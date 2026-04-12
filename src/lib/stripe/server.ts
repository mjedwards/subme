import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

let stripeInstance: Stripe | null = null;

export function getStripeServerClient() {
	if (!stripeSecretKey) {
		throw new Error("Missing STRIPE_SECRET_KEY");
	}

	if (!stripeInstance) {
		stripeInstance = new Stripe(stripeSecretKey);
	}

	return stripeInstance;
}

export function getStripeWebhookSecret() {
	if (!stripeWebhookSecret) {
		throw new Error("Missing STRIPE_WEBHOOK_SECRET");
	}

	return stripeWebhookSecret;
}
