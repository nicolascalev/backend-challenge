import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from 'hono/cors';
import { serveStatic } from '@hono/node-server/serve-static';
import api from "./api/routes";

const app = new Hono();

// Add CORS middleware
app.use('*', cors({
  origin: "*",
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['Content-Length', 'X-Kuma-Revision'],
  maxAge: 600,
  credentials: true,
}));

// Serve static files from the public directory
app.use('/*', serveStatic({ root: './public' }));

app.use("*", (c, next) => {
  console.log(`${c.req.method} ${c.req.path}`);
  return next();
});

app.route("/api", api);

app.get("/", (c) => {
  return c.text("Backend challenge: Typescript version");
});

const port = process.env.PORT ? Number(process.env.PORT) : 5000;
console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});
