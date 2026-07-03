import {
  pgTable,
  pgEnum,
  text,
  boolean,
  timestamp,
  uuid,
  integer,
  numeric,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import type { EstimationInput } from "@/lib/contracts/input";
import type { EstimationResult } from "@/lib/contracts/result";
import type { CalibrationProfile } from "@/lib/contracts/profile";

// ─── Enums ───────────────────────────────────────────────────────────────────

export const estimationStatusEnum = pgEnum("estimation_status", [
  "draft",
  "final",
  "archived",
]);

// ─── Better Auth tables (text IDs managed by Better Auth) ────────────────────

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull(),
  image: text("image"),
  role: text("role").notNull().default("user"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
});

export const accounts = pgTable("accounts", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verifications = pgTable("verifications", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

// ─── App tables (UUID IDs) ────────────────────────────────────────────────────

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    client: text("client"),
    description: text("description"),
    ownerId: text("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("projects_owner_idx").on(t.ownerId)],
);

export const calibrationProfiles = pgTable("calibration_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  version: integer("version").notNull().default(1),
  isActive: boolean("is_active").notNull().default(false),
  coefficients: jsonb("coefficients")
    .$type<Omit<CalibrationProfile, "id" | "name" | "version">>()
    .notNull(),
  createdBy: text("created_by").references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const estimations = pgTable(
  "estimations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    input: jsonb("input").$type<EstimationInput>().notNull(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => calibrationProfiles.id, { onDelete: "restrict" }),
    profileVersion: integer("profile_version").notNull(),
    engineVersion: text("engine_version").notNull(),
    result: jsonb("result").$type<EstimationResult>().notNull(),
    status: estimationStatusEnum("status").notNull().default("draft"),
    createdBy: text("created_by")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("estimations_project_idx").on(t.projectId),
    index("estimations_profile_idx").on(t.profileId),
  ],
);

export const benchmarks = pgTable("benchmarks", {
  id: uuid("id").primaryKey().defaultRandom(),
  estimationId: uuid("estimation_id")
    .notNull()
    .references(() => estimations.id, { onDelete: "cascade" }),
  actualEffortPd: numeric("actual_effort_pd"),
  actualCost: numeric("actual_cost"),
  actualDurationMonths: numeric("actual_duration_months"),
  notes: text("notes"),
  recordedAt: timestamp("recorded_at").notNull().defaultNow(),
});
