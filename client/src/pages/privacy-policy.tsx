import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Shield, Lock, Eye, Database, Mail, Globe, Instagram, LogIn, LogOut, MessageCircle } from "lucide-react";
import { getUser, logoutUser } from '../../lib/supabase/auth';
import logoImage from "@assets/image_1750404810112.png";

export default function PrivacyPolicy() {
  // Check authentication state
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['user'],
    queryFn: getUser,
  });

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Link href="/">
                <img 
                  src={logoImage} 
                  alt="DMCloser" 
                  className="h-10 w-auto cursor-pointer" 
                />
              </Link>
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

      {/* Page Header */}
      <div className="bg-gray-50 border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
            <p className="text-lg text-gray-600 mb-2">Your privacy and data protection are our top priorities</p>
            <p className="text-sm text-gray-500">Last updated: {new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Introduction */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Our Commitment to Your Privacy</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">
                At DMCloser AI, we are committed to protecting your privacy and personal information. This Privacy Policy explains how we collect, use, store, and protect your information when you use our Instagram DM automation service. We comply with applicable data protection laws including GDPR, CCPA, and other relevant privacy regulations.
              </p>
            </CardContent>
          </Card>

          {/* Information We Collect */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="h-5 w-5" />
                <span>Information We Collect</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Account Information</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                  <li>Email address and password (encrypted)</li>
                  <li>First and last name</li>
                  <li>Profile information you choose to provide</li>
                  <li>Subscription and billing information</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Instagram Integration Data</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                  <li>Instagram account connection tokens (encrypted)</li>
                  <li>Instagram direct messages and conversations (when you enable automation)</li>
                  <li>Instagram profile information necessary for service functionality</li>
                  <li>Message metadata (timestamps, read status, participant information)</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Usage and Analytics Data</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                  <li>Service usage statistics (messages processed, AI responses generated)</li>
                  <li>Performance metrics (response times, conversation volumes)</li>
                  <li>Feature usage patterns and preferences</li>
                  <li>Technical logs for service improvement and debugging</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">AI Training Data</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                  <li>Conversation context for AI response generation (anonymized)</li>
                  <li>Tone and style preferences you configure</li>
                  <li>Response quality feedback and corrections</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* How We Use Your Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Eye className="h-5 w-5" />
                <span>How We Use Your Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Service Provision</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                    <li>Automate Instagram DM responses using AI technology</li>
                    <li>Maintain conversation context and threading</li>
                    <li>Generate responses that match your configured tone and style</li>
                    <li>Provide analytics and usage insights</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Account Management</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                    <li>Create and maintain your user account</li>
                    <li>Process subscription payments and billing</li>
                    <li>Provide customer support and troubleshooting</li>
                    <li>Send important service notifications and updates</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Service Improvement</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                    <li>Analyze usage patterns to improve AI response quality</li>
                    <li>Monitor system performance and reliability</li>
                    <li>Develop new features and capabilities</li>
                    <li>Ensure compliance with Instagram's policies and terms</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Sharing and Third Parties */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="h-5 w-5" />
                <span>Data Sharing and Third Parties</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-700">
                  We do not sell, rent, or trade your personal information. We only share your data in the following limited circumstances:
                </p>
                
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Essential Service Providers</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                    <li><strong>Supabase:</strong> Database hosting and user authentication (GDPR compliant)</li>
                    <li><strong>Stripe:</strong> Payment processing and subscription management</li>
                    <li><strong>OpenAI:</strong> AI response generation (data processed according to their privacy policy)</li>
                    <li><strong>Instagram/Meta:</strong> Direct message automation through official APIs</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Legal Requirements</h3>
                  <p className="text-gray-700 ml-4">
                    We may disclose your information if required by law, court order, or government request, or to protect our rights, property, or safety.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Lock className="h-5 w-5" />
                <span>Data Security</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-700">
                  We implement industry-standard security measures to protect your data:
                </p>
                
                <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                  <li>End-to-end encryption for all data transmission</li>
                  <li>Encrypted storage of sensitive information including passwords and API tokens</li>
                  <li>Regular security audits and vulnerability assessments</li>
                  <li>Access controls and authentication for all system components</li>
                  <li>Secure data centers with physical and digital security measures</li>
                  <li>Regular backups with encrypted storage</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Your Privacy Rights */}
          <Card>
            <CardHeader>
              <CardTitle>Your Privacy Rights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-700">
                  You have the following rights regarding your personal data:
                </p>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Access and Portability</h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                      <li>Request a copy of your data</li>
                      <li>Export your conversation history</li>
                      <li>View your account information</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Control and Deletion</h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                      <li>Update or correct your information</li>
                      <li>Delete your account and data</li>
                      <li>Opt out of data processing</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">Data Retention Settings</h3>
                  <p className="text-blue-800 text-sm">
                    You can configure your data retention preferences in your account settings. 
                    Choose how long to keep conversation data (30-365 days) and manage your privacy preferences.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cookies and Tracking */}
          <Card>
            <CardHeader>
              <CardTitle>Cookies and Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Essential Cookies</h3>
                  <p className="text-gray-700 ml-4">
                    We use essential cookies for authentication, session management, and core functionality. These cannot be disabled.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Analytics Cookies (Optional)</h3>
                  <p className="text-gray-700 ml-4">
                    We use analytics cookies to understand how you use our service and improve performance. 
                    You can opt out of analytics sharing in your privacy settings.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* International Data Transfers */}
          <Card>
            <CardHeader>
              <CardTitle>International Data Transfers</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">
                Your data may be processed in countries outside your residence. We ensure adequate protection through:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4 mt-2">
                <li>Standard Contractual Clauses (SCCs) with service providers</li>
                <li>Adequacy decisions where applicable</li>
                <li>Additional safeguards for data protection</li>
              </ul>
            </CardContent>
          </Card>

          {/* Children's Privacy */}
          <Card>
            <CardHeader>
              <CardTitle>Children's Privacy</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">
                Our service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. 
                If you believe we have collected information from a child under 13, please contact us immediately.
              </p>
            </CardContent>
          </Card>

          {/* Changes to Privacy Policy */}
          <Card>
            <CardHeader>
              <CardTitle>Changes to This Privacy Policy</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">
                We may update this Privacy Policy from time to time. We will notify you of any material changes by:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4 mt-2">
                <li>Sending an email notification to your registered email address</li>
                <li>Posting a notice in your account dashboard</li>
                <li>Updating the "Last updated" date at the top of this policy</li>
              </ul>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Mail className="h-5 w-5" />
                <span>Contact Us</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">
                If you have any questions about this Privacy Policy or our data practices, please contact us:
              </p>
              
              <div className="space-y-2 text-gray-700">
                <p><strong>Email:</strong> privacy@dmcloser.ai</p>
                <p><strong>Support:</strong> support@dmcloser.ai</p>
                <p><strong>Data Protection Officer:</strong> dpo@dmcloser.ai</p>
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  For GDPR-related requests, please include "GDPR Request" in your email subject line. 
                  We will respond to all privacy requests within 30 days as required by applicable law.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

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
                <li><Link href="/" className="hover:text-white">Features</Link></li>
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