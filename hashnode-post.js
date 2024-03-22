
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
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
  console.log("\nGetting blog/**.md files from last commit...")
  const markdownBlogs = await getMarkdownBlogsFromLastCommit();

  if (markdownBlogs.length === 0) {
    console.log("No markdown blogs found in last commit");
    return;
  }

  console.log("\nGetting all posts from hashnode...")
  const postsFromHashNode = await getPostsFromHashnode();

  // check if the blogs in the last commit exist in the hashnode posts
  await upsertBlogs(markdownBlogs, postsFromHashNode);
  // console.log({
  //   markdownBlogs,
  //   postsFromHashNode
  // })
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
  const { paths } = await simpleGit().diff(["--name-only", "HEAD^", "HEAD"]).grep('.md');
  const markdownBlogsPaths = Array.from(paths);
  const markdownBlogs = [];
  for (const path of markdownBlogsPaths) {
    // TODO: handle deleted files, if a file is deleted, then don't try to read it or add it to the list
    const content = readFileSync(path, "utf-8");
    const markdown = fm(content);
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
      }).then(res => res.data.data.publication.posts.edges.map(post => post.node));;
    postsFromHashNode.push(...posts);
    total = posts.length;
  }
  return postsFromHashNode;
}

async function upsertBlogs(markdownBlogs, postsFromHashNode) {
  for (const blog of markdownBlogs) {
    const post = postsFromHashNode.find(post => post.title === blog.attributes.title);
    if (post) {
      console.log(`\nUpdating post in Hashnode: ${post.title}...`);
      await updatePost(post.id, blog);
    } else {
      console.log(`\nCreating post in Hashnode: ${blog.attributes.title}...`);
      await createPost(blog);
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

  if (response.data) {
    console.log("Updated blog for " + blog.path);
    console.log(response.data.data.updatePost.post.url);
  }
};

async function createPost(blog) {
  const mutation = `
    mutation CreatePost($input: CreatePostInput!) {
      createPost(input: $input) {
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
      publicationId: process.env.HASHNODE_HOST
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

  if (response.data) {
    console.log("Created blog for " + blog.path);
    console.log(response.data.data.createPost.post.url);
  }
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}