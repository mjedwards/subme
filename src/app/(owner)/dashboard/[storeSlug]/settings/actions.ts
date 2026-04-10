"use server";

import { createStaffInvite } from "@/lib/staff/invites";
import { createRouteHandlerSupabaseClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

function redirectWithMessage(
	storeSlug: string,
	message: string,
	type: "error" | "success" = "error",
) {
	const params = new URLSearchParams();
	params.set(type, message);
	redirect(
		`/dashboard/${encodeURIComponent(storeSlug)}/settings?${params.toString()}`,
	);
}

export async function sendStaffInvite(formData: FormData) {
	const storeSlug = (formData.get("storeSlug") ?? "").toString().trim();
	const email = (formData.get("email") ?? "").toString().trim().toLowerCase();

	if (!storeSlug) {
		redirect("/dashboard");
	}

	if (!email) {
		redirectWithMessage(storeSlug, "Staff email is required.");
	}

	const supabase = await createRouteHandlerSupabaseClient();
	const { data: authData } = await supabase.auth.getUser();
	const user = authData.user;

	if (!user) {
		redirectWithMessage(storeSlug, "Please sign in again to continue.");
	}

	const headerStore = await headers();
	const proto = headerStore.get("x-forwarded-proto") ?? "http";
	const host =
		headerStore.get("x-forwarded-host") ??
		headerStore.get("host") ??
		"localhost:3000";
	const origin = `${proto}://${host}`;

	const result = await createStaffInvite({
		supabase,
		storeSlug,
		ownerUserId: user.id,
		email,
		origin,
	});

	if (result.error) {
		redirectWithMessage(storeSlug, result.error);
	}

	redirectWithMessage(storeSlug, `Invite ready for ${email}.`, "success");
}
