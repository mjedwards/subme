import { createAdminClient } from "@/lib/supabase/admin";
import { getStripeServerClient } from "@/lib/stripe/server";
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
		const { data: authData, error: authError } = await supabase.auth.getUser();
		const user = authData.user;
		const roles = (authData.user?.app_metadata?.roles as string[]) ?? [];

		if (authError || !user || !roles.includes("owner")) {
			return NextResponse.redirect(
				new URL("/login?error=Please%20sign%20in%20as%20an%20owner", request.url),
			);
		}

		const admin = createAdminClient();
		const { data: profile } = await admin
			.from("profiles")
			.select("stripe_account_id")
			.eq("user_id", user.id)
			.maybeSingle<{ stripe_account_id: string | null }>();

		const stripe = getStripeServerClient();
		const accountId =
			profile?.stripe_account_id ??
			(
				await stripe.accounts.create({
					type: "express",
					email: user.email ?? undefined,
					metadata: {
						profile_id: user.id,
					},
				})
			).id;

		if (!profile?.stripe_account_id) {
			await admin
				.from("profiles")
				.update({ stripe_account_id: accountId })
				.eq("user_id", user.id);
		}

		const accountLink = await stripe.accountLinks.create({
			account: accountId,
			type: "account_onboarding",
			refresh_url: `${request.nextUrl.origin}/dashboard/onboarding/billing?refresh=1`,
			return_url: `${request.nextUrl.origin}/api/stripe/connect/return?next=${encodeURIComponent(next)}`,
		});

		return NextResponse.redirect(accountLink.url);
	} catch (error) {
		console.error("Stripe connect route error:", error);
		return NextResponse.redirect(
			new URL(
				"/dashboard/onboarding/billing?error=Unable%20to%20start%20Stripe%20setup",
				request.url,
			),
		);
	}
}
