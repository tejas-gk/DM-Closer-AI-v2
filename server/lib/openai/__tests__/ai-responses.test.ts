import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { generateAIResponse, type ToneSettings, type ConversationContext } from '../ai-responses';
import OpenAI from 'openai';

// Mock OpenAI
jest.mock('openai');

const MockedOpenAI = OpenAI as jest.MockedClass<typeof OpenAI>;

describe('AI Response Generation', () => {
  let mockOpenAI: jest.Mocked<OpenAI>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockOpenAI = new MockedOpenAI() as jest.Mocked<OpenAI>;
    mockOpenAI.chat = {
      completions: {
        create: jest.fn(),
      },
    } as any;
  });

  const mockToneSettings: ToneSettings = {
    type: 'friendly',
    customInstructions: 'Be helpful and engage with enthusiasm',
  };

  const mockConversationContext: ConversationContext = {
    conversationId: 'conv_123',
    participantName: 'John Doe',
    participantUsername: 'johndoe_fitness',
    recentMessages: [
      {
        id: 'msg_1',
        content: 'Hi! I saw your fitness program. Is it suitable for beginners?',
        senderType: 'customer',
        sentAt: '2025-06-20T10:00:00Z',
      },
      {
        id: 'msg_2',
        content: 'Thanks for reaching out! Yes, our program is perfect for beginners.',
        senderType: 'user',
        sentAt: '2025-06-20T10:01:00Z',
      },
      {
        id: 'msg_3',
        content: 'Great! What kind of results can I expect in the first month?',
        senderType: 'customer',
        sentAt: '2025-06-20T10:02:00Z',
      },
    ],
  };

  describe('generateAIResponse', () => {
    it('should generate appropriate response with friendly tone', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: "That's a great question! In your first month, most beginners see improved energy levels and start building healthy habits. You'll likely notice better form in your workouts and increased strength in basic movements. The key is consistency - even 20-30 minutes 3-4 times per week makes a real difference! 💪",
            },
          },
        ],
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse as any);

      const result = await generateAIResponse(mockToneSettings, mockConversationContext);

      expect(result).toEqual({
        response: "That's a great question! In your first month, most beginners see improved energy levels and start building healthy habits. You'll likely notice better form in your workouts and increased strength in basic movements. The key is consistency - even 20-30 minutes 3-4 times per week makes a real difference! 💪",
        tone: 'friendly',
        tokensUsed: expect.any(Number),
      });

      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith({
        model: 'gpt-4',
        messages: expect.arrayContaining([
          expect.objectContaining({
            role: 'system',
            content: expect.stringContaining('friendly'),
          }),
          expect.objectContaining({
            role: 'user',
            content: expect.stringContaining('Great! What kind of results can I expect in the first month?'),
          }),
        ]),
        max_tokens: 300,
        temperature: 0.7,
      });
    });

    it('should generate professional tone responses', async () => {
      const professionalTone: ToneSettings = {
        type: 'professional',
        customInstructions: 'Maintain professionalism while being informative',
      };

      const mockResponse = {
        choices: [
          {
            message: {
              content: "Thank you for your inquiry. Based on our program data, beginners typically experience measurable improvements within the first 30 days. You can expect increased energy levels, improved form in basic exercises, and enhanced strength in fundamental movements. For optimal results, we recommend consistency with 3-4 sessions per week, 20-30 minutes each.",
            },
          },
        ],
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse as any);

      const result = await generateAIResponse(professionalTone, mockConversationContext);

      expect(result.tone).toBe('professional');
      expect(result.response).toContain('Thank you for your inquiry');
    });

    it('should generate casual tone responses', async () => {
      const casualTone: ToneSettings = {
        type: 'casual',
        customInstructions: 'Keep it relaxed and conversational',
      };

      const mockResponse = {
        choices: [
          {
            message: {
              content: "Hey! So in your first month, you'll probably feel way more energetic and start getting the hang of the workouts. Most people see their strength improve pretty quickly with the basic stuff. Just stay consistent - even if it's just 20-30 mins a few times a week, you'll be good to go! 🙌",
            },
          },
        ],
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse as any);

      const result = await generateAIResponse(casualTone, mockConversationContext);

      expect(result.tone).toBe('casual');
      expect(result.response).toContain('Hey!');
    });

    it('should handle conversation context properly', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Test response' } }],
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse as any);

      await generateAIResponse(mockToneSettings, mockConversationContext);

      const callArgs = mockOpenAI.chat.completions.create.mock.calls[0][0];
      const messages = callArgs.messages;

      expect(messages).toHaveLength(4); // system + 3 conversation messages
      expect(messages[0].role).toBe('system');
      expect(messages[1].content).toContain('Hi! I saw your fitness program');
      expect(messages[2].content).toContain('Thanks for reaching out!');
      expect(messages[3].content).toContain('Great! What kind of results');
    });

    it('should include custom instructions in system prompt', async () => {
      const customTone: ToneSettings = {
        type: 'friendly',
        customInstructions: 'Always mention the 30-day money-back guarantee',
      };

      const mockResponse = {
        choices: [{ message: { content: 'Test response with guarantee mention' } }],
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse as any);

      await generateAIResponse(customTone, mockConversationContext);

      const callArgs = mockOpenAI.chat.completions.create.mock.calls[0][0];
      const systemMessage = callArgs.messages[0];

      expect(systemMessage.content).toContain('Always mention the 30-day money-back guarantee');
    });

    it('should handle empty conversation context', async () => {
      const emptyContext: ConversationContext = {
        conversationId: 'conv_empty',
        participantName: 'New User',
        participantUsername: 'newuser',
        recentMessages: [],
      };

      const mockResponse = {
        choices: [{ message: { content: 'Hello! How can I help you today?' } }],
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse as any);

      const result = await generateAIResponse(mockToneSettings, emptyContext);

      expect(result.response).toBe('Hello! How can I help you today?');

      const callArgs = mockOpenAI.chat.completions.create.mock.calls[0][0];
      expect(callArgs.messages).toHaveLength(2); // system + default greeting prompt
    });

    it('should handle OpenAI API errors', async () => {
      const apiError = new Error('OpenAI API rate limit exceeded');
      mockOpenAI.chat.completions.create.mockRejectedValue(apiError);

      await expect(generateAIResponse(mockToneSettings, mockConversationContext))
        .rejects.toThrow('OpenAI API rate limit exceeded');
    });

    it('should handle malformed OpenAI responses', async () => {
      const malformedResponse = {
        choices: [], // No choices
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(malformedResponse as any);

      await expect(generateAIResponse(mockToneSettings, mockConversationContext))
        .rejects.toThrow('Invalid response from OpenAI');
    });

    it('should calculate token usage accurately', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Test response' } }],
        usage: {
          total_tokens: 150,
          prompt_tokens: 100,
          completion_tokens: 50,
        },
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse as any);

      const result = await generateAIResponse(mockToneSettings, mockConversationContext);

      expect(result.tokensUsed).toBe(150);
    });

    it('should limit conversation history appropriately', async () => {
      const longContext: ConversationContext = {
        conversationId: 'conv_long',
        participantName: 'Active User',
        participantUsername: 'activeuser',
        recentMessages: Array.from({ length: 20 }, (_, i) => ({
          id: `msg_${i}`,
          content: `Message ${i} content here`,
          senderType: i % 2 === 0 ? 'customer' : 'user',
          sentAt: new Date(Date.now() - (20 - i) * 60000).toISOString(),
        })),
      };

      const mockResponse = {
        choices: [{ message: { content: 'Response to long conversation' } }],
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse as any);

      await generateAIResponse(mockToneSettings, longContext);

      const callArgs = mockOpenAI.chat.completions.create.mock.calls[0][0];
      // Should limit to system message + max 10 recent messages
      expect(callArgs.messages.length).toBeLessThanOrEqual(11);
    });

    it('should format Instagram context properly', async () => {
      const instagramContext: ConversationContext = {
        conversationId: 'conv_ig',
        participantName: 'Fitness Enthusiast',
        participantUsername: 'fit_enthusiast_2024',
        recentMessages: [
          {
            id: 'msg_ig',
            content: 'Saw your post about nutrition tips! Do you have a meal plan?',
            senderType: 'customer',
            sentAt: '2025-06-20T15:00:00Z',
          },
        ],
      };

      const mockResponse = {
        choices: [{ message: { content: 'Instagram-specific response' } }],
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse as any);

      await generateAIResponse(mockToneSettings, instagramContext);

      const callArgs = mockOpenAI.chat.completions.create.mock.calls[0][0];
      const systemMessage = callArgs.messages[0];

      expect(systemMessage.content).toContain('Instagram');
      expect(systemMessage.content).toContain('@fit_enthusiast_2024');
    });
  });

  describe('Error Handling', () => {
    it('should handle network timeouts', async () => {
      const timeoutError = new Error('Network timeout');
      timeoutError.name = 'TimeoutError';
      
      mockOpenAI.chat.completions.create.mockRejectedValue(timeoutError);

      await expect(generateAIResponse(mockToneSettings, mockConversationContext))
        .rejects.toThrow('Network timeout');
    });

    it('should handle invalid API key errors', async () => {
      const authError = new Error('Invalid API key');
      authError.name = 'AuthenticationError';
      
      mockOpenAI.chat.completions.create.mockRejectedValue(authError);

      await expect(generateAIResponse(mockToneSettings, mockConversationContext))
        .rejects.toThrow('Invalid API key');
    });

    it('should handle content filtering errors', async () => {
      const contentError = new Error('Content filtered by OpenAI');
      contentError.name = 'ContentFilterError';
      
      mockOpenAI.chat.completions.create.mockRejectedValue(contentError);

      await expect(generateAIResponse(mockToneSettings, mockConversationContext))
        .rejects.toThrow('Content filtered by OpenAI');
    });
  });
});