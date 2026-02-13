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

	const { data } = await supabase.auth.getSession();
	const hasSession = !!data.session;

	if (!hasSession) {
		return NextResponse.redirect(new URL("/login", request.url));
	}

	const roles = (data.session?.user.app_metadata?.roles as string[]) ?? [];
	const isStaff = roles.includes("staff") || roles.includes("owner");
	const isCustomer = roles.includes("customer");

	const pathname = request.nextUrl.pathname;
	const isStaffRoute =
		pathname.startsWith("/dashboard") ||
		pathname.startsWith("/scan") ||
		pathname.startsWith("/redeem");
	const isCustomerRoute = pathname.startsWith("/account");

	if (isStaffRoute && !isStaff) {
		const redirectTarget = isCustomer ? "/account" : "/login";
		return NextResponse.redirect(new URL(redirectTarget, request.url));
	}

	if (isCustomerRoute && !isCustomer) {
		const redirectTarget = isStaff ? "/dashboard" : "/login";
		return NextResponse.redirect(new URL(redirectTarget, request.url));
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
