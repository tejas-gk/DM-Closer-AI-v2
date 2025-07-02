import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailParams {
    from: string;
    to: string[];
    subject: string;
    html: string;
}

export async function sendEmail({ from, to, subject, html }: EmailParams) {
    const { data, error } = await resend.emails.send({
        from,
        to,
        subject,
        html,
    });
    if (error) {
        throw new Error(`Failed to send email: ${error.message}`);
    }
    if (!data) {
        throw new Error('No data returned from email service');
    }
    return data;
}

// Email templates
export function createQuotaWarningTemplate(userEmail: string, usagePercentage: number, quotaLimit: number, currentUsage: number) {
    const isNearLimit = usagePercentage >= 90;
    const warningLevel = usagePercentage >= 95 ? 'Critical' : usagePercentage >= 90 ? 'High' : 'Warning';
    const colorCode = usagePercentage >= 95 ? '#dc2626' : usagePercentage >= 90 ? '#ea580c' : '#d97706';
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Quota Warning - FitLife Coaching</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">FitLife Coaching</h1>
                <p style="color: #e2e8f0; margin: 8px 0 0 0; font-size: 16px;">AI Response Management</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 30px;">
                <div style="background: ${colorCode}; color: white; padding: 20px; border-radius: 8px; margin-bottom: 30px; text-align: center;">
                    <h2 style="margin: 0 0 10px 0; font-size: 24px; font-weight: 600;">${warningLevel} Usage Alert</h2>
                    <p style="margin: 0; font-size: 18px; opacity: 0.9;">You've used ${usagePercentage}% of your monthly quota</p>
                </div>
                
                <div style="background: #f8fafc; padding: 25px; border-radius: 8px; margin-bottom: 30px;">
                    <h3 style="margin: 0 0 20px 0; color: #374151; font-size: 18px;">Usage Details</h3>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                        <span style="color: #6b7280;">Current Usage:</span>
                        <strong style="color: #111827;">${currentUsage.toLocaleString()} responses</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                        <span style="color: #6b7280;">Monthly Limit:</span>
                        <strong style="color: #111827;">${quotaLimit.toLocaleString()} responses</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
                        <span style="color: #6b7280;">Remaining:</span>
                        <strong style="color: ${isNearLimit ? '#dc2626' : '#059669'};">${(quotaLimit - currentUsage).toLocaleString()} responses</strong>
                    </div>
                    
                    <!-- Progress bar -->
                    <div style="background: #e5e7eb; height: 8px; border-radius: 4px; overflow: hidden;">
                        <div style="background: ${colorCode}; height: 100%; width: ${usagePercentage}%; transition: width 0.3s ease;"></div>
                    </div>
                </div>
                
                ${isNearLimit ? `
                <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                    <h4 style="margin: 0 0 10px 0; color: #92400e; font-size: 16px;">⚠️ Action Required</h4>
                    <p style="margin: 0; color: #92400e; font-size: 14px;">You're approaching your monthly limit. Consider upgrading your plan to avoid service interruption.</p>
                </div>
                ` : ''}
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${process.env.APP_URL || 'http://localhost:5000'}/dashboard/settings" 
                       style="background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; transition: background-color 0.2s;">
                        Manage Subscription
                    </a>
                </div>
                
                <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
                    <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">This email was sent because you have quota warning notifications enabled.</p>
                    <p style="color: #6b7280; font-size: 14px; margin: 0;">You can manage your notification preferences in your <a href="${process.env.APP_URL || 'http://localhost:5000'}/dashboard/settings" style="color: #667eea;">account settings</a>.</p>
                </div>
            </div>
            
            <!-- Footer -->
            <div style="background: #f8fafc; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 12px; margin: 0;">© 2024 FitLife Coaching. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    `;
}

export function createWelcomeEmailTemplate(userEmail: string, firstName?: string, trialEndDate?: Date) {
    const displayName = firstName || userEmail.split('@')[0];
    const trialEndFormatted = trialEndDate ? trialEndDate.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    }) : '';
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to FitLife Coaching</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">Welcome to FitLife Coaching!</h1>
                <p style="color: #e2e8f0; margin: 8px 0 0 0; font-size: 16px;">AI-Powered Customer Engagement</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 30px;">
                <h2 style="color: #374151; margin: 0 0 20px 0; font-size: 24px;">Hi ${displayName}! 👋</h2>
                
                <p style="color: #4b5563; margin: 0 0 20px 0; font-size: 16px;">
                    We're excited to have you on board! FitLife Coaching's AI assistant is ready to help you engage with your customers more effectively.
                </p>
                
                ${trialEndDate ? `
                <div style="background: #ecfdf5; border: 1px solid #10b981; padding: 25px; border-radius: 8px; margin: 25px 0;">
                    <h3 style="color: #047857; margin: 0 0 15px 0; font-size: 18px;">🎉 Your 7-Day Free Trial Starts Now!</h3>
                    <p style="color: #047857; margin: 0 0 10px 0; font-size: 16px;">
                        Your trial period runs until <strong>${trialEndFormatted}</strong>
                    </p>
                    <p style="color: #047857; margin: 0; font-size: 14px;">
                        No payment required during your trial. You'll only be charged if you choose to continue after the trial ends.
                    </p>
                </div>
                ` : ''}
                
                <div style="background: #f0f9ff; border: 1px solid #0ea5e9; padding: 25px; border-radius: 8px; margin: 25px 0;">
                    <h3 style="color: #0c4a6e; margin: 0 0 15px 0; font-size: 18px;">🚀 Get Started</h3>
                    <ul style="color: #0c4a6e; margin: 0; padding-left: 20px;">
                        <li style="margin-bottom: 8px;">Set up your business profile in settings</li>
                        <li style="margin-bottom: 8px;">Configure AI response preferences</li>
                        <li style="margin-bottom: 8px;">Start engaging with your customers</li>
                    </ul>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${process.env.APP_URL || 'http://localhost:5000'}/dashboard" 
                       style="background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; margin-right: 15px;">
                        Go to Dashboard
                    </a>
                    <a href="${process.env.APP_URL || 'http://localhost:5000'}/dashboard/settings" 
                       style="background: transparent; color: #667eea; border: 2px solid #667eea; padding: 12px 26px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
                        Settings
                    </a>
                </div>
                
                <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
                    <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
                        Need help getting started? We're here to support you every step of the way.
                    </p>
                </div>
            </div>
            
            <!-- Footer -->
            <div style="background: #f8fafc; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 12px; margin: 0;">© 2024 FitLife Coaching. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    `;
}

export function createTrialEndingTemplate(userEmail: string, firstName: string, trialEndDate: Date) {
    const displayName = firstName || userEmail.split('@')[0];
    const trialEndFormatted = trialEndDate.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Trial Ends Soon - FitLife Coaching</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">Your Trial Ends Soon</h1>
                <p style="color: #e2e8f0; margin: 8px 0 0 0; font-size: 16px;">Continue Your FitLife Coaching Journey</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 30px;">
                <h2 style="color: #374151; margin: 0 0 20px 0; font-size: 24px;">Hi ${displayName}!</h2>
                
                <p style="color: #4b5563; margin: 0 0 20px 0; font-size: 16px;">
                    Your 7-day free trial with FitLife Coaching ends on <strong>${trialEndFormatted}</strong>.
                </p>
                
                <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 25px; border-radius: 8px; margin: 25px 0;">
                    <h3 style="color: #92400e; margin: 0 0 15px 0; font-size: 18px;">⏰ Action Required</h3>
                    <p style="color: #92400e; margin: 0; font-size: 16px;">
                        To continue using FitLife Coaching's AI assistant, please ensure your payment method is set up before your trial ends.
                    </p>
                </div>
                
                <div style="background: #f0f9ff; border: 1px solid #0ea5e9; padding: 25px; border-radius: 8px; margin: 25px 0;">
                    <h3 style="color: #0c4a6e; margin: 0 0 15px 0; font-size: 18px;">What happens next?</h3>
                    <ul style="color: #0c4a6e; margin: 0; padding-left: 20px;">
                        <li style="margin-bottom: 8px;">If you have a payment method on file, you'll be automatically charged</li>
                        <li style="margin-bottom: 8px;">If not, your subscription will be canceled and you can resubscribe anytime</li>
                        <li style="margin-bottom: 8px;">You can cancel before the trial ends to avoid any charges</li>
                    </ul>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${process.env.APP_URL || 'http://localhost:5000'}/dashboard/settings" 
                       style="background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; margin-right: 15px;">
                        Manage Subscription
                    </a>
                    <a href="${process.env.APP_URL || 'http://localhost:5000'}/dashboard" 
                       style="background: transparent; color: #667eea; border: 2px solid #667eea; padding: 12px 26px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
                        Go to Dashboard
                    </a>
                </div>
                
                <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
                    <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
                        Questions? We're here to help! Contact our support team anytime.
                    </p>
                </div>
            </div>
            
            <!-- Footer -->
            <div style="background: #f8fafc; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 12px; margin: 0;">© 2024 FitLife Coaching. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    `;
}

// Email sending functions
export async function sendQuotaWarningEmail(userEmail: string, usagePercentage: number, quotaLimit: number, currentUsage: number) {
    const subject = `Quota ${usagePercentage >= 95 ? 'Critical' : usagePercentage >= 90 ? 'High' : 'Warning'}: ${usagePercentage}% Used - FitLife Coaching`;
    const html = createQuotaWarningTemplate(userEmail, usagePercentage, quotaLimit, currentUsage);
    
    return sendEmail({
        from: 'FitLife Coaching <noreply@resend.dev>',
        to: [userEmail],
        subject,
        html
    });
}

export async function sendWelcomeEmail(params: { email: string; firstName?: string; trialEndDate?: Date }) {
    const subject = 'Welcome to FitLife Coaching - Your 7-Day Free Trial Starts Now!';
    const html = createWelcomeEmailTemplate(params.email, params.firstName, params.trialEndDate);
    
    return sendEmail({
        from: 'FitLife Coaching <noreply@resend.dev>',
        to: [params.email],
        subject,
        html
    });
}

export async function sendTrialEndingEmail(params: { email: string; firstName: string; trialEndDate: Date }) {
    const subject = 'Your FitLife Coaching Trial Ends Soon - Continue Your Journey!';
    const html = createTrialEndingTemplate(params.email, params.firstName, params.trialEndDate);
    
    return sendEmail({
        from: 'FitLife Coaching <noreply@resend.dev>',
        to: [params.email],
        subject,
        html
    });
}