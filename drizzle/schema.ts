import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Spreadsheets table for cloud-synced meta-analysis data
 */
export const spreadsheets = mysqlTable("spreadsheets", {
  id: int("id").autoincrement().primaryKey(),
  /** UUID for sharing and collaboration */
  shareId: varchar("shareId", { length: 36 }).notNull().unique(),
  /** Owner user ID */
  userId: int("userId").notNull(),
  /** Spreadsheet name */
  name: varchar("name", { length: 255 }).notNull(),
  /** Column definitions as JSON */
  columns: json("columns").notNull(),
  /** Row data as JSON */
  rows: json("rows").notNull(),
  /** Template type used */
  templateType: varchar("templateType", { length: 50 }),
  /** Version number for conflict resolution */
  version: int("version").default(1).notNull(),
  /** Whether the spreadsheet is shared publicly */
  isPublic: boolean("isPublic").default(false).notNull(),
  /** Timestamps */
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Spreadsheet = typeof spreadsheets.$inferSelect;
export type InsertSpreadsheet = typeof spreadsheets.$inferInsert;

/**
 * Spreadsheet collaborators for shared editing
 */
export const spreadsheetCollaborators = mysqlTable("spreadsheet_collaborators", {
  id: int("id").autoincrement().primaryKey(),
  spreadsheetId: int("spreadsheetId").notNull(),
  userId: int("userId").notNull(),
  /** Role: viewer, editor, or admin */
  role: mysqlEnum("collaboratorRole", ["viewer", "editor", "admin"]).default("viewer").notNull(),
  /** Invite status */
  status: mysqlEnum("inviteStatus", ["pending", "accepted", "declined"]).default("pending").notNull(),
  /** Invite code for accepting */
  inviteCode: varchar("inviteCode", { length: 36 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SpreadsheetCollaborator = typeof spreadsheetCollaborators.$inferSelect;
export type InsertSpreadsheetCollaborator = typeof spreadsheetCollaborators.$inferInsert;

/**
 * Spreadsheet edit history for conflict resolution and undo
 */
export const spreadsheetHistory = mysqlTable("spreadsheet_history", {
  id: int("id").autoincrement().primaryKey(),
  spreadsheetId: int("spreadsheetId").notNull(),
  userId: int("userId").notNull(),
  /** Type of change */
  changeType: mysqlEnum("changeType", ["create", "update", "delete"]).notNull(),
  /** Previous data (for undo) */
  previousData: json("previousData"),
  /** New data */
  newData: json("newData"),
  /** Version at time of change */
  version: int("version").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SpreadsheetHistory = typeof spreadsheetHistory.$inferSelect;
export type InsertSpreadsheetHistory = typeof spreadsheetHistory.$inferInsert;

/**
 * User learning progress for cross-device sync
 */
export const userProgress = mysqlTable("user_progress", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  /** Tutorial progress as JSON */
  tutorialProgress: json("tutorialProgress"),
  /** Completed tutorials list */
  completedTutorials: json("completedTutorials"),
  /** Earned badges */
  badges: json("badges"),
  /** Quiz scores and spaced repetition data */
  quizData: json("quizData"),
  /** Streak information */
  streakData: json("streakData"),
  /** Total learning time in minutes */
  totalLearningTime: int("totalLearningTime").default(0),
  /** Last synced timestamp */
  lastSyncedAt: timestamp("lastSyncedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserProgress = typeof userProgress.$inferSelect;
export type InsertUserProgress = typeof userProgress.$inferInsert;

/**
 * Active editing sessions for real-time collaboration
 */
export const activeSessions = mysqlTable("active_sessions", {
  id: int("id").autoincrement().primaryKey(),
  spreadsheetId: int("spreadsheetId").notNull(),
  userId: int("userId").notNull(),
  /** User's display name for collaboration UI */
  displayName: varchar("displayName", { length: 100 }),
  /** User's cursor position */
  cursorPosition: json("cursorPosition"),
  /** Last heartbeat timestamp */
  lastHeartbeat: timestamp("lastHeartbeat").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ActiveSession = typeof activeSessions.$inferSelect;
export type InsertActiveSession = typeof activeSessions.$inferInsert;
