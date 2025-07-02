import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { getUser } from "../../lib/supabase/auth";
import { 
  CheckCircle, 
  Zap, 
  Crown, 
  Building, 
  TrendingUp,
  Euro,
  MessageSquare,
  Bot,
  BarChart3,
  Settings
} from "lucide-react";

interface SubscriptionPlan {
  id: string;
  name: string;
  lookup_key: string;
  price: number;
  currency: string;
  replies: number;
  features: string[];
  popular?: boolean;
  isFlexible?: boolean;
}

interface SubscriptionStatus {
  hasSubscription: boolean;
  subscriptions: any[];
  customerId: string;
}

const PRICING_PLANS: SubscriptionPlan[] = [
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

export default function MembershipNew() {
  const [, setLocation] = useLocation();
  const [isCreatingCheckout, setIsCreatingCheckout] = useState<string | null>(null);
  const [flexRepliesCount, setFlexRepliesCount] = useState([5000]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get current user from authentication
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['user'],
    queryFn: getUser,
  });

  // Get user's subscription status
  const { data: subscriptionStatus, isLoading: statusLoading } = useQuery<SubscriptionStatus>({
    queryKey: ['/api/subscription-status'],
    queryFn: () => apiRequest('GET', `/api/subscription-status?userId=${user?.id}`).then(res => res.json()),
    enabled: !!user?.id,
    initialData: {
      hasSubscription: false,
      subscriptions: [],
      customerId: ''
    }
  });

  const createCheckoutMutation = useMutation({
    mutationFn: async (planId: string) => {
      const response = await apiRequest('POST', '/api/create-checkout-session', {
        priceId: planId,
        userId: user?.id,
        flexReplies: planId === 'flex' ? flexRepliesCount[0] : undefined
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error) => {
      console.error('Checkout error:', error);
      toast({
        title: "Error",
        description: "Failed to create checkout session. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsCreatingCheckout(null);
    }
  });

  const handlePlanSelect = async (plan: SubscriptionPlan) => {
    if (subscriptionStatus?.hasSubscription) {
      toast({
        title: "Already subscribed",
        description: "You already have an active subscription. Use the billing portal to make changes.",
      });
      return;
    }

    setIsCreatingCheckout(plan.id);
    createCheckoutMutation.mutate(plan.lookup_key);
  };

  const calculateFlexPrice = (replies: number) => {
    return replies * 0.049;
  };

  const getPlanIcon = (planId: string) => {
    const iconMap = {
      starter: <Zap className="h-8 w-8 text-blue-500" />,
      pro: <Crown className="h-8 w-8 text-purple-500" />,
      agency: <Building className="h-8 w-8 text-green-500" />,
      flex: <TrendingUp className="h-8 w-8 text-orange-500" />
    };
    return iconMap[planId as keyof typeof iconMap] || <MessageSquare className="h-8 w-8" />;
  };

  if (userLoading || statusLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  const hasActiveSubscription = subscriptionStatus?.hasSubscription;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Choose Your Plan</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Select the perfect plan for your Instagram DM automation needs
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => setLocation('/dashboard')}
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Pricing Plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {PRICING_PLANS.map((plan: SubscriptionPlan) => {
            const isPopular = plan.popular;
            const isFlexPlan = plan.isFlexible;
            
            return (
              <Card 
                key={plan.id} 
                className={`relative transition-all duration-200 hover:shadow-lg ${
                  isPopular 
                    ? 'border-purple-200 shadow-lg scale-105 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20' 
                    : 'hover:border-gray-300 dark:hover:border-gray-600'
                } ${isFlexPlan ? 'border-orange-200 bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20' : ''}`}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1">
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-4">
                    {getPlanIcon(plan.id)}
                  </div>
                  <CardTitle className="text-2xl font-bold">
                    {plan.name}
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-300 mt-2">
                    {isFlexPlan 
                      ? `Starting from ${plan.replies.toLocaleString()} replies`
                      : `${plan.replies.toLocaleString()} replies per month`
                    }
                  </CardDescription>
                  <div className="mt-4">
                    {isFlexPlan ? (
                      <div className="space-y-4">
                        <div className="text-center">
                          <span className="text-4xl font-bold text-gray-900 dark:text-white">
                            €{calculateFlexPrice(flexRepliesCount[0]).toFixed(0)}
                          </span>
                          <span className="text-gray-600 dark:text-gray-400 ml-2">
                            /month
                          </span>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">
                            Monthly replies: {flexRepliesCount[0].toLocaleString()}
                          </Label>
                          <Slider
                            value={flexRepliesCount}
                            onValueChange={setFlexRepliesCount}
                            max={50000}
                            min={5000}
                            step={1000}
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>5K</span>
                            <span>50K</span>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 text-center">
                          €0.049 per reply
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <span className="text-4xl font-bold text-gray-900 dark:text-white">
                          €{plan.price}
                        </span>
                        <span className="text-gray-600 dark:text-gray-400 ml-2">
                          /month
                        </span>
                      </div>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    className="w-full mt-6" 
                    size="lg"
                    variant={isPopular ? "default" : "outline"}
                    onClick={() => handlePlanSelect(plan)}
                    disabled={isCreatingCheckout === plan.id || hasActiveSubscription}
                  >
                    {isCreatingCheckout === plan.id ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        <span>Processing...</span>
                      </div>
                    ) : hasActiveSubscription ? (
                      'Current Plan'
                    ) : (
                      'Start Free Trial'
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Features Comparison */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-center mb-8 text-gray-900 dark:text-white">
            All Plans Include
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <Bot className="h-12 w-12 text-blue-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                AI-Powered Responses
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Advanced AI generates contextual, brand-consistent replies
              </p>
            </div>
            <div className="text-center">
              <BarChart3 className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                Analytics & Insights
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Track performance and optimize your messaging strategy
              </p>
            </div>
            <div className="text-center">
              <Settings className="h-12 w-12 text-purple-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                Full Customization
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Customize tone, style, and business profiles
              </p>
            </div>
          </div>
        </div>

        {/* Trial Notice */}
        <div className="text-center mt-12">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            🎉 <strong>7-day free trial</strong> • No credit card required • Cancel anytime
          </p>
        </div>
      </div>
    </div>
  );
}