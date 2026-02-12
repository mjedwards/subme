/* eslint-disable @typescript-eslint/no-explicit-any */
import { createRouteHandlerSupabaseClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

interface SignInRequest {
	email: string;
	password: string;
}

export async function POST(request: NextRequest) {
	try {
		const body: SignInRequest = await request.json();

		if (!body.email || !body.password) {
			return NextResponse.json({ error: "Email and password are required" });
		}

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(body.email)) {
			return NextResponse.json({
				error: "Please provide a valid email address",
			});
		}

		const { email, password } = body;

		const supabase = await createRouteHandlerSupabaseClient();

		const { data, error } = await supabase.auth.signInWithPassword({
			email,
			password,
		});

		if (error || !data.user || !data.session) {
			return NextResponse.json({ error: "Sign in failed. Please try again." });
		}

		return NextResponse.json({
			success: true,
			user: {
				id: data.user.id,
				email: data.user.email,
				name: data.user.user_metadata?.name || "",
				emailConfirmed: !!data.user.email_confirmed_at,
				onboardingCompleted: !!data.user.user_metadata?.onboarding_completed,
			},
			session: {
				accessToken: data.session.access_token,
				refreshToken: data.session.refresh_token,
				expiresAt: data.session.expires_at,
				tokenType: data.session.token_type,
			},
			message: "Signed in successfully!",
		});
	} catch (err: any) {
		console.error("Sign in error:", err);
		return NextResponse.json(
			{ error: "Internal server error. Please try again." },
			{ status: 500 },
		);
	}
}
