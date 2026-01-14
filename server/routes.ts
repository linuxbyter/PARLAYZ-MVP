import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.get(api.messages.list.path, async (req, res) => {
    const messages = await storage.getMessages();
    res.json(messages);
  });

  app.post(api.messages.create.path, async (req, res) => {
    try {
      const input = api.messages.create.input.parse(req.body);
      const message = await storage.createMessage(input);
      res.status(201).json(message);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
        });
      }
      throw err;
    }
  });

  return httpServer;
}

// Seed function to ensure there is some data
async function seedDatabase() {
  try {
    const existing = await storage.getMessages();
    if (existing.length === 0) {
      await storage.createMessage({ content: "Welcome to your blank React app!" });
      await storage.createMessage({ content: "This message comes from the Postgres database." });
    }
  } catch (err) {
    console.error("Error seeding database:", err);
  }
}

// Run seed on startup
seedDatabase();
