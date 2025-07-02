import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  MessageSquare, 
  Bot, 
  TrendingUp, 
  Clock,
  Users,
  Zap,
  Target,
  BarChart3
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface DashboardStats {
  totalConversations: number;
  unreadMessages: number;
  aiResponsesThisMonth: number;
  quotaLimit: number;
  responseRate: number;
  avgResponseTime: string;
  qualityScore: number;
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
  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
    initialData: {
      totalConversations: 24,
      unreadMessages: 7,
      aiResponsesThisMonth: 45,
      quotaLimit: 100,
      responseRate: 94,
      avgResponseTime: "2.3 minutes",
      qualityScore: 92,
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
            Monitor your Instagram DM automation and AI responses
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalConversations}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.unreadMessages} unread messages
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">AI Responses</CardTitle>
              <Bot className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.aiResponsesThisMonth}</div>
              <p className="text-xs text-muted-foreground">
                of {stats?.quotaLimit} this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.responseRate}%</div>
              <p className="text-xs text-muted-foreground">
                +2.1% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.avgResponseTime}</div>
              <p className="text-xs text-muted-foreground">
                -30s from last week
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Usage Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="h-5 w-5" />
                <span>Usage Overview</span>
              </CardTitle>
              <CardDescription>
                Your AI response usage for this billing cycle
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>AI Responses Used</span>
                  <span>{stats?.aiResponsesThisMonth}/{stats?.quotaLimit}</span>
                </div>
                <Progress value={usagePercentage} className="h-2" />
              </div>
              
              <div className="flex items-center justify-between pt-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    {stats?.quotaLimit && stats?.aiResponsesThisMonth 
                      ? stats.quotaLimit - stats.aiResponsesThisMonth 
                      : 0} responses remaining
                  </p>
                  {usagePercentage > 80 && (
                    <Badge variant="destructive">Approaching limit</Badge>
                  )}
                </div>
                <Button variant="outline" size="sm">
                  Upgrade Plan
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Recent Activity</span>
              </CardTitle>
              <CardDescription>
                Latest messages and AI responses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity?.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      activity.type === 'message' ? 'bg-blue-500' :
                      activity.type === 'ai_response' ? 'bg-green-500' : 'bg-gray-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {activity.customerName}
                        </p>
                        <Badge variant={
                          activity.status === 'pending' ? 'secondary' :
                          activity.status === 'sent' ? 'default' : 'outline'
                        } className="text-xs">
                          {activity.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {activity.content}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activity.timestamp}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="pt-4">
                <Button variant="outline" className="w-full">
                  View All Conversations
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}