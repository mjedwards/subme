/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAdminClient } from "@/lib/supabase/admin";
import { createRouteHandlerSupabaseClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

type SignUpRole = "customer" | "owner";

interface SignUpRequest {
	email: string;
	name?: string;
	password: string;
	role: SignUpRole;
}

function getOrigin(req: NextRequest) {
	const proto = req.headers.get("x-forwarded-proto");
	const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
	if (proto && host) return `${proto}://${host}`;
	return req.nextUrl.origin;
}

export async function POST(request: NextRequest) {
	try {
		const body: SignUpRequest = await request.json();
		const redirectURL = getOrigin(request);

		if (!body.email || !body.password) {
			return NextResponse.json({ error: "Email and password are required" });
		}

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(body.email)) {
			return NextResponse.json({
				error: "Please provide a valid email address",
			});
		}

		const { email, name, password, role } = body;
		const userRole: SignUpRole = role === "owner" ? "owner" : "customer";

		const supabase = await createRouteHandlerSupabaseClient();

		const { data, error } = await supabase.auth.signUp({
			email: email,
			password: password,
			options: {
				emailRedirectTo: `${redirectURL}/auth/callback`,
				data: {
					name: name,
				},
			},
		});

		if (error) {
			console.error("Signup error", error);

			if (error.message.includes("already registered")) {
				return NextResponse.json({
					error:
						"An account with this email already exists. Please sign in instead.",
				});
			}
			if (error.message.includes("password")) {
				return NextResponse.json({
					error:
						"Password does not meet requirements. Please use at least 8 characters.",
				});
			}

			return NextResponse.json({
				error: error.message || "Failed to create an account",
			});
		}

		if (!data.user) {
			return NextResponse.json(
				{ error: "Failed to create an account" },
				{ status: 500 },
			);
		}

		const admin = createAdminClient();
		const { error: roleError } = await admin.auth.admin.updateUserById(
			data.user.id,
			{
				app_metadata: {
					roles: [userRole],
				},
			},
		);

		if (roleError) {
			console.error("Role assignment error", roleError);
			return NextResponse.json(
				{ error: "Account created but role setup failed." },
				{ status: 500 },
			);
		}

		const needsConfirmation = !data.session;

		return NextResponse.json({
			success: true,
			user: {
				id: data.user.id,
				email: data.user.email,
				emailConfirmed: data.user.email_confirmed_at ? true : false,
				roles: [userRole],
			},
			needsConfirmation,
			message: needsConfirmation
				? "Account created! Please check your email to verify your account before signing in."
				: "Account created and signed in successfully!",
		});
	} catch (err: any) {
		console.error("Signup error:", err);
		return NextResponse.json(
			{ error: "Internal server error. Please try again." },
			{ status: 500 },
		);
	}
}
