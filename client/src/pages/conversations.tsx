import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { getUser } from '../../lib/supabase/auth';
import { Search, MessageCircle, Clock, User, Send, ArrowLeft, Bot, CheckCheck, Check, Zap } from 'lucide-react';

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

export default function Conversations() {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get current user
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['user'],
    queryFn: getUser,
  });

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

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversationId) return;
    
    sendMessageMutation.mutate({
      conversationId: selectedConversationId,
      content: newMessage.trim(),
    });
  };

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    markAsReadMutation.mutate(conversationId);
  };

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

  if (userLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Skeleton className="h-8 w-48 mx-auto mb-4" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400">
              Please log in to access conversations.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const conversations = conversationsData?.conversations || [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Instagram Conversations
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your Instagram DM conversations in one place
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Conversations List */}
          <div className="lg:col-span-1">
            <Card className="h-full flex flex-col">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Conversations</CardTitle>
                  <Badge variant="secondary">
                    {conversations.length}
                  </Badge>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-0">
                {conversationsLoading ? (
                  <div className="space-y-4 p-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-3">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="flex-1">
                          <Skeleton className="h-4 w-24 mb-2" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="p-6 text-center">
                    <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">
                      No conversations found
                    </p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {conversations.map((conversation: Conversation) => (
                      <div
                        key={conversation.id}
                        className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                          selectedConversationId === conversation.id
                            ? 'bg-blue-50 dark:bg-blue-900/20 border-r-2 border-blue-500'
                            : ''
                        }`}
                        onClick={() => handleSelectConversation(conversation.id)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <img
                              src={conversation.participantAvatarUrl}
                              alt={conversation.participantName || conversation.participantUsername}
                              className="w-12 h-12 rounded-full"
                            />
                            {!conversation.isRead && (
                              <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-gray-900 dark:text-white truncate">
                                {conversation.participantName || conversation.participantUsername}
                              </p>
                              <span className="text-xs text-gray-500 flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {formatTime(conversation.lastMessageAt)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                              {conversation.lastMessage?.content || 'No messages yet'}
                            </p>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-xs text-gray-500">
                                @{conversation.participantUsername}
                              </span>
                              {conversation.messageCount > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  {conversation.messageCount}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Conversation Detail */}
          <div className="lg:col-span-2">
            {!selectedConversationId ? (
              <Card className="h-full flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Select a conversation
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Choose a conversation from the list to start messaging
                  </p>
                </div>
              </Card>
            ) : (
              <Card className="h-full flex flex-col">
                {/* Conversation Header */}
                <CardHeader className="border-b">
                  {conversationLoading ? (
                    <div className="flex items-center space-x-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div>
                        <Skeleton className="h-4 w-24 mb-2" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                  ) : selectedConversation ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="lg:hidden"
                          onClick={() => setSelectedConversationId(null)}
                        >
                          <ArrowLeft className="w-4 h-4" />
                        </Button>
                        <img
                          src={selectedConversation.participantAvatarUrl}
                          alt={selectedConversation.participantName}
                          className="w-10 h-10 rounded-full"
                        />
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {selectedConversation.participantName || selectedConversation.participantUsername}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            @{selectedConversation.participantUsername}
                          </p>
                        </div>
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
                      </div>
                    </div>
                  ) : null}
                </CardHeader>

                {/* Messages */}
                <CardContent className="flex-1 overflow-y-auto p-4">
                  {conversationLoading ? (
                    <div className="space-y-4">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                          <Skeleton className={`h-12 ${i % 2 === 0 ? 'w-64' : 'w-48'} rounded-lg`} />
                        </div>
                      ))}
                    </div>
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
                <div className="border-t p-4">
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
      </div>
    </div>
  );
}