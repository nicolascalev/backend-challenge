import { Hono } from "hono";

const api = new Hono();

api.get("/", (c) => {
  return c.text("This is the api route");
});

export default api;
