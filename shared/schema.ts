import { pgTable, text, serial, decimal, boolean, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from "drizzle-orm";

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  wallet_balance: decimal("wallet_balance", { precision: 20, scale: 2 }).default("1000.00").notNull(),
  is_admin: boolean("is_admin").default(false).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const pools = pgTable("pools", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  creator_id: uuid("creator_id").references(() => profiles.id).notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  stake_amount: decimal("stake_amount", { precision: 20, scale: 2 }).notNull(),
  pool_type: text("pool_type").notNull(), // 'pool' or '1v1'
  outcomes: text("outcomes").array().notNull(),
  status: text("status").default("open").notNull(), // 'open', 'locked', 'settled'
  max_entries: serial("max_entries"),
  winning_outcome: text("winning_outcome"),
  locked_at: timestamp("locked_at"),
  settled_at: timestamp("settled_at"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const entries = pgTable("entries", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  pool_id: uuid("pool_id").references(() => pools.id).notNull(),
  user_id: uuid("user_id").references(() => profiles.id).notNull(),
  chosen_outcome: text("chosen_outcome").notNull(),
  stake_amount: decimal("stake_amount", { precision: 20, scale: 2 }).notNull(),
  is_winner: boolean("is_winner").default(false).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const miniPools = pgTable("mini_pools", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  main_pool_id: uuid("main_pool_id").references(() => pools.id).notNull(),
  creator_id: uuid("creator_id").references(() => profiles.id).notNull(),
  name: text("name").notNull(),
  min_stake: decimal("min_stake", { precision: 20, scale: 2 }).default("200.00").notNull(),
  status: text("status").default("open").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const miniPoolEntries = pgTable("mini_pool_entries", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  mini_pool_id: uuid("mini_pool_id").references(() => miniPools.id).notNull(),
  user_id: uuid("user_id").references(() => profiles.id).notNull(),
  chosen_outcome: text("chosen_outcome").notNull(),
  stake_amount: decimal("stake_amount", { precision: 20, scale: 2 }).notNull(),
  is_winner: boolean("is_winner").default(false).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  content: true,
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type Profile = typeof profiles.$inferSelect;
export type Pool = typeof pools.$inferSelect;
export type Entry = typeof entries.$inferSelect;
export type MiniPool = typeof miniPools.$inferSelect;
export type MiniPoolEntry = typeof miniPoolEntries.$inferSelect;
