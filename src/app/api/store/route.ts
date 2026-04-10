import { createRouteHandlerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
	try {
		const supabase = await createRouteHandlerSupabaseClient();
		const { data: userData, error: userError } = await supabase.auth.getUser();

		if (userError || !userData.user) {
			return NextResponse.json({ user: null }, { status: 401 });
		}

		const user = userData.user;

		const [{ data: staffRows, error: staffError }] = await Promise.all([
			supabase
				.from("store_staff")
				.select("store_id")
				.eq("profile_id", user.id)
				.eq("active", true),
		]);

		if (staffError) {
			return NextResponse.json(
				{ error: "Failed to load roles" },
				{ status: 500 },
			);
		}

		const storeIds = Array.from(
			new Set([...(staffRows ?? []).map((row) => row.store_id)]),
		);

		const { data, error } = await supabase
			.from("stores")
			.select("*")
			.in("id", storeIds);

		if (error) {
			return NextResponse.json(
				{ error: "Failed to load stores" },
				{ status: 500 },
			);
		}

		return NextResponse.json({
			stores: { data },
		});
	} catch {
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
