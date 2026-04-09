"use server";

import { createRouteHandlerSupabaseClient } from "@/lib/supabase/server";
import { randomUUID } from "crypto";
import { redirect } from "next/navigation";

function redirectWithError(message: string, storeSlug?: string) {
	const params = new URLSearchParams();
	params.set("error", message);
	if (storeSlug) params.set("storeSlug", storeSlug);
	redirect(`/dashboard/onboarding/staff?${params.toString()}`);
}

export async function inviteStaff(formData: FormData) {
	const storeSlug = (formData.get("storeSlug") ?? "").toString().trim();
	const email = (formData.get("email") ?? "").toString().trim().toLowerCase();

	if (!storeSlug) redirectWithError("Store is missing. Please create a store.");
	if (!email) redirectWithError("Staff email is required.", storeSlug);

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
		.eq("store_id", store?.id)
		.eq("profile_id", user?.id)
		.maybeSingle();

	if (!membership || membership.role !== "owner") {
		redirectWithError("You do not have access to this store.", storeSlug);
	}

	const { data: staffProfile } = await supabase
		.from("profiles")
		.select("user_id")
		.eq("email", email)
		.maybeSingle();

	if (!staffProfile) {
		redirectWithError(
			"That staff member has not signed up yet. Ask them to create an account first.",
			storeSlug,
		);
	}

	const { error: staffError } = await supabase.from("store_staff").insert({
		id: randomUUID(),
		store_id: store?.id,
		profile_id: staffProfile?.user_id,
		role: "staff",
		work_email: email,
	});

	if (staffError) redirectWithError("Could not invite this staff member.", storeSlug);

	await supabase
		.from("profiles")
		.update({ onboarding_stage: "done", onboarding_complete: true })
		.eq("user_id", user?.id);

	redirect(`/dashboard/${encodeURIComponent(storeSlug)}`);
}
