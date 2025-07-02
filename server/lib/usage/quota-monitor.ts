import { sendQuotaWarningEmail } from '../resend/emails';

interface UserUsage {
    userId: string;
    currentUsage: number;
    quotaLimit: number;
    lastWarningAt?: Date;
    warningsSent: number[];
}

// In-memory storage for user usage (in production, this would be in a database)
const userUsageStore = new Map<string, UserUsage>();

// Warning thresholds
const WARNING_THRESHOLDS = [75, 85, 90, 95];

export function getUserUsage(userId: string): UserUsage {
    if (!userUsageStore.has(userId)) {
        userUsageStore.set(userId, {
            userId,
            currentUsage: 0,
            quotaLimit: 1000, // Default limit
            warningsSent: []
        });
    }
    return userUsageStore.get(userId)!;
}

export function updateUserUsage(userId: string, increment: number = 1): UserUsage {
    const usage = getUserUsage(userId);
    usage.currentUsage += increment;
    userUsageStore.set(userId, usage);
    return usage;
}

export function setUserQuota(userId: string, quotaLimit: number): void {
    const usage = getUserUsage(userId);
    usage.quotaLimit = quotaLimit;
    userUsageStore.set(userId, usage);
}

export function resetMonthlyUsage(userId: string): void {
    const usage = getUserUsage(userId);
    usage.currentUsage = 0;
    usage.warningsSent = [];
    delete usage.lastWarningAt;
    userUsageStore.set(userId, usage);
}

export function getUsagePercentage(userId: string): number {
    const usage = getUserUsage(userId);
    return Math.round((usage.currentUsage / usage.quotaLimit) * 100);
}

export async function checkAndSendQuotaWarnings(userId: string, userEmail: string, emailNotificationsEnabled: boolean): Promise<void> {
    if (!emailNotificationsEnabled) {
        return;
    }

    const usage = getUserUsage(userId);
    const usagePercentage = getUsagePercentage(userId);
    
    // Find the highest threshold that should trigger a warning
    const thresholdToSend = WARNING_THRESHOLDS
        .filter(threshold => usagePercentage >= threshold)
        .filter(threshold => !usage.warningsSent.includes(threshold))
        .pop();

    if (thresholdToSend) {
        try {
            console.log(`Sending quota warning email: ${usagePercentage}% usage for user ${userId}`);
            
            await sendQuotaWarningEmail(
                userEmail,
                usagePercentage,
                usage.quotaLimit,
                usage.currentUsage
            );

            // Record that we sent this warning
            usage.warningsSent.push(thresholdToSend);
            usage.lastWarningAt = new Date();
            userUsageStore.set(userId, usage);

            console.log(`Quota warning email sent successfully to ${userEmail}`);
        } catch (error) {
            console.error('Failed to send quota warning email:', error);
        }
    }
}

export function getAllUserUsage(): UserUsage[] {
    return Array.from(userUsageStore.values());
}

// Simulate some usage for demo purposes
export function simulateUsage(userId: string, targetPercentage: number): void {
    const usage = getUserUsage(userId);
    const targetUsage = Math.floor((targetPercentage / 100) * usage.quotaLimit);
    usage.currentUsage = targetUsage;
    userUsageStore.set(userId, usage);
}