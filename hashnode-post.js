
import dotenv from 'dotenv';
import { readFileSync, existsSync } from 'fs';
import { simpleGit } from 'simple-git';
import fm from 'front-matter';
import axios from 'axios';

dotenv.config();

if (!process.env.HASHNODE_PAT) {
  console.error("Please provide a HASHNODE_PAT environment variable");
  process.exit(1);
}

if (!process.env.HASHNODE_HOST) {
  console.error("Please provide a HASHNODE_HOST environment variable");
  process.exit(1);
}

async function main() {
  console.log("\nAttempting to post to Hashnode...");
  console.log("WARNING: We find blogs based on the title of the blog. The title hast to be unique. Also if you change the title after the blog has been posted, we will create a new post and you have to delete the old one manually.");
  console.log("WARNING: If you delete a blog, it will not be deleted from Hashnode. You have to delete it manually.")

  console.log("\nGetting blog/**.md files from last commit...")
  const markdownBlogs = await getMarkdownBlogsFromLastCommit();

  if (markdownBlogs.length === 0) {
    console.log("No markdown blogs found in last commit");
    return;
  }

  console.log("\nGetting all posts from hashnode...")
  const postsFromHashNode = await getPostsFromHashnode();

  console.log("\nGetting publication id from hashnode...");
  const publicationId = await getPublicationId();
  if (!publicationId) {
    console.error("Error getting publication id from hashnode");
    return;
  }

  // check if the blogs in the last commit exist in the hashnode posts
  await upsertBlogs(markdownBlogs, postsFromHashNode, publicationId);
}

main();

/**
 * This function retrieves the markdown blog files that were changed in the last commit.
 * It uses the simpleGit library to get the diff of the last commit and filters for '.md' files.
 * It then reads the content of each markdown file, parses the frontmatter to get the title, and stores the title, content, and path in an object.
 * These objects are collected in an array and returned.
 *
 * @async
 * @function getMarkdownBlogsFromLastCommit
 * @returns {Promise<Array<{ content: string, path: string, attributes: any }>>} - Returns a promise that resolves to an array of objects. Each object represents a markdown blog with properties: content, path and attributes.
 */
async function getMarkdownBlogsFromLastCommit() {
  const paths = await simpleGit().diff(["--name-only", "HEAD^", "HEAD"]).then(res => res.split("\n"));
  const regex = new RegExp('blog/.*\\.md');
  const markdownBlogsPaths = paths.filter(path => regex.test(path))

  const markdownBlogs = [];
  for (const path of markdownBlogsPaths) {
    if (!existsSync(path)) {
      console.log("\nFILE FOR BLOG DELETED. Now you have to delete it from Hashnode manually. " + path);
      const beforeDeleted = await simpleGit().show(["HEAD^:" + path]);
      const markdownBeforeDeleted = fm(beforeDeleted);
      if (markdownBeforeDeleted.attributes.title) {
        console.log("Title of deleted blog: " + markdownBeforeDeleted.attributes.title + "\n");
      }
      continue;
    }

    const content = readFileSync(path, "utf-8");
    const markdown = fm(content);
    if (!markdown.attributes.title || !markdown.attributes.tags) {
      console.log("---> BlOG SKIPPED! Blog must contain a title in the frontmatter. Path: " + path);
      continue;
    }
    markdownBlogs.push({
      attributes: markdown.attributes,
      content: markdown.body,
      path
    });
  }
  return markdownBlogs;
}

/**
 * This function retrieves the posts from the hashnode API.
 * It uses the axios library to make a post request to the hashnode API with a query to retrieve the posts from the hashnode publication.
 * It keeps fetching posts until all posts are retrieved and returns an array of posts.
 * @async
 * @function getPostsFromHashnode
 * @returns {Promise<Array<{ id: string, title: string }>>} - Returns a promise that resolves to an array of objects. Each object represents a post with properties: id and title.
 * */
async function getPostsFromHashnode() {
  const postsFromHashNode = []

  // this is the limit of posts to retrieve from hashnode, keep fetching until all posts are retrieved
  let total = 20;
  while (total === 20) {
    const last = postsFromHashNode.at(-1)?.id || null;
    const posts =
      await axios.post("https://gql.hashnode.com", {
        query: `query {
          publication( host: "${process.env.HASHNODE_HOST}" ) { 
            id 
            posts(first: 20${last ? `, after(${last})` : ""}) {
              edges {
                node {
                  id
                  title
                }
              }
            }
          }
        }`
      }, {
        Headers: {
          "Content-Type": "application/json",
          "Authorization": process.env.HASHNODE_PAT
        }
      }).then(res => res?.data?.data?.publication?.posts?.edges?.map(post => post.node));
    if (!posts) {
      console.error("Error fetching posts from hashnode");
      return;
    }
    postsFromHashNode.push(...posts);
    total = posts.length;
  }
  return postsFromHashNode;
}

/**
 * This function retrieves the publication id from the hashnode API.
 * It uses the axios library to make a post request to the hashnode API with a query to retrieve the publication id.
 * @async
 * @function getPublicationId
 * @returns {Promise<string>} - Returns a promise that resolves to a string representing the publication id.
 * */
async function getPublicationId() {
  return await axios.post("https://gql.hashnode.com", {
    query: `query {
          publication( host: "${process.env.HASHNODE_HOST}" ) { 
            id
          }
        }`
  }, {
    Headers: {
      "Content-Type": "application/json",
      "Authorization": process.env.HASHNODE_PAT
    }
  }).then(res => res?.data?.data?.publication?.id);
}

async function upsertBlogs(markdownBlogs, postsFromHashNode, publicationId) {
  for (const blog of markdownBlogs) {
    const post = postsFromHashNode.find(post => post.title === blog.attributes.title);
    if (post) {
      console.log(`\nUpdating post in Hashnode: ${blog.path}...`);
      await updatePost(post.id, blog);
    } else {
      console.log(`\nCreating post in Hashnode: ${blog.path}...`);
      await createPost(blog, publicationId);
    }
  }
}

async function updatePost(id, blog) {
  const mutation = `
    mutation UpdatePost($input: UpdatePostInput!) {
      updatePost(input: $input) {
        post {
          id
          title
          content {
            markdown
          }
          tags {
            name
            slug
          }
          url
        }
      }
    }
  `;

  const variables = {
    input: {
      id: id,
      title: blog.attributes.title,
      contentMarkdown: blog.content,
      tags: blog.attributes.tags.map(tag => ({ name: tag, slug: slugify(tag) }))
    }
  };

  const response = await axios({
    url: 'https://gql.hashnode.com/',
    method: 'post',
    data: {
      query: mutation,
      variables: variables
    },
    headers: {
      'Content-Type': 'application/json',
      "Authorization": process.env.HASHNODE_PAT
    }
  }).catch(err => {
    console.log("\nError updating post in Hashnode: " + blog.attributes.title)
    console.error(JSON.stringify(err.response.data, null, 2));
  });


  if (response.data.errors) {
    console.log("\nError updating post in Hashnode: " + blog.attributes.title)
    console.error(JSON.stringify(response.data.errors, null, 2));
    return
  }

  if (response.data) {
    console.log("Updated blog for " + blog.path);
    console.log(response.data.data.updatePost.post.url);
  }
};

async function createPost(blog, publicationId) {
  const mutation = `
    mutation PublishPost($input: PublishPostInput!) {
      publishPost(input: $input) {
        post {
          id
          title
          content {
            markdown
          }
          tags {
            name
            slug
          }
          url
        }
      }
    }
  `;
  const variables = {
    input: {
      title: blog.attributes.title,
      contentMarkdown: blog.content,
      tags: blog.attributes.tags.map(tag => ({ name: tag, slug: slugify(tag) })),
      publicationId
    }
  };

  const response = await axios({
    url: 'https://gql.hashnode.com/',
    method: 'post',
    data: {
      query: mutation,
      variables: variables
    },
    headers: {
      'Content-Type': 'application/json',
      "Authorization": process.env.HASHNODE_PAT
    }
  }).catch(err => {
    console.log("\nError creating post in Hashnode: " + blog.attributes.title)
    console.error(JSON.stringify(err.response.data, null, 2));
  });

  if (response.data.errors) {
    console.log("\nError creating post in Hashnode: " + blog.attributes.title)
    console.error(JSON.stringify(response.data.errors, null, 2));
    return
  }

  if (response.data) {
    console.log("Published blog for " + blog.path);
    console.log(response.data.data.publishPost.post.url);
  }
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}