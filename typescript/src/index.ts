import { serve } from "@hono/node-server";
import { Hono } from "hono";
import api from "./api/routes";

const app = new Hono();

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
