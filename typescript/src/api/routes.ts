import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import prisma from "../../prisma/db";
import {
  comparePassword,
  generateToken,
  hashPassword,
  requireAuth,
} from "./auth";
import { createBatchProcess } from "../domain/batch";
import { readdir } from "fs/promises";
import path from "path";

const api = new Hono();

api.get("/", (c) => {
  return c.text("This is the api route");
});

// Ping endpoint
api.get("/ping", (c) => {
  return c.text("pong");
});

// Register endpoint
api.post(
  "/auth/register",
  zValidator(
    "form",
    z.object({
      email: z.string().email(),
      password: z.string().min(8),
      name: z.string().min(1),
    })
  ),
  async (c) => {
    const { email, password, name } = c.req.valid("form");

    if (!email || !password) {
      return c.text("Email and password are required", 400);
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return c.text("Email already registered", 400);
    }

    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });

    const token = generateToken(user.id);
    return c.json({
      token,
      user: { id: user.id, email: user.email, name: user.name },
    });
  }
);

// Login endpoint
api.post("/auth/login", async (c) => {
  const { email, password } = await c.req.json();

  if (!email || !password) {
    return c.text("Email and password are required", 400);
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return c.text("Invalid credentials", 401);
  }

  const isValidPassword = await comparePassword(password, user.password);
  if (!isValidPassword) {
    return c.text("Invalid credentials", 401);
  }

  const token = generateToken(user.id);
  return c.json({
    token,
    user: { id: user.id, email: user.email, name: user.name },
  });
});

// Protected route example
api.get("/auth/me", requireAuth, async (c) => {
  const userId = c.get("jwtPayload").userId;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true },
  });

  if (!user) {
    return c.text("User not found", 404);
  }

  return c.json(user);
});

// Batch processing endpoint
api.post("/batch", requireAuth, async (c) => {
  const userId = c.get("jwtPayload").userId;
  const formData = await c.req.raw.formData();

  // Use getAll to retrieve all images with the same field name
  const images = formData.getAll("images") as File[];

  const process = await createBatchProcess({
    images,
    userId,
    context: c,
  });

  return c.json(process);
});

// Get user's processes
api.get("/process", requireAuth, async (c) => {
  const userId = c.get("jwtPayload").userId;
  
  const processes = await prisma.process.findMany({
    where: { createdById: userId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      createdAt: true,
      imageAmount: true,
      finishedProcessingAt: true,
      outputUrl: true,
      status: true
    }
  });

  return c.json(processes);
});

// Get specific process details
api.get("/process/:processId", requireAuth, async (c) => {
  const userId = c.get("jwtPayload").userId;
  const processId = parseInt(c.req.param("processId"));

  if (isNaN(processId)) {
    return c.text("Invalid process ID", 400);
  }

  const process = await prisma.process.findUnique({
    where: { id: processId },
  });

  if (!process) {
    return c.text("Process not found", 404);
  }

  // Check if the process belongs to the authenticated user
  if (process.createdById !== userId) {
    return c.text("Unauthorized", 403);
  }

  // Get list of files in the output directory
  const outputDir = path.join("public", process.outputUrl);
  let imageUrls: string[] = [];
  
  try {
    const files = await readdir(outputDir);
    imageUrls = files
      .filter(file => file.startsWith("image_"))
      .map(file => `${process.outputUrl}/${file}`);
  } catch (error) {
    // If directory doesn't exist or can't be read, return empty array
    console.error("Error reading output directory:", error);
  }

  return c.json({
    ...process,
    imageUrls,
  });
});

// Create webhook endpoint
api.post(
  "/webhook",
  requireAuth,
  zValidator(
    "json",
    z.object({
      label: z.string().min(1),
      url: z.string().url(),
      method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]).default("POST"),
      requestConfig: z.record(z.any()).optional(),
    })
  ),
  async (c) => {
    const userId = c.get("jwtPayload").userId;
    const { label, url, method, requestConfig } = c.req.valid("json");

    const webhook = await prisma.webhook.create({
      data: {
        label,
        url,
        method,
        requestConfig,
        ownerId: userId,
      },
    });

    return c.json(webhook);
  }
);

// Get user's webhooks
api.get("/webhook", requireAuth, async (c) => {
  const userId = c.get("jwtPayload").userId;
  
  const webhooks = await prisma.webhook.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: {
          webhookEvents: true
        }
      }
    }
  });

  return c.json(webhooks);
});

// GET /api/webhook/:webhookId/events
api.get("/webhook/:webhookId/events", requireAuth, async (c) => {
  const userId = c.get("jwtPayload").userId;
  const webhookId = parseInt(c.req.param("webhookId"));

  if (isNaN(webhookId)) {
    return c.text("Invalid webhook ID", 400);
  }

  const webhook = await prisma.webhook.findUnique({
    where: { id: webhookId },
    include: {
      webhookEvents: {
        orderBy: {
          createdAt: 'desc'
        }
      }
    }
  });

  if (!webhook) {
    return c.text("Webhook not found", 404);
  }

  // Check if the webhook belongs to the authenticated user
  if (webhook.ownerId !== userId) {
    return c.text("Unauthorized", 403);
  }

  return c.json(webhook);
});

// DELETE /api/webhook/:webhookId
api.delete("/webhook/:webhookId", requireAuth, async (c) => {
  const userId = c.get("jwtPayload").userId;
  const webhookId = parseInt(c.req.param("webhookId"));

  if (isNaN(webhookId)) {
    return c.text("Invalid webhook ID", 400);
  }

  const webhook = await prisma.webhook.findUnique({
    where: { id: webhookId },
  });

  if (!webhook) {
    return c.text("Webhook not found", 404);
  }

  // Check if the webhook belongs to the authenticated user
  if (webhook.ownerId !== userId) {
    return c.text("Unauthorized", 403);
  }

  // Delete the webhook (webhook events will be automatically deleted due to cascade)
  await prisma.webhook.delete({
    where: { id: webhookId },
  });

  return c.text("Webhook deleted successfully", 200);
});

// PATCH /api/webhook/:webhookId
api.patch(
  "/webhook/:webhookId",
  requireAuth,
  zValidator(
    "json",
    z.object({
      label: z.string().min(1).optional(),
      url: z.string().url().optional(),
      method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]).optional(),
      requestConfig: z.record(z.any()).optional(),
    })
  ),
  async (c) => {
    const userId = c.get("jwtPayload").userId;
    const webhookId = parseInt(c.req.param("webhookId"));
    const updates = c.req.valid("json");

    if (isNaN(webhookId)) {
      return c.text("Invalid webhook ID", 400);
    }

    const webhook = await prisma.webhook.findUnique({
      where: { id: webhookId },
    });

    if (!webhook) {
      return c.text("Webhook not found", 404);
    }

    // Check if the webhook belongs to the authenticated user
    if (webhook.ownerId !== userId) {
      return c.text("Unauthorized", 403);
    }

    const updatedWebhook = await prisma.webhook.update({
      where: { id: webhookId },
      data: updates,
    });

    return c.json(updatedWebhook);
  }
);

export default api;
