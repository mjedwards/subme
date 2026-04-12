import { createRouteHandlerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

function sanitizeNext(next?: string | null) {
	if (!next || !next.startsWith("/") || next.startsWith("//")) {
		return "";
	}

	return next;
}

export async function GET(request: Request) {
	const url = new URL(request.url);
	const code = url.searchParams.get("code");
	const next = sanitizeNext(url.searchParams.get("next"));

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
	const user = data.user;
	const roles = (data.user?.app_metadata?.roles as string[]) ?? [];
	const isOwner = roles.includes("owner");

	const warning = "profile_update_failed";
	const redirectUrl = new URL(next || "/account", request.url);
	let upsertError = false;

	if (user) {
		const { data: existingProfile } = await supabase
			.from("profiles")
			.select("onboarding_stage, onboarding_complete")
			.eq("user_id", user.id)
			.maybeSingle();

		const shouldInitializeOnboarding =
			isOwner &&
			(!existingProfile ||
				(!existingProfile.onboarding_stage &&
					!existingProfile.onboarding_complete));

		const profilePayload: Record<string, string | boolean | undefined> = {
			user_id: user?.id,
			email: user?.email,
			name: user?.user_metadata?.name ?? "",
		};

		if (shouldInitializeOnboarding) {
			profilePayload.onboarding_stage = "billing";
			profilePayload.onboarding_complete = false;
		}

		const { error } = await supabase.from("profiles").upsert(profilePayload);
		if (error) {
			upsertError = true;
		}
	}

	if (upsertError) {
		redirectUrl.searchParams.set("toast", warning);
	}

	if (roles.includes("owner") || roles.includes("staff")) {
		if (isOwner) {
			return NextResponse.redirect(
				new URL(next || "/dashboard/onboarding", request.url),
			);
		}
		return NextResponse.redirect(new URL(next || "/dashboard", request.url));
	}

	return NextResponse.redirect(redirectUrl);
}
