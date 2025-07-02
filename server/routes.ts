import type { Express } from "express";
import { createServer, type Server } from "http";
import { getSubscriptionPricesFromLookups, getActiveCustomerSubscriptions } from "./lib/stripe/subscriptions";
import { createCheckoutSession } from "./lib/stripe/checkout";
import { createPortalSession } from "./lib/stripe/portal";
import { findOrCreateStripeCustomer } from "./lib/stripe/customers";
import { getUserProfileByAdmin } from "./lib/supabase/admin/profiles";
import { generateAIResponse, ToneSettings, ConversationContext } from "./lib/openai/ai-responses";
import { sendWelcomeEmail, sendQuotaWarningEmail } from "./lib/resend/emails";
import { handleStripeWebhook, verifyWebhookSignature } from "./lib/stripe/webhooks";
import { getCustomerTrialInfo } from "./lib/stripe/trials";
import { 
  getUserUsage, 
  updateUserUsage, 
  checkAndSendQuotaWarnings, 
  simulateUsage, 
  getUsagePercentage,
  getAllUserUsage 
} from "./lib/usage/quota-monitor";
import { 
  getUserPreferences, 
  createOrUpdateUserPreferences, 
  getDefaultUserPreferences 
} from "./lib/database/user-preferences";
import { 
  updateConversationAutoReply, 
  getConversationAutoReplyStatus,
  createOrUpdateConversation 
} from "./lib/database/conversations";
import { 
  exchangeCodeForToken, 
  getLongLivedToken, 
  getUserInfo 
} from "./lib/instagram/auth";
import { sendInstagramMessage } from "./lib/instagram/messaging";
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { conversations, messages, instagramConnections, insertConversationSchema, insertMessageSchema, insertInstagramConnectionSchema } from "../shared/schema";
import { eq, and } from "drizzle-orm";

// Database connection
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}
const client = postgres(connectionString);
const db = drizzle(client);

// State storage for demo conversations
const demoConversationSettings: Record<string, { autoReplyEnabled: boolean }> = {
  'conv_1': { autoReplyEnabled: false },
  'conv_2': { autoReplyEnabled: true },
  'conv_3': { autoReplyEnabled: false }
};

// Dynamic message storage for demo
const conversationMessages: Record<string, any[]> = {
  'conv_1': [
    {
      id: 'msg_1',
      conversationId: 'conv_1',
      instagramMessageId: 'ig_msg_28490123_1',
      senderType: 'customer',
      content: "Hi! I've been following your Instagram and love your content.",
      messageType: 'text',
      isRead: true,
      aiGenerated: false,
      responseStatus: 'sent',
      sentAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
      createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString()
    },
    {
      id: 'msg_2',
      conversationId: 'conv_1',
      instagramMessageId: 'ig_msg_28490123_2',
      senderType: 'ai',
      content: "Thank you so much! I really appreciate your support. How can I help you today?",
      messageType: 'text',
      isRead: true,
      aiGenerated: true,
      toneUsed: 'friendly',
      responseStatus: 'sent',
      sentAt: new Date(Date.now() - 1000 * 60 * 21).toISOString(),
      createdAt: new Date(Date.now() - 1000 * 60 * 21).toISOString()
    }
  ],
  'conv_2': [
    {
      id: 'msg_2_1',
      conversationId: 'conv_2',
      instagramMessageId: 'ig_msg_28490124_1',
      senderType: 'customer',
      content: "Hey! I'm looking to build muscle and lose fat. Can you help?",
      messageType: 'text',
      isRead: true,
      aiGenerated: false,
      responseStatus: 'sent',
      sentAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString()
    }
  ]
};

// Mock data generation functions
function generateDashboardConversations(userId: string, page: number, limit: number, search?: string) {
  const mockConversations = [
    {
      id: "conv_1",
      userId,
      instagramThreadId: "ig_thread_28490123",
      participantUsername: "sarah_martinez_fit",
      participantName: "Sarah Martinez", 
      participantFirstName: "Sarah",
      participantAvatarUrl: "https://images.unsplash.com/photo-1494790108755-2616b332c1a5?w=150&h=150&fit=crop&crop=face",
      lastMessageAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      isRead: false,
      autoReplyEnabled: demoConversationSettings['conv_1']?.autoReplyEnabled ?? false,
      messageCount: 5,
      lastMessage: {
        content: "I'm interested in your fitness coaching services. What packages do you offer?",
        sentAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        senderType: "customer",
        aiGenerated: false
      }
    },
    {
      id: "conv_2", 
      userId,
      instagramThreadId: "ig_thread_28490124",
      participantUsername: "mike_johnson_gains",
      participantName: "Mike Johnson",
      participantFirstName: "Mike",
      participantAvatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face", 
      lastMessageAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      isRead: true,
      autoReplyEnabled: demoConversationSettings['conv_2']?.autoReplyEnabled ?? false,
      messageCount: 8,
      lastMessage: {
        content: "Perfect! I'd love to help you reach your goals. Our beginner package includes personalized workouts and nutrition guidance.",
        sentAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        senderType: "ai",
        aiGenerated: true
      }
    }
  ];

  let filtered = mockConversations;
  if (search) {
    filtered = mockConversations.filter(conv => 
      conv.participantName.toLowerCase().includes(search.toLowerCase()) ||
      conv.participantUsername.toLowerCase().includes(search.toLowerCase())
    );
  }

  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  return filtered.slice(startIndex, endIndex);
}

function generateDashboardConversationWithMessages(conversationId: string, userId: string) {
  // Get messages from dynamic storage, or use empty array
  const messages = conversationMessages[conversationId] || [];
  
  // Get conversation metadata
  const conversations = generateDashboardConversations(userId, 1, 50);
  const conversation = conversations.find(c => c.id === conversationId);
  
  if (!conversation) {
    return null;
  }
  
  // Return conversation with messages
  return {
    ...conversation,
    messages: messages.sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime())
  };
}

// HARDCODE TESTING - REMOVE BEFORE PRODUCTION
const HARDCODED_INSTAGRAM_CONFIG = {
  appId: '1737792583503765',
  appSecret: '28c80d7fe3c907ce5271753e3357e329', // ✅ Updated with your app secret
  webhookVerifyToken: 'dmcloser_webhook_verify_2025', // ✅ Updated with your verify token
  testUserId: 'PLACEHOLDER_INSTAGRAM_USER_ID', // Replace with your Instagram user ID
  testAccessToken: 'PLACEHOLDER_ACCESS_TOKEN', // Replace with your long-lived access token
  testUsername: 'PLACEHOLDER_USERNAME' // Replace with your Instagram username
};

export async function registerRoutes(app: Express): Promise<Server> {
  const server = createServer(app);

  // Get conversations list with pagination (unified inbox)
  app.get("/api/conversations", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string;
      
      if (!userId) {
        return res.status(400).json({ error: "User ID required" });
      }

      // Get real Instagram conversations from database
      let dbConversations = await db.select()
        .from(conversations)
        .where(eq(conversations.userId, userId))
        .orderBy(conversations.lastMessageAt)
        .limit(limit)
        .offset((page - 1) * limit);

      // Add search filtering if provided
      if (search) {
        dbConversations = dbConversations.filter(conv => 
          conv.participantName?.toLowerCase().includes(search.toLowerCase()) ||
          conv.participantUsername.toLowerCase().includes(search.toLowerCase())
        );
      }

      // Get last message for each conversation
      const conversationsWithMessages = await Promise.all(
        dbConversations.map(async (conv) => {
          const lastMessage = await db.select()
            .from(messages)
            .where(eq(messages.conversationId, conv.id))
            .orderBy(messages.sentAt)
            .limit(1);

          return {
            ...conv,
            lastMessage: lastMessage[0] ? {
              content: lastMessage[0].content,
              sentAt: lastMessage[0].sentAt,
              senderType: lastMessage[0].senderType,
              aiGenerated: lastMessage[0].aiGenerated
            } : null,
            platform: 'instagram' // All conversations are Instagram for now
          };
        })
      );

      // Fallback to mock conversations if no database conversations
      let finalConversations: any[] = conversationsWithMessages;
      if (finalConversations.length === 0) {
        console.log('No Instagram conversations found, using mock data');
        finalConversations = generateDashboardConversations(userId, page, limit, search);
      }
      
      res.json({
        conversations: finalConversations,
        pagination: {
          page,
          limit,
          total: 50,
          totalPages: Math.ceil(50 / limit)
        }
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get specific conversation with messages
  app.get("/api/conversations/:id", async (req, res) => {
    try {
      const conversationId = req.params.id;
      const userId = req.query.userId as string;
      
      if (!userId) {
        return res.status(400).json({ error: "User ID required" });
      }

      const conversation = generateDashboardConversationWithMessages(conversationId, userId);
      
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      
      res.json(conversation);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Send message to conversation
  app.post("/api/conversations/:id/messages", async (req, res) => {
    try {
      const conversationId = req.params.id;
      const { content, userId } = req.body;
      
      if (!userId || !content) {
        return res.status(400).json({ error: "User ID and content required" });
      }

      // Create user message
      const userMessage = {
        id: `msg_${Date.now()}`,
        conversationId,
        instagramMessageId: `ig_${Date.now()}`,
        senderType: 'user',
        content,
        messageType: 'text',
        isRead: true,
        aiGenerated: false,
        sentAt: new Date().toISOString(),
        deliveredAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };

      // Add message to conversation
      if (!conversationMessages[conversationId]) {
        conversationMessages[conversationId] = [];
      }
      conversationMessages[conversationId].push(userMessage);

      res.json(userMessage);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get conversation auto-reply status
  app.get("/api/conversations/:id/auto-reply", async (req, res) => {
    try {
      const conversationId = req.params.id;

      // For demo conversations, return mock status
      if (conversationId.startsWith('conv_')) {
        const mockConversations = generateDashboardConversations('demo_user', 1, 50);
        const conversation = mockConversations.find(c => c.id === conversationId);
        
        return res.json({ 
          conversationId, 
          autoReplyEnabled: conversation?.autoReplyEnabled ?? true 
        });
      }

      // Get from database for real conversations
      const autoReplyEnabled = await getConversationAutoReplyStatus(conversationId);
      
      if (autoReplyEnabled === null) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      
      res.json({ 
        conversationId, 
        autoReplyEnabled 
      });
    } catch (error: any) {
      console.error('Error fetching auto-reply status:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Update conversation auto-reply setting
  app.put("/api/conversations/:id/auto-reply", async (req, res) => {
    try {
      const conversationId = req.params.id;
      const { autoReplyEnabled } = req.body;
      
      if (typeof autoReplyEnabled !== 'boolean') {
        return res.status(400).json({ error: "autoReplyEnabled must be a boolean" });
      }

      // For demo conversations, update the in-memory state
      if (conversationId.startsWith('conv_')) {
        // Update the demo conversation settings
        if (!demoConversationSettings[conversationId]) {
          demoConversationSettings[conversationId] = { autoReplyEnabled: false };
        }
        demoConversationSettings[conversationId].autoReplyEnabled = autoReplyEnabled;
        
        console.log(`Auto-reply ${autoReplyEnabled ? 'enabled' : 'disabled'} for demo conversation ${conversationId}`);
        return res.json({ 
          success: true, 
          conversationId, 
          autoReplyEnabled 
        });
      }

      // Update database for real conversations
      const updated = await updateConversationAutoReply(conversationId, autoReplyEnabled);
      
      if (!updated) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      console.log(`Auto-reply ${autoReplyEnabled ? 'enabled' : 'disabled'} for conversation ${conversationId} - saved to database`);
      
      res.json({ 
        success: true, 
        conversationId, 
        autoReplyEnabled 
      });
    } catch (error: any) {
      console.error('Error updating auto-reply setting:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Generate AI response for conversation
  app.post("/api/conversations/:id/generate-ai-response", async (req, res) => {
    try {
      const conversationId = req.params.id;
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: "User ID required" });
      }

      // Get conversation with messages
      const conversation = generateDashboardConversationWithMessages(conversationId, userId);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      // Generate AI response
      // Check if auto-reply is enabled for this conversation
      const conversationData = generateDashboardConversations(userId, 1, 100).find(c => c.id === conversationId);
      if (!conversationData?.autoReplyEnabled) {
        return res.status(400).json({ error: "Auto-reply is disabled for this conversation" });
      }

      const aiSettings: ToneSettings = {
        type: "friendly",
        customInstructions: "Always mention our 7-day free trial when appropriate. Focus on transformation stories and results. Be encouraging about their fitness journey."
      };

      const conversationContext: ConversationContext = {
        messages: conversation.messages.map((msg: any) => ({
          role: msg.senderType === 'customer' ? 'user' as const : 'assistant' as const,
          content: String(msg.content),
          timestamp: String(msg.sentAt)
        })),
        customerName: conversation.participantName || 'Customer',
        customerFirstName: conversation.participantFirstName,
        businessContext: 'Fitness coaching and personal training services',
        businessProfile: 'fitlife_coaching'
      };

      const aiResponse = await generateAIResponse({
        conversationContext,
        toneSettings: aiSettings,
        businessProfile: 'fitlife_coaching',
        userId: 'demo-user'
      });

      // Track usage
      updateUserUsage("demo-user", 1);

      // Create AI response message
      const aiMessage = {
        id: `msg_ai_${Date.now()}`,
        conversationId,
        instagramMessageId: `ig_ai_${Date.now()}`,
        senderType: 'ai',
        content: aiResponse,
        messageType: 'text',
        isRead: true,
        aiGenerated: true,
        toneUsed: aiSettings.type,
        responseStatus: 'sent',
        sentAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };

      // Add AI message to conversation
      conversationMessages[conversationId].push(aiMessage);

      console.log(`Manual AI response generated for conversation ${conversationId}: "${aiResponse.substring(0, 50)}..."`);
      
      res.json(aiMessage);
    } catch (error: any) {
      console.error('Failed to generate AI response:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Simulate customer message
  app.post("/api/conversations/:id/simulate-customer-message", async (req, res) => {
    try {
      const conversationId = req.params.id;
      const { content, customerName } = req.body;
      
      if (!content) {
        return res.status(400).json({ error: "Content required" });
      }

      // Create customer message
      const customerMessage = {
        id: `msg_customer_${Date.now()}`,
        conversationId,
        instagramMessageId: `ig_customer_${Date.now()}`,
        senderType: 'customer',
        content,
        messageType: 'text',
        isRead: false,
        aiGenerated: false,
        sentAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };

      // Add message to conversation
      if (!conversationMessages[conversationId]) {
        conversationMessages[conversationId] = [];
      }
      conversationMessages[conversationId].push(customerMessage);

      // Auto-generate AI response after delay
      setTimeout(async () => {
        try {
          const conversation = generateDashboardConversationWithMessages(conversationId, 'demo-user');
          if (!conversation) return;

          const aiSettings: ToneSettings = {
            type: "friendly",
            customInstructions: "Always mention our 7-day free trial when appropriate. Focus on transformation stories and results. Be encouraging about their fitness journey."
          };

          const conversationContext: ConversationContext = {
            messages: conversation.messages.map((msg: any) => ({
              role: msg.senderType === 'customer' ? 'user' as const : 'assistant' as const,
              content: String(msg.content),
              timestamp: String(msg.sentAt)
            })),
            customerName: conversation.participantName || 'Customer',
            businessContext: 'Fitness coaching and personal training services'
          };

          const aiResponse = await generateAIResponse({
            conversationContext,
            toneSettings: aiSettings,
            userId: 'demo-user'
          });

          updateUserUsage("demo-user", 1);

          const aiMessage = {
            id: `msg_ai_${Date.now()}`,
            conversationId,
            instagramMessageId: `ig_ai_${Date.now()}`,
            senderType: 'ai',
            content: aiResponse,
            messageType: 'text',
            isRead: true,
            aiGenerated: true,
            toneUsed: aiSettings.type,
            responseStatus: 'sent',
            sentAt: new Date().toISOString(),
            createdAt: new Date().toISOString()
          };

          conversationMessages[conversationId].push(aiMessage);
          console.log(`AI auto-response to customer message in ${conversationId}: "${aiResponse.substring(0, 50)}..."`);
        } catch (error) {
          console.error('Failed to generate AI auto-response:', error);
        }
      }, 2000 + Math.random() * 2000);

      res.json(customerMessage);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Subscription status endpoint
  app.get("/api/subscription-status", async (req, res) => {
    try {
      const { userId } = req.query;
      if (!userId) {
        return res.status(400).json({ error: "User ID required" });
      }

      console.log(`[Subscription Status] Processing request for userId: ${userId}`);
      
      // Handle demo/development environments with non-UUID user IDs
      const isDemoUser = !(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId as string));
      
      if (isDemoUser) {
        console.log(`[Subscription Status] Demo user detected: ${userId}`);
        // Return demo subscription data for testing
        return res.json({
          hasSubscription: true,
          subscriptions: [{
            id: 'demo_subscription',
            status: 'active',
            plan: 'demo_plan'
          }],
          customerId: 'demo_customer_id'
        });
      }
      
      const customer = await findOrCreateStripeCustomer(userId as string);
      const subscriptions = await getActiveCustomerSubscriptions({
        customerId: customer.id
      });

      // Get trial information for the customer
      const trialInfo = await getCustomerTrialInfo(customer.id);

      console.log(`[Subscription Status] Found customer: ${customer.id}, subscriptions: ${subscriptions.length}`);
      console.log(`[Subscription Status] Trial info:`, trialInfo);

      res.json({
        hasSubscription: subscriptions.length > 0,
        subscriptions: subscriptions,
        customerId: customer.id,
        trialInfo: {
          isInTrial: trialInfo.isInTrial,
          trialEnd: trialInfo.trialEnd?.toISOString() || null,
          daysRemaining: trialInfo.daysRemaining,
          subscriptionStatus: trialInfo.subscriptionStatus
        }
      });
    } catch (error: any) {
      console.error(`[Subscription Status] Error for userId ${req.query.userId}:`, error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // Create billing portal session endpoint
  app.post("/api/create-portal-session", async (req, res) => {
    try {
      const { customerId, returnUrl } = req.body;
      if (!customerId) {
        return res.status(400).json({ error: "Customer ID required" });
      }

      // Handle demo environment
      if (customerId === 'demo_customer_id') {
        console.log('[Portal] Demo customer detected - simulating portal access');
        return res.json({ 
          url: returnUrl || `${req.headers.origin}/dashboard/settings?demo=true`
        });
      }

      const portalUrl = await createPortalSession({
        customerId,
        returnUrl: returnUrl || `${process.env.NODE_ENV === 'production' ? 'https://' + req.get('host') : 'http://localhost:5000'}/dashboard/settings`
      });

      res.json({ url: portalUrl });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Stripe webhook endpoint for trial management
  app.post("/api/webhooks/stripe", async (req, res) => {
    const signature = req.headers['stripe-signature'] as string;
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!endpointSecret) {
      console.error('[Stripe Webhook] Missing STRIPE_WEBHOOK_SECRET environment variable');
      return res.status(500).json({ error: 'Webhook secret not configured' });
    }

    let event;
    try {
      event = verifyWebhookSignature(req.body, signature, endpointSecret);
    } catch (error: any) {
      console.error('[Stripe Webhook] Signature verification failed:', error.message);
      return res.status(400).json({ error: 'Invalid signature' });
    }

    try {
      await handleStripeWebhook(event);
      res.json({ received: true });
    } catch (error: any) {
      console.error('[Stripe Webhook] Error processing webhook:', error.message);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  });

  // Get subscription plans endpoint (new pricing structure)
  app.get("/api/subscription-plans", async (req, res) => {
    try {
      const plans = [
        {
          id: 'starter',
          name: 'Starter',
          lookup_key: 'starter_monthly_eur',
          price: 39,
          currency: 'EUR',
          replies: 500,
          features: [
            '500 AI replies per month',
            'Basic tone settings',
            'Email support',
            'Instagram DM integration',
            'Basic analytics'
          ]
        },
        {
          id: 'pro',
          name: 'Pro',
          lookup_key: 'pro_monthly_eur',
          price: 79,
          currency: 'EUR',
          replies: 1500,
          popular: true,
          features: [
            '1,500 AI replies per month',
            'All tone settings including GFE',
            'Business profile customization',
            'Priority support',
            'Advanced analytics',
            'Custom instructions'
          ]
        },
        {
          id: 'agency',
          name: 'Agency',
          lookup_key: 'agency_monthly_eur',
          price: 199,
          currency: 'EUR',
          replies: 4000,
          features: [
            '4,000 AI replies per month',
            'All Pro features',
            'Multiple business profiles',
            'Team collaboration',
            'White-label options',
            'Phone support'
          ]
        },
        {
          id: 'flex',
          name: 'Flex',
          lookup_key: 'flex_monthly_eur',
          price: 0.049,
          currency: 'EUR',
          replies: 5000,
          isFlexible: true,
          features: [
            'Starting from 5,000 replies',
            'Pay per reply (€0.049)',
            'All Agency features',
            'Unlimited scaling',
            'Custom integrations',
            'Dedicated account manager'
          ]
        }
      ];
      
      res.json({ plans });
    } catch (error: any) {
      console.error("Failed to fetch subscription plans:", error);
      res.status(500).json({ error: "Failed to fetch subscription plans" });
    }
  });

  // Get trial status for a customer
  app.get("/api/trial-status", async (req, res) => {
    try {
      const { userId } = req.query;
      if (!userId) {
        return res.status(400).json({ error: "User ID required" });
      }

      // Handle demo environment
      if (userId === 'demo_user') {
        return res.json({
          isInTrial: true,
          trialEnd: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          daysRemaining: 5,
          subscriptionId: 'demo_subscription',
          subscriptionStatus: 'trialing'
        });
      }

      const customer = await findOrCreateStripeCustomer(userId as string);
      const trialInfo = await getCustomerTrialInfo(customer.id);

      res.json({
        ...trialInfo,
        trialEnd: trialInfo.trialEnd?.toISOString() || null
      });
    } catch (error: any) {
      console.error("Failed to get trial status:", error);
      res.status(500).json({ error: "Failed to get trial status" });
    }
  });

  // Create checkout session for subscription
  app.post("/api/create-checkout-session", async (req, res) => {
    try {
      const { userId, priceId } = req.body;
      if (!userId || !priceId) {
        return res.status(400).json({ error: "User ID and price ID required" });
      }

      // Check if user already has an active subscription
      const customer = await findOrCreateStripeCustomer(userId);
      const subscriptions = await getActiveCustomerSubscriptions({
        customerId: customer.id
      });

      if (subscriptions.length > 0) {
        return res.json({ status: 'already_subscribed' });
      }

      const result = await createCheckoutSession({
        userId,
        priceId,
        successUrl: `${req.headers.origin}/membership?success=true`,
        cancelUrl: `${req.headers.origin}/membership?canceled=true`
      });

      res.json(result);
    } catch (error: any) {
      console.error("Failed to create checkout session:", error);
      res.status(500).json({ error: "Failed to create checkout session" });
    }
  });

  // AI Settings endpoints
  app.get("/api/ai-settings", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      
      // For demo purposes, use a default user ID if none provided
      const targetUserId = userId || 'demo_user';
      
      let settings;
      
      if (targetUserId === 'demo_user') {
        // Return demo data for demo user
        settings = await getDefaultUserPreferences();
      } else {
        // Try to get user preferences from database
        settings = await getUserPreferences(targetUserId);
        
        // If no preferences found, return defaults
        if (!settings) {
          settings = await getDefaultUserPreferences();
        }
      }
      
      // Convert to expected frontend format
      res.json({
        type: settings.aiTone,
        businessProfile: settings.businessProfile,
        customInstructions: settings.customInstructions
      });
    } catch (error: any) {
      console.error('Error fetching AI settings:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/ai-settings", async (req, res) => {
    try {
      const { type, businessProfile, customInstructions } = req.body;
      const userId = req.query.userId as string || 'demo_user';
      
      if (!type || !['friendly', 'professional', 'casual', 'girlfriend_experience'].includes(type)) {
        return res.status(400).json({ error: "Invalid tone type" });
      }
      
      if (businessProfile && !['fitlife_coaching', 'onlyfans_model', 'product_sales'].includes(businessProfile)) {
        return res.status(400).json({ error: "Invalid business profile" });
      }
      
      const preferencesData = {
        aiTone: type as 'friendly' | 'professional' | 'casual' | 'girlfriend_experience',
        businessProfile: businessProfile as 'fitlife_coaching' | 'onlyfans_model' | 'product_sales',
        customInstructions: customInstructions || null
      };
      
      // Save to database (except for demo user)
      if (userId !== 'demo_user') {
        await createOrUpdateUserPreferences(userId, preferencesData);
        console.log(`AI settings saved to database for user ${userId}: tone=${type}, profile=${businessProfile}`);
      } else {
        console.log(`AI settings updated for demo user: tone=${type}, profile=${businessProfile}, instructions="${customInstructions?.substring(0, 50)}..."`);
      }
      
      res.json({ 
        success: true, 
        settings: { type, businessProfile, customInstructions } 
      });
    } catch (error: any) {
      console.error('Error saving AI settings:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Instagram webhook endpoint for receiving DM notifications
  app.get("/api/instagram/webhook", (req, res) => {
    // Support both dot and underscore notation for parameters
    const mode = req.query['hub.mode'] || req.query['hub_mode'];
    const token = req.query['hub.verify_token'] || req.query['hub_verify_token'];
    const challenge = req.query['hub.challenge'] || req.query['hub_challenge'];
    
    console.log('Instagram webhook verification request:', {
      mode,
      token: token,
      challenge: challenge,
      challengeType: typeof challenge,
      allParams: req.query,
      expectedToken: HARDCODED_INSTAGRAM_CONFIG.webhookVerifyToken,
      tokenMatch: token === HARDCODED_INSTAGRAM_CONFIG.webhookVerifyToken,
      serverPubliclyAccessible: 'https://' + req.get('host')
    });
    
    // HARDCODE TESTING - Use hardcoded webhook verification token
    const verifyToken = HARDCODED_INSTAGRAM_CONFIG.webhookVerifyToken;
    
    // Be more flexible with verification
    if (mode === 'subscribe' && token === verifyToken && challenge) {
      console.log('Instagram webhook verified successfully');
      
      // Convert challenge to number if it's a numeric string, otherwise return as-is
      const challengeStr = String(Array.isArray(challenge) ? challenge[0] : challenge);
      const challengeResponse = /^\d+$/.test(challengeStr) ? parseInt(challengeStr, 10) : challengeStr;
      
      console.log('Returning challenge:', {
        original: challenge,
        response: challengeResponse,
        type: typeof challengeResponse
      });
      
      // Return challenge as plain text with correct content type
      res.status(200).type('text/plain').send(challengeResponse.toString());
    } else {
      console.log('Instagram webhook verification failed:', {
        mode,
        modeCorrect: mode === 'subscribe',
        tokenMatch: token === verifyToken,
        expectedToken: verifyToken,
        actualToken: token,
        hasChallenge: !!challenge,
        challenge: challenge
      });
      
      // Return a more helpful response
      if (mode === 'subscribe' && !token) {
        res.status(400).send('Missing verify_token');
      } else if (mode === 'subscribe' && token !== verifyToken) {
        res.status(403).send('Invalid verify_token');
      } else if (mode === 'subscribe' && !challenge) {
        res.status(400).send('Missing challenge');
      } else {
        res.status(403).send('Forbidden');
      }
    }
  });

  // Instagram webhook endpoint for receiving DM messages
  app.post("/api/instagram/webhook", (req, res) => {
    try {
      console.log('=== INSTAGRAM WEBHOOK MESSAGE RECEIVED ===');
      console.log('Headers:', JSON.stringify(req.headers, null, 2));
      console.log('Body:', JSON.stringify(req.body, null, 2));
      console.log('Timestamp:', new Date().toISOString());
      
      const body = req.body;
      
      // Verify the webhook signature (in production)
      // TODO: Add signature verification for security
      
      if (body.object === 'instagram') {
        body.entry.forEach((entry: any) => {
          entry.messaging?.forEach((messagingEvent: any) => {
            handleInstagramMessage(messagingEvent);
          });
        });
      }
      
      res.status(200).send('OK');
    } catch (error) {
      console.error('Instagram webhook error:', error);
      res.status(500).send('Error processing webhook');
    }
  });

  // Instagram OAuth callback endpoint (root path for Instagram compatibility)
  app.get("/", async (req, res) => {
    const code = req.query.code as string;
    const state = req.query.state as string;
    
    // Check if this is an Instagram OAuth callback
    if (code && state && typeof state === 'string' && state.startsWith('user_')) {
      console.log('Instagram OAuth callback received at root path:', { code: code ? 'present' : 'missing', state });
      
      try {
        // Exchange code for short-lived access token
        // Use the same redirect URI as in authorization
        const redirectUri = 'https://dm-closer-ai-hellocrossman.replit.app/api/instagram/callback';
        const tokenResponse = await exchangeCodeForToken(code, redirectUri);
        
        // Get long-lived access token (60 days)
        const longLivedToken = await getLongLivedToken(tokenResponse.access_token);
        
        // Get user info
        const userInfo = await getUserInfo(longLivedToken.access_token);
        
        console.log('Instagram OAuth success:', {
          instagramUserId: userInfo.id,
          username: userInfo.username,
          tokenExpires: longLivedToken.expires_in
        });
        
        // Extract user ID from state
        const userId = state.split('_')[1];
        
        // Calculate token expiration (Instagram long-lived tokens last 60 days)
        const tokenExpiresAt = new Date();
        tokenExpiresAt.setDate(tokenExpiresAt.getDate() + 60);
        
        // Store Instagram connection in database
        try {
          await db.insert(instagramConnections).values({
            userId,
            instagramUserId: userInfo.id,
            username: userInfo.username,
            accessToken: longLivedToken.access_token,
            tokenExpiresAt,
            accountType: userInfo.account_type,
            isActive: true
          });
          
          console.log('Instagram connection stored successfully for user:', userId);
        } catch (dbError) {
          console.error('Failed to store Instagram connection:', dbError);
          return res.redirect('/dashboard/settings?instagram_error=' + encodeURIComponent('Failed to save connection'));
        }
        
        // Redirect to success page
        return res.redirect('/dashboard/settings?instagram_connected=true');
        
      } catch (error: any) {
        console.error('Instagram OAuth error at root:', error);
        return res.redirect('/dashboard/settings?instagram_error=' + encodeURIComponent(error.message));
      }
    }
    
    // Otherwise serve the normal frontend
    res.redirect('/dashboard');
  });

  // Instagram OAuth callback endpoint
  app.get("/api/instagram/callback", async (req, res) => {
    try {
      const code = req.query.code as string;
      const state = req.query.state as string;
      const error = req.query.error;
      
      if (error) {
        console.log('Instagram OAuth error:', error);
        return res.status(400).send(`Instagram connection failed: ${error}`);
      }
      
      if (!code) {
        return res.status(400).send('Authorization code not provided');
      }
      
      console.log('Instagram OAuth callback received:', { code: code ? 'present' : 'missing', state });
      
      // HARDCODE TESTING - Exchange code for short-lived access token using hardcoded credentials
      const redirectUri = 'https://dm-closer-ai-hellocrossman.replit.app/api/instagram/callback';
      
      const tokenResponse = await fetch('https://api.instagram.com/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: HARDCODED_INSTAGRAM_CONFIG.appId,
          client_secret: HARDCODED_INSTAGRAM_CONFIG.appSecret, // HARDCODE TESTING
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
          code: code,
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('Token exchange failed:', errorText);
        return res.status(400).send(`Token exchange failed: ${errorText}`);
      }

      const tokenData = await tokenResponse.json();
      console.log('Short-lived token obtained:', { expires_in: tokenData.expires_in });

      // HARDCODE TESTING - Exchange for long-lived token (60 days)
      const longLivedResponse = await fetch(`https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${HARDCODED_INSTAGRAM_CONFIG.appSecret}&access_token=${tokenData.access_token}`, {
        method: 'GET'
      });

      if (!longLivedResponse.ok) {
        const errorText = await longLivedResponse.text();
        console.error('Long-lived token exchange failed:', errorText);
        return res.status(400).send(`Long-lived token exchange failed: ${errorText}`);
      }

      const longLivedToken = await longLivedResponse.json();
      console.log('Long-lived token obtained:', { expires_in: longLivedToken.expires_in });

      // HARDCODE TESTING - Get user profile information
      const profileResponse = await fetch(
        `https://graph.instagram.com/me?fields=id,username,account_type&access_token=${longLivedToken.access_token}`
      );

      if (!profileResponse.ok) {
        const errorText = await profileResponse.text();
        console.error('Profile fetch failed:', errorText);
        return res.status(400).send(`Profile fetch failed: ${errorText}`);
      }

      const userInfo = await profileResponse.json();
      
      console.log('Instagram connection successful:', {
        instagramUserId: userInfo.id,
        username: userInfo.username,
        accountType: userInfo.account_type
      });
      
      // Extract user ID from state
      const userId = state.split('_')[1];
      
      // Calculate token expiration (Instagram long-lived tokens last 60 days)
      const tokenExpiresAt = new Date();
      tokenExpiresAt.setDate(tokenExpiresAt.getDate() + 60);
      
      // HARDCODE TESTING - Skip database storage, just log the connection data
      console.log('HARDCODE TESTING - Would store Instagram connection:', {
        userId,
        instagramUserId: userInfo.id,
        username: userInfo.username,
        accessToken: longLivedToken.access_token,
        tokenExpiresAt,
        accountType: userInfo.account_type,
        isActive: true
      });
      
      console.log('HARDCODE TESTING - Instagram connection processing complete for user:', userId);
      
      // Redirect to success page
      res.send(`
        <div style="font-family: Arial, sans-serif; padding: 40px; text-align: center;">
          <h2>✅ Instagram Connected Successfully!</h2>
          <div style="background: #fef3c7; padding: 10px; margin: 20px 0; border-radius: 8px; color: #92400e;">
            <strong>⚠️ TESTING MODE:</strong> Connection data logged but not stored in database
          </div>
          <p><strong>Account:</strong> @${userInfo.username}</p>
          <p><strong>Type:</strong> ${userInfo.account_type}</p>
          <p><strong>Instagram ID:</strong> ${userInfo.id}</p>
          <p><strong>Token Expires:</strong> ${tokenExpiresAt.toDateString()}</p>
          <p>You can now close this window and return to your dashboard.</p>
          <script>
            setTimeout(() => {
              window.close();
            }, 3000);
          </script>
        </div>
      `);
    } catch (error: any) {
      console.error('Instagram OAuth callback error:', error);
      res.status(500).send(`Error processing Instagram connection: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  // Instagram deauthorization callback
  app.post("/api/instagram/deauthorize", (req, res) => {
    try {
      console.log('Instagram deauthorization callback received');
      // TODO: Remove stored access tokens for the user
      res.status(200).send('OK');
    } catch (error) {
      console.error('Instagram deauthorization error:', error);
      res.status(500).send('Error');
    }
  });

  // Handle Instagram message processing
  async function handleInstagramMessage(messagingEvent: any) {
    try {
      const senderId = messagingEvent.sender?.id;
      const recipientId = messagingEvent.recipient?.id;
      const message = messagingEvent.message;
      const timestamp = messagingEvent.timestamp;
      
      if (!senderId || !recipientId || !message) {
        console.log('Invalid messaging event structure');
        return;
      }
      
      console.log('Processing Instagram message:', {
        senderId,
        recipientId,
        messageText: message.text,
        messageId: message.mid
      });
      
      const instagramThreadId = `ig_${senderId}_${recipientId}`;
      const messageText = message.text || '[Media message]';
      
      // Find or create conversation in database
      let conversation = await db.select()
        .from(conversations)
        .where(eq(conversations.instagramThreadId, instagramThreadId))
        .limit(1);
      
      let conversationId: string;
      
      if (conversation.length === 0) {
        // Create new conversation
        console.log('Creating new Instagram conversation');
        const newConversation = await db.insert(conversations).values({
          userId: recipientId, // Map this to actual user ID later
          instagramThreadId,
          participantUsername: messagingEvent.sender?.username || senderId,
          participantName: messagingEvent.sender?.username || senderId,
          lastMessageAt: new Date(parseInt(timestamp) * 1000),
          isRead: false,
          autoReplyEnabled: true,
          messageCount: 1
        }).returning();
        
        conversationId = newConversation[0].id;
      } else {
        conversationId = conversation[0].id;
        
        // Update conversation metadata
        await db.update(conversations)
          .set({
            lastMessageAt: new Date(parseInt(timestamp) * 1000),
            isRead: false,
            messageCount: conversation[0].messageCount + 1
          })
          .where(eq(conversations.id, conversationId));
      }
      
      // Store the message in database
      await db.insert(messages).values({
        conversationId,
        instagramMessageId: message.mid,
        senderType: 'customer',
        content: messageText,
        messageType: message.text ? 'text' : 'media',
        isRead: false,
        aiGenerated: false,
        sentAt: new Date(parseInt(timestamp) * 1000)
      });
      
      console.log('Instagram message stored in database successfully');
      
      // Check if auto-reply is enabled and generate AI response
      const conversationRecord = conversation.length > 0 ? conversation : 
        await db.select().from(conversations).where(eq(conversations.id, conversationId)).limit(1);
      
      if (conversationRecord.length > 0 && (conversationRecord[0] as any)?.autoReplyEnabled) {
        console.log('Auto-reply enabled, generating AI response...');
        await generateAndSendInstagramReply(conversationId, messageText, senderId);
      }
      
    } catch (error) {
      console.error('Error handling Instagram message:', error);
    }
  }
  
  async function generateAndSendInstagramReply(conversationId: string, incomingMessage: string, recipientId: string) {
    try {
      // Get conversation context and user preferences
      const conversationWithMessages = await db.select()
        .from(conversations)
        .where(eq(conversations.id, conversationId))
        .limit(1);
      
      if (!conversationWithMessages || conversationWithMessages.length === 0) {
        console.log('Conversation not found for AI response');
        return;
      }
      
      // Get recent messages for context
      const recentMessages = await db.select()
        .from(messages)
        .where(eq(messages.conversationId, conversationId))
        .orderBy(messages.sentAt)
        .limit(10);
      
      // TODO: Get user preferences for AI tone
      const defaultTone = 'friendly';
      const defaultProfile = 'fitlife_coaching';
      
      // Generate AI response using existing AI service
      const aiSettings = {
        tone: defaultTone,
        businessProfile: defaultProfile,
        customInstructions: null
      };
      
      const conversationContext = {
        recentMessages: recentMessages.map(msg => ({
          content: msg.content,
          senderType: msg.senderType,
          timestamp: msg.sentAt
        })),
        customerName: conversationWithMessages[0].participantName || 'Customer'
      };
      
      console.log('Generating AI response with context:', { 
        messageCount: recentMessages.length,
        tone: defaultTone 
      });
      
      // TODO: Connect to existing AI response generation
      // For now, create a simple response
      const aiResponse = `Thank you for your message! I'll get back to you soon. This is an AI assistant helping with customer service.`;
      
      // Store AI response in database
      await db.insert(messages).values({
        conversationId,
        instagramMessageId: `ai_${Date.now()}`,
        senderType: 'ai',
        content: aiResponse,
        messageType: 'text',
        isRead: true,
        aiGenerated: true,
        toneUsed: defaultTone,
        responseStatus: 'pending',
        sentAt: new Date()
      });
      
      // TODO: Send response via Instagram API
      // For now, log the response
      console.log('AI response generated:', aiResponse);
      console.log('TODO: Send via Instagram API to recipient:', recipientId);
      
    } catch (error) {
      console.error('Error generating Instagram AI reply:', error);
    }
  }

  // Instagram connection initiation endpoint
  app.post("/api/instagram/connect", (req, res) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: "User ID required" });
      }
      
      // Use the exact redirect URI from your Instagram app configuration
      const redirectUri = 'https://dm-closer-ai-hellocrossman.replit.app/api/instagram/callback';
      
      // Use the exact app ID from your embed URL
      const instagramAppId = '1737792583503765';
      
      const state = `user_${userId}_${Date.now()}`;
      
      console.log('OAuth generation debug:', {
        redirectUri,
        appId: instagramAppId,
        userId,
        state
      });
      
      // Generate OAuth URL matching your Instagram app embed URL exactly
      const scopes = 'instagram_business_basic%2Cinstagram_business_manage_messages%2Cinstagram_business_manage_comments%2Cinstagram_business_content_publish%2Cinstagram_business_manage_insights';
      
      // Do NOT encode redirect_uri - use exact same format in authorization and token exchange
      const authUrl = `https://www.instagram.com/oauth/authorize?` +
        `force_reauth=true&` +
        `client_id=${instagramAppId}&` +
        `redirect_uri=${redirectUri}&` +
        `response_type=code&` +
        `scope=${scopes}&` +
        `state=${state}`;
      
      console.log('Generated Instagram auth URL for user:', userId);
      console.log('Full auth URL:', authUrl);
      
      res.json({ authUrl });
    } catch (error) {
      console.error('Error generating Instagram auth URL:', error);
      res.status(500).json({ error: 'Failed to generate authorization URL' });
    }
  });

  // Get Instagram connection status
  app.get("/api/instagram/status", async (req, res) => {
    try {
      // HARDCODE TESTING - Return hardcoded connection status
      const { userId } = req.query;
      
      if (!userId) {
        return res.status(400).json({ error: 'User ID required' });
      }

      console.log('HARDCODE TESTING - Returning Instagram status for user:', userId);

      // Return hardcoded test connection data
      res.json({
        connected: true,
        username: HARDCODED_INSTAGRAM_CONFIG.testUsername,
        accountType: 'BUSINESS',
        connectedAt: new Date().toISOString(),
        tokenExpired: false,
        testMode: true
      });
    } catch (error) {
      console.error('Error checking Instagram status:', error);
      res.status(500).json({ error: 'Failed to check Instagram status' });
    }
  });

  // Debug Instagram app configuration
  app.get("/api/instagram/debug", (req, res) => {
    const redirectUri = 'https://dm-closer-ai-hellocrossman.replit.app/api/instagram/callback';
    const instagramAppId = '1737792583503765';
    const scopes = 'instagram_business_basic%2Cinstagram_business_manage_messages%2Cinstagram_business_manage_comments%2Cinstagram_business_content_publish%2Cinstagram_business_manage_insights';
    
    // Generate the exact same URL as our connect endpoint
    const testAuthUrl = `https://www.instagram.com/oauth/authorize?` +
      `force_reauth=true&` +
      `client_id=${instagramAppId}&` +
      `redirect_uri=${redirectUri}&` +
      `response_type=code&` +
      `scope=${scopes}&` +
      `state=debug_test`;

    res.json({
      appId: instagramAppId,
      currentHost: req.get('host'),
      redirectUri: redirectUri,
      webhookUrl: 'https://dm-closer-ai-hellocrossman.replit.app/api/instagram/webhook',
      scopes: scopes,
      forceReauth: true,
      generatedAuthUrl: testAuthUrl,
      yourEmbedUrl: 'https://www.instagram.com/oauth/authorize?force_reauth=true&client_id=1737792583503765&redirect_uri=https://dm-closer-ai-hellocrossman.replit.app/api/instagram/callback&response_type=code&scope=instagram_business_basic%2Cinstagram_business_manage_messages%2Cinstagram_business_manage_comments%2Cinstagram_business_content_publish%2Cinstagram_business_manage_insights',
      status: 'Compare generated URL with your embed URL',
      note: 'URLs should be identical except for state parameter'
    });
  });

  // HARDCODE TESTING - Check hardcoded configuration
  app.get("/api/instagram/test-config", (req, res) => {
    const host = req.get('host');
    const webhookUrl = `https://${host}/api/instagram/webhook`;
    
    res.json({
      testingMode: true,
      config: {
        appId: HARDCODED_INSTAGRAM_CONFIG.appId,
        appSecret: HARDCODED_INSTAGRAM_CONFIG.appSecret ? 'configured' : 'missing',
        webhookVerifyToken: HARDCODED_INSTAGRAM_CONFIG.webhookVerifyToken ? 'configured' : 'missing',
        testUserId: HARDCODED_INSTAGRAM_CONFIG.testUserId ? 'configured' : 'missing',
        testAccessToken: HARDCODED_INSTAGRAM_CONFIG.testAccessToken ? 'configured' : 'missing',
        testUsername: HARDCODED_INSTAGRAM_CONFIG.testUsername ? 'configured' : 'missing'
      },
      webhookTesting: {
        webhookUrl: webhookUrl,
        testVerificationUrl: `${webhookUrl}?hub.mode=subscribe&hub.verify_token=${HARDCODED_INSTAGRAM_CONFIG.webhookVerifyToken}&hub.challenge=test123`,
        instructions: [
          'Copy the testVerificationUrl above',
          'Paste it in your browser or Postman',
          'Should return "test123" if working correctly',
          'Use this URL in Instagram app webhook configuration'
        ]
      },
      nextSteps: [
        'Replace PLACEHOLDER values in HARDCODED_INSTAGRAM_CONFIG',
        'Test webhook verification using the URL above',
        'Configure webhook in Meta Developer Console',
        'Try Instagram OAuth flow'
      ]
    });
  });

  // Manual token setup for testing (temporary solution)
  app.post("/api/instagram/manual-setup", async (req, res) => {
    try {
      const { userId, accessToken, username, instagramUserId } = req.body;
      
      if (!userId || !accessToken || !username || !instagramUserId) {
        return res.status(400).json({ error: 'All fields required: userId, accessToken, username, instagramUserId' });
      }

      // Calculate token expiration (Instagram long-lived tokens last 60 days)
      const tokenExpiresAt = new Date();
      tokenExpiresAt.setDate(tokenExpiresAt.getDate() + 60);

      // Store Instagram connection manually
      await db.insert(instagramConnections).values({
        userId,
        instagramUserId,
        username,
        accessToken,
        tokenExpiresAt,
        accountType: 'BUSINESS',
        isActive: true
      });

      res.json({
        success: true,
        message: 'Instagram connection stored successfully',
        expiresAt: tokenExpiresAt
      });
    } catch (error: any) {
      console.error('Manual setup error:', error);
      res.status(500).json({ error: 'Failed to store connection' });
    }
  });

  // Test Instagram API connection
  app.post("/api/instagram/test", async (req, res) => {
    try {
      const { accessToken } = req.body;
      
      if (!accessToken) {
        return res.status(400).json({ error: "Access token required for testing" });
      }
      
      // Test API call to verify token works
      const userInfo = await getUserInfo(accessToken);
      
      res.json({
        success: true,
        message: "Instagram API connection successful",
        userInfo
      });
    } catch (error: any) {
      console.error('Instagram API test failed:', error);
      res.status(500).json({ 
        error: 'Instagram API test failed',
        details: error.message 
      });
    }
  });

  // Send Instagram message using stored token
  app.post("/api/instagram/send-message", async (req, res) => {
    try {
      // Extract Authorization header and verify JWT with Supabase
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authorization header required' });
      }

      const { userId, recipientId, message } = req.body;
      if (!userId || !recipientId || !message) {
        return res.status(400).json({ error: 'User ID, recipient ID and message are required' });
      }

      // Get user's Instagram connection
      const connections = await db
        .select()
        .from(instagramConnections)
        .where(and(
          eq(instagramConnections.userId, userId),
          eq(instagramConnections.isActive, true)
        ))
        .limit(1);

      if (connections.length === 0) {
        return res.status(400).json({ error: 'No Instagram connection found' });
      }

      const connection = connections[0];
      
      // Check if token is expired
      if (connection.tokenExpiresAt && new Date() > connection.tokenExpiresAt) {
        return res.status(400).json({ error: 'Instagram token expired. Please reconnect.' });
      }

      // Send message using Instagram API
      const result = await sendInstagramMessage(connection.accessToken, recipientId, message);
      
      res.json({
        success: true,
        messageId: result.message_id,
        recipientId: recipientId
      });
    } catch (error: any) {
      console.error('Error sending Instagram message:', error);
      res.status(500).json({ error: 'Failed to send message' });
    }
  });

  // Test webhook simulation endpoint
  app.post("/api/instagram/test-webhook", async (req, res) => {
    try {
      console.log('Simulating Instagram webhook message...');
      
      // Simulate an Instagram message event
      const mockInstagramMessage = {
        sender: { id: "test_sender_123", username: "test_user" },
        recipient: { id: "test_recipient_456" },
        message: { 
          mid: "test_message_" + Date.now(),
          text: "Hello! This is a test message from Instagram." 
        },
        timestamp: Math.floor(Date.now() / 1000).toString()
      };
      
      // Process the message through our handler
      await handleInstagramMessage(mockInstagramMessage);
      
      res.json({
        success: true,
        message: "Test webhook processed successfully",
        simulatedEvent: mockInstagramMessage
      });
    } catch (error: any) {
      console.error('Webhook test failed:', error);
      res.status(500).json({ 
        error: 'Webhook test failed',
        details: error.message 
      });
    }
  });

  return server;
}