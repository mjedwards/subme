import { createRouteHandlerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
	try {
		const supabase = await createRouteHandlerSupabaseClient();
		const { data: userData, error: userError } =
			await supabase.auth.getUser();

		if (userError || !userData.user) {
			return NextResponse.json({ user: null }, { status: 401 });
		}

		const user = userData.user;

		const [{ data: staffRows, error: staffError }, { data: customerRows, error: customerError }] =
			await Promise.all([
				supabase
					.from("store_staff")
					.select("store_id, role")
					.eq("profile_id", user.id)
					.eq("active", true),
				supabase
					.from("customers")
					.select("store_id")
					.eq("profile_id", user.id),
			]);

		if (staffError || customerError) {
			return NextResponse.json(
				{ error: "Failed to load roles" },
				{ status: 500 },
			);
		}

		const roles = {
			isStaff: (staffRows ?? []).some((row) => row.role === "staff"),
			isOwner: (staffRows ?? []).some((row) => row.role === "owner"),
			isCustomer: (customerRows ?? []).length > 0,
		};

		const storeIds = Array.from(
			new Set([
				...(staffRows ?? []).map((row) => row.store_id),
				...(customerRows ?? []).map((row) => row.store_id),
			]),
		);

		return NextResponse.json({
			user: {
				id: user.id,
				email: user.email,
				name: user.user_metadata?.name ?? "",
			},
			roles,
			storeIds,
		});
	} catch {
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
