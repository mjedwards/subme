import { createRouteHandlerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
	const url = new URL(request.url);
	const code = url.searchParams.get("code");

	if (!code) {
		return NextResponse.redirect(
			new URL("/login?error=Missing%20verification%20code", request.url),
		);
	}

	const supabase = await createRouteHandlerSupabaseClient();
	const { error } = await supabase.auth.exchangeCodeForSession(code);

	if (error) {
		return NextResponse.redirect(
			new URL(
				"/login?error=Verification%20failed.%20Please%20try%20again.",
				request.url,
			),
		);
	}

	const { data } = await supabase.auth.getUser();
	console.log(data);
	const roles = (data.user?.app_metadata?.roles as string[]) ?? [];

	if (roles.includes("owner") || roles.includes("staff")) {
		return NextResponse.redirect(new URL("/dashboard", request.url));
	}

	return NextResponse.redirect(new URL("/account", request.url));
}
