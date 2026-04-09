"use server";

import { createRouteHandlerSupabaseClient } from "@/lib/supabase/server";
import { randomUUID } from "crypto";
import { redirect } from "next/navigation";

function slugify(value: string) {
	return value
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9\s-]/g, "")
		.replace(/\s+/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-+|-+$/g, "");
}

function redirectWithError(message: string, slug?: string) {
	const params = new URLSearchParams();
	params.set("error", message);
	if (slug) params.set("storeSlug", slug);
	redirect(`/dashboard/onboarding/store?${params.toString()}`);
}

export async function createStore(formData: FormData) {
	const name = (formData.get("name") ?? "").toString().trim();
	const slugInput = (formData.get("slug") ?? "").toString().trim();
	const timezone =
		(formData.get("timezone") ?? "").toString().trim() || "America/New_York";

	if (!name) redirectWithError("Store name is required.");

	const slug = slugify(slugInput || name);
	if (!slug) redirectWithError("Please provide a valid store slug.");

	const supabase = await createRouteHandlerSupabaseClient();
	const { data: authData } = await supabase.auth.getUser();
	const user = authData.user;

	if (!user) redirectWithError("Please sign in again to continue.");

	const { data: existingStore } = await supabase
		.from("stores")
		.select("id")
		.eq("slug", slug)
		.maybeSingle();

	if (existingStore) redirectWithError("That store slug is already taken.");

	await supabase.from("profiles").upsert({
		user_id: user.id,
		email: user.email ?? "",
		name: user.user_metadata?.name ?? "",
	});

	const storeId = randomUUID();
	const { error: storeError } = await supabase.from("stores").insert({
		id: storeId,
		slug,
		name,
		timezone,
	});

	if (storeError) redirectWithError("Could not create the store.");

	const { error: staffError } = await supabase.from("store_staff").insert({
		id: randomUUID(),
		store_id: storeId,
		profile_id: user.id,
		role: "owner",
		work_email: user.email ?? null,
	});

	if (staffError) redirectWithError("Could not assign store ownership.");

	const { error: profileError } = await supabase
		.from("profiles")
		.update({ onboarding_stage: "plan", onboarding_complete: false })
		.eq("user_id", user.id);

	if (profileError) {
		redirectWithError(
			`Store created, but onboarding could not advance. ${profileError.message}`,
		);
	}

	redirect(`/dashboard/onboarding/plan?storeSlug=${encodeURIComponent(slug)}`);
}
