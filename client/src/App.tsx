import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/components/error-boundary";
import { NavigationLoader } from "@/components/page-loading";
import Home from "@/pages/home";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import ProfileRedirect from "@/pages/profile-redirect";
import Membership from "@/pages/membership";
import MembershipNew from "@/pages/membership-new";
import Dashboard from "@/pages/dashboard";
import DashboardConversations from "@/pages/dashboard-conversations-enhanced";
import DashboardAISettings from "@/pages/dashboard-ai-settings";
import DashboardAnalytics from "@/pages/dashboard-analytics";
import DashboardSettings from "@/pages/dashboard-settings";
import InstagramTest from "@/pages/instagram-test";
import EmailTest from "@/pages/email-test";
import PrivacyPolicy from "@/pages/privacy-policy";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/profile" component={ProfileRedirect} />
      <Route path="/membership" component={MembershipNew} />
      <Route path="/membership-old" component={Membership} />

      <Route path="/dashboard" component={Dashboard} />
      <Route path="/dashboard/conversations" component={DashboardConversations} />
      <Route path="/dashboard/ai-settings" component={DashboardAISettings} />
      <Route path="/dashboard/analytics" component={DashboardAnalytics} />
      <Route path="/dashboard/settings" component={DashboardSettings} />
      <Route path="/instagram-test" component={InstagramTest} />
      <Route path="/email-test" component={EmailTest} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <NavigationLoader />
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
