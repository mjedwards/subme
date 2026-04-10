import { getStoreSubscribersPayload } from "@/lib/dashboard/subscribers";
import { createRouteHandlerSupabaseClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

type RouteProps = {
	params: Promise<{ storeSlug: string }>;
};

export async function GET(_request: NextRequest, { params }: RouteProps) {
	try {
		const { storeSlug } = await params;
		const supabase = await createRouteHandlerSupabaseClient();
		const { data: authData, error: authError } = await supabase.auth.getUser();
		const user = authData.user;

		if (authError || !user) {
			return NextResponse.json({ error: "Authentication required." }, { status: 401 });
		}

		const result = await getStoreSubscribersPayload(storeSlug, user.id);

		if ("error" in result) {
			return NextResponse.json({ error: result.error }, { status: result.status });
		}

		return NextResponse.json(result.data, {
			headers: {
				"Cache-Control": "no-store",
			},
		});
	} catch (error) {
		console.error("Subscribers route error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
