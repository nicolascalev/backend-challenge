---
title: Update 1. Typescript backend first steps
tags:
  - Next.js
  - Backend challenge
  - Typescript
  - TS
  - Node
  - JS
  - Backend
---

## Introduction

To get started with my backend challenge, I wanted to use TypeScript because that's the language that I am the most familiar with, of the languages that I picked to complete this challenge.

I have worked with Node multiple times in the past but lately I've been using Next js for pretty much everything.

Next js is awesome when it comes to DX (Developer Experience). It comes with linters, typescript, formatters, routing, and pretty much everything right out of the box.

If you use Next js for your backend that's probably enough for most scenarios, and their api route handlers follow web standards.

## How to start a TypeScript backend in 2024? Should be easy, right?

Well... as anything with javascript, there are multiple ways of doing it and you need to evaluate all the trade-offs.

These were my requirements to start the project:

1. Use typescript.
2. Have hot reloading.
3. Have linter and formatters.
4. Handle the build step.
5. Support `import` and `require()`

And probably a few other things that weren't so important like having a fast bundler or package manager.

However, I couldn't find any `npx create-ts-api` or anything like that to handle all configuration for me easily, so I started looking at some options.

### YouTube guides and internet blogs

Jeff, the guy behind [Fireship](https://www.youtube.com/@fireship), posted [a video about this](https://www.youtube.com/watch?v=H91aqUHn8sE&t=3s).

This was really helpful and honestly, you should probably watch the video and pick that solution. There were just a few caveats with the imports that I did not want to deal with.

I also looked at multiple blogs but I wasn't happy with any of the solutions.

### Bun

If I wasn't coding on a Windows machine, I would definitely be using bun. Yes you can use it with WSL for Windows but that's what I have to explain.

Bun supports everything right out of the box, it conforms to web standards, it has a tool to start a new project with all configuration, it has the fastest package manager, bundler, and hot reloading.

It's basically the best option you can think you because it has everything.

However, if your project is not in the WSL directory, hot reloading won't work which is such a bummer. So you can just move your code there. I did not do it because I keep all my projects organized in one main folder, and if I wanted to revisit my project in the future, I would probably forget where it's located.

I will consider using a docker container to code or something like that because that really seems like the best option for me.

### Hono

I ended up going for Hono.

It's a supper fast, and had all the requirements I needed. It also has a similar syntax compared to Express js which I am familiar with.

I handled all the configuration for me and it was just the best option I could find for my use case.

## Next steps

So far, none of this has to do with the actual development of the backend, but it was important to get started.

In the next blog I will explain how I am using GitHub actions and Hashnode to document this project automatically.
