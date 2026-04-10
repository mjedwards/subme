import { createRouteHandlerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
	request: Request,
	{ params }: { params: { storeSlug: string } },
) {
	try {
		const supabase = await createRouteHandlerSupabaseClient();
		const { data: userData, error: userError } = await supabase.auth.getUser();

		if (userError || !userData.user) {
			return NextResponse.json({ user: null }, { status: 401 });
		}

		const { storeSlug } = params;

		const { data: store, error } = await supabase
			.from("stores")
			.select("*")
			.eq("slug", storeSlug)
			.single();

		if (error || !store) {
			return NextResponse.json({ error: "Store not found" }, { status: 404 });
		}

		const { data: membership } = await supabase
			.from("store_staff")
			.select("id")
			.eq("store_id", store.id)
			.eq("profile_id", userData.user.id)
			.eq("role", "owner")
			.eq("active", true)
			.maybeSingle();

		if (!membership) {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		return NextResponse.json({ store });
	} catch {
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
