"use server";

import { createPlanForStore } from "@/lib/plans/upsertPlan";
import { createRouteHandlerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

function redirectWithError(message: string, storeSlug?: string) {
	const params = new URLSearchParams();
	params.set("error", message);
	if (storeSlug) params.set("storeSlug", storeSlug);
	redirect(`/dashboard/onboarding/plan?${params.toString()}`);
}

export async function createPlan(formData: FormData) {
	const storeSlug = (formData.get("storeSlug") ?? "").toString().trim();
	const name = (formData.get("name") ?? "").toString().trim();
	const description = (formData.get("description") ?? "").toString().trim();
	const benefitType = (formData.get("benefitType") ?? "").toString().trim();
	const stripePriceId = (formData.get("stripePriceId") ?? "").toString().trim();
	const redemptionsRaw = (formData.get("redemptions") ?? "").toString().trim();
	const redemptions = Number.parseInt(redemptionsRaw || "1", 10);

	if (!storeSlug) redirectWithError("Store is missing. Please create a store.");
	if (!name) redirectWithError("Plan name is required.", storeSlug);

	const supabase = await createRouteHandlerSupabaseClient();
	const { data: authData } = await supabase.auth.getUser();
	const user = authData.user;

	if (!user) redirectWithError("Please sign in again to continue.", storeSlug);

	const result = await createPlanForStore({
		supabase,
		storeSlug,
		userId: user.id,
		plan: {
			name,
			description,
			benefitType,
			stripePriceId,
			redemptionsPerPeriod: redemptions,
			active: true,
		},
	});

	if (result.error) redirectWithError(result.error, storeSlug);

	await supabase
		.from("profiles")
		.update({ onboarding_stage: "staff", onboarding_complete: false })
		.eq("user_id", user.id);

	redirect(`/dashboard/onboarding/staff?storeSlug=${encodeURIComponent(storeSlug)}`);
}
