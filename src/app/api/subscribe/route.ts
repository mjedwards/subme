import { randomUUID } from "crypto";

import { getStripeServerClient } from "@/lib/stripe/server";
import { createRouteHandlerSupabaseClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["active", "trialing"]);
const BILLING_PERIOD_DAYS = 30;

type SubscribeRequest = {
	storeSlug?: string;
	planId?: string;
};

export async function POST(request: NextRequest) {
	try {
		const body = (await request.json()) as SubscribeRequest;
		const storeSlug = body.storeSlug?.trim() ?? "";
		const planId = body.planId?.trim() ?? "";

		if (!storeSlug || !planId) {
			return NextResponse.json(
				{ error: "storeSlug and planId are required." },
				{ status: 400 },
			);
		}

		const supabase = await createRouteHandlerSupabaseClient();
		const { data: authData, error: authError } = await supabase.auth.getUser();
		const user = authData.user;

		if (authError || !user) {
			return NextResponse.json({ error: "Authentication required." }, { status: 401 });
		}

		const { data: store } = await supabase
			.from("stores")
			.select("id, slug")
			.eq("slug", storeSlug)
			.maybeSingle();

		if (!store) {
			return NextResponse.json({ error: "Store not found." }, { status: 404 });
		}

		const { data: plan } = await supabase
			.from("plans")
			.select("id, store_id, active, stripe_price_id, name")
			.eq("id", planId)
			.eq("store_id", store.id)
			.maybeSingle();

		if (!plan || !plan.active) {
			return NextResponse.json(
				{ error: "This plan is no longer available." },
				{ status: 404 },
			);
		}

		let { data: customer } = await supabase
			.from("customers")
			.select("id")
			.eq("store_id", store.id)
			.eq("profile_id", user.id)
			.maybeSingle();

		if (!customer) {
			const { data: insertedCustomer, error: customerError } = await supabase
				.from("customers")
				.insert({
					id: randomUUID(),
					store_id: store.id,
					profile_id: user.id,
					email: user.email ?? null,
					name: user.user_metadata?.name ?? user.email ?? null,
				})
				.select("id")
				.single();

			if (customerError || !insertedCustomer) {
				return NextResponse.json(
					{ error: "Could not create the customer record." },
					{ status: 500 },
				);
			}

			customer = insertedCustomer;
		}

		const now = new Date();
		const { data: subscriptions, error: subscriptionsError } = await supabase
			.from("subscriptions")
			.select("id, plan_id, status, current_period_end")
			.eq("customer_id", customer.id)
			.eq("store_id", store.id)
			.order("current_period_end", { ascending: false, nullsFirst: false });

		if (subscriptionsError) {
			return NextResponse.json(
				{ error: "Could not check existing subscriptions." },
				{ status: 500 },
			);
		}

		const existingActiveSubscription = (subscriptions ?? []).find((subscription) => {
			if (
				!subscription.status ||
				!ACTIVE_SUBSCRIPTION_STATUSES.has(subscription.status)
			) {
				return false;
			}

			if (!subscription.current_period_end) {
				return true;
			}

			return new Date(subscription.current_period_end).getTime() > now.getTime();
		});

		if (existingActiveSubscription) {
			return NextResponse.json({
				success: true,
				alreadySubscribed: true,
				redirectTo: `/account?storeId=${encodeURIComponent(store.id)}`,
			});
		}

		if (plan.stripe_price_id) {
			const { data: ownerMembership } = await supabase
				.from("store_staff")
				.select("profile_id")
				.eq("store_id", store.id)
				.eq("role", "owner")
				.eq("active", true)
				.order("created_at", { ascending: true })
				.limit(1)
				.maybeSingle<{ profile_id: string }>();

			if (!ownerMembership?.profile_id) {
				return NextResponse.json(
					{ error: "This store does not have an owner billing account configured." },
					{ status: 409 },
				);
			}

			const { data: ownerProfile } = await supabase
				.from("profiles")
				.select(
					"stripe_account_id, stripe_charges_enabled, stripe_payouts_enabled",
				)
				.eq("user_id", ownerMembership.profile_id)
				.maybeSingle<{
					stripe_account_id: string | null;
					stripe_charges_enabled: boolean | null;
					stripe_payouts_enabled: boolean | null;
				}>();

			if (
				!ownerProfile?.stripe_account_id ||
				!ownerProfile.stripe_charges_enabled ||
				!ownerProfile.stripe_payouts_enabled
			) {
				return NextResponse.json(
					{ error: "The store owner still needs to finish Stripe setup." },
					{ status: 409 },
				);
			}

			const stripe = getStripeServerClient();
			const customerId = customer.id;
			const successUrl = new URL("/subscribe/success", request.nextUrl.origin);
			successUrl.searchParams.set("storeId", store.id);
			successUrl.searchParams.set("storeSlug", store.slug);
			successUrl.searchParams.set("planId", plan.id);

			const session = await stripe.checkout.sessions.create({
				mode: "subscription",
				line_items: [
					{
						price: plan.stripe_price_id,
						quantity: 1,
					},
				],
				customer_email: user.email ?? undefined,
				success_url: successUrl.toString(),
				cancel_url: `${request.nextUrl.origin}/${encodeURIComponent(store.slug)}`,
				metadata: {
					store_id: store.id,
					plan_id: plan.id,
					customer_id: customerId,
					profile_id: user.id,
				},
				subscription_data: {
					metadata: {
						store_id: store.id,
						plan_id: plan.id,
						customer_id: customerId,
						profile_id: user.id,
						owner_profile_id: ownerMembership.profile_id,
					},
				},
			},
			{
				stripeAccount: ownerProfile.stripe_account_id,
			});

			return NextResponse.json({
				success: true,
				checkoutUrl: session.url,
			});
		}

		const periodStart = now.toISOString();
		const periodEnd = new Date(
			now.getTime() + BILLING_PERIOD_DAYS * 24 * 60 * 60 * 1000,
		).toISOString();

		const { error: insertError } = await supabase.from("subscriptions").insert({
			id: randomUUID(),
			store_id: store.id,
			customer_id: customer.id,
			plan_id: plan.id,
			provider: "manual",
			status: "active",
			current_period_start: periodStart,
			current_period_end: periodEnd,
		});

		if (insertError) {
			return NextResponse.json(
				{ error: "Could not create the subscription." },
				{ status: 500 },
			);
		}

		return NextResponse.json({
			success: true,
			redirectTo: `/account?storeId=${encodeURIComponent(store.id)}`,
		});
	} catch (error) {
		console.error("Subscribe route error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
