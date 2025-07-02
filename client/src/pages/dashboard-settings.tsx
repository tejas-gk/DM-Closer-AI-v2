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
  Trash2,
  Key,
  Globe,
  Clock,
  User,
  LogOut,
  CreditCard,
  Crown,
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
    quotaWarnings: boolean;
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
  trialInfo?: {
    isInTrial: boolean;
    trialEnd: string | null;
    daysRemaining: number;
    subscriptionStatus: string | null;
  };
}

export default function DashboardSettings() {
  const [, setLocation] = useLocation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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
  });

  // Get user's subscription status
  const { data: subscriptionStatus, isLoading: statusLoading } = useQuery<SubscriptionStatus>({
    queryKey: ['/api/subscription-status', user?.id],
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
      // Add small delay to prevent immediate redirect during page transitions
      const timer = setTimeout(() => {
        setLocation('/login');
      }, 100);
      return () => clearTimeout(timer);
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



  // Manage subscription mutation
  const manageSubscriptionMutation = useMutation({
    mutationFn: async (customerId: string) => {
      const response = await apiRequest('POST', '/api/create-portal-session', {
        customerId,
        returnUrl: window.location.origin + '/dashboard/settings',
      });
      return response.json();
    },
    onSuccess: (data) => {
      window.open(data.url, '_blank', 'noopener,noreferrer');
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

  const handleManageSubscription = async () => {
    if (!user?.id) {
      toast({
        title: 'Authentication required',
        description: 'Please log in to manage your subscription.',
        variant: 'destructive',
      });
      return;
    }

    // If subscription status is still loading, wait a moment
    if (statusLoading) {
      toast({
        title: 'Loading subscription data',
        description: 'Please wait while we fetch your subscription information.',
        variant: 'default',
      });
      return;
    }

    // If no customer ID, refetch the subscription status
    if (!subscriptionStatus?.customerId) {
      try {
        const response = await apiRequest('GET', `/api/subscription-status?userId=${user.id}`);
        const freshStatus = await response.json();
        
        if (freshStatus.customerId) {
          // Proceed with the fresh customer ID
          manageSubscriptionMutation.mutate(freshStatus.customerId);
        } else {
          toast({
            title: 'Subscription not found',
            description: 'Unable to access billing portal. Please contact support.',
            variant: 'destructive',
          });
        }
      } catch (error) {
        toast({
          title: 'Error loading subscription',
          description: 'Failed to fetch subscription data. Please try again.',
          variant: 'destructive',
        });
      }
      return;
    }

    if (subscriptionStatus?.customerId) {
      manageSubscriptionMutation.mutate(subscriptionStatus.customerId as string);
    } else {
      toast({
        title: 'Subscription data unavailable',
        description: 'Please wait a moment and try again.',
        variant: 'destructive',
      });
    }
  };



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

  // Listen for Instagram connection updates (when OAuth window closes)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'INSTAGRAM_CONNECTED') {
        // Refresh Instagram status when OAuth completes
        queryClient.invalidateQueries({ queryKey: ['/api/instagram/status'] });
        toast({
          title: 'Instagram connected!',
          description: 'Your Instagram account has been successfully connected.',
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [queryClient, toast]);

  const { data: settings, isLoading } = useQuery<UserSettings>({
    queryKey: ['/api/settings'],
    queryFn: () => apiRequest('GET', '/api/settings').then(res => res.json()),
    initialData: {
      profile: {
        businessName: "FitLife Coaching",
        businessDescription: "Personal fitness coaching and nutrition guidance to help you achieve your health goals.",
        timezone: "America/New_York",
        language: "en"
      },
      notifications: {
        emailNotifications: true,
        quotaWarnings: true
      },
      automation: {
        autoRespond: false,
        autoRespondDelay: 60,
        workingHours: {
          enabled: false,
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
      // Invalidate and refetch to sync with server state
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      toast({
        title: "Settings updated",
        description: "Your preferences have been saved successfully."
      });
    },
    onError: (error: any) => {
      // Revert the optimistic update on error
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      toast({
        title: "Error updating settings",
        description: error.message || "Failed to save settings",
        variant: "destructive"
      });
    }
  });

  // Instagram connection status query
  const { data: instagramStatus, isLoading: instagramLoading } = useQuery({
    queryKey: ['/api/instagram/status', user?.id],
    queryFn: () => apiRequest('GET', `/api/instagram/status?userId=${user?.id}`).then(res => res.json()),
    enabled: !!user?.id,
    initialData: {
      connected: false,
      username: null,
      accountType: null,
      connectedAt: null
    }
  });

  // Instagram connect mutation
  const connectInstagramMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      const response = await apiRequest('POST', '/api/instagram/connect', { userId: user.id });
      return response.json();
    },
    onSuccess: (data) => {
      // Open Instagram OAuth in new window
      window.open(data.authUrl, '_blank', 'width=600,height=700,scrollbars=yes,resizable=yes');
      
      toast({
        title: "Instagram authorization opened",
        description: "Complete the authorization in the new window."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Connection failed",
        description: error.message || "Failed to initiate Instagram connection",
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
    
    const updatedNotifications = {
      ...settings.notifications,
      [field]: value
    };
    
    // Update the cache immediately for better UX
    queryClient.setQueryData(['/api/settings'], (oldData: UserSettings | undefined) => {
      if (!oldData) return oldData;
      return {
        ...oldData,
        notifications: updatedNotifications
      };
    });
    
    updateSettingsMutation.mutate({
      notifications: updatedNotifications
    });
  };

  const updateAutomation = (field: string, value: any) => {
    if (!settings) return;
    
    const updatedAutomation = {
      ...settings.automation,
      [field]: value
    };
    
    // Update the cache immediately for better UX
    queryClient.setQueryData(['/api/settings'], (oldData: UserSettings | undefined) => {
      if (!oldData) return oldData;
      return {
        ...oldData,
        automation: updatedAutomation
      };
    });
    
    updateSettingsMutation.mutate({
      automation: updatedAutomation
    });
  };

  // Show loading state while queries are loading
  if (userLoading || profileLoading || plansLoading || statusLoading || isLoading || !settings) {
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

          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Loading your settings...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Don't render anything if user is not authenticated (prevents flash)
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Personal Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Personal Profile</span>
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

        {/* Subscription & Billing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5" />
              <span>Subscription & Billing</span>
            </CardTitle>
            <CardDescription>
              Manage your subscription through Stripe's secure billing portal
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center">
                    <Crown className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-blue-900 dark:text-blue-100">
                      {subscriptionStatus?.subscriptions?.some(sub => 
                        sub.items?.data?.some((item: any) => item.price?.lookup_key === 'pro')
                      ) ? 'Pro Plan' : 'Starter Plan'}
                    </h3>
                    <p className="text-blue-700 dark:text-blue-300 text-sm">
                      {subscriptionStatus?.trialInfo?.isInTrial 
                        ? `Trial active - ${subscriptionStatus.trialInfo.daysRemaining} days remaining`
                        : 'Subscription active'
                      }
                    </p>
                  </div>
                </div>
                <Button 
                  onClick={handleManageSubscription}
                  disabled={manageSubscriptionMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  {manageSubscriptionMutation.isPending ? "Opening..." : "Manage Subscription"}
                </Button>
              </div>
            </div>
            
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Need to change your plan, update payment methods, or view billing history? 
                Use the "Manage Subscription" button above to access Stripe's secure billing portal.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <span>Notifications</span>
            </CardTitle>
            <CardDescription>
              Configure email notifications for important updates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="emailNotifications">Email notifications</Label>
                <p className="text-sm text-gray-500">
                  Enable email notifications for quota warnings
                </p>
              </div>
              <Switch
                id="emailNotifications"
                checked={settings.notifications.emailNotifications}
                onCheckedChange={(checked) => updateNotifications('emailNotifications', checked)}
              />
            </div>

            {settings.notifications.emailNotifications && (
              <div className="pl-4 border-l-2 border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="quotaWarnings">Quota warnings</Label>
                    <p className="text-sm text-gray-500">
                      Get warned when approaching usage limits
                    </p>
                  </div>
                  <Switch
                    id="quotaWarnings"
                    checked={settings.notifications.quotaWarnings}
                    onCheckedChange={(checked) => updateNotifications('quotaWarnings', checked)}
                  />
                </div>
              </div>
            )}
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
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                  instagramStatus?.connected 
                    ? "bg-pink-100 dark:bg-pink-900" 
                    : "bg-gray-100 dark:bg-gray-800"
                }`}>
                  <Globe className={`h-5 w-5 ${
                    instagramStatus?.connected 
                      ? "text-pink-600" 
                      : "text-gray-400"
                  }`} />
                </div>
                <div>
                  <h4 className="font-medium">Instagram Business API</h4>
                  <p className="text-sm text-gray-500">
                    {instagramStatus?.connected 
                      ? `Connected as @${instagramStatus.username}` 
                      : "Connect your Instagram business account"}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {instagramStatus?.connected ? (
                  <Badge variant="default">Connected</Badge>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => connectInstagramMutation.mutate()}
                    disabled={connectInstagramMutation.isPending || instagramLoading}
                  >
                    {connectInstagramMutation.isPending ? "Connecting..." : "Connect"}
                  </Button>
                )}
              </div>
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