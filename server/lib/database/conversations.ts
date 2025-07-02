import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq, sql } from 'drizzle-orm';
import { conversations } from '../../../shared/schema';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}

const client = postgres(connectionString);
const db = drizzle(client);

export async function updateConversationAutoReply(
  conversationId: string,
  autoReplyEnabled: boolean
): Promise<boolean> {
  try {
    const result = await db
      .update(conversations)
      .set({
        autoReplyEnabled,
        updatedAt: sql`NOW()`
      })
      .where(eq(conversations.id, conversationId))
      .returning({ id: conversations.id });

    return result.length > 0;
  } catch (error) {
    console.error('Error updating conversation auto-reply:', error);
    throw error;
  }
}

export async function getConversationAutoReplyStatus(
  conversationId: string
): Promise<boolean | null> {
  try {
    const result = await db
      .select({ autoReplyEnabled: conversations.autoReplyEnabled })
      .from(conversations)
      .where(eq(conversations.id, conversationId))
      .limit(1);

    return result.length > 0 ? result[0].autoReplyEnabled : null;
  } catch (error) {
    console.error('Error fetching conversation auto-reply status:', error);
    throw error;
  }
}

export async function createOrUpdateConversation(conversationData: {
  id: string;
  userId: string;
  instagramThreadId: string;
  participantUsername: string;
  participantName?: string;
  participantAvatarUrl?: string;
  participantFirstName?: string;
  autoReplyEnabled?: boolean;
}): Promise<void> {
  try {
    await db
      .insert(conversations)
      .values({
        id: conversationData.id,
        userId: conversationData.userId,
        instagramThreadId: conversationData.instagramThreadId,
        participantUsername: conversationData.participantUsername,
        participantName: conversationData.participantName,
        participantAvatarUrl: conversationData.participantAvatarUrl,
        participantFirstName: conversationData.participantFirstName,
        autoReplyEnabled: conversationData.autoReplyEnabled ?? true
      })
      .onConflictDoUpdate({
        target: conversations.id,
        set: {
          participantName: conversationData.participantName,
          participantAvatarUrl: conversationData.participantAvatarUrl,
          participantFirstName: conversationData.participantFirstName,
          autoReplyEnabled: conversationData.autoReplyEnabled ?? true,
          updatedAt: sql`NOW()`
        }
      });
  } catch (error) {
    console.error('Error creating/updating conversation:', error);
    throw error;
  }
}