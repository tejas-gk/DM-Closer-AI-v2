import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart3, 
  TrendingUp, 
  MessageSquare, 
  Bot,
  Clock,
  Users,
  Target,
  Calendar,
  Download
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";

interface AnalyticsData {
  overview: {
    totalConversations: number;
    aiResponsesGenerated: number;
    averageResponseTime: string;
    customerEngagementRate: number;
    quotaUsed: number;
    quotaLimit: number;
  };
  usage: {
    daily: Array<{
      date: string;
      aiResponses: number;
      manualResponses: number;
      totalMessages: number;
    }>;
    toneBreakdown: Array<{
      tone: string;
      count: number;
      percentage: number;
    }>;
  };
  performance: {
    responseQuality: Array<{
      date: string;
      qualityScore: number;
      editRate: number;
    }>;
    customerSatisfaction: Array<{
      metric: string;
      value: number;
      change: number;
    }>;
  };
}

const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444'];

export default function DashboardAnalytics() {
  const [timeRange, setTimeRange] = useState("7d");

  const { data: analytics, isLoading } = useQuery<AnalyticsData>({
    queryKey: ['/api/analytics', timeRange],
    initialData: {
      overview: {
        totalConversations: 89,
        aiResponsesGenerated: 156,
        averageResponseTime: "2.3 min",
        customerEngagementRate: 87,
        quotaUsed: 156,
        quotaLimit: 500
      },
      usage: {
        daily: [
          { date: "Mon", aiResponses: 12, manualResponses: 8, totalMessages: 32 },
          { date: "Tue", aiResponses: 18, manualResponses: 5, totalMessages: 28 },
          { date: "Wed", aiResponses: 15, manualResponses: 10, totalMessages: 35 },
          { date: "Thu", aiResponses: 22, manualResponses: 7, totalMessages: 41 },
          { date: "Fri", aiResponses: 19, manualResponses: 6, totalMessages: 38 },
          { date: "Sat", aiResponses: 14, manualResponses: 12, totalMessages: 29 },
          { date: "Sun", aiResponses: 16, manualResponses: 9, totalMessages: 31 }
        ],
        toneBreakdown: [
          { tone: "Friendly", count: 89, percentage: 57 },
          { tone: "Professional", count: 45, percentage: 29 },
          { tone: "Casual", count: 22, percentage: 14 }
        ]
      },
      performance: {
        responseQuality: [
          { date: "Mon", qualityScore: 92, editRate: 8 },
          { date: "Tue", qualityScore: 89, editRate: 11 },
          { date: "Wed", qualityScore: 94, editRate: 6 },
          { date: "Thu", qualityScore: 91, editRate: 9 },
          { date: "Fri", qualityScore: 96, editRate: 4 },
          { date: "Sat", qualityScore: 88, editRate: 12 },
          { date: "Sun", qualityScore: 93, editRate: 7 }
        ],
        customerSatisfaction: [
          { metric: "Response Relevance", value: 94, change: 5 },
          { metric: "Tone Appropriateness", value: 91, change: 2 },
          { metric: "Conversion Rate", value: 23, change: 8 },
          { metric: "Follow-up Rate", value: 67, change: -3 }
        ]
      }
    }
  });

  if (isLoading || !analytics) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  const quotaPercentage = (analytics.overview.quotaUsed / analytics.overview.quotaLimit) * 100;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Track your AI assistant performance and usage metrics
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1 w-full sm:w-auto">
              {["7d", "30d", "90d"].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1 text-sm rounded-md transition-colors flex-1 sm:flex-none ${
                    timeRange === range
                      ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  {range === "7d" ? "7 days" : range === "30d" ? "30 days" : "90 days"}
                </button>
              ))}
            </div>
            <Button variant="outline" size="sm" className="w-full sm:w-auto">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Total Conversations</CardTitle>
              <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold">{analytics.overview.totalConversations}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+12%</span> from last period
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">AI Responses Generated</CardTitle>
              <Bot className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold">{analytics.overview.aiResponsesGenerated}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+18%</span> from last period
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Avg Response Time</CardTitle>
              <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold">{analytics.overview.averageResponseTime}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">-15%</span> from last period
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Engagement Rate</CardTitle>
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold">{analytics.overview.customerEngagementRate}%</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+5%</span> from last period
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quota Usage */}
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
                {analytics.overview.quotaUsed} / {analytics.overview.quotaLimit}
              </span>
            </div>
            <Progress value={quotaPercentage} className="h-2" />
            <div className="flex justify-between items-center text-xs text-gray-500">
              <span>{quotaPercentage.toFixed(1)}% used</span>
              <span>{analytics.overview.quotaLimit - analytics.overview.quotaUsed} remaining</span>
            </div>
            {quotaPercentage > 80 && (
              <div className="flex items-center space-x-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="h-2 w-2 bg-yellow-500 rounded-full"></div>
                <span className="text-sm text-yellow-800 dark:text-yellow-200">
                  Approaching quota limit. Consider upgrading your plan.
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Analytics Tabs */}
        <Tabs defaultValue="usage" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="usage">Usage Trends</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="usage" className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Daily Usage Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Daily Message Activity</CardTitle>
                  <CardDescription>
                    AI vs manual responses over the last 7 days
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={analytics.usage.daily}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="aiResponses" stackId="a" fill="#0ea5e9" name="AI Responses" />
                      <Bar dataKey="manualResponses" stackId="a" fill="#64748b" name="Manual Responses" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Tone Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Response Tone Distribution</CardTitle>
                  <CardDescription>
                    Breakdown of AI response tones used
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={analytics.usage.toneBreakdown}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percentage }) => `${name} ${percentage}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {analytics.usage.toneBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Response Quality */}
              <Card>
                <CardHeader>
                  <CardTitle>Response Quality Trends</CardTitle>
                  <CardDescription>
                    Quality scores and edit rates over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={analytics.performance.responseQuality}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="qualityScore" 
                        stroke="#10b981" 
                        strokeWidth={2}
                        name="Quality Score"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="editRate" 
                        stroke="#f59e0b" 
                        strokeWidth={2}
                        name="Edit Rate %"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Customer Satisfaction Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle>Customer Satisfaction</CardTitle>
                  <CardDescription>
                    Key performance indicators and changes
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {analytics.performance.customerSatisfaction.map((metric, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="font-medium">{metric.metric}</span>
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl font-bold">{metric.value}%</span>
                        <Badge 
                          variant={metric.change >= 0 ? "default" : "destructive"}
                          className="text-xs"
                        >
                          {metric.change >= 0 ? "+" : ""}{metric.change}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* AI Performance Insights */}
              <Card>
                <CardHeader>
                  <CardTitle>AI Performance Insights</CardTitle>
                  <CardDescription>
                    Key observations and recommendations
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-green-800 dark:text-green-200">Strong Performance</h4>
                        <p className="text-sm text-green-700 dark:text-green-300">
                          Your friendly tone generates the highest customer engagement (94% response rate)
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <MessageSquare className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-blue-800 dark:text-blue-200">Optimization Opportunity</h4>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          Peak message volume occurs between 2-4 PM. Consider pre-generating common responses.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <Target className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-yellow-800 dark:text-yellow-200">Action Needed</h4>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300">
                          You're using 31% of your monthly quota. Current usage suggests you'll need 420 responses this month.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Usage Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle>Usage Recommendations</CardTitle>
                  <CardDescription>
                    Optimize your AI assistant for better results
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3 p-3 border rounded-lg">
                      <div className="h-2 w-2 bg-blue-500 rounded-full mt-2"></div>
                      <div>
                        <h5 className="font-medium text-sm">Custom Instructions Update</h5>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Add more specific product details to reduce manual edits by 23%
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 p-3 border rounded-lg">
                      <div className="h-2 w-2 bg-green-500 rounded-full mt-2"></div>
                      <div>
                        <h5 className="font-medium text-sm">Tone Strategy</h5>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Use professional tone for pricing inquiries (18% higher conversion)
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 p-3 border rounded-lg">
                      <div className="h-2 w-2 bg-purple-500 rounded-full mt-2"></div>
                      <div>
                        <h5 className="font-medium text-sm">Peak Hours</h5>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Pre-generate responses for common questions during 2-4 PM rush
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}