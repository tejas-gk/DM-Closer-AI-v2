import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq, sql } from 'drizzle-orm';
import { userPreferences, insertUserPreferencesSchema } from '../../../shared/schema';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}

const client = postgres(connectionString);
const db = drizzle(client);

export interface UserPreferencesData {
  aiTone: 'friendly' | 'professional' | 'casual' | 'girlfriend_experience';
  businessProfile: 'fitlife_coaching' | 'onlyfans_model' | 'product_sales';
  customInstructions: string | null;
}

export async function getUserPreferences(userId: string): Promise<UserPreferencesData | null> {
  try {
    const preferences = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId))
      .limit(1);

    if (preferences.length === 0) {
      return null;
    }

    const pref = preferences[0];
    return {
      aiTone: pref.aiTone as 'friendly' | 'professional' | 'casual' | 'girlfriend_experience',
      businessProfile: pref.businessProfile as 'fitlife_coaching' | 'onlyfans_model' | 'product_sales',
      customInstructions: pref.customInstructions
    };
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    throw error;
  }
}

export async function createOrUpdateUserPreferences(
  userId: string, 
  preferences: UserPreferencesData
): Promise<UserPreferencesData> {
  try {
    // Use PostgreSQL UPSERT (ON CONFLICT) for atomic operation
    await db
      .insert(userPreferences)
      .values({
        userId,
        aiTone: preferences.aiTone,
        businessProfile: preferences.businessProfile,
        customInstructions: preferences.customInstructions
      })
      .onConflictDoUpdate({
        target: userPreferences.userId,
        set: {
          aiTone: preferences.aiTone,
          businessProfile: preferences.businessProfile,
          customInstructions: preferences.customInstructions,
          updatedAt: sql`NOW()`
        }
      });

    return preferences;
  } catch (error) {
    console.error('Error saving user preferences:', error);
    throw error;
  }
}

export async function getDefaultUserPreferences(): Promise<UserPreferencesData> {
  return {
    aiTone: 'friendly',
    businessProfile: 'fitlife_coaching',
    customInstructions: 'Always mention our 7-day free trial when appropriate. Focus on transformation stories and results. Be encouraging about their fitness journey.'
  };
}