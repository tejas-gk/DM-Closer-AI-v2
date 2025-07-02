import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLocation } from 'wouter';
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { getUser, logoutUser } from '../../lib/supabase/auth';
import { getUserProfile, updateUserProfile, Profile } from '../../lib/supabase/profiles';
import { 
  Settings2, 
  Bell, 
  Shield, 
  Trash2,
  Download,
  Upload,
  Key,
  Globe,
  Clock,
  User,
  LogOut,
  CreditCard,
  Crown,
  Check,
  ExternalLink,
  Calendar
} from "lucide-react";

const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Please enter a valid email address'),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface UserSettings {
  profile: {
    businessName: string;
    businessDescription: string;
    timezone: string;
    language: string;
  };
  notifications: {
    emailNotifications: boolean;
    newMessageAlerts: boolean;
    aiResponseAlerts: boolean;
    weeklyReports: boolean;
    quotaWarnings: boolean;
  };
  privacy: {
    dataRetention: number;
    analyticsSharing: boolean;
    conversationLogging: boolean;
  };
  automation: {
    autoRespond: boolean;
    autoRespondDelay: number;
    workingHours: {
      enabled: boolean;
      start: string;
      end: string;
      timezone: string;
    };
  };
}

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

export default function DashboardSettings() {
  const [, setLocation] = useLocation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isCreatingCheckout, setIsCreatingCheckout] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check if user is authenticated
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['user'],
    queryFn: getUser,
  });

  // Fetch user profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: () => getUserProfile(user!.id),
    enabled: !!user?.id,
  });

  // Get subscription plans
  const { data: plansData, isLoading: plansLoading } = useQuery({
    queryKey: ['/api/subscription-plans'],
    initialData: {
      plans: [
        {
          id: 'starter',
          nickname: 'Starter',
          lookup_key: 'starter_monthly',
          unit_amount: 2900,
          currency: 'usd',
          recurring: { interval: 'month', interval_count: 1 },
          product: {
            id: 'prod_starter',
            name: 'Starter Plan',
            description: 'Perfect for small businesses starting with Instagram automation',
            metadata: {
              aiResponses: '100',
              conversations: '50',
              analytics: 'basic',
              support: 'email'
            }
          }
        },
        {
          id: 'professional',
          nickname: 'Professional',
          lookup_key: 'professional_monthly',
          unit_amount: 7900,
          currency: 'usd',
          recurring: { interval: 'month', interval_count: 1 },
          product: {
            id: 'prod_professional',
            name: 'Professional Plan',
            description: 'Ideal for growing businesses with higher automation needs',
            metadata: {
              aiResponses: '500',
              conversations: '200',
              analytics: 'advanced',
              support: 'priority'
            }
          }
        },
        {
          id: 'enterprise',
          nickname: 'Enterprise',
          lookup_key: 'enterprise_monthly',
          unit_amount: 19900,
          currency: 'usd',
          recurring: { interval: 'month', interval_count: 1 },
          product: {
            id: 'prod_enterprise',
            name: 'Enterprise Plan',
            description: 'Complete solution for large-scale Instagram automation',
            metadata: {
              aiResponses: 'unlimited',
              conversations: 'unlimited',
              analytics: 'premium',
              support: 'dedicated'
            }
          }
        }
      ]
    }
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

  // Profile form
  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
    },
  });

  // Update profile form when data loads
  useEffect(() => {
    if (profile) {
      profileForm.reset({
        firstName: profile.first_name || '',
        lastName: profile.last_name || '',
        email: profile.email || user?.email || '',
      });
    }
  }, [profile, user, profileForm]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!userLoading && !user) {
      setLocation('/login');
    }
  }, [user, userLoading, setLocation]);

  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      if (!user?.id) throw new Error('User not authenticated');
      return updateUserProfile(user.id, {
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast({
        title: 'Profile updated',
        description: 'Your profile has been successfully updated.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Update failed',
        description: error.message || 'Failed to update profile. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const onProfileSubmit = async (data: ProfileFormData) => {
    updateProfileMutation.mutate(data);
  };

  // Create checkout session mutation
  const createCheckoutMutation = useMutation({
    mutationFn: async (planId: string) => {
      const response = await apiRequest('POST', '/api/create-checkout-session', {
        planId,
        userId: user?.id,
        successUrl: window.location.origin + '/dashboard/settings?success=true',
        cancelUrl: window.location.origin + '/dashboard/settings?canceled=true',
      });
      return response.json();
    },
    onSuccess: (data) => {
      window.location.href = data.url;
    },
    onError: (error) => {
      toast({
        title: 'Checkout failed',
        description: 'Failed to create checkout session. Please try again.',
        variant: 'destructive',
      });
      setIsCreatingCheckout(null);
    },
  });

  // Manage subscription mutation
  const manageSubscriptionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/create-portal-session', {
        customerId: subscriptionStatus?.customerId,
        returnUrl: window.location.origin + '/dashboard/settings',
      });
      return response.json();
    },
    onSuccess: (data) => {
      window.location.href = data.url;
    },
    onError: (error) => {
      toast({
        title: 'Portal access failed',
        description: 'Failed to access billing portal. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logoutUser();
      queryClient.clear();
      toast({
        title: 'Logged out',
        description: 'You have been successfully logged out.',
      });
      setLocation('/login');
    } catch (error) {
      toast({
        title: 'Logout failed',
        description: 'Failed to log out. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleUpgrade = (planId: string) => {
    setIsCreatingCheckout(planId);
    createCheckoutMutation.mutate(planId);
  };

  const handleManageSubscription = () => {
    manageSubscriptionMutation.mutate();
  };

  // Export data mutation
  const exportDataMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/export-data', { userId: user?.id });
    },
    onSuccess: () => {
      toast({
        title: 'Data export started',
        description: 'Your data export will be emailed to you when ready.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Export failed',
        description: 'Failed to start data export. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Handle URL parameters for success/cancel
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      toast({
        title: 'Subscription activated!',
        description: 'Welcome to your new plan. Your subscription is now active.',
      });
      window.history.replaceState({}, '', '/dashboard/settings');
      queryClient.invalidateQueries({ queryKey: ['/api/subscription-status'] });
    } else if (params.get('canceled') === 'true') {
      toast({
        title: 'Subscription canceled',
        description: 'You can try subscribing again at any time.',
        variant: 'destructive',
      });
      window.history.replaceState({}, '', '/dashboard/settings');
    }
  }, [toast, queryClient]);

  const { data: settings, isLoading } = useQuery<UserSettings>({
    queryKey: ['/api/settings'],
    initialData: {
      profile: {
        businessName: "FitLife Coaching",
        businessDescription: "Personal fitness coaching and nutrition guidance to help you achieve your health goals.",
        timezone: "America/New_York",
        language: "en"
      },
      notifications: {
        emailNotifications: true,
        newMessageAlerts: true,
        aiResponseAlerts: false,
        weeklyReports: true,
        quotaWarnings: true
      },
      privacy: {
        dataRetention: 90,
        analyticsSharing: false,
        conversationLogging: true
      },
      automation: {
        autoRespond: false,
        autoRespondDelay: 300,
        workingHours: {
          enabled: true,
          start: "09:00",
          end: "17:00",
          timezone: "America/New_York"
        }
      }
    }
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: Partial<UserSettings>) => {
      return apiRequest('PUT', '/api/settings', newSettings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      toast({
        title: "Settings updated",
        description: "Your preferences have been saved successfully."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating settings",
        description: error.message || "Failed to save settings",
        variant: "destructive"
      });
    }
  });



  const updateProfile = (field: string, value: any) => {
    if (!settings) return;
    updateSettingsMutation.mutate({
      profile: {
        ...settings.profile,
        [field]: value
      }
    });
  };

  const updateNotifications = (field: string, value: boolean) => {
    if (!settings) return;
    updateSettingsMutation.mutate({
      notifications: {
        ...settings.notifications,
        [field]: value
      }
    });
  };

  const updateAutomation = (field: string, value: any) => {
    if (!settings) return;
    updateSettingsMutation.mutate({
      automation: {
        ...settings.automation,
        [field]: value
      }
    });
  };

  if (userLoading || profileLoading || isLoading || !settings) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your account preferences and automation settings
          </p>
        </div>

        {/* Account Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Account Profile</span>
            </CardTitle>
            <CardDescription>
              Manage your personal account information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...profileForm}>
              <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={profileForm.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="John"
                            {...field}
                            disabled={updateProfileMutation.isPending}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={profileForm.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Doe"
                            {...field}
                            disabled={updateProfileMutation.isPending}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={profileForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="john@example.com"
                          {...field}
                          disabled={updateProfileMutation.isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex items-center justify-between pt-4">
                  <div className="text-sm text-muted-foreground">
                    Last updated: {profile?.updated_at ? new Date(profile.updated_at).toLocaleDateString() : 'Never'}
                  </div>
                  <Button 
                    type="submit" 
                    disabled={updateProfileMutation.isPending}
                    className="min-w-[120px]"
                  >
                    {updateProfileMutation.isPending ? 'Updating...' : 'Update Profile'}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Business Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings2 className="h-5 w-5" />
              <span>Business Profile</span>
            </CardTitle>
            <CardDescription>
              Configure your business information for AI responses
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name</Label>
                <Input
                  id="businessName"
                  value={settings.profile.businessName}
                  onChange={(e) => updateProfile('businessName', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Input
                  id="timezone"
                  value={settings.profile.timezone}
                  onChange={(e) => updateProfile('timezone', e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="businessDescription">Business Description</Label>
              <Textarea
                id="businessDescription"
                value={settings.profile.businessDescription}
                onChange={(e) => updateProfile('businessDescription', e.target.value)}
                className="min-h-[100px]"
                placeholder="Describe your business to help AI generate more relevant responses..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Automation Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Automation</span>
            </CardTitle>
            <CardDescription>
              Configure when and how AI responds automatically
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="autoRespond">Auto-respond to messages</Label>
                <p className="text-sm text-gray-500">
                  Automatically send AI-generated responses to new messages
                </p>
              </div>
              <Switch
                id="autoRespond"
                checked={settings.automation.autoRespond}
                onCheckedChange={(checked) => updateAutomation('autoRespond', checked)}
              />
            </div>

            {settings.automation.autoRespond && (
              <div className="space-y-4 pl-4 border-l-2 border-blue-200 dark:border-blue-800">
                <div className="space-y-2">
                  <Label htmlFor="autoRespondDelay">Response delay (seconds)</Label>
                  <Input
                    id="autoRespondDelay"
                    type="number"
                    value={settings.automation.autoRespondDelay}
                    onChange={(e) => updateAutomation('autoRespondDelay', parseInt(e.target.value))}
                    min="30"
                    max="3600"
                  />
                  <p className="text-xs text-gray-500">
                    Wait time before sending automatic responses (30-3600 seconds)
                  </p>
                </div>
              </div>
            )}

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Working hours</Label>
                  <p className="text-sm text-gray-500">
                    Only auto-respond during business hours
                  </p>
                </div>
                <Switch
                  checked={settings.automation.workingHours.enabled}
                  onCheckedChange={(checked) => updateAutomation('workingHours', {
                    ...settings.automation.workingHours,
                    enabled: checked
                  })}
                />
              </div>

              {settings.automation.workingHours.enabled && (
                <div className="grid grid-cols-2 gap-4 pl-4 border-l-2 border-blue-200 dark:border-blue-800">
                  <div className="space-y-2">
                    <Label htmlFor="startTime">Start time</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={settings.automation.workingHours.start}
                      onChange={(e) => updateAutomation('workingHours', {
                        ...settings.automation.workingHours,
                        start: e.target.value
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endTime">End time</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={settings.automation.workingHours.end}
                      onChange={(e) => updateAutomation('workingHours', {
                        ...settings.automation.workingHours,
                        end: e.target.value
                      })}
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <span>Notifications</span>
            </CardTitle>
            <CardDescription>
              Choose what notifications you want to receive
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(settings.notifications).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor={key}>
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </Label>
                  <p className="text-sm text-gray-500">
                    {key === 'emailNotifications' && 'Receive important updates via email'}
                    {key === 'newMessageAlerts' && 'Get notified when new messages arrive'}
                    {key === 'aiResponseAlerts' && 'Notifications when AI generates responses'}
                    {key === 'weeklyReports' && 'Weekly analytics and performance reports'}
                    {key === 'quotaWarnings' && 'Alerts when approaching usage limits'}
                  </p>
                </div>
                <Switch
                  id={key}
                  checked={value}
                  onCheckedChange={(checked) => updateNotifications(key, checked)}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Data & Privacy */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Data & Privacy</span>
            </CardTitle>
            <CardDescription>
              Manage your data retention and privacy preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="dataRetention">Data retention (days)</Label>
              <Input
                id="dataRetention"
                type="number"
                value={settings.privacy.dataRetention}
                onChange={(e) => updateSettingsMutation.mutate({
                  privacy: {
                    ...settings.privacy,
                    dataRetention: parseInt(e.target.value)
                  }
                })}
                min="30"
                max="365"
              />
              <p className="text-sm text-gray-500">
                How long to keep conversation data (30-365 days)
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="analyticsSharing">Anonymous analytics sharing</Label>
                <p className="text-sm text-gray-500">
                  Help improve our service by sharing anonymous usage data
                </p>
              </div>
              <Switch
                id="analyticsSharing"
                checked={settings.privacy.analyticsSharing}
                onCheckedChange={(checked) => updateSettingsMutation.mutate({
                  privacy: {
                    ...settings.privacy,
                    analyticsSharing: checked
                  }
                })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="conversationLogging">Conversation logging</Label>
                <p className="text-sm text-gray-500">
                  Store conversation history for analytics and training
                </p>
              </div>
              <Switch
                id="conversationLogging"
                checked={settings.privacy.conversationLogging}
                onCheckedChange={(checked) => updateSettingsMutation.mutate({
                  privacy: {
                    ...settings.privacy,
                    conversationLogging: checked
                  }
                })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Subscription & Billing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5" />
              <span>Subscription & Billing</span>
            </CardTitle>
            <CardDescription>
              Manage your subscription plan and billing preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Current Subscription Status */}
            {subscriptionStatus?.hasSubscription ? (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-green-100 dark:bg-green-900/40 rounded-lg flex items-center justify-center">
                      <Crown className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-green-800 dark:text-green-200">Active Subscription</h4>
                      <p className="text-sm text-green-600 dark:text-green-300">
                        Your subscription is active and billing automatically
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={handleManageSubscription}
                    disabled={manageSubscriptionMutation.isPending}
                    className="border-green-300 hover:bg-green-50 dark:border-green-700 dark:hover:bg-green-900/40"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    {manageSubscriptionMutation.isPending ? "Loading..." : "Manage Billing"}
                  </Button>
                </div>
                
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white dark:bg-gray-800 p-3 rounded border">
                    <div className="text-sm text-gray-500 dark:text-gray-400">Plan</div>
                    <div className="font-medium">Professional</div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-3 rounded border">
                    <div className="text-sm text-gray-500 dark:text-gray-400">Next billing</div>
                    <div className="font-medium">
                      <Calendar className="h-4 w-4 inline mr-1" />
                      Dec 25, 2024
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-3 rounded border">
                    <div className="text-sm text-gray-500 dark:text-gray-400">Amount</div>
                    <div className="font-medium">$79.00/month</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-blue-800 dark:text-blue-200">Free Trial Active</h4>
                    <p className="text-sm text-blue-600 dark:text-blue-300">
                      You're currently on a free trial. Upgrade to unlock all features.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Available Plans */}
            {!subscriptionStatus?.hasSubscription && (
              <div className="space-y-4">
                <h4 className="font-medium">Available Plans</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {plansData?.plans?.map((plan: SubscriptionPlan) => {
                    const isPopular = plan.id === 'professional';
                    return (
                      <div 
                        key={plan.id} 
                        className={`relative p-4 rounded-lg border-2 transition-colors ${
                          isPopular 
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        {isPopular && (
                          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                            <Badge className="bg-blue-500 text-white">Most Popular</Badge>
                          </div>
                        )}
                        
                        <div className="text-center mb-4">
                          <h5 className="font-semibold text-lg">{plan.nickname}</h5>
                          <div className="mt-2">
                            <span className="text-3xl font-bold">${(plan.unit_amount / 100).toFixed(0)}</span>
                            <span className="text-gray-500 dark:text-gray-400">/{plan.recurring.interval}</span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                            {plan.product.description}
                          </p>
                        </div>

                        <div className="space-y-2 mb-4">
                          <div className="flex items-center text-sm">
                            <Check className="h-4 w-4 text-green-500 mr-2" />
                            {plan.product.metadata.aiResponses} AI responses/month
                          </div>
                          <div className="flex items-center text-sm">
                            <Check className="h-4 w-4 text-green-500 mr-2" />
                            {plan.product.metadata.conversations} conversations
                          </div>
                          <div className="flex items-center text-sm">
                            <Check className="h-4 w-4 text-green-500 mr-2" />
                            {plan.product.metadata.analytics} analytics
                          </div>
                          <div className="flex items-center text-sm">
                            <Check className="h-4 w-4 text-green-500 mr-2" />
                            {plan.product.metadata.support} support
                          </div>
                        </div>

                        <Button 
                          className="w-full" 
                          variant={isPopular ? "default" : "outline"}
                          onClick={() => handleUpgrade(plan.lookup_key)}
                          disabled={isCreatingCheckout === plan.lookup_key}
                        >
                          {isCreatingCheckout === plan.lookup_key ? (
                            "Processing..."
                          ) : (
                            `Upgrade to ${plan.nickname}`
                          )}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Download className="h-5 w-5" />
              <span>Data Management</span>
            </CardTitle>
            <CardDescription>
              Export or delete your data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">Export data</h4>
                <p className="text-sm text-gray-500">
                  Download all your conversations and analytics data
                </p>
              </div>
              <Button 
                variant="outline" 
                onClick={() => exportDataMutation.mutate()}
                disabled={exportDataMutation.isPending}
              >
                <Download className="h-4 w-4 mr-2" />
                {exportDataMutation.isPending ? "Exporting..." : "Export"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* API & Integrations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Key className="h-5 w-5" />
              <span>API & Integrations</span>
            </CardTitle>
            <CardDescription>
              Manage external service connections
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                  <Globe className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium">OpenAI API</h4>
                  <p className="text-sm text-gray-500">Connected for AI response generation</p>
                </div>
              </div>
              <Badge variant="default">Connected</Badge>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                  <Globe className="h-5 w-5 text-gray-400" />
                </div>
                <div>
                  <h4 className="font-medium">Instagram Business API</h4>
                  <p className="text-sm text-gray-500">Direct Instagram integration (coming soon)</p>
                </div>
              </div>
              <Badge variant="secondary">Coming Soon</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Account Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <LogOut className="h-5 w-5" />
              <span>Account Actions</span>
            </CardTitle>
            <CardDescription>
              Manage your account security and access
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">Sign out</h4>
                <p className="text-sm text-gray-500">
                  Sign out of your account on this device
                </p>
              </div>
              <Button 
                variant="outline" 
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                <LogOut className="h-4 w-4 mr-2" />
                {isLoggingOut ? "Signing out..." : "Sign out"}
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-900/20">
              <div>
                <h4 className="font-medium text-red-800 dark:text-red-200">Delete account</h4>
                <p className="text-sm text-red-600 dark:text-red-300">
                  Permanently delete your account and all associated data
                </p>
              </div>
              <Button variant="destructive" size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}