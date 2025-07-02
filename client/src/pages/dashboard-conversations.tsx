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
import { Textarea } from "@/components/ui/textarea";
import { 
  Search, 
  Filter, 
  Bot, 
  User,
  Send,
  Edit,
  Check,
  CheckCheck,
  Clock,
  MessageSquare,
  ArrowLeft,
  MoreVertical,
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
  aiGenerated: boolean;
  toneUsed?: string;
  responseStatus: 'pending' | 'sent' | 'edited';
}

interface Conversation {
  id: string;
  participantUsername: string;
  participantName: string;
  participantAvatarUrl: string;
  lastMessageAt: string;
  isRead: boolean;
  autoReplyEnabled: boolean;
  participantFirstName?: string;
  messageCount: number;
  lastMessage?: {
    content: string;
    sentAt: string;
    senderType: string;
    aiGenerated: boolean;
  };
}

interface ConversationWithMessages extends Conversation {
  messages: Message[];
}

export default function DashboardConversations() {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get current user (assuming auth context)
  const user = { id: 'demo-user' };

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

  // AI Response Generation
  const generateAIResponseMutation = useMutation({
    mutationFn: async (conversationId: string) => {
      const response = await apiRequest('POST', `/api/conversations/${conversationId}/generate-ai-response`, {
        userId: user.id
      });
      return response.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations', selectedConversationId] });
      toast({
        title: "AI response generated",
        description: `Generated using ${data.toneUsed} tone`
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to generate AI response",
        description: error.message || "Please try again",
        variant: "destructive"
      });
    }
  });

  const handleGenerateAIResponse = async () => {
    if (selectedConversationId) {
      setIsGeneratingAI(true);
      try {
        await generateAIResponseMutation.mutateAsync(selectedConversationId);
      } finally {
        setIsGeneratingAI(false);
      }
    }
  };

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

  // Mobile Layout
  if (isMobile) {
    return (
      <DashboardLayout>
        <div className="h-[calc(100vh-4rem)] flex flex-col">
          {!showMobileChat ? (
            // Mobile Conversation List
            <div className="flex-1 flex flex-col">
              <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-4">
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Messages</h1>
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
              </div>
              <div className="flex-1 overflow-y-auto">
                {filteredConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => handleConversationSelect(conversation.id)}
                    className="p-4 cursor-pointer border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors active:bg-gray-100 dark:active:bg-gray-700"
                    data-testid="conversation-item"
                  >
                    <div className="flex items-start space-x-3">
                      <Avatar className="h-12 w-12 flex-shrink-0">
                        <AvatarImage src={conversation.participantAvatarUrl} />
                        <AvatarFallback className="text-sm font-medium">
                          {conversation.participantName.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-base font-medium text-gray-900 dark:text-white truncate">
                            {conversation.participantName}
                          </p>
                          <div className="flex items-center space-x-2 flex-shrink-0">
                            {conversation.lastMessage?.aiGenerated && (
                              <Bot className="h-4 w-4 text-green-500" />
                            )}
                            <span className="text-sm text-gray-500">
                              {formatTime(conversation.lastMessageAt)}
                            </span>
                          </div>
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
            </div>
          ) : (
            // Mobile Chat Interface
            <div className="flex-1 flex flex-col" data-testid="mobile-message-thread">
              {selectedConversation && (
                <>
                  {/* Mobile Chat Header */}
                  <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-4">
                    <div className="flex items-center space-x-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleBackToList}
                        className="p-1 h-8 w-8"
                      >
                        <ArrowLeft className="h-5 w-5" />
                      </Button>
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={selectedConversation.participantAvatarUrl} />
                        <AvatarFallback>
                          {selectedConversation.participantName.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">
                          {selectedConversation.participantName}
                        </h3>
                        <p className="text-sm text-gray-500 truncate">@{selectedConversation.participantUsername}</p>
                      </div>
                      <Button variant="ghost" size="sm" className="p-1 h-8 w-8">
                        <MoreVertical className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>

                  {/* Mobile Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
                    {selectedConversation.messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.senderType === 'customer' ? 'justify-start' : 'justify-end'}`}
                      >
                        <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                          message.senderType === 'customer'
                            ? 'bg-white dark:bg-gray-800 shadow-sm'
                            : message.aiGenerated
                            ? 'bg-green-500 text-white shadow-sm'
                            : 'bg-blue-500 text-white shadow-sm'
                        }`}>
                          <div className="flex items-start justify-between mb-1">
                            <div className="flex items-center space-x-1">
                              {message.senderType === 'customer' ? (
                                <User className="h-3 w-3 text-gray-500" />
                              ) : message.aiGenerated ? (
                                <Bot className="h-3 w-3 text-white" />
                              ) : (
                                <User className="h-3 w-3 text-white" />
                              )}
                              {message.aiGenerated && message.toneUsed && (
                                <Badge variant="secondary" className="text-xs ml-1">
                                  {message.toneUsed}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center space-x-1 ml-2">
                              {message.responseStatus === 'sent' && <Check className="h-3 w-3 text-green-300" />}
                              {message.responseStatus === 'pending' && <Clock className="h-3 w-3 text-yellow-300" />}
                              {message.responseStatus === 'edited' && <Edit className="h-3 w-3 text-blue-300" />}
                            </div>
                          </div>
                          <p className="text-sm leading-relaxed">{message.content}</p>
                          <p className={`text-xs mt-2 ${
                            message.senderType === 'customer' 
                              ? 'text-gray-500' 
                              : 'text-white/70'
                          }`}>
                            {formatTime(message.sentAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Mobile Message Input */}
                  <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-4 space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleGenerateAIResponse}
                        disabled={isGeneratingAI}
                        className="flex-1 min-w-fit"
                      >
                        <Bot className="h-4 w-4 mr-2" />
                        {isGeneratingAI ? "Generating..." : "AI Response"}
                      </Button>
                    </div>
                    <div className="flex space-x-2 items-end">
                      <Textarea
                        placeholder="Type your message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="flex-1 min-h-[44px] max-h-[120px] resize-none rounded-2xl"
                        rows={1}
                      />
                      <Button size="sm" className="h-11 w-11 rounded-full p-0">
                        <Send className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </DashboardLayout>
    );
  }

  // Desktop Layout
  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-8rem)] flex gap-6">
        {/* Conversations List */}
        <div className="w-1/3 flex flex-col">
          <Card className="flex-1">
            <CardHeader className="pb-3">
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
            <CardContent className="p-0">
              <div className="space-y-1">
                {filteredConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => handleConversationSelect(conversation.id)}
                    className={`p-4 cursor-pointer border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                      selectedConversationId === conversation.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={conversation.participantAvatarUrl} />
                        <AvatarFallback>
                          {conversation.participantName.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {conversation.participantName}
                          </p>
                          <div className="flex items-center space-x-1">
                            {conversation.lastMessage?.aiGenerated && (
                              <Bot className="h-3 w-3 text-green-500" />
                            )}
                            <span className="text-xs text-gray-500">
                              {formatTime(conversation.lastMessageAt)}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500">@{conversation.participantUsername}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate mt-1">
                          {conversation.lastMessage?.content}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center space-x-1">
                            <Badge variant={conversation.isRead ? "secondary" : "default"} className="text-xs">
                              {conversation.isRead ? "Read" : "Unread"}
                            </Badge>
                            <Badge variant={conversation.autoReplyEnabled ? "default" : "outline"} className="text-xs">
                              {conversation.autoReplyEnabled ? "Auto-reply On" : "Auto-reply Off"}
                            </Badge>
                          </div>
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

        {/* Chat Interface */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <Card className="flex-1 flex flex-col">
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={selectedConversation.participantAvatarUrl} />
                      <AvatarFallback>
                        {selectedConversation.participantName.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-lg font-medium">{selectedConversation.participantName}</h3>
                      <p className="text-sm text-gray-500">@{selectedConversation.participantUsername}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
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
                    <Button variant="ghost" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {/* Messages */}
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                {selectedConversation.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.senderType === 'customer' ? 'justify-start' : 'justify-end'}`}
                  >
                    <div className={`max-w-[70%] rounded-lg p-3 ${
                      message.senderType === 'customer'
                        ? 'bg-gray-100 dark:bg-gray-700'
                        : message.aiGenerated
                        ? 'bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                        : 'bg-blue-100 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                    }`}>
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex items-center space-x-1">
                          {message.senderType === 'customer' ? (
                            <User className="h-3 w-3 text-gray-500" />
                          ) : message.aiGenerated ? (
                            <Bot className="h-3 w-3 text-green-500" />
                          ) : (
                            <User className="h-3 w-3 text-blue-500" />
                          )}
                          {message.aiGenerated && message.toneUsed && (
                            <Badge variant="outline" className="text-xs">
                              {message.toneUsed}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-1">
                          {message.responseStatus === 'sent' && <Check className="h-3 w-3 text-green-500" />}
                          {message.responseStatus === 'pending' && <Clock className="h-3 w-3 text-yellow-500" />}
                          {message.responseStatus === 'edited' && <Edit className="h-3 w-3 text-blue-500" />}
                        </div>
                      </div>
                      <p className="text-sm">{message.content}</p>
                      <p className="text-xs text-gray-500 mt-1">{formatTime(message.sentAt)}</p>
                    </div>
                  </div>
                ))}
              </CardContent>

              {/* Message Input */}
              <div className="border-t p-4 space-y-3">
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleGenerateAIResponse}
                    disabled={isGeneratingAI}
                  >
                    <Bot className="h-4 w-4 mr-1" />
                    {isGeneratingAI ? "Generating..." : "Generate AI Response"}
                  </Button>
                </div>
                <div className="flex space-x-2">
                  <Textarea
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1 min-h-[60px]"
                  />
                  <Button size="sm" className="mt-auto">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Select a conversation</h3>
                <p className="text-gray-500">Choose a conversation from the list to start messaging</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}