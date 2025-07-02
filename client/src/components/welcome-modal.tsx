import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Check, ArrowRight, Settings, MessageCircle, BarChart3, Instagram, Link, Loader2 } from 'lucide-react';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WelcomeModal({ isOpen, onClose }: WelcomeModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const handleInstagramConnect = async () => {
    setIsConnecting(true);
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsConnected(true);
    setIsConnecting(false);
  };

  const steps = [
    {
      title: "Welcome to DMCloser AI!",
      description: "Your subscription is now active. Let's get you set up for success.",
      content: (
        <div className="text-center py-4 sm:py-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
            <Check className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
          </div>
          <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base px-2">
            You're now ready to automate your Instagram DMs with AI that sounds just like you.
          </p>
        </div>
      )
    },
    {
      title: "Quick Setup Guide",
      description: "Follow these steps to get the most out of DMCloser AI",
      content: (
        <div className="space-y-3 sm:space-y-4">
          <Card className="p-3 sm:p-4 border-blue-200 bg-blue-50">
            <div className="flex items-start space-x-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs sm:text-sm font-semibold">1</span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-blue-900 mb-1 text-sm sm:text-base">Configure AI Settings</h4>
                <p className="text-blue-700 text-xs sm:text-sm">Set your brand voice and response preferences</p>
              </div>
              <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 flex-shrink-0" />
            </div>
          </Card>
          
          <Card className="p-3 sm:p-4 border-purple-200 bg-purple-50">
            <div className="flex items-start space-x-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs sm:text-sm font-semibold">2</span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-purple-900 mb-1 text-sm sm:text-base">Connect Instagram</h4>
                <p className="text-purple-700 text-xs sm:text-sm">Link your Instagram account to start automation</p>
              </div>
              <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500 flex-shrink-0" />
            </div>
          </Card>
          
          <Card className="p-3 sm:p-4 border-green-200 bg-green-50">
            <div className="flex items-start space-x-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs sm:text-sm font-semibold">3</span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-green-900 mb-1 text-sm sm:text-base">Monitor Performance</h4>
                <p className="text-green-700 text-xs sm:text-sm">Track your AI responses and engagement</p>
              </div>
              <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" />
            </div>
          </Card>
        </div>
      )
    },
    {
      title: "Connect Your Instagram",
      description: "Link your Instagram account to start automating DM responses",
      content: (
        <div className="space-y-4 sm:space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <Instagram className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </div>
            <h4 className="font-semibold text-lg sm:text-xl mb-2">Almost There!</h4>
            <p className="text-gray-600 text-sm sm:text-base px-2 mb-6">
              Connect your Instagram account to start receiving and responding to DMs automatically.
            </p>
          </div>

          {!isConnected ? (
            <div className="space-y-4">
              <Card className="p-4 border-blue-200 bg-blue-50">
                <div className="flex items-center space-x-3">
                  <Link className="w-5 h-5 text-blue-600" />
                  <div>
                    <h5 className="font-medium text-blue-900">Secure Connection</h5>
                    <p className="text-sm text-blue-700">Your data is encrypted and secure</p>
                  </div>
                </div>
              </Card>

              <Button 
                onClick={handleInstagramConnect}
                disabled={isConnecting}
                className="w-full h-12 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Instagram className="w-4 h-4 mr-2" />
                    Connect Instagram Account
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Card className="p-4 border-green-200 bg-green-50">
                <div className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-green-600" />
                  <div>
                    <h5 className="font-medium text-green-900">Connected Successfully!</h5>
                    <p className="text-sm text-green-700">@your_instagram_account</p>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      )
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handleSkip = () => {
    onClose();
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md max-w-[calc(100vw-2rem)] mx-4 max-h-[calc(100vh-2rem)] overflow-y-auto">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-lg sm:text-xl font-bold leading-tight">
            {steps[currentStep].title}
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            {steps[currentStep].description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-2 sm:py-4">
          {steps[currentStep].content}
        </div>
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex justify-center sm:justify-start space-x-1">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index === currentStep 
                    ? 'bg-blue-500' 
                    : index < currentStep 
                      ? 'bg-green-500' 
                      : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="flex space-x-2">
              {currentStep > 0 && (
                <Button variant="outline" onClick={handlePrevious} className="flex-1 sm:flex-none h-10 sm:h-9">
                  Previous
                </Button>
              )}
              {currentStep === steps.length - 1 ? (
                <Button variant="outline" onClick={handleSkip} className="flex-1 sm:flex-none h-10 sm:h-9">
                  Skip for Now
                </Button>
              ) : null}
            </div>
            <Button onClick={handleNext} className="flex-1 sm:flex-none h-10 sm:h-9">
              {currentStep < steps.length - 1 ? (
                <>
                  Next
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              ) : isConnected ? (
                'Complete Setup'
              ) : (
                'Go to Dashboard'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}