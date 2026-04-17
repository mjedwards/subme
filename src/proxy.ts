// src/proxy.ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
	const response = NextResponse.next();

	const supabase = createServerClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
		{
			cookies: {
				getAll: () => request.cookies.getAll(),
				setAll: (cookies) => {
					cookies.forEach(({ name, value, options }) =>
						response.cookies.set(name, value, options),
					);
				},
			},
		},
	);

	const { data: userData, error: userError } = await supabase.auth.getUser();
	const hasSession = !!userData.user && !userError;

	if (!hasSession) {
		return NextResponse.redirect(new URL("/login", request.url));
	}

	const roles = (userData.user?.app_metadata?.roles as string[]) ?? [];
	const isOwner = roles.includes("owner");
	const isStaff = roles.includes("staff") || isOwner;
	const isCustomer = roles.includes("customer");

	const pathname = request.nextUrl.pathname;
	const isStaffRoute =
		pathname.startsWith("/dashboard") ||
		pathname.startsWith("/scan") ||
		pathname.startsWith("/redeem");
	const isCustomerRoute = pathname.startsWith("/account");
	const isOnboardingRoute = pathname.startsWith("/dashboard/onboarding");
	const isBillingOnboardingRoute = pathname === "/dashboard/onboarding/billing";
	const isOwnerSettingsRoute = pathname === "/dashboard/settings";

	if (isStaffRoute && !isStaff) {
		const redirectTarget = isCustomer ? "/account" : "/login";
		return NextResponse.redirect(new URL(redirectTarget, request.url));
	}

	if (isCustomerRoute && !isCustomer) {
		const redirectTarget = isStaff ? "/dashboard" : "/login";
		return NextResponse.redirect(new URL(redirectTarget, request.url));
	}

	if (isStaffRoute && isOwner) {
		const isEmailConfirmed = !!userData.user?.email_confirmed_at;
		if (!isEmailConfirmed) {
			return NextResponse.redirect(
				new URL(
					"/signup/confirm?message=Please%20verify%20your%20email%20before%20continuing.",
					request.url,
				),
			);
		}

		const { data: profile } = await supabase
			.from("profiles")
			.select("onboarding_stage, onboarding_complete")
			.eq("user_id", userData.user.id)
			.maybeSingle();

		const onboardingComplete = !!profile?.onboarding_complete;
		const rawOnboardingStage = profile?.onboarding_stage ?? "store";
		const onboardingStage =
			rawOnboardingStage === "billing" ? "store" : rawOnboardingStage;

		if (onboardingComplete && isOnboardingRoute && !isBillingOnboardingRoute) {
			return NextResponse.redirect(new URL("/dashboard", request.url));
		}

		if (!onboardingComplete) {
			const currentStage = pathname.split("/").slice(3)[0];
			const isOnStageRoute =
				isOnboardingRoute && currentStage === onboardingStage;
			const canBypassOnboardingRedirect = isOwnerSettingsRoute;

			let storeSlugParam = request.nextUrl.searchParams.get("storeSlug") ?? "";
			if (!storeSlugParam && (onboardingStage === "plan" || onboardingStage === "staff")) {
				const { data: storeMembership } = await supabase
					.from("store_staff")
					.select("store_id")
					.eq("profile_id", userData.user.id)
					.eq("role", "owner")
					.order("created_at", { ascending: true })
					.limit(1)
					.maybeSingle();

				if (storeMembership?.store_id) {
					const { data: store } = await supabase
						.from("stores")
						.select("slug")
						.eq("id", storeMembership.store_id)
						.maybeSingle();
					storeSlugParam = store?.slug ?? "";
				}
			}

			if (!isOnStageRoute && !canBypassOnboardingRedirect) {
				const url = new URL(
					`/dashboard/onboarding/${onboardingStage}`,
					request.url,
				);
				if (storeSlugParam) {
					url.searchParams.set("storeSlug", storeSlugParam);
				}
				return NextResponse.redirect(url);
			}
		}
	}

	return response;
}

export const config = {
	matcher: [
		"/scan/:path*",
		"/redeem/:path*",
		"/dashboard/:path*",
		"/account/:path*",
	],
};
