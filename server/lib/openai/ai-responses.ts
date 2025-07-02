import { openai } from './client';

export interface ToneSettings {
  type: 'friendly' | 'professional' | 'casual' | 'girlfriend_experience';
  customInstructions?: string;
}

export interface BusinessProfile {
  type: 'fitlife_coaching' | 'onlyfans_model' | 'product_sales';
}

export interface ConversationContext {
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
  }>;
  customerName: string;
  customerFirstName?: string;
  businessContext?: string;
  businessProfile?: 'fitlife_coaching' | 'onlyfans_model' | 'product_sales';
}

export interface GenerateResponseParams {
  conversationContext: ConversationContext;
  toneSettings: ToneSettings;
  businessProfile?: 'fitlife_coaching' | 'onlyfans_model' | 'product_sales';
  userId: string;
}

const TONE_PROMPTS = {
  friendly: {
    personality: "warm, enthusiastic, and personable",
    style: "Use a conversational tone with enthusiasm. Be helpful and show genuine interest in the customer's needs. Use friendly language and appropriate emojis occasionally.",
    examples: "Great to hear from you! I'd love to help you with that! That sounds awesome!"
  },
  professional: {
    personality: "polished, knowledgeable, and respectful",
    style: "Maintain a professional but approachable tone. Be clear, concise, and helpful. Avoid slang and excessive punctuation.",
    examples: "Thank you for your interest. I'd be happy to assist you. Let me provide you with the information you need."
  },
  casual: {
    personality: "relaxed, approachable, and authentic",
    style: "Use a relaxed, conversational tone. Be helpful while keeping things light and easy-going. Use natural language.",
    examples: "Hey there! No worries at all. Sounds good to me!"
  },
  girlfriend_experience: {
    personality: "gentle, affectionate, and emotionally engaging",
    style: "Use a warm, intimate tone that feels personal and caring. Be emotionally supportive and engaging. Use the customer's first name when available. Express genuine interest and affection.",
    examples: "Hey beautiful! I've been thinking about you. You're so sweet for reaching out! I'd love to help you with that, babe."
  }
};

const BUSINESS_PROFILES = {
  fitlife_coaching: {
    context: "fitness coach who offers personal training, nutrition guidance, and wellness coaching",
    focus: "helping customers achieve their fitness goals through personalized training and nutrition",
    callToAction: "scheduling a consultation or discussing training packages"
  },
  onlyfans_model: {
    context: "content creator offering exclusive, personalized content and intimate interactions",
    focus: "building personal connections and offering exclusive content experiences",
    callToAction: "joining your premium content or discussing custom content options"
  },
  product_sales: {
    context: "business owner selling products through e-commerce, print-on-demand, or direct sales",
    focus: "showcasing product benefits and helping customers find the perfect items",
    callToAction: "making a purchase or learning more about product offerings"
  }
};

export async function generateAIResponse({
  conversationContext,
  toneSettings,
  businessProfile = 'fitlife_coaching',
  userId
}: GenerateResponseParams): Promise<string> {
  try {
    const tonePrompt = TONE_PROMPTS[toneSettings.type];
    const profileInfo = BUSINESS_PROFILES[businessProfile];
    
    // Extract first name for personalization in girlfriend experience mode
    const customerFirstName = conversationContext.customerFirstName || 
      (conversationContext.customerName ? conversationContext.customerName.split(' ')[0] : '');

    const systemPrompt = `You are an AI assistant helping to respond to Instagram DM inquiries for a ${profileInfo.context}.

TONE & PERSONALITY:
- Be ${tonePrompt.personality}
- ${tonePrompt.style}
- Examples of your tone: ${tonePrompt.examples}
${toneSettings.type === 'girlfriend_experience' && customerFirstName ? `- Use the name "${customerFirstName}" naturally in your responses to create intimacy` : ''}

BUSINESS CONTEXT:
- You're representing a ${profileInfo.context}
- Focus on ${profileInfo.focus}
- When appropriate, guide naturally toward ${profileInfo.callToAction}
${businessProfile === 'fitlife_coaching' ? '- Be knowledgeable about fitness, nutrition, and wellness topics' : ''}
${businessProfile === 'onlyfans_model' ? '- Create anticipation and desire while maintaining appropriate boundaries for the platform' : ''}
${businessProfile === 'product_sales' ? '- Highlight product benefits and address customer needs effectively' : ''}

RESPONSE GUIDELINES:
- Keep responses concise but engaging (1-3 sentences typically)
${businessProfile === 'onlyfans_model' ? '- Create emotional connection and intrigue' : '- Show genuine interest in helping the customer'}
- Personalize responses using the customer's name when natural
${toneSettings.type === 'girlfriend_experience' ? '- Be flirty but tasteful, intimate but appropriate for Instagram DMs' : '- Be encouraging and supportive'}

CUSTOM INSTRUCTIONS:
${toneSettings.customInstructions || 'None'}

Remember: You're responding to an Instagram DM, so keep it conversational and appropriate for that platform.`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...conversationContext.messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages,
      max_tokens: 200,
      temperature: 0.8,
      presence_penalty: 0.1,
      frequency_penalty: 0.1
    });

    const response = completion.choices[0]?.message?.content;
    
    if (!response) {
      throw new Error('No response generated from OpenAI');
    }

    return response.trim();
    
  } catch (error) {
    console.error('Error generating AI response:', error);
    
    // Provide fallback based on tone and business profile
    const fallbackResponses = {
      friendly: {
        fitlife_coaching: "Thanks for reaching out! I'd love to help you with your fitness journey. Let me get back to you with some personalized suggestions!",
        onlyfans_model: "Hey beautiful! Thanks for reaching out. I'd love to connect with you more!",
        product_sales: "Thanks for your interest! I'd love to help you find exactly what you're looking for!"
      },
      professional: {
        fitlife_coaching: "Thank you for your message. I'll review your inquiry and provide you with detailed information shortly.",
        onlyfans_model: "Thank you for your interest. I'd be happy to discuss my exclusive content options with you.",
        product_sales: "Thank you for your inquiry. I'll provide you with detailed product information shortly."
      },
      casual: {
        fitlife_coaching: "Hey! Thanks for the message. Let me think about the best way to help you out and I'll get back to you soon.",
        onlyfans_model: "Hey there! Thanks for reaching out. I'd love to chat more with you!",
        product_sales: "Hey! Thanks for checking out my products. Let me get back to you with some great options!"
      },
      girlfriend_experience: {
        fitlife_coaching: "Hey beautiful! Thanks for reaching out about fitness. I'd love to help you on your journey!",
        onlyfans_model: `Hey ${customerFirstName || 'beautiful'}! I've been thinking about you. Thanks for reaching out!`,
        product_sales: `Hey ${customerFirstName || 'babe'}! Thanks for your interest. I'd love to help you find something special!`
      }
    };
    
    return fallbackResponses[toneSettings.type][businessProfile] || fallbackResponses.friendly.fitlife_coaching;
  }
}

export async function validateResponse(response: string): Promise<{
  isValid: boolean;
  issues: string[];
  qualityScore: number;
}> {
  const issues: string[] = [];
  let qualityScore = 100;

  // Check response length
  if (response.length < 10) {
    issues.push('Response too short');
    qualityScore -= 30;
  }
  
  if (response.length > 500) {
    issues.push('Response too long for Instagram DM');
    qualityScore -= 20;
  }

  // Check for inappropriate content markers
  const inappropriatePatterns = [
    /\b(fuck|shit|damn|hell)\b/gi,
    /\b(guaranteed|promise|100%)\b/gi, // Avoid over-promising
    /\b(free|discount|sale|buy now)\b/gi // Avoid salesy language
  ];

  inappropriatePatterns.forEach(pattern => {
    if (pattern.test(response)) {
      issues.push('Contains potentially inappropriate language');
      qualityScore -= 25;
    }
  });

  // Check for personalization
  if (!/\b(you|your)\b/gi.test(response)) {
    qualityScore -= 10; // Minor deduction for lack of personalization
  }

  return {
    isValid: issues.length === 0 && qualityScore >= 50,
    issues,
    qualityScore: Math.max(0, qualityScore)
  };
}