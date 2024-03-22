# using yq v4.6.3 or a version that supports the -r flag
# to install in wsl:
# wget https://github.com/mikefarah/yq/releases/download/v4.6.3/yq_linux_amd64 -O /usr/bin/yq &&\
# chmod +x /usr/bin/yq

# I am also using jq to get what I need from json results, I installed it this way:
# wget https://github.com/jqlang/jq/releases/download/jq-1.7.1/jq-linux64 -O /usr/bin/jq
# chmod +x /usr/bin/jq

# echo "Getting blog/**.md files from last commit"
# files=$(git diff --name-only HEAD^ HEAD | grep 'blog/.*\.md')

echo "Getting post titles from Hashnode"
response=$(curl -s -X POST 'https://gql.hashnode.com/' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
-d '{
  "query": "query { publication( host: \"nicolascalev.hashnode.dev\" ) { id posts(first: 20) { edges { node { id title } } } } }"
}')

echo $response | jq '.data.publication.posts.edges[].node.title'

# for file in $files
# do
#   echo "Processing $file"
#   title=$(yq -r '.title' $file)
#   echo $title
#   cat $file
# done