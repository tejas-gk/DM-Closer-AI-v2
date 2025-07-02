import { pgTable, text, uuid, timestamp, boolean, integer, varchar } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// Enums for business profiles and tones
export const businessProfileEnum = z.enum(['fitlife_coaching', 'onlyfans_model', 'product_sales']);
export const aiToneEnum = z.enum(['friendly', 'professional', 'casual', 'girlfriend_experience']);
export const subscriptionPlanEnum = z.enum(['starter', 'pro', 'agency', 'flex']);

export type BusinessProfile = z.infer<typeof businessProfileEnum>;
export type AITone = z.infer<typeof aiToneEnum>;
export type SubscriptionPlan = z.infer<typeof subscriptionPlanEnum>;

// Conversations table
export const conversations = pgTable('conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  instagramThreadId: varchar('instagram_thread_id', { length: 255 }).notNull().unique(),
  participantUsername: varchar('participant_username', { length: 255 }).notNull(),
  participantName: varchar('participant_name', { length: 255 }),
  participantAvatarUrl: text('participant_avatar_url'),
  lastMessageAt: timestamp('last_message_at', { withTimezone: true }).defaultNow(),
  isRead: boolean('is_read').default(false),
  isArchived: boolean('is_archived').default(false),
  autoReplyEnabled: boolean('auto_reply_enabled').default(true),
  participantFirstName: varchar('participant_first_name', { length: 100 }),
  messageCount: integer('message_count').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Messages table
export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversationId: uuid('conversation_id').notNull(),
  instagramMessageId: varchar('instagram_message_id', { length: 255 }).notNull().unique(),
  senderType: varchar('sender_type', { length: 20 }).notNull(),
  content: text('content').notNull(),
  messageType: varchar('message_type', { length: 20 }).default('text'),
  isRead: boolean('is_read').default(false),
  aiGenerated: boolean('ai_generated').default(false),
  toneUsed: varchar('tone_used', { length: 50 }),
  responseStatus: varchar('response_status', { length: 20 }).default('pending'),
  sentAt: timestamp('sent_at', { withTimezone: true }).defaultNow(),
  deliveredAt: timestamp('delivered_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// User usage tracking
export const userUsage = pgTable('user_usage', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  month: timestamp('month', { withTimezone: true }).notNull(),
  aiResponsesUsed: integer('ai_responses_used').default(0),
  quotaLimit: integer('quota_limit').default(500),
  subscriptionPlan: varchar('subscription_plan', { length: 20 }).default('starter'),
  flexRepliesCount: integer('flex_replies_count'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// User preferences
export const userPreferences = pgTable('user_preferences', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().unique(),
  aiTone: varchar('ai_tone', { length: 50 }).default('friendly'),
  businessProfile: varchar('business_profile', { length: 50 }).default('fitlife_coaching'),
  customInstructions: text('custom_instructions'),
  notificationPreferences: text('notification_preferences').default('{}'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Instagram connections
export const instagramConnections = pgTable('instagram_connections', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  instagramUserId: text('instagram_user_id').notNull(),
  username: text('username').notNull(),
  accessToken: text('access_token').notNull(),
  tokenExpiresAt: timestamp('token_expires_at', { withTimezone: true }),
  accountType: varchar('account_type', { length: 50 }),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Insert schemas using drizzle-zod
export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const insertUserUsageSchema = createInsertSchema(userUsage).omit({
  id: true,
  createdAt: true,
});

export const insertUserPreferencesSchema = createInsertSchema(userPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInstagramConnectionSchema = createInsertSchema(instagramConnections).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type InsertUserUsage = z.infer<typeof insertUserUsageSchema>;
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;
export type InsertInstagramConnection = z.infer<typeof insertInstagramConnectionSchema>;
export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type UserUsage = typeof userUsage.$inferSelect;
export type UserPreferences = typeof userPreferences.$inferSelect;
export type InstagramConnection = typeof instagramConnections.$inferSelect;

// Extended types for UI
export interface ConversationWithMessages extends Conversation {
  messages: Message[];
  lastMessage?: Message;
}

export interface ConversationSummary extends Conversation {
  lastMessage?: Pick<Message, 'content' | 'sentAt' | 'senderType'>;
}