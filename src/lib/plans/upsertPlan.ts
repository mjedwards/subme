import type { SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import { createStripeCatalogForPlan } from "@/lib/stripe/plans";

type PlanInput = {
	name: string;
	description?: string;
	benefitType?: string;
	redemptionsPerPeriod?: number;
	active?: boolean;
	amountCents?: number;
	currency?: string;
	billingInterval?: "month" | "year";
};

type UpsertPlanParams = {
	supabase: SupabaseClient;
	storeSlug: string;
	userId: string;
	plan: PlanInput;
};

export async function createPlanForStore({
	supabase,
	storeSlug,
	userId,
	plan,
}: UpsertPlanParams) {
	const { data: store } = await supabase
		.from("stores")
		.select("id")
		.eq("slug", storeSlug)
		.maybeSingle();

	if (!store) {
		return { error: "Store not found." };
	}

	const { data: membership } = await supabase
		.from("store_staff")
		.select("id, role")
		.eq("store_id", store.id)
		.eq("profile_id", userId)
		.maybeSingle();

	if (!membership || membership.role !== "owner") {
		return { error: "You do not have access to this store." };
	}

	const redemptionsPerPeriod =
		typeof plan.redemptionsPerPeriod === "number" &&
		!Number.isNaN(plan.redemptionsPerPeriod) &&
		plan.redemptionsPerPeriod > 0
			? plan.redemptionsPerPeriod
			: 1;
	const amountCents =
		typeof plan.amountCents === "number" &&
		!Number.isNaN(plan.amountCents) &&
		plan.amountCents > 0
			? Math.round(plan.amountCents)
			: null;
	const currency = (plan.currency || "usd").trim().toLowerCase();
	const billingInterval = plan.billingInterval === "year" ? "year" : "month";

	const { data: billingProfile } = await supabase
		.from("profiles")
		.select("stripe_account_id, stripe_charges_enabled, stripe_payouts_enabled")
		.eq("user_id", userId)
		.maybeSingle<{
			stripe_account_id: string | null;
			stripe_charges_enabled: boolean | null;
			stripe_payouts_enabled: boolean | null;
		}>();

	const canPublish = !!(
		billingProfile?.stripe_account_id &&
		billingProfile.stripe_charges_enabled &&
		billingProfile.stripe_payouts_enabled
	);

	if (plan.active && !canPublish) {
		return { error: "Enable payments before publishing a plan." };
	}

	if (!amountCents) {
		return { error: "A valid subscription price is required." };
	}

	const planId = randomUUID();
	let stripeProductId: string | null = null;
	let stripePriceId: string | null = null;

	if (plan.active && billingProfile?.stripe_account_id) {
		try {
			const stripeCatalog = await createStripeCatalogForPlan({
				stripeAccountId: billingProfile.stripe_account_id,
				storeName: store.name,
				storeId: store.id,
				planId,
				name: plan.name,
				description: plan.description,
				amountCents,
				currency,
				billingInterval,
			});

			stripeProductId = stripeCatalog.productId;
			stripePriceId = stripeCatalog.priceId;
		} catch (error) {
			console.error("Stripe plan creation error:", error);
			return { error: "Could not create the billing product for this plan." };
		}
	}

	const { error: planError } = await supabase.from("plans").insert({
		id: planId,
		store_id: store.id,
		name: plan.name,
		description: plan.description || null,
		benefit_type: plan.benefitType || null,
		redemptions_per_period: redemptionsPerPeriod,
		stripe_price_id: stripePriceId,
		active: plan.active ?? true,
		stripe_product_id: stripeProductId,
		billing_interval: billingInterval,
		amount_cents: amountCents,
		currency,
	});

	if (planError) {
		return { error: "Could not create the plan." };
	}

	return { error: null, storeId: store.id };
}
