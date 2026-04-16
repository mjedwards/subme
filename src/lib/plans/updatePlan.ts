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
		.update({ active: true })
		.eq("store_id", store.id)
		.eq("id", planId)
		.maybeSingle();

	if (!canPublish) {
		return { error: "Enable payments before publishing a plan." };
	}

	return { error: null, plan: plan };
}
