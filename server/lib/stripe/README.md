# Stripe building blocks

## Checkout flow

The checkout flow relies on a list of price lookups (or subscription keys). Here is the usual flow:

1. `getActiveCustomerSubscriptions`: Get all subscriptions for an user.
2. `getSubscriptionPricesFromLookups`: Retrieve the list of subscription prices, given a list of subscription keys.
3. `createCheckoutSession` Send a price id and user information to subscribe.
4. `createPortalSession` Manage the user subscriptions.