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
			created_at: new Date(event.created * 1000).toISOString(),
			payload: event as unknown as Record<string, unknown>,
		});

		if (eventInsertError) {
			return NextResponse.json(
				{ error: "Failed to persist Stripe event." },
				{ status: 500 },
			);
		}

		if (isSubscriptionEvent(event)) {
			await upsertSubscriptionFromStripe(event.data.object, supabase);
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
		.select("id")
		.eq("stripe_subscription_id", subscription.id)
		.maybeSingle();

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
		last_event_created: new Date().toISOString(),
	};

	if (existingSubscription) {
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
