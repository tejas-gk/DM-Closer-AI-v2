import { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { getUser } from '../../lib/supabase/auth';
import { Check, Crown, Star, Settings } from 'lucide-react';
import logoImage from "@assets/image_1750404810112.png";

interface SubscriptionPlan {
  id: string;
  nickname: string;
  lookup_key: string;
  unit_amount: number;
  currency: string;
  recurring: {
    interval: string;
    interval_count: number;
  };
  product: {
    id: string;
    name: string;
    description: string;
    metadata: Record<string, string>;
  };
}

interface SubscriptionStatus {
  hasSubscription: boolean;
  subscriptions: any[];
  customerId: string;
}

export default function Membership() {
  const [, setLocation] = useLocation();
  const [isCreatingCheckout, setIsCreatingCheckout] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get current user from authentication
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['user'],
    queryFn: getUser,
  });

  // Get subscription plans
  const { data: plansData, isLoading: plansLoading } = useQuery({
    queryKey: ['/api/subscription-plans'],
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

  // Handle authentication and email verification
  useEffect(() => {
    if (!userLoading) {
      if (!user) {
        // No user - redirect to signup
        setLocation('/signup');
      } else if (user && !user.email_confirmed_at) {
        // User exists but email not verified - show verification message
        toast({
          title: 'Email verification required',
          description: 'Please check your email and click the verification link to continue.',
          variant: 'destructive',
        });
      }
    }
  }, [user, userLoading, setLocation, toast]);

  // Handle URL parameters for success/cancel
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      // Redirect to dashboard with welcome modal
      setLocation('/dashboard?welcome=true');
      return;
    } else if (params.get('canceled') === 'true') {
      toast({
        title: 'Subscription canceled',
        description: 'You can try subscribing again at any time.',
        variant: 'destructive',
      });
      window.history.replaceState({}, '', '/membership');
    }
  }, [toast, queryClient, setLocation]);

  // Create checkout session mutation
  const createCheckoutMutation = useMutation({
    mutationFn: async (priceId: string) => {
      const response = await apiRequest('POST', '/api/create-checkout-session', {
        userId: user?.id,
        priceId,
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.status === 'already_subscribed') {
        toast({
          title: 'Already subscribed',
          description: 'You already have an active subscription.',
          variant: 'destructive',
        });
      } else if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to create checkout',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setIsCreatingCheckout(null);
    },
  });

  // Create portal session mutation
  const createPortalMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/create-portal-session', {
        customerId: subscriptionStatus?.customerId,
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to open billing portal',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleSubscribe = (priceId: string) => {
    setIsCreatingCheckout(priceId);
    createCheckoutMutation.mutate(priceId);
  };

  const handleManageSubscription = () => {
    createPortalMutation.mutate();
  };

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const getPlanIcon = (planId: string) => {
    const icons = {
      starter: <Star className="w-6 h-6 text-blue-500" />,
      pro: <Crown className="w-6 h-6 text-purple-500" />
    };
    return icons[planId as keyof typeof icons] || <Star className="w-6 h-6" />;
  };



  if (userLoading || plansLoading || statusLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-3">
                <img 
                  src={logoImage} 
                  alt="DMCloser" 
                  className="h-10 w-auto" 
                />
              </div>
              <div className="flex items-center space-x-4">
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm">
                    Dashboard
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </nav>
        
        <div className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <Skeleton className="h-10 w-64 mx-auto mb-4" />
              <Skeleton className="h-6 w-96 mx-auto" />
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-16 w-full mb-4" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                    <Skeleton className="h-10 w-full mt-6" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Don't render pricing if email is not verified
  if (user && !user.email_confirmed_at) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-3">
                <img 
                  src={logoImage} 
                  alt="DMCloser" 
                  className="h-10 w-auto" 
                />
              </div>
              <div className="flex items-center space-x-4">
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </nav>
        
        <div className="flex items-center justify-center py-20 px-4 sm:px-6 lg:px-8">
          <Card className="w-full max-w-md text-center">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                Email Verification Required
              </CardTitle>
              <CardDescription>
                Please check your email and click the verification link to continue with your subscription.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-gray-600 dark:text-gray-300">
                  We sent a verification email to <strong>{user.email}</strong>
                </p>
              </div>
              <div className="space-y-3">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Didn't receive the email? Check your spam folder or try signing up again.
                </p>
                <Link href="/signup">
                  <Button variant="outline" className="w-full">
                    Back to Sign Up
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const plans = (plansData as any)?.plans || [];
  const hasActiveSubscription = subscriptionStatus?.hasSubscription;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <img 
                src={logoImage} 
                alt="DMCloser" 
                className="h-10 w-auto" 
              />
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>
      
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Choose Your Plan
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Both plans include a 7-day free trial
            </p>
          </div>

        {/* Current Subscription Status */}
        {hasActiveSubscription && (
          <Card className="mb-8 border-green-200 bg-green-50 dark:bg-green-900/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-green-100 dark:bg-green-800 p-2 rounded-full">
                    <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <CardTitle className="text-green-800 dark:text-green-200">Active Subscription</CardTitle>
                    <CardDescription className="text-green-600 dark:text-green-300">
                      Your plan is currently active
                    </CardDescription>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={handleManageSubscription}
                  disabled={createPortalMutation.isPending}
                  className="border-green-300 text-green-700 hover:bg-green-100 dark:border-green-600 dark:text-green-300"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Manage Billing
                </Button>
              </div>
            </CardHeader>
          </Card>
        )}

        {/* Pricing Plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 max-w-4xl mx-auto">
          {plans.map((plan: SubscriptionPlan) => {
            const isPopular = plan.lookup_key === 'pro';
            
            return (
              <Card 
                key={plan.id} 
                className={`relative transition-all duration-200 hover:shadow-lg ${
                  isPopular 
                    ? 'border-purple-200 shadow-lg scale-105 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20' 
                    : 'hover:border-gray-300 dark:hover:border-gray-600'
                }`}
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
                    {getPlanIcon(plan.lookup_key)}
                  </div>
                  <CardTitle className="text-2xl font-bold">
                    {plan.lookup_key === 'starter' ? 'Starter' : 'Pro'}
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-300 mt-2">
                    {plan.lookup_key === 'starter' ? '500 replies per month' : '1,000 replies per month'}
                  </CardDescription>
                  <div className="mt-4">
                    <div className="flex items-baseline justify-center">
                      <span className="text-4xl font-bold text-gray-900 dark:text-white">
                        {formatPrice(plan.unit_amount, plan.currency)}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400 ml-2">
                        /{plan.recurring.interval}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="text-center mb-8">
                    <Badge variant="secondary" className="mb-4">
                      7-day free trial included
                    </Badge>
                  </div>
                  
                  <Button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={isCreatingCheckout === plan.id || hasActiveSubscription}
                    className={`w-full ${
                      isPopular 
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white' 
                        : ''
                    }`}
                    variant={isPopular ? 'default' : 'outline'}
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

        {/* Simple FAQ Section */}
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Both plans include a 7-day free trial. Cancel anytime during the trial period.
          </p>
        </div>
        </div>
      </div>
    </div>
  );
}