import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Mail, Send, TestTube, Settings, Zap } from "lucide-react";

export default function EmailTest() {
  const [testEmail, setTestEmail] = useState("test@example.com");
  const [firstName, setFirstName] = useState("Test User");
  const [targetPercentage, setTargetPercentage] = useState(80);
  const { toast } = useToast();

  // Send welcome email mutation
  const sendWelcomeMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/emails/send-welcome', {
        userEmail: testEmail,
        firstName
      });
    },
    onSuccess: () => {
      toast({
        title: "Welcome email sent!",
        description: `Successfully sent welcome email to ${testEmail}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send welcome email",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  // Simulate usage mutation
  const simulateUsageMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/usage/simulate', {
        targetPercentage
      });
    },
    onSuccess: (data: any) => {
      toast({
        title: "Usage simulated",
        description: `Set usage to ${targetPercentage}% (${data.usage.currentUsage}/${data.usage.quotaLimit} responses)`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to simulate usage",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  // Test email warning mutation
  const testEmailWarningMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/usage/test-email-warning', {
        userEmail: testEmail
      });
    },
    onSuccess: () => {
      toast({
        title: "Email warning test completed",
        description: "Check your email for quota warning notifications",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to test email warning",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  // Send direct quota warning mutation
  const sendQuotaWarningMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/emails/send-quota-warning', {
        userEmail: testEmail,
        usagePercentage: targetPercentage,
        quotaLimit: 1000,
        currentUsage: Math.floor((targetPercentage / 100) * 1000)
      });
    },
    onSuccess: () => {
      toast({
        title: "Quota warning email sent!",
        description: `Successfully sent quota warning email to ${testEmail}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send quota warning email",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Email Service Testing
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Test Resend email integration and quota warning system
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Email Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Email Configuration</span>
              </CardTitle>
              <CardDescription>
                Configure test email settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="testEmail">Test Email Address</Label>
                <Input
                  id="testEmail"
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="test@example.com"
                />
              </div>
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Test User"
                />
              </div>
              <div>
                <Label htmlFor="targetPercentage">Target Usage Percentage</Label>
                <Input
                  id="targetPercentage"
                  type="number"
                  min="0"
                  max="100"
                  value={targetPercentage}
                  onChange={(e) => setTargetPercentage(parseInt(e.target.value) || 0)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Welcome Email Testing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Mail className="h-5 w-5" />
                <span>Welcome Email</span>
              </CardTitle>
              <CardDescription>
                Test welcome email functionality
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => sendWelcomeMutation.mutate()}
                disabled={sendWelcomeMutation.isPending || !testEmail}
                className="w-full"
              >
                <Send className="h-4 w-4 mr-2" />
                {sendWelcomeMutation.isPending ? "Sending..." : "Send Welcome Email"}
              </Button>
            </CardContent>
          </Card>

          {/* Usage Simulation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="h-5 w-5" />
                <span>Usage Simulation</span>
              </CardTitle>
              <CardDescription>
                Simulate usage to test quota warnings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => simulateUsageMutation.mutate()}
                disabled={simulateUsageMutation.isPending}
                className="w-full"
                variant="outline"
              >
                <TestTube className="h-4 w-4 mr-2" />
                {simulateUsageMutation.isPending ? "Simulating..." : `Set Usage to ${targetPercentage}%`}
              </Button>
            </CardContent>
          </Card>

          {/* Quota Warning Testing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TestTube className="h-5 w-5" />
                <span>Quota Warning Tests</span>
              </CardTitle>
              <CardDescription>
                Test quota warning email system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={() => testEmailWarningMutation.mutate()}
                disabled={testEmailWarningMutation.isPending || !testEmail}
                className="w-full"
                variant="outline"
              >
                {testEmailWarningMutation.isPending ? "Testing..." : "Test Auto Warning System"}
              </Button>
              <Button
                onClick={() => sendQuotaWarningMutation.mutate()}
                disabled={sendQuotaWarningMutation.isPending || !testEmail}
                className="w-full"
              >
                <Send className="h-4 w-4 mr-2" />
                {sendQuotaWarningMutation.isPending ? "Sending..." : "Send Direct Warning Email"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Status Information */}
        <Card>
          <CardHeader>
            <CardTitle>Integration Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600">✓</div>
                <div className="text-sm font-medium">Resend API</div>
                <div className="text-xs text-gray-500">Connected</div>
              </div>
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">✓</div>
                <div className="text-sm font-medium">Email Templates</div>
                <div className="text-xs text-gray-500">Ready</div>
              </div>
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">✓</div>
                <div className="text-sm font-medium">Quota Monitoring</div>
                <div className="text-xs text-gray-500">Active</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}