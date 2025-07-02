import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useIsMobile } from "@/hooks/use-mobile";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Search, 
  Filter, 
  Bot, 
  Send,
  Check,
  CheckCheck,
  Clock,
  ArrowLeft,
  Zap,
  Settings
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface Message {
  id: string;
  conversationId: string;
  senderType: 'user' | 'customer' | 'ai';
  content: string;
  sentAt: string;
  isRead: boolean;
  aiGenerated?: boolean;
  toneUsed?: string;
  responseStatus?: 'pending' | 'sent' | 'edited';
}

interface Conversation {
  id: string;
  participantUsername: string;
  participantName: string;
  participantAvatarUrl: string;
  lastMessageAt: string;
  isRead: boolean;
  messageCount: number;
  autoReplyEnabled?: boolean;
  lastMessage?: {
    content: string;
    sentAt: string;
    senderType: string;
    aiGenerated?: boolean;
  };
}

interface ConversationWithMessages extends Conversation {
  messages: Message[];
}

export default function DashboardConversations() {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [showMobileChat, setShowMobileChat] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mock user for demo
  const user = { id: 'demo-user' };

  // Get conversations list with auto-refresh
  const { data: conversationsData, isLoading: conversationsLoading } = useQuery({
    queryKey: ['/api/conversations', user?.id, searchQuery],
    queryFn: () => apiRequest('GET', `/api/conversations?userId=${user?.id}&search=${searchQuery}`).then(res => res.json()),
    enabled: !!user?.id,
    refetchInterval: 5000, // Refresh conversations list every 5 seconds
  });

  // Get selected conversation details with polling for real-time updates
  const { data: selectedConversation, isLoading: conversationLoading } = useQuery({
    queryKey: ['/api/conversations', selectedConversationId, user?.id],
    queryFn: () => apiRequest('GET', `/api/conversations/${selectedConversationId}?userId=${user?.id}`).then(res => res.json()),
    enabled: !!selectedConversationId && !!user?.id,
    refetchInterval: 3000, // Poll every 3 seconds for new messages
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedConversation?.messages]);

  const conversations = conversationsData?.conversations || [];

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ conversationId, content }: { conversationId: string; content: string }) => {
      const response = await apiRequest('POST', `/api/conversations/${conversationId}/messages`, {
        userId: user?.id,
        content,
      });
      return response.json();
    },
    onSuccess: () => {
      setNewMessage('');
      queryClient.invalidateQueries({ queryKey: ['/api/conversations', selectedConversationId] });
      queryClient.invalidateQueries({ queryKey: ['/api/conversations', user?.id] });
      toast({
        title: 'Message sent',
        description: 'Your message has been sent successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to send message',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Simulate customer message mutation for demo
  const simulateCustomerMutation = useMutation({
    mutationFn: async ({ conversationId, content, customerName }: { conversationId: string; content: string; customerName: string }) => {
      const response = await apiRequest('POST', `/api/conversations/${conversationId}/simulate-customer-message`, {
        content,
        customerName,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations', selectedConversationId] });
      queryClient.invalidateQueries({ queryKey: ['/api/conversations', user?.id] });
      toast({
        title: 'Demo message sent',
        description: 'AI will respond automatically in a few seconds.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to send demo message',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Generate AI response mutation
  const generateAIResponseMutation = useMutation({
    mutationFn: async ({ conversationId }: { conversationId: string }) => {
      const response = await apiRequest('POST', `/api/conversations/${conversationId}/generate-ai-response`, {
        userId: user?.id,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations', selectedConversationId] });
      queryClient.invalidateQueries({ queryKey: ['/api/conversations', user?.id] });
      toast({
        title: 'AI response generated',
        description: 'AI response has been created successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to generate AI response',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Auto-reply toggle mutation
  const toggleAutoReplyMutation = useMutation({
    mutationFn: async ({ conversationId, enabled }: { conversationId: string; enabled: boolean }) => {
      const response = await apiRequest('PUT', `/api/conversations/${conversationId}/auto-reply`, {
        autoReplyEnabled: enabled
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/conversations', selectedConversationId] });
      toast({
        title: "Auto-reply updated",
        description: "Auto-reply setting has been updated successfully."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update auto-reply",
        description: error.message || "Please try again",
        variant: "destructive"
      });
    }
  });

  const handleSimulateCustomerMessage = () => {
    if (!selectedConversationId || !selectedConversation) return;
    
    const demoMessages = [
      "What are your rates for personal training?",
      "Do you offer nutrition coaching too?",
      "I'm a complete beginner, can you help me get started?",
      "How long does it take to see results?",
      "Do you have any success stories I can see?",
      "What makes your program different from others?"
    ];
    
    const randomMessage = demoMessages[Math.floor(Math.random() * demoMessages.length)];
    
    simulateCustomerMutation.mutate({
      conversationId: selectedConversationId,
      content: randomMessage,
      customerName: selectedConversation.participantName
    });
  };

  const handleGenerateAIResponse = () => {
    if (!selectedConversationId) return;
    
    generateAIResponseMutation.mutate({
      conversationId: selectedConversationId
    });
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversationId) return;
    
    sendMessageMutation.mutate({
      conversationId: selectedConversationId,
      content: newMessage.trim(),
    });
  };

  // Mark conversation as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (conversationId: string) => {
      const response = await apiRequest('PATCH', `/api/conversations/${conversationId}`, {
        userId: user?.id,
        isRead: true,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
    },
  });

  const handleConversationSelect = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    markAsReadMutation.mutate(conversationId);
    if (isMobile) {
      setShowMobileChat(true);
    }
  };

  const handleBackToList = () => {
    setShowMobileChat(false);
    setSelectedConversationId(null);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const filteredConversations = conversations?.filter((conv: Conversation) =>
    conv.participantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.participantUsername.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Mobile First Layout
  if (isMobile) {
    return (
      <DashboardLayout>
        <div className="h-[calc(100vh-8rem)] flex flex-col overflow-hidden">
          {!showMobileChat ? (
            // Mobile Conversations List
            <Card className="flex-1 flex flex-col h-full">
              <CardHeader className="pb-3 flex-shrink-0 bg-white dark:bg-gray-900 border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">Conversations</CardTitle>
                  <Badge variant="outline" className="text-xs">
                    {filteredConversations.length}
                  </Badge>
                </div>
                <div className="flex space-x-2 mt-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search conversations..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 py-2.5 text-base rounded-lg border-2 bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-700"
                    />
                  </div>
                  <Button variant="outline" size="sm" className="px-3">
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0 flex-1 overflow-y-auto">
                <div className="space-y-1">
                  {conversationsLoading ? (
                    <div className="p-4">Loading conversations...</div>
                  ) : filteredConversations.map((conversation: Conversation) => (
                    <div
                      key={conversation.id}
                      onClick={() => handleConversationSelect(conversation.id)}
                      className="p-3 cursor-pointer border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors active:bg-gray-100 dark:active:bg-gray-800"
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-14 w-14 flex-shrink-0">
                          <img src={conversation.participantAvatarUrl} alt={conversation.participantName} />
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-1">
                            <div className="flex-1 min-w-0 mr-2">
                              <p className="text-base font-semibold text-gray-900 dark:text-white truncate">
                                {conversation.participantName}
                              </p>
                              <p className="text-sm text-gray-500">@{conversation.participantUsername}</p>
                            </div>
                            <div className="flex flex-col items-end space-y-1">
                              <span className="text-xs text-gray-500">
                                {formatTime(conversation.lastMessageAt)}
                              </span>
                              {!conversation.isRead && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 truncate mb-2 line-clamp-2">
                            {conversation.lastMessage?.content}
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Badge 
                                variant={conversation.autoReplyEnabled ? "default" : "outline"} 
                                className="text-xs px-2 py-0.5"
                              >
                                {conversation.autoReplyEnabled ? "Auto ON" : "Auto OFF"}
                              </Badge>
                              <Badge variant={conversation.isRead ? "secondary" : "default"} className="text-xs px-2 py-0.5">
                                {conversation.isRead ? "Read" : "New"}
                              </Badge>
                            </div>
                            <span className="text-xs text-gray-400">{conversation.messageCount}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            // Mobile Chat View
            selectedConversationId && (
              <Card className="flex-1 flex flex-col h-full">
                {/* Mobile Chat Header */}
                <CardHeader className="border-b flex-shrink-0 bg-white dark:bg-gray-900 shadow-sm">
                  {conversationLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                    </div>
                  ) : selectedConversation ? (
                    <div className="space-y-3">
                      {/* Top Row: Back button, Avatar, Name, Actions */}
                      <div className="flex items-center space-x-3">
                        <Button variant="ghost" size="sm" onClick={handleBackToList} className="p-2">
                          <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <Avatar className="h-10 w-10">
                          <img src={selectedConversation.participantAvatarUrl} alt={selectedConversation.participantName} />
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-base text-gray-900 dark:text-white truncate">
                            {selectedConversation.participantName}
                          </h3>
                          <p className="text-sm text-gray-500">@{selectedConversation.participantUsername}</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleGenerateAIResponse}
                          disabled={generateAIResponseMutation.isPending}
                          className="px-3"
                        >
                          <Bot className="h-4 w-4 mr-1" />
                          {generateAIResponseMutation.isPending ? "..." : "AI"}
                        </Button>
                      </div>
                      
                      {/* Bottom Row: Auto-reply toggle and status */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="auto-reply-mobile"
                              checked={selectedConversation.autoReplyEnabled || false}
                              onCheckedChange={(checked) => {
                                toggleAutoReplyMutation.mutate({
                                  conversationId: selectedConversation.id,
                                  enabled: checked
                                });
                              }}
                            />
                            <Label htmlFor="auto-reply-mobile" className="text-sm font-medium">
                              Auto-reply
                            </Label>
                          </div>
                          <Badge 
                            variant={selectedConversation.autoReplyEnabled ? "default" : "outline"}
                            className="text-xs"
                          >
                            {selectedConversation.autoReplyEnabled ? "ON" : "OFF"}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs">
                            {selectedConversation.messageCount} messages
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            Demo
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </CardHeader>

                {/* Mobile Messages */}
                <CardContent className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50 dark:bg-gray-900">
                  {selectedConversation?.messages.map((message: Message) => (
                    <div key={message.id} className={`flex ${message.senderType === 'customer' ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                        message.senderType === 'customer'
                          ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
                          : message.aiGenerated
                          ? 'bg-blue-500 text-white'
                          : 'bg-green-500 text-white'
                      }`}>
                        <p className="text-base leading-relaxed">{message.content}</p>
                        <div className="flex items-center justify-between mt-2 gap-2">
                          <span className={`text-xs ${
                            message.senderType === 'customer' 
                              ? 'text-gray-500 dark:text-gray-400' 
                              : 'text-white/70'
                          }`}>
                            {formatTime(message.sentAt)}
                          </span>
                          {message.aiGenerated && (
                            <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                              <Bot className="h-3 w-3 mr-1" />
                              AI
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </CardContent>

                {/* Mobile Message Input */}
                <div className="border-t bg-white dark:bg-gray-900 p-3 space-y-3">
                  {/* Quick Action Buttons */}
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleGenerateAIResponse}
                      disabled={generateAIResponseMutation.isPending}
                      className="flex-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                    >
                      <Bot className="h-4 w-4 mr-2" />
                      {generateAIResponseMutation.isPending ? "Generating..." : "AI Response"}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleSimulateCustomerMessage}
                      disabled={simulateCustomerMutation.isPending}
                      className="flex-1 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700 hover:bg-purple-100 dark:hover:bg-purple-900/30"
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Simulate
                    </Button>
                  </div>
                  
                  {/* Message Input */}
                  <div className="flex space-x-2 items-end">
                    <div className="flex-1 relative">
                      <Input
                        placeholder="Type your message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                        className="pr-12 py-3 text-base border-2 rounded-full bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-700"
                      />
                    </div>
                    <Button 
                      size="sm" 
                      onClick={handleSendMessage}
                      disabled={sendMessageMutation.isPending || !newMessage.trim()}
                      className="rounded-full p-3 bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            )
          )}
        </div>
      </DashboardLayout>
    );
  }

  // Desktop Layout
  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-8rem)] flex gap-4 sm:gap-6 overflow-hidden">
        {/* Conversations List */}
        <div className="w-1/3 flex flex-col h-full">
          <Card className="flex-1 flex flex-col h-full">
            <CardHeader className="pb-3 flex-shrink-0">
              <CardTitle className="text-lg">Conversations</CardTitle>
              <div className="flex space-x-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-y-auto">
              <div className="space-y-1">
                {conversationsLoading ? (
                  <div className="p-4">Loading conversations...</div>
                ) : filteredConversations.map((conversation: Conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => handleConversationSelect(conversation.id)}
                    className={`p-4 cursor-pointer border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                      selectedConversationId === conversation.id
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-r-2 border-blue-500'
                        : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <Avatar className="h-12 w-12 flex-shrink-0">
                        <img src={conversation.participantAvatarUrl} alt={conversation.participantName} />
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {conversation.participantName}
                          </p>
                          <span className="text-xs text-gray-500 flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {formatTime(conversation.lastMessageAt)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mb-2">@{conversation.participantUsername}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate mb-2">
                          {conversation.lastMessage?.content}
                        </p>
                        <div className="flex items-center justify-between">
                          <Badge variant={conversation.isRead ? "secondary" : "default"} className="text-xs">
                            {conversation.isRead ? "Read" : "Unread"}
                          </Badge>
                          <span className="text-xs text-gray-400">{conversation.messageCount} messages</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Conversation Detail */}
        <div className="flex-1 flex flex-col h-full">
          {!selectedConversationId ? (
            <Card className="flex-1 flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
                  <Search className="w-full h-full" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Select a conversation
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Choose a conversation from the list to start messaging
                </p>
              </div>
            </Card>
          ) : (
            <Card className="flex-1 flex flex-col h-full">
              {/* Conversation Header */}
              <CardHeader className="border-b flex-shrink-0">
                {conversationLoading ? (
                  <div>Loading conversation...</div>
                ) : selectedConversation ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <img src={selectedConversation.participantAvatarUrl} alt={selectedConversation.participantName} />
                      </Avatar>
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {selectedConversation.participantName}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          @{selectedConversation.participantUsername}
                        </p>
                      </div>
                    </div>
                    
                    {/* Controls */}
                    <div className="flex items-center space-x-3">
                      {/* Auto-reply Toggle */}
                      <div className="flex items-center space-x-2">
                        <Label htmlFor="auto-reply-desktop" className="text-sm font-medium">Auto-reply</Label>
                        <Switch
                          id="auto-reply-desktop"
                          checked={selectedConversation.autoReplyEnabled || false}
                          onCheckedChange={(checked) => {
                            toggleAutoReplyMutation.mutate({
                              conversationId: selectedConversation.id,
                              enabled: checked
                            });
                          }}
                        />
                      </div>
                      
                      {/* Demo Controls */}
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          Demo Mode
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleSimulateCustomerMessage}
                          disabled={simulateCustomerMutation.isPending}
                          className="text-xs"
                        >
                          <Zap className="w-3 h-3 mr-1" />
                          {simulateCustomerMutation.isPending ? 'Sending...' : 'Simulate Message'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleGenerateAIResponse}
                          disabled={generateAIResponseMutation.isPending}
                          className="text-xs bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700 hover:bg-green-100 dark:hover:bg-green-900/30"
                        >
                          <Bot className="w-3 h-3 mr-1" />
                          {generateAIResponseMutation.isPending ? 'Generating...' : 'Generate AI Response'}
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : null}
              </CardHeader>

              {/* Messages */}
              <CardContent className="flex-1 overflow-y-auto p-4 min-h-0 max-h-full">
                {conversationLoading ? (
                  <div>Loading messages...</div>
                ) : selectedConversation?.messages ? (
                  <div className="space-y-4">
                    {selectedConversation.messages.map((message: Message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.senderType === 'user' || message.senderType === 'ai' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className="max-w-xs lg:max-w-md">
                          {/* Message bubble */}
                          <div
                            className={`px-4 py-2 rounded-lg ${
                              message.senderType === 'user'
                                ? 'bg-blue-500 text-white'
                                : message.senderType === 'ai'
                                ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border-l-4 border-green-500'
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            
                            {/* Message metadata */}
                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center space-x-2">
                                <span className={`text-xs ${
                                  message.senderType === 'user' 
                                    ? 'text-blue-100' 
                                    : 'text-gray-500 dark:text-gray-400'
                                }`}>
                                  {formatTime(message.sentAt)}
                                </span>
                                
                                {/* Read status for user messages */}
                                {message.senderType === 'user' && (
                                  <div className="flex items-center">
                                    {message.isRead ? (
                                      <CheckCheck className="w-3 h-3 text-blue-100" />
                                    ) : (
                                      <Check className="w-3 h-3 text-blue-200" />
                                    )}
                                  </div>
                                )}
                              </div>
                              
                              {/* AI response indicators */}
                              {message.aiGenerated && (
                                <div className="flex items-center space-x-1">
                                  <Bot className="w-3 h-3 text-green-600 dark:text-green-400" />
                                  <Badge variant="outline" className="text-xs bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700">
                                    AI
                                  </Badge>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Tone indicator for AI messages */}
                          {message.aiGenerated && message.toneUsed && (
                            <div className="mt-1 flex justify-end">
                              <Badge variant="secondary" className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                                {message.toneUsed} tone
                              </Badge>
                            </div>
                          )}
                          
                          {/* Response status for AI messages */}
                          {message.aiGenerated && message.responseStatus && (
                            <div className="mt-1 flex justify-end">
                              <span className={`text-xs ${
                                message.responseStatus === 'sent' ? 'text-green-600 dark:text-green-400' :
                                message.responseStatus === 'pending' ? 'text-yellow-600 dark:text-yellow-400' :
                                'text-blue-600 dark:text-blue-400'
                              }`}>
                                {message.responseStatus === 'sent' ? 'Sent automatically' :
                                 message.responseStatus === 'pending' ? 'Sending...' :
                                 'Edited before sending'}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                ) : null}
              </CardContent>

              {/* Message Input */}
              <div className="border-t p-4 flex-shrink-0">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sendMessageMutation.isPending}
                    size="sm"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}