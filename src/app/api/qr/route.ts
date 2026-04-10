import { createQrToken, DEFAULT_QR_TTL_SECONDS } from "@/lib/qr/sign";
import { createRouteHandlerSupabaseClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["active", "trialing"]);

type CustomerRow = {
	id: string;
	store_id: string;
};

type SubscriptionRow = {
	id: string;
	store_id: string;
	customer_id: string;
	plan_id: string;
	status: string | null;
	current_period_start: string | null;
	current_period_end: string | null;
};

export async function GET(request: NextRequest) {
	try {
		const supabase = await createRouteHandlerSupabaseClient();
		const { data: userData, error: userError } = await supabase.auth.getUser();

		if (userError || !userData.user) {
			return NextResponse.json({ user: null }, { status: 401 });
		}

		const storeId = request.nextUrl.searchParams.get("storeId")?.trim() ?? "";

		const customerQuery = supabase
			.from("customers")
			.select("id, store_id")
			.eq("profile_id", userData.user.id);

		if (storeId) {
			customerQuery.eq("store_id", storeId);
		}

		const { data: customerRows, error: customerError } = await customerQuery;

		if (customerError) {
			return NextResponse.json(
				{ error: "Failed to load customer memberships." },
				{ status: 500 },
			);
		}

		if (!customerRows?.length) {
			return NextResponse.json(
				{ error: "No customer membership found for this account." },
				{ status: 404 },
			);
		}

		const customerIds = customerRows.map((row) => row.id);
		const customersById = new Map(customerRows.map((row) => [row.id, row]));

		const { data: subscriptionRows, error: subscriptionError } = await supabase
			.from("subscriptions")
			.select(
				"id, store_id, customer_id, plan_id, status, current_period_start, current_period_end",
			)
			.in("customer_id", customerIds)
			.order("current_period_end", { ascending: false, nullsFirst: false });

		if (subscriptionError) {
			return NextResponse.json(
				{ error: "Failed to load subscriptions." },
				{ status: 500 },
			);
		}

		const now = new Date();
		const candidates = (subscriptionRows ?? [])
			.map((subscription) => ({
				customer: customersById.get(subscription.customer_id),
				subscription,
			}))
			.filter(
				(
					result,
				): result is {
					customer: CustomerRow;
					subscription: SubscriptionRow;
				} => !!result.customer,
			)
			.filter(({ subscription }) => isRedeemableSubscription(subscription, now));

		if (!candidates.length) {
			return NextResponse.json(
				{ error: "No active subscription is available for QR redemption." },
				{ status: 404 },
			);
		}

		if (!storeId && candidates.length > 1) {
			return NextResponse.json(
				{
					error:
						"Multiple active subscriptions found. Provide a storeId to request a specific QR code.",
					storeIds: Array.from(
						new Set(candidates.map(({ subscription }) => subscription.store_id)),
					),
				},
				{ status: 409 },
			);
		}

		const selected = selectBestCandidate(candidates, now);
		const token = createQrToken({
			storeId: selected.subscription.store_id,
			subscriptionId: selected.subscription.id,
			customerId: selected.customer.id,
			planId: selected.subscription.plan_id,
			periodStart: selected.subscription.current_period_start!,
			periodEnd: selected.subscription.current_period_end ?? undefined,
			now,
		});

		return NextResponse.json(
			{
				qrCode: {
					token,
					expiresAt: new Date(
						now.getTime() + DEFAULT_QR_TTL_SECONDS * 1000,
					).toISOString(),
					storeId: selected.subscription.store_id,
					subscriptionId: selected.subscription.id,
					customerId: selected.customer.id,
					planId: selected.subscription.plan_id,
					status: selected.subscription.status,
					currentPeriodStart: selected.subscription.current_period_start,
					currentPeriodEnd: selected.subscription.current_period_end,
				},
			},
			{
				headers: {
					"Cache-Control": "no-store",
				},
			},
		);
	} catch (error) {
		console.error("QR route error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

function isRedeemableSubscription(subscription: SubscriptionRow, now: Date) {
	if (!subscription.current_period_start) {
		return false;
	}

	if (!subscription.status || !ACTIVE_SUBSCRIPTION_STATUSES.has(subscription.status)) {
		return false;
	}

	if (!subscription.current_period_end) {
		return true;
	}

	return new Date(subscription.current_period_end).getTime() > now.getTime();
}

function selectBestCandidate(
	candidates: Array<{ customer: CustomerRow; subscription: SubscriptionRow }>,
	now: Date,
) {
	return [...candidates].sort((left, right) => {
		const leftDistance = getPeriodEndDistance(left.subscription, now);
		const rightDistance = getPeriodEndDistance(right.subscription, now);
		return leftDistance - rightDistance;
	})[0];
}

function getPeriodEndDistance(subscription: SubscriptionRow, now: Date) {
	if (!subscription.current_period_end) {
		return Number.MAX_SAFE_INTEGER;
	}

	return Math.abs(
		new Date(subscription.current_period_end).getTime() - now.getTime(),
	);
}
