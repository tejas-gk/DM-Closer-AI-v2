import { stripe } from './config';

export interface CreatePortalSessionParams {
    customerId: string;
    returnUrl: string;
}

export async function createPortalSession({
    customerId,
    returnUrl,
}: CreatePortalSessionParams): Promise<string> {
    const portalSession = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
    });
    return portalSession.url;
}