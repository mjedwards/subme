import { createRouteHandlerSupabaseClient } from "@/lib/supabase/server";

type CustomerRow = {
	id: string;
	email: string | null;
	name: string | null;
	created_at: string;
};

type SubscriptionRow = {
	id: string;
	customer_id: string;
	plan_id: string;
	status: string | null;
	current_period_start: string | null;
	current_period_end: string | null;
	created_at: string;
};

type PlanRow = {
	id: string;
	name: string;
	benefit_type: string | null;
	redemptions_per_period: number | null;
};

type RedemptionRow = {
	subscription_id: string;
	period_start: string;
	redeemed_at: string;
};

export type SubscriberTableRow = {
	id: string;
	customerName: string;
	customerEmail: string;
	planName: string;
	redeemed: boolean;
	redeemedAt: string | null;
	periodStart: string | null;
	periodEnd: string | null;
	joinedAt: string;
};

export type StoreSubscribersPayload = {
	store: {
		id: string;
		name: string;
		slug: string;
	};
	summary: {
		customers: number;
		activeSubscriptions: number;
	};
	rows: SubscriberTableRow[];
};

export async function getStoreSubscribersPayload(
	storeSlug: string,
	userId: string,
	options?: { requireOwner?: boolean },
) {
	const supabase = await createRouteHandlerSupabaseClient();
	const { data: store } = await supabase
		.from("stores")
		.select("id, name, slug")
		.eq("slug", storeSlug)
		.maybeSingle();

	if (!store) {
		return { error: "Store not found.", status: 404 as const };
	}

	const { data: membership } = await supabase
		.from("store_staff")
		.select("role")
		.eq("store_id", store.id)
		.eq("profile_id", userId)
		.eq("active", true)
		.maybeSingle();

	if (!membership) {
		return { error: "You do not have access to this store.", status: 403 as const };
	}

	if (options?.requireOwner && membership.role !== "owner") {
		return { error: "You do not have access to this store.", status: 403 as const };
	}

	const [{ data: customers }, { data: subscriptions }, { data: plans }] =
		await Promise.all([
			supabase
				.from("customers")
				.select("id, email, name, created_at")
				.eq("store_id", store.id)
				.order("created_at", { ascending: false }),
			supabase
				.from("subscriptions")
				.select(
					"id, customer_id, plan_id, status, current_period_start, current_period_end, created_at",
				)
				.eq("store_id", store.id)
				.order("created_at", { ascending: false }),
			supabase
				.from("plans")
				.select("id, name, benefit_type, redemptions_per_period")
				.eq("store_id", store.id),
		]);

	const { data: redemptions } = await supabase
		.from("redemptions")
		.select("subscription_id, period_start, redeemed_at")
		.eq("store_id", store.id);

	const normalizedRedemptions = (redemptions ?? []) as RedemptionRow[];
	const plansById = new Map(
		((plans ?? []) as PlanRow[]).map((plan) => [plan.id, plan]),
	);
	const customersById = new Map(
		((customers ?? []) as CustomerRow[]).map((customer) => [customer.id, customer]),
	);
	const redemptionsBySubscriptionAndPeriod = new Map(
		normalizedRedemptions.map((redemption) => [
			getSubscriptionPeriodKey(redemption.subscription_id, redemption.period_start),
			redemption,
		]),
	);
	const activeSubscriptions = getDistinctActiveSubscriptions(
		((subscriptions ?? []) as SubscriptionRow[]).filter((subscription) =>
			["active", "trialing"].includes(subscription.status ?? ""),
		),
		normalizedRedemptions,
	);

	const rows: SubscriberTableRow[] = activeSubscriptions.map((subscription) => {
		const customer = customersById.get(subscription.customer_id);
		const plan = plansById.get(subscription.plan_id);
		const redemptionKey = subscription.current_period_start
			? getSubscriptionPeriodKey(
					subscription.id,
					subscription.current_period_start,
				)
			: "";
		const redemption = redemptionKey
			? redemptionsBySubscriptionAndPeriod.get(redemptionKey)
			: undefined;

		return {
			id: subscription.id,
			customerName: customer?.name || customer?.email || "Customer",
			customerEmail: customer?.email || "No email on file",
			planName: plan?.name || "Unknown plan",
			redeemed: !!redemption,
			redeemedAt: redemption?.redeemed_at ?? null,
			periodStart: subscription.current_period_start,
			periodEnd: subscription.current_period_end,
			joinedAt: customer?.created_at || subscription.created_at,
		};
	});

	return {
		data: {
			store,
			summary: {
				customers: (customers ?? []).length,
				activeSubscriptions: rows.length,
			},
			rows,
		} satisfies StoreSubscribersPayload,
	};
}

function getDistinctActiveSubscriptions(
	subscriptions: SubscriptionRow[],
	redemptions: RedemptionRow[],
) {
	const distinctByStoreAndPlan = new Map<string, SubscriptionRow>();
	const redeemedKeys = new Set(
		redemptions.map((redemption) =>
			getSubscriptionPeriodKey(redemption.subscription_id, redemption.period_start),
		),
	);

	for (const subscription of subscriptions) {
		const key = `${subscription.customer_id}:${subscription.plan_id}`;
		const existing = distinctByStoreAndPlan.get(key);

		if (!existing) {
			distinctByStoreAndPlan.set(key, subscription);
			continue;
		}

		const existingIsRedeemed = hasCurrentPeriodRedemption(existing, redeemedKeys);
		const nextIsRedeemed = hasCurrentPeriodRedemption(subscription, redeemedKeys);

		if (nextIsRedeemed && !existingIsRedeemed) {
			distinctByStoreAndPlan.set(key, subscription);
			continue;
		}

		if (nextIsRedeemed === existingIsRedeemed) {
			const existingPeriodEnd = existing.current_period_end
				? new Date(existing.current_period_end).getTime()
				: 0;
			const nextPeriodEnd = subscription.current_period_end
				? new Date(subscription.current_period_end).getTime()
				: 0;

			if (nextPeriodEnd > existingPeriodEnd) {
				distinctByStoreAndPlan.set(key, subscription);
				continue;
			}

			if (nextPeriodEnd === existingPeriodEnd) {
				const existingCreatedAt = new Date(existing.created_at).getTime();
				const nextCreatedAt = new Date(subscription.created_at).getTime();

				if (nextCreatedAt > existingCreatedAt) {
					distinctByStoreAndPlan.set(key, subscription);
				}
			}
		}
	}

	return Array.from(distinctByStoreAndPlan.values()).sort(
		(left, right) =>
			new Date(right.created_at).getTime() - new Date(left.created_at).getTime(),
	);
}

function getSubscriptionPeriodKey(subscriptionId: string, periodStart: string) {
	const parsedTime = new Date(periodStart).getTime();
	const normalizedPeriodStart = Number.isNaN(parsedTime)
		? periodStart
		: new Date(parsedTime).toISOString();

	return `${subscriptionId}:${normalizedPeriodStart}`;
}

function hasCurrentPeriodRedemption(
	subscription: SubscriptionRow,
	redeemedKeys: Set<string>,
) {
	if (!subscription.current_period_start) {
		return false;
	}

	return redeemedKeys.has(
		getSubscriptionPeriodKey(subscription.id, subscription.current_period_start),
	);
}
