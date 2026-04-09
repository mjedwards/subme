"use server";

import { createRouteHandlerSupabaseClient } from "@/lib/supabase/server";
import { randomUUID } from "crypto";
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
	const redemptionsRaw = (formData.get("redemptions") ?? "").toString().trim();
	const redemptions = Number.parseInt(redemptionsRaw || "1", 10);

	if (!storeSlug) redirectWithError("Store is missing. Please create a store.");
	if (!name) redirectWithError("Plan name is required.", storeSlug);

	const supabase = await createRouteHandlerSupabaseClient();
	const { data: authData } = await supabase.auth.getUser();
	const user = authData.user;

	if (!user) redirectWithError("Please sign in again to continue.", storeSlug);

	const { data: store } = await supabase
		.from("stores")
		.select("id")
		.eq("slug", storeSlug)
		.maybeSingle();

	if (!store) redirectWithError("Store not found.", storeSlug);

	const { data: membership } = await supabase
		.from("store_staff")
		.select("id, role")
		.eq("store_id", store.id)
		.eq("profile_id", user.id)
		.maybeSingle();

	if (!membership || membership.role !== "owner") {
		redirectWithError("You do not have access to this store.", storeSlug);
	}

	const { error: planError } = await supabase.from("plans").insert({
		id: randomUUID(),
		store_id: store.id,
		name,
		description: description || null,
		benefit_type: benefitType || null,
		redemptions_per_period: Number.isNaN(redemptions) ? 1 : redemptions,
	});

	if (planError) redirectWithError("Could not create the plan.", storeSlug);

	await supabase
		.from("profiles")
		.update({ onboarding_stage: "staff", onboarding_complete: false })
		.eq("user_id", user.id);

	redirect(`/dashboard/onboarding/staff?storeSlug=${encodeURIComponent(storeSlug)}`);
}
