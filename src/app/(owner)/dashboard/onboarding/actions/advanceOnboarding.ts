"use server";

import { createRouteHandlerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

function redirectWithError(message: string, storeSlug?: string, step?: string) {
	const params = new URLSearchParams();
	params.set("error", message);
	if (storeSlug) params.set("storeSlug", storeSlug);
	const targetStep = step ?? "staff";
	redirect(`/dashboard/onboarding/${targetStep}?${params.toString()}`);
}

export async function skipPlan(formData: FormData) {
	const storeSlug = (formData.get("storeSlug") ?? "").toString().trim();
	if (!storeSlug) redirectWithError("Store is missing. Please create a store.");

	const supabase = await createRouteHandlerSupabaseClient();
	const { data: authData } = await supabase.auth.getUser();
	const user = authData.user;

	if (!user) redirectWithError("Please sign in again to continue.", storeSlug, "plan");

	await supabase
		.from("profiles")
		.update({ onboarding_stage: "staff", onboarding_complete: false })
		.eq("user_id", user.id);

	redirect(`/dashboard/onboarding/staff?storeSlug=${encodeURIComponent(storeSlug)}`);
}

export async function completeOnboarding(formData: FormData) {
	const storeSlug = (formData.get("storeSlug") ?? "").toString().trim();

	const supabase = await createRouteHandlerSupabaseClient();
	const { data: authData } = await supabase.auth.getUser();
	const user = authData.user;

	if (!user) redirectWithError("Please sign in again to continue.", storeSlug);

	await supabase
		.from("profiles")
		.update({ onboarding_stage: "done", onboarding_complete: true })
		.eq("user_id", user.id);

	const destination = storeSlug
		? `/dashboard/${encodeURIComponent(storeSlug)}`
		: "/dashboard";
	redirect(destination);
}
