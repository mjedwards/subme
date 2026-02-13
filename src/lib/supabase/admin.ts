import { createClient } from "@supabase/supabase-js";

const supaURL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function createAdminClient() {
	if (!supaURL || !serviceRoleKey) {
		throw new Error("Missing Supabase service role credentials");
	}
	return createClient(supaURL, serviceRoleKey, {
		auth: {
			persistSession: false,
			autoRefreshToken: false,
		},
	});
}
