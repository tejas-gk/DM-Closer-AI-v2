import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Bot, 
  Sparkles, 
  MessageCircle,
  Save,
  Wand2,
  AlertCircle,
  Settings2
} from "lucide-react";

interface ToneSettings {
  type: 'friendly' | 'professional' | 'casual' | 'girlfriend_experience';
  customInstructions: string;
}

interface BusinessProfile {
  type: 'fitlife_coaching' | 'onlyfans_model' | 'product_sales';
}

interface TonePreview {
  scenario: string;
  message: string;
  response: string;
}

const TONE_OPTIONS = [
  {
    value: 'friendly',
    label: 'Friendly',
    description: 'Warm, enthusiastic, and personable responses',
    color: 'bg-green-100 text-green-800 border-green-300',
    preview: {
      scenario: 'Customer asks about pricing',
      message: 'Hi! What are your rates for personal training?',
      response: 'Great to hear from you! I offer several training packages to fit different goals and budgets. I\'d love to chat about what you\'re looking for and find the perfect fit for you!'
    }
  },
  {
    value: 'professional',
    label: 'Professional',
    description: 'Polished, knowledgeable, and respectful tone',
    color: 'bg-blue-100 text-blue-800 border-blue-300',
    preview: {
      scenario: 'Customer asks about pricing',
      message: 'Hi! What are your rates for personal training?',
      response: 'Thank you for your interest in my personal training services. I offer customized packages based on individual goals and needs. I\'d be happy to discuss the options that would work best for you.'
    }
  },
  {
    value: 'casual',
    label: 'Casual',
    description: 'Relaxed, approachable, and authentic responses',
    color: 'bg-purple-100 text-purple-800 border-purple-300',
    preview: {
      scenario: 'Customer asks about pricing',
      message: 'Hi! What are your rates for personal training?',
      response: 'Hey there! I have a few different training options depending on what you\'re looking for. Want to hop on a quick call to chat about your goals and see what might work best?'
    }
  },
  {
    value: 'girlfriend_experience',
    label: 'Girlfriend Experience',
    description: 'Gentle, affectionate, and emotionally engaging responses',
    color: 'bg-pink-100 text-pink-800 border-pink-300',
    preview: {
      scenario: 'Customer asks about content',
      message: 'Hi! I\'m interested in your content.',
      response: 'Hey beautiful! I\'ve been thinking about you. I\'d love to create something special just for you. What kind of experience are you looking for, babe?'
    }
  }
];

const BUSINESS_PROFILE_OPTIONS = [
  {
    value: 'fitlife_coaching',
    label: 'Fitlife Coaching',
    description: 'Personal training, nutrition guidance, and wellness coaching',
    icon: '💪',
    defaultTone: 'friendly'
  },
  {
    value: 'onlyfans_model',
    label: 'OnlyFans Model',
    description: 'Content creation with personalized, intimate interactions',
    icon: '💋',
    defaultTone: 'girlfriend_experience'
  },
  {
    value: 'product_sales',
    label: 'Product Sales',
    description: 'E-commerce, print-on-demand, and direct sales',
    icon: '🛍️',
    defaultTone: 'professional'
  }
];

export default function DashboardAISettings() {
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [customPreview, setCustomPreview] = useState<string>('');
  const [localToneSelection, setLocalToneSelection] = useState<'friendly' | 'professional' | 'casual' | 'girlfriend_experience'>('friendly');
  const [localBusinessProfile, setLocalBusinessProfile] = useState<'fitlife_coaching' | 'onlyfans_model' | 'product_sales'>('fitlife_coaching');
  const [customInstructionsDraft, setCustomInstructionsDraft] = useState<string>('');
  const [hasUnsavedToneChange, setHasUnsavedToneChange] = useState(false);
  const [hasUnsavedProfileChange, setHasUnsavedProfileChange] = useState(false);
  const [hasUnsavedInstructions, setHasUnsavedInstructions] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery<ToneSettings & { businessProfile?: 'fitlife_coaching' | 'onlyfans_model' | 'product_sales' }>({
    queryKey: ['/api/ai-settings', 'demo_user'],
    queryFn: () => apiRequest('GET', '/api/ai-settings?userId=demo_user'),
    initialData: {
      type: 'friendly',
      customInstructions: '',
      businessProfile: 'fitlife_coaching'
    }
  });

  // Sync local state with loaded settings
  useEffect(() => {
    if (settings) {
      setLocalToneSelection(settings.type);
      setLocalBusinessProfile(settings.businessProfile || 'fitlife_coaching');
      setCustomInstructionsDraft(settings.customInstructions);
      setHasUnsavedToneChange(false);
      setHasUnsavedProfileChange(false);
      setHasUnsavedInstructions(false);
    }
  }, [settings]);

  // Auto-set tone when business profile changes
  const handleBusinessProfileChange = (profile: 'fitlife_coaching' | 'onlyfans_model' | 'product_sales') => {
    setLocalBusinessProfile(profile);
    setHasUnsavedProfileChange(true);
    
    // Auto-select recommended tone for the business profile
    const recommendedProfile = BUSINESS_PROFILE_OPTIONS.find(p => p.value === profile);
    if (recommendedProfile && recommendedProfile.defaultTone !== localToneSelection) {
      setLocalToneSelection(recommendedProfile.defaultTone as any);
      setHasUnsavedToneChange(true);
    }
  };

  const saveSettingsMutation = useMutation({
    mutationFn: async (newSettings: ToneSettings & { businessProfile?: 'fitlife_coaching' | 'onlyfans_model' | 'product_sales' }) => {
      return apiRequest('PUT', '/api/ai-settings?userId=demo_user', newSettings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai-settings', 'demo_user'] });
      setHasUnsavedToneChange(false);
      setHasUnsavedProfileChange(false);
      setHasUnsavedInstructions(false);
      toast({
        title: "Settings saved",
        description: "Your AI settings have been updated successfully."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error saving settings",
        description: error.message || "Failed to update settings",
        variant: "destructive"
      });
    }
  });

  const generatePreviewMutation = useMutation({
    mutationFn: async (data: { message: string; tone: string; customInstructions: string }) => {
      return apiRequest('POST', '/api/ai/preview-response', data);
    },
    onSuccess: (data: any) => {
      setCustomPreview(data.response);
    },
    onError: (error: any) => {
      toast({
        title: "Preview generation failed",
        description: error.message || "Unable to generate preview response",
        variant: "destructive"
      });
    }
  });

  const handleToneChange = (newTone: 'friendly' | 'professional' | 'casual' | 'girlfriend_experience') => {
    setLocalToneSelection(newTone);
    setHasUnsavedToneChange(settings?.type !== newTone);
  };

  const handleCustomInstructionsChange = (instructions: string) => {
    setCustomInstructionsDraft(instructions);
    setHasUnsavedInstructions(settings?.customInstructions !== instructions);
  };

  const handleSaveSettings = () => {
    if (!settings) return;
    
    const newSettings = {
      type: localToneSelection,
      businessProfile: localBusinessProfile,
      customInstructions: customInstructionsDraft
    };
    
    saveSettingsMutation.mutate(newSettings);
  };

  const handleRevertChanges = () => {
    if (settings) {
      setLocalToneSelection(settings.type);
      setLocalBusinessProfile(settings.businessProfile || 'fitlife_coaching');
      setCustomInstructionsDraft(settings.customInstructions);
      setHasUnsavedToneChange(false);
      setHasUnsavedProfileChange(false);
      setHasUnsavedInstructions(false);
    }
  };

  const hasAnyUnsavedChanges = hasUnsavedToneChange || hasUnsavedProfileChange || hasUnsavedInstructions;

  const handleGeneratePreview = async () => {
    if (!settings) return;
    
    setIsGeneratingPreview(true);
    await generatePreviewMutation.mutateAsync({
      message: "Hi! I'm interested in your fitness coaching services. What packages do you offer and what are your rates?",
      tone: localToneSelection,
      customInstructions: customInstructionsDraft
    });
    setIsGeneratingPreview(false);
  };

  const selectedTone = TONE_OPTIONS.find(option => option.value === localToneSelection);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6 p-2 sm:p-0">
        {/* Header */}
        <div className="px-1">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">AI Settings</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
            Configure your AI assistant's business profile and response style
          </p>
        </div>

        {/* Business Profile Selection */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
              <Settings2 className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>Business Profile</span>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Choose your business type to automatically optimize AI responses
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {BUSINESS_PROFILE_OPTIONS.map((profile) => (
                <div
                  key={profile.value}
                  onClick={() => handleBusinessProfileChange(profile.value as any)}
                  className={`p-3 sm:p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                    localBusinessProfile === profile.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl mb-2">{profile.icon}</div>
                    <h3 className="font-semibold mb-1 text-sm sm:text-base">{profile.label}</h3>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-tight">{profile.description}</p>
                    {localBusinessProfile === profile.value && (
                      <Badge className="mt-2 text-xs">Selected</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {hasUnsavedProfileChange && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <span className="text-xs sm:text-sm text-amber-700 dark:text-amber-400 leading-tight">
                    Business profile changed - recommended tone has been auto-selected
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Save/Revert Bar */}
        {hasAnyUnsavedChanges && (
          <Card className="border-orange-200 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-800">
            <CardContent className="pt-4">
              <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400 flex-shrink-0" />
                  <span className="text-sm font-medium text-orange-800 dark:text-orange-200">
                    You have unsaved changes
                  </span>
                </div>
                <div className="flex space-x-2 w-full sm:w-auto">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleRevertChanges}
                    disabled={saveSettingsMutation.isPending}
                    className="flex-1 sm:flex-none"
                  >
                    Revert
                  </Button>
                  <Button 
                    size="sm"
                    onClick={handleSaveSettings}
                    disabled={saveSettingsMutation.isPending}
                    className="flex-1 sm:flex-none"
                  >
                    {saveSettingsMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        <span className="hidden sm:inline">Saving...</span>
                        <span className="sm:hidden">Save</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">Save Changes</span>
                        <span className="sm:hidden">Save</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tone Selection */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
              <Bot className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>Response Tone</span>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Choose how your AI assistant should communicate with customers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <RadioGroup 
              value={localToneSelection} 
              onValueChange={handleToneChange}
              className="grid grid-cols-1 gap-3 sm:gap-4"
            >
              {TONE_OPTIONS.map((option) => (
                <div key={option.value} className="relative">
                  <RadioGroupItem 
                    value={option.value} 
                    id={option.value}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={option.value}
                    className={`flex flex-col space-y-3 rounded-lg border-2 p-3 sm:p-4 cursor-pointer transition-all peer-checked:border-blue-500 peer-checked:bg-blue-50 dark:peer-checked:bg-blue-900/20 hover:bg-gray-50 dark:hover:bg-gray-800/50`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 space-y-1 sm:space-y-0">
                          <span className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">
                            {option.label}
                          </span>
                          {localToneSelection === option.value && (
                            <Badge 
                              variant={hasUnsavedToneChange && settings?.type !== option.value ? "secondary" : "default"} 
                              className="text-xs w-fit"
                            >
                              {hasUnsavedToneChange && settings?.type !== option.value ? "Selected" : "Current"}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 leading-tight">
                          {option.description}
                        </p>
                      </div>
                    </div>

                    {/* Preview */}
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-xs sm:text-sm">
                      <div className="mb-2">
                        <span className="font-medium text-gray-700 dark:text-gray-300">Preview:</span>
                        <span className="text-gray-500 dark:text-gray-400 ml-1 sm:ml-2">{option.preview.scenario}</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex flex-col sm:flex-row">
                          <span className="text-gray-600 dark:text-gray-400 font-medium mb-1 sm:mb-0 sm:min-w-0 sm:mr-2">Customer:</span>
                          <span className="text-gray-700 dark:text-gray-300 leading-tight">{option.preview.message}</span>
                        </div>
                        <div className="flex flex-col sm:flex-row">
                          <span className="text-blue-600 dark:text-blue-400 font-medium mb-1 sm:mb-0 sm:min-w-0 sm:mr-2">AI Response:</span>
                          <span className="text-gray-700 dark:text-gray-300 leading-tight">{option.preview.response}</span>
                        </div>
                      </div>
                    </div>
                  </Label>
                </div>
              ))}
            </RadioGroup>

            {/* Custom Instructions */}
            <div className="space-y-3">
              <Label htmlFor="custom-instructions" className="text-sm font-medium">
                Custom Instructions (Optional)
              </Label>
              <Textarea
                id="custom-instructions"
                placeholder="Add specific instructions for your AI assistant..."
                value={customInstructionsDraft}
                onChange={(e) => handleCustomInstructionsChange(e.target.value)}
                className="min-h-[80px] sm:min-h-[100px] resize-none text-sm"
              />
              <p className="text-xs text-gray-500 leading-tight">
                These instructions will be included with every AI response to ensure consistency with your brand voice.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}