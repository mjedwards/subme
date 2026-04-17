import { syncStripeBillingStatus } from "@/lib/stripe/connect";
import { createRouteHandlerSupabaseClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

function sanitizeNext(next?: string | null) {
	if (!next || !next.startsWith("/") || next.startsWith("//")) {
		return "/dashboard/onboarding/store";
	}

	return next;
}

export async function GET(request: NextRequest) {
	try {
		const next = sanitizeNext(request.nextUrl.searchParams.get("next"));
		const supabase = await createRouteHandlerSupabaseClient();
		const { data: authData } = await supabase.auth.getUser();
		const user = authData.user;

		if (!user) {
			return NextResponse.redirect(new URL("/login", request.url));
		}

		const billing = await syncStripeBillingStatus(user.id);

		if (billing.chargesEnabled && billing.payoutsEnabled) {
			return NextResponse.redirect(new URL(next, request.url));
		}

		return NextResponse.redirect(
			new URL(
				"/dashboard/settings?error=Stripe%20setup%20is%20not%20finished%20yet",
				request.url,
			),
		);
	} catch (error) {
		console.error("Stripe connect return error:", error);
		return NextResponse.redirect(
			new URL(
				"/dashboard/settings?error=Unable%20to%20verify%20Stripe%20setup",
				request.url,
			),
		);
	}
}
