import { createAdminClient } from "@/lib/supabase/admin";
import { getStripeServerClient, getStripeWebhookSecret } from "@/lib/stripe/server";
import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(request: NextRequest) {
	try {
		const signature = (await headers()).get("stripe-signature");

		if (!signature) {
			return NextResponse.json(
				{ error: "Missing Stripe signature." },
				{ status: 400 },
			);
		}

		const payload = await request.text();
		const stripe = getStripeServerClient();
		const event = stripe.webhooks.constructEvent(
			payload,
			signature,
			getStripeWebhookSecret(),
		);
		const supabase = createAdminClient();

		const { data: existingEvent } = await supabase
			.from("stripe_events")
			.select("id")
			.eq("event_id", event.id)
			.maybeSingle();

		if (existingEvent) {
			return NextResponse.json({ received: true });
		}

		const { error: eventInsertError } = await supabase.from("stripe_events").insert({
			id: randomUUID(),
			event_id: event.id,
			type: event.type,
			stripe_account_id: event.account ?? null,
			created_at: new Date(event.created * 1000).toISOString(),
			payload: event as unknown as Record<string, unknown>,
		});

		if (eventInsertError) {
			return NextResponse.json(
				{ error: "Failed to persist Stripe event." },
				{ status: 500 },
			);
		}

		if (isCheckoutCompletedEvent(event)) {
			await syncSubscriptionFromCheckoutSession(event.data.object, event, supabase);
		}

		if (isSubscriptionEvent(event)) {
			await upsertSubscriptionFromStripe(event.data.object, event, supabase);
		}

		return NextResponse.json({ received: true });
	} catch (error) {
		console.error("Stripe webhook error:", error);
		return NextResponse.json(
			{ error: "Webhook handling failed." },
			{ status: 400 },
		);
	}
}

function isCheckoutCompletedEvent(
	event: Stripe.Event,
): event is Stripe.Event & {
	data: {
		object: Stripe.Checkout.Session;
	};
} {
	return event.type === "checkout.session.completed";
}

function isSubscriptionEvent(
	event: Stripe.Event,
): event is Stripe.Event & {
	data: {
		object: Stripe.Subscription;
	};
} {
	return (
		event.type === "customer.subscription.created" ||
		event.type === "customer.subscription.updated" ||
		event.type === "customer.subscription.deleted"
	);
}

async function upsertSubscriptionFromStripe(
	subscription: Stripe.Subscription,
	event: Stripe.Event,
	supabase: ReturnType<typeof createAdminClient>,
) {
	const storeId = subscription.metadata.store_id;
	const planId = subscription.metadata.plan_id;
	const customerId = subscription.metadata.customer_id;

	if (!storeId || !planId || !customerId) {
		throw new Error("Stripe subscription metadata is incomplete.");
	}

	const periodStart = subscription.items.data[0]?.current_period_start
		? new Date(
				subscription.items.data[0].current_period_start * 1000,
			).toISOString()
		: null;
	const periodEnd = subscription.items.data[0]?.current_period_end
		? new Date(
				subscription.items.data[0].current_period_end * 1000,
			).toISOString()
		: null;

	const { data: existingSubscription } = await supabase
		.from("subscriptions")
		.select("id, last_event_created")
		.eq("stripe_subscription_id", subscription.id)
		.maybeSingle<{
			id: string;
			last_event_created: string | null;
		}>();

	const payload = {
		store_id: storeId,
		customer_id: customerId,
		plan_id: planId,
		provider: "stripe",
		stripe_customer_id:
			typeof subscription.customer === "string"
				? subscription.customer
				: subscription.customer.id,
		stripe_subscription_id: subscription.id,
		status: subscription.status,
		current_period_start: periodStart,
		current_period_end: periodEnd,
		cancel_at_period_end: subscription.cancel_at_period_end,
		last_event_created: new Date(event.created * 1000).toISOString(),
	};

	if (existingSubscription) {
		const existingEventTime = existingSubscription.last_event_created
			? new Date(existingSubscription.last_event_created).getTime()
			: 0;
		const nextEventTime = event.created * 1000;

		if (existingEventTime > nextEventTime) {
			return;
		}

		const { error } = await supabase
			.from("subscriptions")
			.update(payload)
			.eq("id", existingSubscription.id);

		if (error) {
			throw error;
		}

		return;
	}

	const { error } = await supabase.from("subscriptions").insert({
		id: randomUUID(),
		...payload,
	});

	if (error) {
		throw error;
	}
}

async function syncSubscriptionFromCheckoutSession(
	session: Stripe.Checkout.Session,
	event: Stripe.Event,
	supabase: ReturnType<typeof createAdminClient>,
) {
	if (session.mode !== "subscription" || !session.subscription) {
		return;
	}

	const subscriptionId =
		typeof session.subscription === "string"
			? session.subscription
			: session.subscription.id;

	const storeId = session.metadata?.store_id;
	const planId = session.metadata?.plan_id;
	const customerId = session.metadata?.customer_id;

	if (!storeId || !planId || !customerId) {
		throw new Error("Checkout session metadata is incomplete.");
	}

	const { data: existingSubscription } = await supabase
		.from("subscriptions")
		.select("id, last_event_created")
		.eq("stripe_subscription_id", subscriptionId)
		.maybeSingle<{
			id: string;
			last_event_created: string | null;
		}>();

	const payload = {
		store_id: storeId,
		customer_id: customerId,
		plan_id: planId,
		provider: "stripe",
		stripe_customer_id:
			typeof session.customer === "string"
				? session.customer
				: session.customer?.id ?? null,
		stripe_subscription_id: subscriptionId,
		status: session.payment_status === "paid" ? "active" : "incomplete",
		last_event_created: new Date(event.created * 1000).toISOString(),
	};

	if (existingSubscription) {
		const existingEventTime = existingSubscription.last_event_created
			? new Date(existingSubscription.last_event_created).getTime()
			: 0;
		const nextEventTime = event.created * 1000;

		if (existingEventTime > nextEventTime) {
			return;
		}

		const { error } = await supabase
			.from("subscriptions")
			.update(payload)
			.eq("id", existingSubscription.id);

		if (error) {
			throw error;
		}

		return;
	}

	const { error } = await supabase.from("subscriptions").insert({
		id: randomUUID(),
		...payload,
	});

	if (error) {
		throw error;
	}
}
