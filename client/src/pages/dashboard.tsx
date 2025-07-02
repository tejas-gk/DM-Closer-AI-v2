import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import WelcomeModal from "@/components/welcome-modal";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  MessageSquare, 
  Bot, 
  TrendingUp, 
  Clock,
  Users,
  Zap,
  Target,
  BarChart3,
  ArrowRight,
  AlertCircle
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface DashboardStats {
  totalConversations: number;
  unreadMessages: number;
  aiResponsesThisMonth: number;
  quotaLimit: number;
  responseRate: number;
  avgResponseTime: string;
  engagementRate: number;
}

interface DailyActivity {
  date: string;
  aiResponses: number;
  manualResponses: number;
  totalMessages: number;
}

interface AIInsight {
  type: 'success' | 'info' | 'warning';
  title: string;
  description: string;
  icon: any;
}

interface RecentActivity {
  id: string;
  type: 'message' | 'ai_response' | 'manual_reply';
  customerName: string;
  content: string;
  timestamp: string;
  status: 'pending' | 'sent' | 'read';
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  // Check URL parameters for welcome flow
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('welcome') === 'true') {
      setShowWelcomeModal(true);
      // Clean up URL
      window.history.replaceState({}, '', '/dashboard');
    }
  }, []);

  // Navigation handlers
  const handleViewAISettings = () => {
    setLocation('/dashboard/ai-settings');
  };

  const handleViewAllConversations = () => {
    setLocation('/dashboard/conversations');
  };

  // Get user authentication
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => import('../../lib/supabase/auth').then(auth => auth.getUser()),
  });

  // Get user's subscription status  
  const { data: subscriptionStatus } = useQuery({
    queryKey: ['/api/subscription-status', user?.id],
    queryFn: () => apiRequest('GET', `/api/subscription-status?userId=${user?.id}`).then(res => res.json()),
    enabled: !!user?.id,
  });

  // Manage subscription handler
  const manageSubscriptionMutation = useMutation({
    mutationFn: async (customerId: string) => {
      const response = await apiRequest('POST', '/api/create-portal-session', {
        customerId,
        returnUrl: window.location.origin + '/dashboard',
      });
      return response.json();
    },
    onSuccess: (data) => {
      window.open(data.url, '_blank', 'noopener,noreferrer');
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to open billing portal",
        variant: "destructive"
      });
    }
  });

  const handleManageSubscription = async () => {
    if (!user?.id) {
      toast({
        title: 'Authentication required',
        description: 'Please log in to manage your subscription.',
        variant: 'destructive',
      });
      return;
    }

    // Get fresh subscription status if not loaded
    if (!subscriptionStatus?.customerId) {
      try {
        const response = await apiRequest('GET', `/api/subscription-status?userId=${user.id}`);
        const freshStatus = await response.json();
        
        if (freshStatus.customerId) {
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
      manageSubscriptionMutation.mutate(subscriptionStatus.customerId);
    } else {
      toast({
        title: 'Subscription data unavailable',
        description: 'Please wait a moment and try again.',
        variant: 'destructive',
      });
    }
  };

  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
    initialData: {
      totalConversations: 24,
      unreadMessages: 7,
      aiResponsesThisMonth: 45,
      quotaLimit: 100,
      responseRate: 94,
      avgResponseTime: "2.3 min",
      engagementRate: 87
    }
  });

  const { data: dailyActivity } = useQuery<DailyActivity[]>({
    queryKey: ['/api/dashboard/daily-activity'],
    initialData: [
      { date: "Mon", aiResponses: 12, manualResponses: 8, totalMessages: 32 },
      { date: "Tue", aiResponses: 18, manualResponses: 5, totalMessages: 28 },
      { date: "Wed", aiResponses: 15, manualResponses: 10, totalMessages: 35 },
      { date: "Thu", aiResponses: 22, manualResponses: 7, totalMessages: 41 },
      { date: "Fri", aiResponses: 19, manualResponses: 6, totalMessages: 38 },
      { date: "Sat", aiResponses: 14, manualResponses: 12, totalMessages: 29 },
      { date: "Sun", aiResponses: 16, manualResponses: 9, totalMessages: 31 }
    ]
  });

  const { data: aiInsights } = useQuery<AIInsight[]>({
    queryKey: ['/api/dashboard/ai-insights'],
    initialData: [
      {
        type: 'success',
        title: 'Strong Performance',
        description: 'Your friendly tone generates the highest customer engagement (94% response rate)',
        icon: TrendingUp
      },
      {
        type: 'info',
        title: 'Peak Hours Identified',
        description: 'Most customer messages arrive between 2-4 PM. Consider enabling auto-responses during this time.',
        icon: Clock
      }
    ]
  });

  const { data: recentActivity } = useQuery<RecentActivity[]>({
    queryKey: ['/api/dashboard/activity'],
    initialData: [
      {
        id: '1',
        type: 'message',
        customerName: 'Sarah Martinez',
        content: 'Hi! I\'m interested in your fitness coaching services...',
        timestamp: '2 minutes ago',
        status: 'pending'
      },
      {
        id: '2',
        type: 'ai_response',
        customerName: 'Mike Johnson',
        content: 'Thanks for your interest! I\'d love to help you achieve your fitness goals.',
        timestamp: '15 minutes ago',
        status: 'sent'
      },
      {
        id: '3',
        type: 'message',
        customerName: 'Emma Wilson',
        content: 'What are your rates for personal training?',
        timestamp: '1 hour ago',
        status: 'pending'
      }
    ]
  });

  const usagePercentage = stats ? (stats.aiResponsesThisMonth / stats.quotaLimit) * 100 : 0;
  const quotaRemaining = stats ? stats.quotaLimit - stats.aiResponsesThisMonth : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard Overview</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Monitor your Instagram DM automation and AI performance
          </p>
        </div>

        {/* Enhanced Stats Cards - Mobile optimized grid */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Conversations</CardTitle>
              <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold">{stats?.totalConversations}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+12%</span> from last week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Unread</CardTitle>
              <Badge variant="destructive" className="h-3 sm:h-4 text-xs px-1">{stats?.unreadMessages}</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold">{stats?.unreadMessages}</div>
              <p className="text-xs text-muted-foreground">
                require attention
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">AI Responses</CardTitle>
              <Bot className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold">{stats?.aiResponsesThisMonth}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+18%</span> this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Quota Used</CardTitle>
              <Target className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold">{stats?.aiResponsesThisMonth}</div>
              <p className="text-xs text-muted-foreground">
                of {stats?.quotaLimit} this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Engagement</CardTitle>
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold">{stats?.engagementRate}%</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+5%</span> from last week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Response Time</CardTitle>
              <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold">{stats?.avgResponseTime}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">-15%</span> faster
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Performance Insights Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* AI Performance Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="h-5 w-5" />
                <span>AI Performance Insights</span>
              </CardTitle>
              <CardDescription>
                Key observations and recommendations for your AI assistant
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {aiInsights?.map((insight, index) => {
                const IconComponent = insight.icon;
                const bgColor = insight.type === 'success' 
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                  : insight.type === 'info'
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                  : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
                
                const textColor = insight.type === 'success'
                  ? 'text-green-800 dark:text-green-200'
                  : insight.type === 'info' 
                  ? 'text-blue-800 dark:text-blue-200'
                  : 'text-yellow-800 dark:text-yellow-200';

                const iconColor = insight.type === 'success'
                  ? 'text-green-600'
                  : insight.type === 'info'
                  ? 'text-blue-600' 
                  : 'text-yellow-600';

                return (
                  <div key={index} className={`p-4 rounded-lg border ${bgColor}`}>
                    <div className="flex items-start space-x-2">
                      <IconComponent className={`h-5 w-5 mt-0.5 ${iconColor}`} />
                      <div>
                        <h4 className={`font-medium ${textColor}`}>{insight.title}</h4>
                        <p className={`text-sm ${textColor.replace('800', '700').replace('200', '300')}`}>
                          {insight.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={handleViewAISettings}
              >
                View AI Settings
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          {/* Daily Activity Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Daily Message Activity</span>
              </CardTitle>
              <CardDescription>
                AI vs manual responses over the last 7 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={dailyActivity}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="date" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                  />
                  <Bar 
                    dataKey="aiResponses" 
                    stackId="a" 
                    fill="#0ea5e9" 
                    name="AI Responses"
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar 
                    dataKey="manualResponses" 
                    stackId="a" 
                    fill="#64748b" 
                    name="Manual Responses"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Usage & Actions Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Enhanced Quota Usage */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5" />
                <span>Monthly Quota Usage</span>
              </CardTitle>
              <CardDescription>
                Track your AI response quota for the current billing period
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">AI Responses Used</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {stats?.aiResponsesThisMonth} / {stats?.quotaLimit}
                </span>
              </div>
              <Progress value={usagePercentage} className="h-2" />
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>{usagePercentage.toFixed(1)}% used</span>
                <span>{quotaRemaining} remaining</span>
              </div>
              {usagePercentage > 80 && (
                <div className="flex items-center space-x-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <div className="h-2 w-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm text-yellow-800 dark:text-yellow-200">
                    Approaching quota limit. Consider upgrading your plan.
                  </span>
                </div>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={handleManageSubscription}
                disabled={manageSubscriptionMutation.isPending}
              >
                {manageSubscriptionMutation.isPending ? "Loading..." : "Manage Subscription"}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          {/* Quick Actions & Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Recent Activity</span>
              </CardTitle>
              <CardDescription>
                Latest customer interactions and AI responses
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {recentActivity?.slice(0, 3).map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                    <div className={`h-2 w-2 rounded-full mt-2 ${
                      activity.type === 'message' 
                        ? 'bg-blue-500' 
                        : activity.type === 'ai_response'
                        ? 'bg-green-500'
                        : 'bg-gray-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {activity.customerName}
                        </p>
                        <Badge 
                          variant={activity.status === 'pending' ? 'destructive' : 'secondary'}
                          className="text-xs"
                        >
                          {activity.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {activity.content}
                      </p>
                      <p className="text-xs text-gray-500">
                        {activity.timestamp}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={handleViewAllConversations}
              >
                View All Conversations
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <WelcomeModal 
        isOpen={showWelcomeModal} 
        onClose={() => setShowWelcomeModal(false)} 
      />
    </DashboardLayout>
  );
}