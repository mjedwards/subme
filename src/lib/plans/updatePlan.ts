import type { SupabaseClient } from "@supabase/supabase-js";
import { createStripeCatalogForPlan } from "@/lib/stripe/plans";

type UpdatePlanParams = {
	supabase: SupabaseClient;
	storeSlug: string;
	userId: string;
	planId: string;
};

export async function updatePlanForStore({
	supabase,
	storeSlug,
	userId,
	planId,
}: UpdatePlanParams) {
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

	const { data: plan } = await supabase
		.from("plans")
		.select("*")
		.eq("store_id", store.id)
		.eq("id", planId);

	let stripeProductId: string | null = null;
	let stripePriceId: string | null = null;

	if (billingProfile?.stripe_account_id) {
		try {
			const stripeCatalog = await createStripeCatalogForPlan({
				stripeAccountId: billingProfile.stripe_account_id,
				storeName: store.name,
				storeId: store.id,
				planId,
				name: plan[0].name,
				description: plan[0].description,
				amountCents: plan[0].amount_cents,
				currency: plan[0].currency,
				billingInterval: plan[0].billing_interval,
			});

			stripeProductId = stripeCatalog.productId;
			stripePriceId = stripeCatalog.priceId;

			console.log(stripeCatalog);

			const { error } = await supabase
				.from("plans")
				.update({
					active: true,
					stripe_product_id: stripeProductId,
					stripe_price_id: stripePriceId,
					updated_at: new Date().toISOString(),
				})
				.eq("store_id", store.id)
				.eq("id", planId)
				.select()
				.maybeSingle();

			if (error) {
				return { error: "plan could not be updated." };
			}
		} catch (error) {
			console.error("Stripe plan creation error:", error);
			return { error: "Could not create the billing product for this plan." };
		}
	}

	if (!canPublish) {
		return { error: "Enable payments before publishing a plan." };
	}

	return { error: null, plan: plan };
}
