# Backend challenge

As a full-stack web developer, I have worked on multiple projects with different requirements and domains. However, I haven't had to implement more advanced backend functionality.

I have worked with databases, web sockets, cli tools, authentication, and more. But I have never had to worry about performance and use workers or multi threading and tuff like that which seems to be very popular these days.

And honestly that's enough for me. I like creating a Next js project and not having to deal with configuration. I like having my serverless functions taken care of. And the only reason I create this project, is for fun.

That being said, when people hear Next js it seems that the first thing that comes to mind is "frontend developer". So I am creating a project where the backend is the most special part.

## The idea: Batch image processing with multiple programming languages

I want to create an app where a user uploads a batch of images, the images get processed, and then they can see the final result. Sounds simple right? But this example will help me implement the following:

### Authentication

The user will have to log in the frontend (Scroll down if you want to see that part). Then I have to use `jwt` to authenticate the user in the backend.

### File uploads

I will have to handle uploads, validate the size and mime type of the files, make sure there's a limit of number and size.

### Command line commands

I am using `ffmpeg` to process the images and I will do it from the command line.

### Web sockets

I will use web sockets to send the stream of the logs to the admin view.

### Workers

I will split the batch of files so they can be distributed and processed with multiple workers to make it more efficient.

### Database

I will use some relational database probably sqlite, to store the user's upload directories and configuration.

### Webhooks

I will use webhooks to notify the user when processing has finished.

## Frontend

I will create a frontend, it should have the exact same UX no matter what backend I am currently serving. Wether it's the js backend or the golang backend. It should work the same.

I will use Next js because that's what I know best and the focus is on the backend.

## Blog

If you are interested in following the building process you can check out this blog where I will be building in public and commenting about this project.

## Roadmap

I will consider adding other features like:

- Docker containers.
- Rate limiting.

If there is another language that interests me I will add it to this repo too.