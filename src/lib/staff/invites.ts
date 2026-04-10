import { randomUUID } from "crypto";

import { createAdminClient } from "@/lib/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";

const STAFF_INVITE_TTL_DAYS = 7;

type InviteStaffParams = {
	supabase: SupabaseClient;
	storeSlug: string;
	ownerUserId: string;
	email: string;
	origin: string;
};

type InviteLookupResult = {
	id: string;
	store_id: string;
	email: string;
	role: "staff";
	token: string;
	status: "pending" | "accepted" | "revoked" | "expired";
	invited_by_user_id: string | null;
	accepted_by_user_id: string | null;
	expires_at: string;
	accepted_at: string | null;
	created_at: string;
	updated_at: string;
	stores?: {
		id: string;
		name: string;
		slug: string;
	};
};

export async function createStaffInvite({
	supabase,
	storeSlug,
	ownerUserId,
	email,
	origin,
}: InviteStaffParams) {
	const { data: store } = await supabase
		.from("stores")
		.select("id, name, slug")
		.eq("slug", storeSlug)
		.maybeSingle();

	if (!store) {
		return { error: "Store not found." };
	}

	const { data: membership } = await supabase
		.from("store_staff")
		.select("id, role")
		.eq("store_id", store.id)
		.eq("profile_id", ownerUserId)
		.eq("role", "owner")
		.eq("active", true)
		.maybeSingle();

	if (!membership) {
		return { error: "You do not have access to invite staff for this store." };
	}

	const { data: existingInvite } = await supabase
		.from("staff_invites")
		.select("id, token, expires_at, status")
		.eq("store_id", store.id)
		.eq("email", email)
		.eq("status", "pending")
		.gte("expires_at", new Date().toISOString())
		.order("created_at", { ascending: false })
		.limit(1)
		.maybeSingle();

	const inviteToken = existingInvite?.token ?? randomUUID();
	const expiresAt =
		existingInvite?.expires_at ??
		new Date(
			Date.now() + STAFF_INVITE_TTL_DAYS * 24 * 60 * 60 * 1000,
		).toISOString();

	if (!existingInvite) {
		const { error: inviteError } = await supabase.from("staff_invites").insert({
			id: randomUUID(),
			store_id: store.id,
			email,
			role: "staff",
			token: inviteToken,
			status: "pending",
			invited_by_user_id: ownerUserId,
			expires_at: expiresAt,
		});

		if (inviteError) {
			return { error: "Could not create this staff invite." };
		}
	}

	return {
		error: null,
		inviteUrl: `${origin}/staff/invite/${inviteToken}`,
		storeName: store.name,
		expiresAt,
	};
}

export async function getInviteByToken(
	supabase: SupabaseClient,
	token: string,
) {
	const { data, error } = await supabase
		.from("staff_invites")
		.select("*, stores(id, name, slug)")
		.eq("token", token)
		.maybeSingle<InviteLookupResult>();

	if (error || !data) {
		return { invite: null, error: "Invite not found." };
	}

	if (
		data.status === "pending" &&
		new Date(data.expires_at).getTime() < Date.now()
	) {
		await supabase
			.from("staff_invites")
			.update({ status: "expired" })
			.eq("id", data.id);
		return { invite: { ...data, status: "expired" as const }, error: null };
	}

	return { invite: data, error: null };
}

export async function acceptStaffInvite({
	supabase,
	token,
	userId,
	name,
}: {
	supabase: SupabaseClient;
	token: string;
	userId: string;
	name: string;
}) {
	const { invite, error } = await getInviteByToken(supabase, token);
	if (error || !invite) {
		return { error: "Invite not found." };
	}

	if (invite.status !== "pending") {
		return { error: "This invite is no longer available." };
	}

	const { data: authData } = await supabase.auth.getUser();
	const user = authData.user;
	if (!user || user.id !== userId) {
		return { error: "Please sign in again to accept this invite." };
	}

	if ((user.email ?? "").toLowerCase() !== invite.email.toLowerCase()) {
		return {
			error: "This invite belongs to a different email address.",
		};
	}

	await supabase.from("profiles").upsert({
		user_id: user.id,
		email: user.email ?? invite.email,
		name: name || user.user_metadata?.name || "",
	});

	const { error: membershipError } = await supabase.from("store_staff").upsert(
		{
			id: randomUUID(),
			store_id: invite.store_id,
			profile_id: user.id,
			role: "staff",
			active: true,
			work_email: invite.email,
		},
		{ onConflict: "store_id,profile_id" },
	);

	if (membershipError) {
		return { error: "Could not attach this account to the store." };
	}

	const admin = createAdminClient();
	const existingRoles = ((user.app_metadata?.roles as string[]) ?? []).slice();
	const nextRoles = Array.from(new Set([...existingRoles, "staff"]));
	const { error: roleError } = await admin.auth.admin.updateUserById(user.id, {
		app_metadata: {
			...user.app_metadata,
			roles: nextRoles,
		},
	});

	if (roleError) {
		return { error: "Could not update staff access for this account." };
	}

	const { error: inviteError } = await supabase
		.from("staff_invites")
		.update({
			status: "accepted",
			accepted_at: new Date().toISOString(),
			accepted_by_user_id: user.id,
		})
		.eq("id", invite.id);

	if (inviteError) {
		return { error: "Could not finalize this invite." };
	}

	return { error: null, storeSlug: invite.stores?.slug ?? "" };
}

export { STAFF_INVITE_TTL_DAYS };
