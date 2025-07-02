import { describe, it, expect } from '@jest/globals';
import { z } from 'zod';
import {
  insertConversationSchema,
  insertMessageSchema,
  insertUserUsageSchema,
  insertUserPreferencesSchema,
  type InsertConversation,
  type InsertMessage,
  type InsertUserUsage,
  type InsertUserPreferences,
} from '../schema';

describe('Database Schema Validation', () => {
  describe('Conversation Schema', () => {
    it('should validate valid conversation data', () => {
      const validConversation: InsertConversation = {
        userId: 'user_123',
        participantUsername: 'fitness_guru',
        participantName: 'John Doe',
        participantAvatarUrl: 'https://example.com/avatar.jpg',
        lastMessageAt: new Date().toISOString(),
        isRead: false,
        messageCount: 5,
      };

      const result = insertConversationSchema.safeParse(validConversation);
      expect(result.success).toBe(true);
    });

    it('should reject conversation with missing required fields', () => {
      const invalidConversation = {
        userId: 'user_123',
        participantUsername: 'fitness_guru',
        // Missing participantName
        participantAvatarUrl: 'https://example.com/avatar.jpg',
      };

      const result = insertConversationSchema.safeParse(invalidConversation);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toHaveLength(1);
        expect(result.error.issues[0].path).toContain('participantName');
      }
    });

    it('should validate conversation with optional fields', () => {
      const conversationWithOptionals: InsertConversation = {
        userId: 'user_123',
        participantUsername: 'fitness_guru',
        participantName: 'John Doe',
        participantAvatarUrl: null, // Optional field
        lastMessageAt: new Date().toISOString(),
        isRead: true,
        messageCount: 0,
      };

      const result = insertConversationSchema.safeParse(conversationWithOptionals);
      expect(result.success).toBe(true);
    });

    it('should reject invalid URL format', () => {
      const invalidConversation: InsertConversation = {
        userId: 'user_123',
        participantUsername: 'fitness_guru',
        participantName: 'John Doe',
        participantAvatarUrl: 'not-a-valid-url',
        lastMessageAt: new Date().toISOString(),
        isRead: false,
        messageCount: 5,
      };

      const result = insertConversationSchema.safeParse(invalidConversation);
      expect(result.success).toBe(false);
    });

    it('should reject negative message count', () => {
      const invalidConversation: InsertConversation = {
        userId: 'user_123',
        participantUsername: 'fitness_guru',
        participantName: 'John Doe',
        participantAvatarUrl: 'https://example.com/avatar.jpg',
        lastMessageAt: new Date().toISOString(),
        isRead: false,
        messageCount: -1,
      };

      const result = insertConversationSchema.safeParse(invalidConversation);
      expect(result.success).toBe(false);
    });
  });

  describe('Message Schema', () => {
    it('should validate valid message data', () => {
      const validMessage: InsertMessage = {
        conversationId: 'conv_123',
        senderType: 'user',
        content: 'Hello, this is a test message',
        isRead: false,
        aiGenerated: false,
      };

      const result = insertMessageSchema.safeParse(validMessage);
      expect(result.success).toBe(true);
    });

    it('should validate AI-generated message', () => {
      const aiMessage: InsertMessage = {
        conversationId: 'conv_123',
        senderType: 'ai',
        content: 'This is an AI-generated response',
        isRead: true,
        aiGenerated: true,
        toneUsed: 'friendly',
        responseStatus: 'sent',
      };

      const result = insertMessageSchema.safeParse(aiMessage);
      expect(result.success).toBe(true);
    });

    it('should reject message with invalid sender type', () => {
      const invalidMessage = {
        conversationId: 'conv_123',
        senderType: 'invalid_type',
        content: 'Test message',
        isRead: false,
        aiGenerated: false,
      };

      const result = insertMessageSchema.safeParse(invalidMessage);
      expect(result.success).toBe(false);
    });

    it('should reject message with empty content', () => {
      const invalidMessage: InsertMessage = {
        conversationId: 'conv_123',
        senderType: 'user',
        content: '',
        isRead: false,
        aiGenerated: false,
      };

      const result = insertMessageSchema.safeParse(invalidMessage);
      expect(result.success).toBe(false);
    });

    it('should reject message with excessively long content', () => {
      const longContent = 'a'.repeat(5001); // Assuming 5000 char limit
      const invalidMessage: InsertMessage = {
        conversationId: 'conv_123',
        senderType: 'user',
        content: longContent,
        isRead: false,
        aiGenerated: false,
      };

      const result = insertMessageSchema.safeParse(invalidMessage);
      expect(result.success).toBe(false);
    });

    it('should validate customer message type', () => {
      const customerMessage: InsertMessage = {
        conversationId: 'conv_123',
        senderType: 'customer',
        content: 'Customer inquiry message',
        isRead: false,
        aiGenerated: false,
      };

      const result = insertMessageSchema.safeParse(customerMessage);
      expect(result.success).toBe(true);
    });
  });

  describe('User Usage Schema', () => {
    it('should validate valid usage data', () => {
      const validUsage: InsertUserUsage = {
        userId: 'user_123',
        aiResponsesCount: 25,
        tokensUsed: 1500,
        resetDate: new Date().toISOString(),
      };

      const result = insertUserUsageSchema.safeParse(validUsage);
      expect(result.success).toBe(true);
    });

    it('should reject negative usage counts', () => {
      const invalidUsage: InsertUserUsage = {
        userId: 'user_123',
        aiResponsesCount: -5,
        tokensUsed: 1500,
        resetDate: new Date().toISOString(),
      };

      const result = insertUserUsageSchema.safeParse(invalidUsage);
      expect(result.success).toBe(false);
    });

    it('should reject negative token usage', () => {
      const invalidUsage: InsertUserUsage = {
        userId: 'user_123',
        aiResponsesCount: 25,
        tokensUsed: -100,
        resetDate: new Date().toISOString(),
      };

      const result = insertUserUsageSchema.safeParse(invalidUsage);
      expect(result.success).toBe(false);
    });

    it('should validate zero usage counts', () => {
      const zeroUsage: InsertUserUsage = {
        userId: 'user_123',
        aiResponsesCount: 0,
        tokensUsed: 0,
        resetDate: new Date().toISOString(),
      };

      const result = insertUserUsageSchema.safeParse(zeroUsage);
      expect(result.success).toBe(true);
    });
  });

  describe('User Preferences Schema', () => {
    it('should validate valid preferences data', () => {
      const validPreferences: InsertUserPreferences = {
        userId: 'user_123',
        tone: 'friendly',
        customInstructions: 'Always mention the 30-day guarantee',
        autoResponseEnabled: true,
      };

      const result = insertUserPreferencesSchema.safeParse(validPreferences);
      expect(result.success).toBe(true);
    });

    it('should validate all tone types', () => {
      const tones: Array<'friendly' | 'professional' | 'casual'> = ['friendly', 'professional', 'casual'];
      
      for (const tone of tones) {
        const preferences: InsertUserPreferences = {
          userId: 'user_123',
          tone,
          customInstructions: 'Test instructions',
          autoResponseEnabled: true,
        };

        const result = insertUserPreferencesSchema.safeParse(preferences);
        expect(result.success).toBe(true);
      }
    });

    it('should reject invalid tone type', () => {
      const invalidPreferences = {
        userId: 'user_123',
        tone: 'invalid_tone',
        customInstructions: 'Test instructions',
        autoResponseEnabled: true,
      };

      const result = insertUserPreferencesSchema.safeParse(invalidPreferences);
      expect(result.success).toBe(false);
    });

    it('should validate with null custom instructions', () => {
      const preferencesWithNullInstructions: InsertUserPreferences = {
        userId: 'user_123',
        tone: 'professional',
        customInstructions: null,
        autoResponseEnabled: false,
      };

      const result = insertUserPreferencesSchema.safeParse(preferencesWithNullInstructions);
      expect(result.success).toBe(true);
    });

    it('should reject excessively long custom instructions', () => {
      const longInstructions = 'a'.repeat(2001); // Assuming 2000 char limit
      const invalidPreferences: InsertUserPreferences = {
        userId: 'user_123',
        tone: 'friendly',
        customInstructions: longInstructions,
        autoResponseEnabled: true,
      };

      const result = insertUserPreferencesSchema.safeParse(invalidPreferences);
      expect(result.success).toBe(false);
    });

    it('should validate boolean auto-response setting', () => {
      const preferencesTrue: InsertUserPreferences = {
        userId: 'user_123',
        tone: 'casual',
        customInstructions: 'Be concise',
        autoResponseEnabled: true,
      };

      const preferencesFalse: InsertUserPreferences = {
        userId: 'user_123',
        tone: 'casual',
        customInstructions: 'Be concise',
        autoResponseEnabled: false,
      };

      expect(insertUserPreferencesSchema.safeParse(preferencesTrue).success).toBe(true);
      expect(insertUserPreferencesSchema.safeParse(preferencesFalse).success).toBe(true);
    });
  });

  describe('Schema Edge Cases', () => {
    it('should handle UUID validation for user IDs', () => {
      const validUUID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
      const invalidUUID = 'not-a-uuid';

      const validData: InsertConversation = {
        userId: validUUID,
        participantUsername: 'test_user',
        participantName: 'Test User',
        participantAvatarUrl: 'https://example.com/avatar.jpg',
        lastMessageAt: new Date().toISOString(),
        isRead: false,
        messageCount: 1,
      };

      const invalidData: InsertConversation = {
        userId: invalidUUID,
        participantUsername: 'test_user',
        participantName: 'Test User',
        participantAvatarUrl: 'https://example.com/avatar.jpg',
        lastMessageAt: new Date().toISOString(),
        isRead: false,
        messageCount: 1,
      };

      expect(insertConversationSchema.safeParse(validData).success).toBe(true);
      expect(insertConversationSchema.safeParse(invalidData).success).toBe(false);
    });

    it('should handle ISO date string validation', () => {
      const validISODate = new Date().toISOString();
      const invalidDate = 'not-a-date';

      const validData: InsertMessage = {
        conversationId: 'conv_123',
        senderType: 'user',
        content: 'Test message',
        isRead: false,
        aiGenerated: false,
      };

      const invalidData = {
        ...validData,
        sentAt: invalidDate,
      };

      expect(insertMessageSchema.safeParse(validData).success).toBe(true);
      expect(insertMessageSchema.safeParse(invalidData).success).toBe(false);
    });

    it('should handle special characters in text fields', () => {
      const specialCharacters = 'Test with émojis 🎉 and spëcial châractërs!';
      
      const messageWithSpecialChars: InsertMessage = {
        conversationId: 'conv_123',
        senderType: 'customer',
        content: specialCharacters,
        isRead: false,
        aiGenerated: false,
      };

      const result = insertMessageSchema.safeParse(messageWithSpecialChars);
      expect(result.success).toBe(true);
    });

    it('should handle whitespace-only content', () => {
      const whitespaceContent = '   \n\t   ';
      
      const messageWithWhitespace: InsertMessage = {
        conversationId: 'conv_123',
        senderType: 'user',
        content: whitespaceContent,
        isRead: false,
        aiGenerated: false,
      };

      const result = insertMessageSchema.safeParse(messageWithWhitespace);
      expect(result.success).toBe(false);
    });

    it('should validate Instagram username format', () => {
      const validUsernames = ['fitness_guru', 'user123', 'my.username', 'a'];
      const invalidUsernames = ['user@name', 'user name', '', 'a'.repeat(31)];

      for (const username of validUsernames) {
        const conversation: InsertConversation = {
          userId: 'user_123',
          participantUsername: username,
          participantName: 'Test User',
          participantAvatarUrl: 'https://example.com/avatar.jpg',
          lastMessageAt: new Date().toISOString(),
          isRead: false,
          messageCount: 1,
        };

        expect(insertConversationSchema.safeParse(conversation).success).toBe(true);
      }

      for (const username of invalidUsernames) {
        const conversation: InsertConversation = {
          userId: 'user_123',
          participantUsername: username,
          participantName: 'Test User',
          participantAvatarUrl: 'https://example.com/avatar.jpg',
          lastMessageAt: new Date().toISOString(),
          isRead: false,
          messageCount: 1,
        };

        expect(insertConversationSchema.safeParse(conversation).success).toBe(false);
      }
    });
  });
});