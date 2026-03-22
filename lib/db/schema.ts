import {
  sqliteTable,
  text,
  integer,
  real,
  primaryKey,
} from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

// --------------- Auth.js Tables ---------------

export const users = sqliteTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: integer("emailVerified", { mode: "timestamp_ms" }),
  image: text("image"),
});

export const accounts = sqliteTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({ columns: [account.provider, account.providerAccountId] }),
  ]
);

export const sessions = sqliteTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
});

export const verificationTokens = sqliteTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })]
);

// --------------- App Tables ---------------

export const repositories = sqliteTable("repositories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  githubId: integer("github_id").notNull().unique(),
  name: text("name").notNull(),
  owner: text("owner").notNull(),
  fullName: text("full_name").notNull().unique(),
  trustThreshold: integer("trust_threshold").notNull().default(65),
  autoClose: integer("auto_close", { mode: "boolean" })
    .notNull()
    .default(true),
  autoLabel: integer("auto_label", { mode: "boolean" })
    .notNull()
    .default(true),
  status: text("status", { enum: ["active", "paused", "error"] })
    .notNull()
    .default("active"),
  installedAt: text("installed_at").notNull(),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const contributors = sqliteTable("contributors", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  githubId: integer("github_id").notNull().unique(),
  username: text("username").notNull().unique(),
  avatarUrl: text("avatar_url").notNull(),
  trustScore: real("trust_score").notNull().default(50),
  totalPRs: integer("total_prs").notNull().default(0),
  mergedPRs: integer("merged_prs").notNull().default(0),
  accountAge: real("account_age").notNull().default(0),
  isWhitelisted: integer("is_whitelisted", { mode: "boolean" })
    .notNull()
    .default(false),
  isBlocked: integer("is_blocked", { mode: "boolean" })
    .notNull()
    .default(false),
  lastActiveAt: text("last_active_at"),
  lastGithubSyncAt: text("last_github_sync_at"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const activityEvents = sqliteTable("activity_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  contributorId: integer("contributor_id")
    .notNull()
    .references(() => contributors.id),
  repositoryId: integer("repository_id")
    .notNull()
    .references(() => repositories.id),
  prTitle: text("pr_title").notNull(),
  prNumber: integer("pr_number").notNull(),
  action: text("action", {
    enum: ["labeled_trusted", "flagged", "auto_closed", "whitelisted"],
  }).notNull(),
  trustScoreAtTime: real("trust_score_at_time").notNull(),
  timestamp: text("timestamp")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

// --------------- Relations ---------------

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const repositoriesRelations = relations(repositories, ({ many }) => ({
  activityEvents: many(activityEvents),
}));

export const contributorsRelations = relations(contributors, ({ many }) => ({
  activityEvents: many(activityEvents),
}));

export const activityEventsRelations = relations(
  activityEvents,
  ({ one }) => ({
    contributor: one(contributors, {
      fields: [activityEvents.contributorId],
      references: [contributors.id],
    }),
    repository: one(repositories, {
      fields: [activityEvents.repositoryId],
      references: [repositories.id],
    }),
  })
);
