import { randomUUID } from "node:crypto";

import { QrTokenError, verifyQrToken } from "@/lib/qr/sign";
import { createRouteHandlerSupabaseClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["active", "trialing"]);

type RedeemRequestBody = {
	token?: string;
	note?: string;
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

export async function POST(request: NextRequest) {
	try {
		const supabase = await createRouteHandlerSupabaseClient();
		const { data: userData, error: userError } = await supabase.auth.getUser();

		if (userError || !userData.user) {
			return NextResponse.json({ user: null }, { status: 401 });
		}

		const body = (await request.json()) as RedeemRequestBody;
		const token = body.token?.trim();
		const note = body.note?.trim() ?? "";

		if (!token) {
			return NextResponse.json(
				{ error: "A QR token is required." },
				{ status: 400 },
			);
		}

		let payload;
		try {
			payload = verifyQrToken(token);
		} catch (error) {
			if (error instanceof QrTokenError) {
				return NextResponse.json({ error: error.message }, { status: 400 });
			}

			throw error;
		}

		const { data: membership, error: membershipError } = await supabase
			.from("store_staff")
			.select("id, role")
			.eq("store_id", payload.storeId)
			.eq("profile_id", userData.user.id)
			.eq("active", true)
			.maybeSingle();

		if (membershipError) {
			return NextResponse.json(
				{ error: "Failed to verify staff access." },
				{ status: 500 },
			);
		}

		if (!membership) {
			return NextResponse.json(
				{ error: "You do not have access to redeem for this store." },
				{ status: 403 },
			);
		}

		const { data: subscription, error: subscriptionError } = await supabase
			.from("subscriptions")
			.select(
				"id, store_id, customer_id, plan_id, status, current_period_start, current_period_end",
			)
			.eq("id", payload.subscriptionId)
			.maybeSingle<SubscriptionRow>();

		if (subscriptionError) {
			return NextResponse.json(
				{ error: "Failed to load subscription." },
				{ status: 500 },
			);
		}

		if (!subscription) {
			return NextResponse.json(
				{ error: "Subscription not found." },
				{ status: 404 },
			);
		}

		const now = new Date();
		if (!matchesTokenPayload(subscription, payload)) {
			return NextResponse.json(
				{ error: "QR token does not match the current subscription state." },
				{ status: 409 },
			);
		}

		if (!isRedeemableSubscription(subscription, now)) {
			return NextResponse.json(
				{ error: "This subscription is not currently redeemable." },
				{ status: 409 },
			);
		}

		const { data: existingRedemption, error: existingRedemptionError } =
			await supabase
				.from("redemptions")
				.select("id, redeemed_at, staff_user_id, note")
				.eq("subscription_id", subscription.id)
				.eq("period_start", subscription.current_period_start!)
				.maybeSingle();

		if (existingRedemptionError) {
			return NextResponse.json(
				{ error: "Failed to check existing redemption state." },
				{ status: 500 },
			);
		}

		if (existingRedemption) {
			return NextResponse.json(
				{
					error: "This subscription has already been redeemed for the current period.",
					redemption: existingRedemption,
				},
				{ status: 409 },
			);
		}

		const redemptionId = randomUUID();
		const { data: redemption, error: insertError } = await supabase
			.from("redemptions")
			.insert({
				id: redemptionId,
				store_id: subscription.store_id,
				subscription_id: subscription.id,
				customer_id: subscription.customer_id,
				period_start: subscription.current_period_start!,
				staff_user_id: userData.user.id,
				note: note || null,
			})
			.select(
				"id, store_id, subscription_id, customer_id, period_start, redeemed_at, staff_user_id, note",
			)
			.single();

		if (insertError) {
			if (insertError.code === "23505") {
				return NextResponse.json(
					{
						error:
							"This subscription has already been redeemed for the current period.",
					},
					{ status: 409 },
				);
			}

			return NextResponse.json(
				{ error: "Failed to record redemption." },
				{ status: 500 },
			);
		}

		return NextResponse.json(
			{
				success: true,
				redemption,
				subscription: {
					id: subscription.id,
					storeId: subscription.store_id,
					customerId: subscription.customer_id,
					planId: subscription.plan_id,
					status: subscription.status,
					currentPeriodStart: subscription.current_period_start,
					currentPeriodEnd: subscription.current_period_end,
				},
				staff: {
					userId: userData.user.id,
					role: membership.role,
				},
			},
			{
				headers: {
					"Cache-Control": "no-store",
				},
			},
		);
	} catch (error) {
		console.error("Redeem route error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

function matchesTokenPayload(
	subscription: SubscriptionRow,
	payload: ReturnType<typeof verifyQrToken>,
) {
	if (subscription.store_id !== payload.storeId) {
		return false;
	}

	if (subscription.customer_id !== payload.customerId) {
		return false;
	}

	if (!sameInstant(subscription.current_period_start, payload.periodStart)) {
		return false;
	}

	if (
		!sameInstant(
			subscription.current_period_end ?? undefined,
			payload.periodEnd,
		)
	) {
		return false;
	}

	if (payload.planId && subscription.plan_id !== payload.planId) {
		return false;
	}

	return true;
}

function sameInstant(left?: string | null, right?: string) {
	if (!left && !right) {
		return true;
	}

	if (!left || !right) {
		return false;
	}

	const leftTime = new Date(left).getTime();
	const rightTime = new Date(right).getTime();

	if (Number.isNaN(leftTime) || Number.isNaN(rightTime)) {
		return left === right;
	}

	return leftTime === rightTime;
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
