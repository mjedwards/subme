import Link from "next/link";

import { createRouteHandlerSupabaseClient } from "@/lib/supabase/server";
import { sendStaffInvite } from "./actions";

type StoreSettingsPageProps = {
	params: Promise<{ storeSlug: string }>;
	searchParams?: Promise<{ error?: string; success?: string }>;
};

export default async function StoreSettingsPage({
	params,
	searchParams,
}: StoreSettingsPageProps) {
	const { storeSlug } = await params;
	const resolvedSearchParams = await searchParams;
	const supabase = await createRouteHandlerSupabaseClient();
	const { data: store } = await supabase
		.from("stores")
		.select("id, name, slug, timezone")
		.eq("slug", storeSlug)
		.maybeSingle();
	const { data: authData } = await supabase.auth.getUser();
	const user = authData.user;

	if (!store) {
		return (
			<div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
				Store not found.
			</div>
		);
	}

	const { data: membership } = user
		? await supabase
				.from("store_staff")
				.select("role")
				.eq("store_id", store.id)
				.eq("profile_id", user.id)
				.eq("active", true)
				.maybeSingle()
		: { data: null };

	if (membership?.role !== "owner") {
		return (
			<div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-700">
				Only store owners can manage staff invites from settings.
			</div>
		);
	}

	const [{ data: staffRows }, { data: invites }] = await Promise.all([
		supabase
			.from("store_staff")
			.select("profile_id, role, active, work_email, profiles(name, email)")
			.eq("store_id", store.id)
			.order("created_at", { ascending: false }),
		supabase
			.from("staff_invites")
			.select("id, email, token, status, expires_at, created_at")
				.eq("store_id", store.id)
				.order("created_at", { ascending: false }),
	]);
	const pendingInvites = (invites ?? []).filter(
		(invite) => invite.status === "pending",
	);

	return (
		<div className="space-y-6">
			<section className="rounded-[2rem] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.16),_transparent_28%),linear-gradient(135deg,#ffffff,#f8fafc)] p-6 shadow-sm">
				<p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-600">
					Store Settings
				</p>
				<h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
					Manage {store.name}
				</h1>
				<p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
					Send staff invites, review who already has store access, and manage
					the onboarding links attached to this location.
				</p>
			</section>

			{resolvedSearchParams?.error ? (
				<div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
					{resolvedSearchParams.error}
				</div>
			) : null}
			{resolvedSearchParams?.success ? (
				<div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
					{resolvedSearchParams.success}
				</div>
			) : null}

			<div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr),minmax(22rem,0.85fr)]">
				<section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
					<p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
						Current Staff
					</p>
					<div className="mt-4 space-y-3">
						{staffRows?.length ? (
							staffRows.map((staff) => (
								<div
									key={`${staff.profile_id}-${staff.role}`}
									className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
								>
									<div className="flex items-center justify-between gap-4">
										<div>
											<p className="text-sm font-semibold text-slate-900">
												{staff.profiles?.name || staff.profiles?.email || "Staff member"}
											</p>
											<p className="mt-1 text-sm text-slate-600">
												{staff.work_email || staff.profiles?.email || "No work email"}
											</p>
										</div>
										<span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
											{staff.role}
										</span>
									</div>
								</div>
							))
						) : (
							<div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
								No staff members have accepted invites yet.
							</div>
						)}
					</div>
				</section>

				<section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
					<p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
						Invite Staff
					</p>
					<h2 className="mt-2 text-2xl font-semibold text-slate-900">
						Send a new invite
					</h2>
					<form action={sendStaffInvite} className="mt-6 space-y-4">
						<input type="hidden" name="storeSlug" value={store.slug} />
						<label className="block">
							<span className="text-sm font-medium text-slate-900">
								Work email
							</span>
							<input
								name="email"
								type="email"
								required
								placeholder="person@yourstore.com"
								className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-900"
							/>
						</label>
						<p className="text-xs leading-5 text-slate-500">
							Use the exact email the staff member should use to sign in. If a
							different email is used during acceptance, the invite will be
							rejected.
						</p>
						<button
							type="submit"
							className="inline-flex h-11 items-center justify-center rounded-full bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
						>
							Create staff invite
						</button>
					</form>

					<div className="mt-8 space-y-3">
						<p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
							Pending invites
						</p>
						{pendingInvites.length ? (
							pendingInvites.map((invite) => (
								<div
									key={invite.id}
									className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
								>
									<p className="text-sm font-semibold text-slate-900">
										{invite.email}
									</p>
									<p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">
										{invite.status} • expires{" "}
										{new Date(invite.expires_at).toLocaleDateString()}
									</p>
									<div className="mt-3">
										<Link
											href={`/staff/invite/${invite.token}`}
											className="inline-flex h-10 items-center justify-center rounded-full border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
										>
											Open invite
										</Link>
									</div>
								</div>
							))
						) : (
							<div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
								No invites have been created for this store yet.
							</div>
						)}
					</div>
				</section>
			</div>
		</div>
	);
}
