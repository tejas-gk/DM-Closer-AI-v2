import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  ArrowRight, 
  Bot, 
  Check,
  Clock, 
  Code,
  Crown, 
  Instagram, 
  Loader2,
  LogIn, 
  LogOut, 
  MessageCircle, 
  Server,
  Shield, 
  Star, 
  TrendingUp, 
  User, 
  UserPlus, 
  Zap 
} from "lucide-react";
import { getUser, logoutUser } from '../../lib/supabase/auth';
import logoImage from "@assets/image_1750404810112.png";

export default function Home() {
  // Check authentication state
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['user'],
    queryFn: getUser,
  });

  const features = [
    {
      icon: Bot,
      title: "AI-Powered Responses",
      description: "GPT-4 generates contextual replies that match your brand voice and tone perfectly."
    },
    {
      icon: Clock,
      title: "24/7 Automation",
      description: "Never miss a customer message. Respond instantly even when you're offline."
    },
    {
      icon: Shield,
      title: "Brand Protection",
      description: "Maintain your unique voice with customizable tone settings and response guidelines."
    }
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      business: "Boutique Fashion",
      quote: "DMCloser AI increased our response rate by 300% while keeping our personal touch.",
      rating: 5
    },
    {
      name: "Marcus Rodriguez",
      business: "Fitness Coaching",
      quote: "I can focus on training clients while AI handles initial inquiries perfectly.",
      rating: 5
    },
    {
      name: "Emily Park",
      business: "Digital Marketing",
      quote: "The tone customization is incredible - clients can't tell it's automated.",
      rating: 5
    }
  ];

  const stats = [
    { number: "2.5M+", label: "Messages Automated" },
    { number: "15k+", label: "Happy Businesses" },
    { number: "94%", label: "Customer Satisfaction" },
    { number: "24/7", label: "Support Coverage" }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <img 
                src={logoImage} 
                alt="DMCloser" 
                className="h-10 w-auto" 
              />
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <Link href="/dashboard">
                    <Button variant="outline" size="sm">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Dashboard
                    </Button>
                  </Link>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={async () => {
                      await logoutUser();
                      window.location.reload();
                    }}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost" size="sm">
                      Login
                    </Button>
                  </Link>
                  <Link href="/signup">
                    <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                      Start Free Trial
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-gray-50 to-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Automate Your Instagram DMs with{" "}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                AI That Sounds Like You
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Never miss a customer message again. DMCloser AI responds to Instagram DMs instantly 
              while preserving your unique brand voice and personality.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <Link href="/dashboard">
                  <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-8">
                    Go to Dashboard
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/signup">
                    <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-8">
                      Start Free Trial
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </Link>
                  <Link href="/membership">
                    <Button variant="outline" size="lg" className="text-lg px-8">
                      View Pricing
                    </Button>
                  </Link>
                </>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-4">
              7-day free trial • No credit card required • Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl font-bold text-gray-900 mb-2">{stat.number}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose DMCloser AI?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powered by GPT-4, our AI understands context and responds with your unique voice
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <Card key={index} className="p-8 text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-6">
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Problem/Solution Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Stop Losing Customers to Slow Response Times
              </h2>
              <div className="space-y-4 mb-8">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-600">73% of customers expect replies within 4 hours</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-600">Manual DM management takes 2-4 hours per day</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-600">Delayed responses lose 67% of potential sales</p>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                DMCloser AI Solves This Automatically
              </h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                  <p className="text-gray-600">Instant responses 24/7, even while you sleep</p>
                </div>
                <div className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                  <p className="text-gray-600">Maintains your authentic brand voice and tone</p>
                </div>
                <div className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                  <p className="text-gray-600">Increases conversion rates by up to 300%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Trusted by Thousands of Businesses
            </h2>
            <p className="text-xl text-gray-600">
              See how DMCloser AI is transforming Instagram customer engagement
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="p-6">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-6 italic">"{testimonial.quote}"</p>
                <div>
                  <p className="font-semibold text-gray-900">{testimonial.name}</p>
                  <p className="text-sm text-gray-500">{testimonial.business}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing/Trial Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Start Your Free Trial Today
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Try DMCloser AI risk-free for 7 days. No setup fees, no long-term contracts.
          </p>
          <Card className="p-8 bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">7-Day Free Trial</h3>
              <p className="text-gray-600">Full access to all features</p>
            </div>
            <div className="flex items-center justify-center space-x-4 mb-6">
              <Check className="w-5 h-5 text-green-500" />
              <span className="text-gray-700">Unlimited AI responses</span>
            </div>
            <div className="flex items-center justify-center space-x-4 mb-6">
              <Check className="w-5 h-5 text-green-500" />
              <span className="text-gray-700">Custom tone configuration</span>
            </div>
            <div className="flex items-center justify-center space-x-4 mb-8">
              <Check className="w-5 h-5 text-green-500" />
              <span className="text-gray-700">Analytics dashboard</span>
            </div>
            {!user && (
              <Link href="/signup">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-8">
                  Start Free Trial Now
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            )}
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Instagram className="w-4 h-4 text-white" />
                </div>
                <span className="text-xl font-bold">DMCloser AI</span>
              </div>
              <p className="text-gray-400 mb-4">
                Automate your Instagram DMs with AI that preserves your unique brand voice. 
                Never miss a customer message again.
              </p>
              <p className="text-sm text-gray-500">
                © {new Date().getFullYear()} DMCloser AI. All rights reserved.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/membership" className="hover:text-white">Pricing</Link></li>
                <li><Link href="/signup" className="hover:text-white">Free Trial</Link></li>
                <li><a href="#features" className="hover:text-white">Features</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="mailto:support@dmcloser.ai" className="hover:text-white">Contact</a></li>
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><Link href="/privacy-policy" className="hover:text-white">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
