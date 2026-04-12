import { createRouteHandlerSupabaseClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["active", "trialing"]);
const PENDING_SUBSCRIPTION_STATUSES = new Set([
	"incomplete",
	"incomplete_expired",
	"past_due",
	"unpaid",
]);

export async function GET(request: NextRequest) {
	try {
		const storeId = request.nextUrl.searchParams.get("storeId")?.trim() ?? "";
		const planId = request.nextUrl.searchParams.get("planId")?.trim() ?? "";

		if (!storeId || !planId) {
			return NextResponse.json(
				{ error: "storeId and planId are required." },
				{ status: 400 },
			);
		}

		const supabase = await createRouteHandlerSupabaseClient();
		const { data: authData, error: authError } = await supabase.auth.getUser();
		const user = authData.user;

		if (authError || !user) {
			return NextResponse.json({ error: "Authentication required." }, { status: 401 });
		}

		const { data: customer } = await supabase
			.from("customers")
			.select("id")
			.eq("store_id", storeId)
			.eq("profile_id", user.id)
			.maybeSingle<{ id: string }>();

		if (!customer) {
			return NextResponse.json({
				status: "none",
			});
		}

		const { data: subscriptions, error: subscriptionError } = await supabase
			.from("subscriptions")
			.select("id, status, provider, current_period_start, current_period_end")
			.eq("store_id", storeId)
			.eq("customer_id", customer.id)
			.eq("plan_id", planId)
			.order("created_at", { ascending: false });

		if (subscriptionError) {
			return NextResponse.json(
				{ error: "Failed to load subscription status." },
				{ status: 500 },
			);
		}

		const now = Date.now();
		const activeSubscription = (subscriptions ?? []).find((subscription) => {
			if (!subscription.status || !ACTIVE_SUBSCRIPTION_STATUSES.has(subscription.status)) {
				return false;
			}

			if (!subscription.current_period_end) {
				return true;
			}

			return new Date(subscription.current_period_end).getTime() > now;
		});

		if (activeSubscription) {
			return NextResponse.json({
				status: "active",
				subscription: activeSubscription,
			});
		}

		const pendingSubscription = (subscriptions ?? []).find((subscription) =>
			subscription.status
				? PENDING_SUBSCRIPTION_STATUSES.has(subscription.status)
				: false,
		);

		if (pendingSubscription) {
			return NextResponse.json({
				status: "pending",
				subscription: pendingSubscription,
			});
		}

		return NextResponse.json({
			status: "none",
		});
	} catch (error) {
		console.error("Subscribe status route error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
