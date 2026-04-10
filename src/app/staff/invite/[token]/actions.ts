"use server";

import { acceptStaffInvite } from "@/lib/staff/invites";
import { createRouteHandlerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

function redirectWithError(token: string, message: string) {
	const params = new URLSearchParams();
	params.set("error", message);
	redirect(`/staff/invite/${encodeURIComponent(token)}?${params.toString()}`);
}

export async function completeStaffInvite(formData: FormData) {
	const token = (formData.get("token") ?? "").toString().trim();
	const name = (formData.get("name") ?? "").toString().trim();

	if (!token) {
		redirect("/login");
	}

	if (!name) {
		redirectWithError(token, "Full name is required.");
	}

	const supabase = await createRouteHandlerSupabaseClient();
	const { data: authData } = await supabase.auth.getUser();
	const user = authData.user;

	if (!user) {
		redirectWithError(token, "Please sign in to continue.");
	}

	const result = await acceptStaffInvite({
		supabase,
		token,
		userId: user.id,
		name,
	});

	if (result.error) {
		redirectWithError(token, result.error);
	}

	redirect(result.storeSlug ? `/dashboard/${encodeURIComponent(result.storeSlug)}` : "/dashboard");
}
