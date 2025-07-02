import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { getUser } from '../../lib/supabase/auth';
import { supabase } from '../../lib/supabase/client';
import { Instagram, Send, CheckCircle, XCircle } from "lucide-react";

export default function InstagramTest() {
  const [recipientId, setRecipientId] = useState("");
  const [message, setMessage] = useState("Hello! This is a test message from DMCloser AI.");
  const { toast } = useToast();

  // Get current user
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: getUser,
  });

  // Get Instagram connection status
  const { data: instagramStatus, isLoading, refetch } = useQuery({
    queryKey: ['instagram-status', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const session = await supabase.auth.getSession();
      if (!session.data.session?.access_token) {
        throw new Error('No session token');
      }

      const response = await fetch(`/api/instagram/status?userId=${user.id}`, {
        headers: {
          'Authorization': `Bearer ${session.data.session.access_token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch Instagram status');
      }
      
      return response.json();
    },
    enabled: !!user?.id,
  });

  // Send Instagram message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ recipientId, message }: { recipientId: string; message: string }) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const session = await supabase.auth.getSession();
      if (!session.data.session?.access_token) {
        throw new Error('No session token');
      }

      const response = await fetch('/api/instagram/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.data.session.access_token}`,
        },
        body: JSON.stringify({
          userId: user.id,
          recipientId,
          message,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Message sent successfully!",
        description: `Message ID: ${data.messageId}`,
      });
      setMessage("");
      setRecipientId("");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send message",
        description: error.message || "Unknown error occurred",
        variant: "destructive",
      });
    },
  });

  // Connect Instagram mutation
  const connectInstagramMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      const response = await apiRequest('POST', '/api/instagram/connect', { userId: user.id });
      return response.json();
    },
    onSuccess: (data) => {
      window.open(data.authUrl, '_blank', 'width=600,height=700,scrollbars=yes,resizable=yes');
      toast({
        title: "Instagram authorization opened",
        description: "Complete the authorization in the new window, then refresh this page."
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

  const handleSendMessage = () => {
    if (!recipientId || !message) {
      toast({
        title: "Missing fields",
        description: "Please enter both recipient ID and message",
        variant: "destructive",
      });
      return;
    }

    sendMessageMutation.mutate({ recipientId, message });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please log in to test Instagram integration</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Instagram API Test Console
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Test your Instagram integration and send messages directly
          </p>
        </div>

        {/* Connection Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Instagram className="h-5 w-5" />
              <span>Instagram Connection Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="h-4 w-4 rounded-full border-2 border-gray-300 border-t-blue-600 animate-spin" />
                <span>Loading connection status...</span>
              </div>
            ) : instagramStatus?.connected ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  <div>
                    <p className="font-medium">Connected</p>
                    <p className="text-sm text-gray-600">@{instagramStatus.username}</p>
                    <p className="text-xs text-gray-500">
                      Connected: {new Date(instagramStatus.connectedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {instagramStatus.tokenExpired && (
                  <Badge variant="destructive">Token Expired</Badge>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <XCircle className="h-6 w-6 text-red-600" />
                  <div>
                    <p className="font-medium">Not Connected</p>
                    <p className="text-sm text-gray-600">Connect your Instagram account to start testing</p>
                  </div>
                </div>
                <Button
                  onClick={() => connectInstagramMutation.mutate()}
                  disabled={connectInstagramMutation.isPending}
                  className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                >
                  {connectInstagramMutation.isPending ? "Connecting..." : "Connect Instagram"}
                </Button>
              </div>
            )}
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isLoading}
              >
                Refresh Status
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Message Sending Test */}
        {instagramStatus?.connected && !instagramStatus.tokenExpired && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Send className="h-5 w-5" />
                <span>Send Test Message</span>
              </CardTitle>
              <CardDescription>
                Send a test message to verify the Instagram messaging functionality
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="recipientId">Recipient Instagram User ID</Label>
                <Input
                  id="recipientId"
                  placeholder="Enter Instagram User ID (e.g., 17841400455970153)"
                  value={recipientId}
                  onChange={(e) => setRecipientId(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Note: You can only send messages to users who have messaged your Instagram account first
                </p>
              </div>
              
              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Enter your test message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                />
              </div>

              <Button
                onClick={handleSendMessage}
                disabled={sendMessageMutation.isPending || !recipientId || !message}
                className="w-full"
              >
                {sendMessageMutation.isPending ? "Sending..." : "Send Test Message"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Debug Information */}
        {instagramStatus && (
          <Card>
            <CardHeader>
              <CardTitle>Debug Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                <pre className="text-xs overflow-x-auto">
                  {JSON.stringify(instagramStatus, null, 2)}
                </pre>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}