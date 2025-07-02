# Analytics and Metrics Plan - DMCloser AI

**Created:** June 20, 2025  
**Version:** 1.0  
**Product:** DMCloser AI - Instagram DM Automation SaaS  
**Status:** Planning Document - Implementation Ready

---

## Executive Summary

This analytics plan defines comprehensive tracking for DMCloser AI, focusing on user engagement, feature adoption, AI quality metrics, and business conversion points. The plan aligns with the core user journeys: onboarding, conversation management, AI usage, and subscription lifecycle.

**Key Focus Areas:**
- User activation and onboarding success
- AI response quality and adoption
- Conversation management efficiency 
- Subscription conversion and retention
- Feature utilization and engagement

---

## 1. Key User Actions and Events to Track

### 1.1 Authentication & Onboarding Journey

**Core Events:**
- `user_signup` - New account creation
- `profile_setup_started` - Profile configuration initiated
- `profile_setup_completed` - Profile configuration finished
- `dashboard_first_view` - Initial dashboard access
- `welcome_modal_viewed` - Onboarding modal displayed
- `welcome_modal_completed` - Onboarding flow finished

**Properties to Track:**
- Registration source (direct, referral, campaign)
- Time to complete profile setup
- Profile completeness score
- Initial subscription tier selection

### 1.2 Conversation Management

**Core Events:**
- `conversation_list_viewed` - Conversation overview accessed
- `conversation_opened` - Individual conversation thread opened
- `message_read` - Message marked as read
- `manual_reply_sent` - User composed and sent manual response
- `conversation_searched` - Search functionality used
- `conversation_filtered` - Filter applied to conversation list

**Properties to Track:**
- Conversation thread depth
- Response time (time between customer message and user reply)
- Message content length
- Conversation resolution status
- Search query terms and results

### 1.3 AI Response System

**Core Events:**
- `ai_response_requested` - AI suggestion generated
- `ai_response_accepted` - AI suggestion used without modification
- `ai_response_edited` - AI suggestion modified before sending
- `ai_response_rejected` - AI suggestion dismissed
- `tone_settings_updated` - AI tone configuration changed
- `custom_instructions_added` - Custom AI instructions provided

**Properties to Track:**
- AI tone used (friendly, professional, casual)
- Response generation time
- Edit distance (how much AI response was modified)
- Custom instruction complexity
- AI response accuracy rating (if user provides feedback)

### 1.4 Settings & Configuration

**Core Events:**
- `settings_accessed` - Settings page opened
- `profile_updated` - User profile information changed
- `tone_preferences_saved` - AI tone settings updated
- `notification_preferences_updated` - Notification settings changed
- `account_settings_saved` - Account configuration updated

**Properties to Track:**
- Settings section accessed
- Changes made in session
- Configuration complexity score
- Time spent in settings

### 1.5 Usage Analytics & Dashboard

**Core Events:**
- `analytics_dashboard_viewed` - Analytics page accessed
- `usage_quota_checked` - Current usage viewed
- `export_data_requested` - Data export functionality used
- `performance_metrics_viewed` - Response time/quality metrics checked

**Properties to Track:**
- Time spent on analytics
- Metrics most frequently viewed
- Export format preferences
- Dashboard interaction patterns

### 1.6 Subscription & Billing

**Core Events:**
- `subscription_plans_viewed` - Pricing page accessed
- `upgrade_initiated` - Subscription upgrade started
- `payment_method_added` - Billing information provided
- `subscription_upgraded` - Plan change completed
- `billing_portal_accessed` - Stripe portal opened
- `subscription_cancelled` - Cancellation initiated
- `subscription_reactivated` - Cancelled subscription restored

**Properties to Track:**
- Plan type selected
- Upgrade/downgrade direction
- Payment method type
- Cancellation reason (if provided)
- Reactivation timing

---

## 2. Conversion Points and Funnels to Measure

### 2.1 New User Activation Funnel

**Funnel Steps:**
1. **Landing Page Visit** → `page_view` (landing)
2. **Sign Up Initiated** → `signup_started`
3. **Account Created** → `user_signup`
4. **Profile Setup Started** → `profile_setup_started`
5. **Profile Completed** → `profile_setup_completed`
6. **First Dashboard View** → `dashboard_first_view`
7. **First Conversation Opened** → `conversation_opened`
8. **First AI Response Used** → `ai_response_accepted`

**Key Conversion Metrics:**
- Signup conversion rate (landing → account creation)
- Onboarding completion rate (signup → profile completed)
- Time to first value (signup → first AI response used)
- Activation rate (signup → active usage within 7 days)

### 2.2 Trial to Subscription Conversion Funnel

**Funnel Steps:**
1. **Trial Started** → `trial_started`
2. **First AI Response** → `ai_response_accepted`
3. **Multiple Conversations Used** → `conversation_opened` (count > 5)
4. **Settings Configured** → `tone_preferences_saved`
5. **Pricing Page Viewed** → `subscription_plans_viewed`
6. **Upgrade Initiated** → `upgrade_initiated`
7. **Payment Completed** → `subscription_upgraded`

**Key Conversion Metrics:**
- Trial-to-paid conversion rate
- Average time to conversion
- Feature usage correlation with conversion
- Drop-off points in upgrade flow

### 2.3 Feature Adoption Funnel

**AI Feature Adoption:**
1. **AI Available** → User has active subscription
2. **AI Discovered** → `ai_response_requested` (first time)
3. **AI Used** → `ai_response_accepted` (first time)
4. **AI Configured** → `tone_settings_updated`
5. **AI Power User** → `ai_response_accepted` (>50 times)

**Advanced Feature Adoption:**
1. **Settings Accessed** → `settings_accessed`
2. **Customization Made** → `custom_instructions_added`
3. **Analytics Used** → `analytics_dashboard_viewed`
4. **Data Exported** → `export_data_requested`

---

## 3. Engagement, Retention, and Feature Usage Metrics

### 3.1 User Engagement Metrics

**Daily Active Users (DAU) Metrics:**
- Total DAU
- DAU by subscription tier
- DAU by user cohort (registration date)
- DAU by acquisition channel

**Session Metrics:**
- Average session duration
- Pages per session
- Bounce rate by page type
- Return visitor rate

**Feature Engagement:**
- Conversation management usage rate
- AI response adoption rate
- Settings configuration frequency
- Analytics dashboard engagement

### 3.2 Retention Metrics

**Cohort Analysis:**
- Day 1, 7, 30, 90 retention rates
- Retention by acquisition channel
- Retention by initial feature usage
- Retention correlation with AI adoption

**Subscription Retention:**
- Monthly recurring revenue (MRR) retention
- Gross revenue retention
- Net revenue retention
- Churn rate by subscription tier

**Behavioral Retention:**
- Feature stickiness (DAU/MAU by feature)
- Consecutive usage days
- Lapse and recovery patterns
- Re-engagement campaign effectiveness

### 3.3 Feature Usage Metrics

**Conversation Management:**
- Average conversations per user per day
- Response time distribution
- Manual vs AI response ratio
- Conversation resolution rate

**AI System Performance:**
- AI response acceptance rate
- AI response edit rate
- AI response generation success rate
- Custom instruction usage rate

**Configuration Usage:**
- Settings page visit frequency
- Configuration changes per session
- Advanced feature adoption rate
- Customization depth score

---

## 4. Tooling Recommendations

### 4.1 Primary Analytics Platform

**Recommended: PostHog (Open Source)**
- **Strengths:** Product analytics focus, feature flags, session recordings
- **Use Case:** Core product metrics, user behavior analysis, A/B testing
- **Implementation:** Self-hosted or cloud, strong React/Node.js integration

**Alternative: Mixpanel**
- **Strengths:** Event-based tracking, advanced cohort analysis, retention reports
- **Use Case:** Detailed user journey analysis, conversion funnel optimization
- **Considerations:** Higher cost, excellent for SaaS metrics

### 4.2 Business Intelligence

**Recommended: Metabase (Open Source)**
- **Use Case:** Internal dashboards, business reporting, SQL-based analysis
- **Integration:** Direct PostgreSQL connection for custom metrics
- **Strengths:** Self-hosted, customizable, cost-effective

**Alternative: Retool**
- **Use Case:** Internal admin tools, customer support dashboards
- **Strengths:** Rapid development, extensive integrations

### 4.3 Error Tracking and Performance

**Recommended: Sentry**
- **Use Case:** Error tracking, performance monitoring, release tracking
- **Integration:** React and Node.js error boundaries and middleware
- **Business Value:** Directly impacts user experience and retention

### 4.4 Specialized SaaS Metrics

**Customer Success Platform: ChurnZero or Pendo**
- **Use Case:** In-app guidance, churn prediction, customer health scoring
- **Implementation Priority:** Phase 2 (after core analytics established)

### 4.5 Implementation Architecture

**Event Collection:**
- Frontend: PostHog React SDK for user interactions
- Backend: PostHog Node.js SDK for server-side events
- Database: Direct SQL queries for business metrics

**Data Flow:**
1. User actions trigger events in React components
2. Server-side events capture business logic outcomes
3. Daily batch jobs aggregate usage and billing metrics
4. Real-time dashboards for operational monitoring

---

## 5. Assumptions and Open Questions

### 5.1 Technical Assumptions

**Data Collection:**
- GDPR compliance requirements for EU users understood
- Instagram API rate limits won't affect analytics collection
- Supabase can handle increased read load from analytics queries
- Real-time analytics updates not required for all metrics

**Integration Complexity:**
- PostHog implementation estimated at 1-2 weeks full-time
- Custom dashboard development estimated at 2-3 weeks
- Data warehouse setup (if needed) estimated at 1 week

### 5.2 Business Assumptions

**User Behavior:**
- Users will engage with analytics features for business optimization
- AI quality metrics correlate with subscription retention
- Advanced users provide more valuable feedback on AI performance
- Customer success team will use analytics for proactive support

**Growth Patterns:**
- Monthly cohort analysis provides sufficient retention insight
- Feature adoption patterns are consistent across user segments
- Subscription tier changes indicate successful value demonstration

### 5.3 Open Questions Requiring Resolution

**Product Strategy:**
1. What constitutes successful user activation beyond first AI usage?
2. Should analytics include competitor comparison features?
3. How granular should AI performance tracking be?
4. What customer success metrics should trigger automated interventions?

**Technical Implementation:**
1. What level of real-time analytics is required for user-facing features?
2. Should historical data be preserved for churned users?
3. What data retention policies apply to conversation content?
4. Are there specific compliance requirements for data tracking?

**Business Operations:**
1. Who will be responsible for monitoring and acting on analytics insights?
2. What threshold metrics should trigger customer success outreach?
3. How should analytics influence product roadmap prioritization?
4. What reporting cadence is needed for stakeholders?

### 5.4 Success Criteria for Analytics Implementation

**Phase 1 Success (Weeks 1-2):**
- Core event tracking implemented and validated
- Basic conversion funnels measuring accurately
- Real-time user activity monitoring operational

**Phase 2 Success (Weeks 3-4):**
- Cohort analysis and retention metrics available
- Feature usage correlation analysis functional
- Automated alerts for critical metric changes

**Phase 3 Success (Weeks 5-6):**
- Advanced segmentation and predictive analytics
- Customer health scoring operational
- Analytics-driven product optimization initiated

---

## Implementation Priority

### High Priority (Week 1)
- User signup and onboarding funnel tracking
- Core conversation management events
- Basic AI usage metrics
- Subscription conversion events

### Medium Priority (Weeks 2-3)
- Detailed feature usage analytics
- Retention cohort analysis
- Performance and error correlation
- Custom dashboard development

### Lower Priority (Weeks 4+)
- Predictive analytics and ML insights
- Advanced segmentation
- Customer success automation
- Competitive analysis features

---

**Document Status:** Ready for Implementation  
**Next Steps:** Technical architecture review and tool selection approval  
**Implementation Timeline:** 4-6 weeks for full analytics platform  
**Budget Consideration:** Open source tools minimize ongoing costs  

**Prepared by:** Senior Product Analyst  
**Review Required:** Technical feasibility and compliance requirements  
**Approval Needed:** Tool selection and implementation timeline