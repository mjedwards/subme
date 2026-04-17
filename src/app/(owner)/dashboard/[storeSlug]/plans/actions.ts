"use server";

import { updatePlanForStore } from "@/lib/plans/updatePlan";
import { createPlanForStore } from "@/lib/plans/upsertPlan";
import { createRouteHandlerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

function redirectWithError(storeSlug: string, message: string) {
	const params = new URLSearchParams();
	params.set("error", message);
	redirect(
		`/dashboard/${encodeURIComponent(storeSlug)}/plans?${params.toString()}`,
	);
}

export async function createDashboardPlan(formData: FormData) {
	const storeSlug = (formData.get("storeSlug") ?? "").toString().trim();
	const name = (formData.get("name") ?? "").toString().trim();
	const description = (formData.get("description") ?? "").toString().trim();
	const benefitType = (formData.get("benefitType") ?? "").toString().trim();
	const redemptionsRaw = (formData.get("redemptions") ?? "").toString().trim();
	const redemptions = Number.parseInt(redemptionsRaw || "1", 10);
	const amountRaw = (formData.get("amount") ?? "").toString().trim();
	const amountValue = Number.parseFloat(amountRaw);
	const billingInterval = (formData.get("billingInterval") ?? "month")
		.toString()
		.trim() as "month" | "year";
	const active = (formData.get("active") ?? "on").toString() === "on";

	if (!storeSlug) {
		redirect("/dashboard");
	}

	if (!name) {
		redirectWithError(storeSlug, "Plan name is required.");
	}

	const supabase = await createRouteHandlerSupabaseClient();
	const { data: authData } = await supabase.auth.getUser();
	const user = authData.user;

	if (!user) {
		redirectWithError(storeSlug, "Please sign in again to continue.");
	}

	const result = await createPlanForStore({
		supabase,
		storeSlug,
		userId: user.id,
		plan: {
			name,
			description,
			benefitType,
			redemptionsPerPeriod: redemptions,
			amountCents: Number.isNaN(amountValue) ? undefined : amountValue * 100,
			billingInterval,
			active,
		},
	});

	if (result.error) {
		redirectWithError(storeSlug, result.error);
	}

	redirect(`/dashboard/${encodeURIComponent(storeSlug)}/plans`);
}

export async function updateDashboardPlan(formData: FormData) {
	const storeSlug = String(formData.get("storeSlug") || "");
	const planId = String(formData.get("planId") || "");
	const supabase = await createRouteHandlerSupabaseClient();
	const { data: authData } = await supabase.auth.getUser();
	const user = authData.user;

	if (!user) {
		redirectWithError(storeSlug, "Please sign in again to continue.");
	}

	const result = await updatePlanForStore({
		supabase,
		storeSlug,
		userId: user.id,
		planId,
	});

	if (result.error) {
		redirectWithError(storeSlug, result.error);
	}

	redirect(`/dashboard/${encodeURIComponent(storeSlug)}/plans`);
}
