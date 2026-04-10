import Link from "next/link";

import { getInviteByToken } from "@/lib/staff/invites";
import { createRouteHandlerSupabaseClient } from "@/lib/supabase/server";
import { completeStaffInvite } from "./actions";

type StaffInvitePageProps = {
	params: Promise<{ token: string }>;
	searchParams?: Promise<{ error?: string }>;
};

export default async function StaffInvitePage({
	params,
	searchParams,
}: StaffInvitePageProps) {
	const { token } = await params;
	const resolvedSearchParams = await searchParams;
	const supabase = await createRouteHandlerSupabaseClient();
	const [{ invite }, { data: authData }] = await Promise.all([
		getInviteByToken(supabase, token),
		supabase.auth.getUser(),
	]);
	const user = authData.user;

	if (!invite) {
		return (
			<div className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900">
				<div className="mx-auto max-w-3xl rounded-[2rem] border border-rose-200 bg-rose-50 p-8 shadow-sm">
					<p className="text-xs font-semibold uppercase tracking-[0.3em] text-rose-500">
						Invite Not Found
					</p>
					<h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
						This staff invite is not available.
					</h1>
					<p className="mt-3 text-sm leading-6 text-slate-600">
						The invite link may be invalid, expired, or already removed.
					</p>
				</div>
			</div>
		);
	}

	const invitedEmail = invite.email.toLowerCase();
	const signedInEmail = (user?.email ?? "").toLowerCase();
	const nextPath = `/staff/invite/${encodeURIComponent(token)}`;

	return (
		<div className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900">
			<div className="mx-auto max-w-4xl space-y-6">
				<section className="rounded-[2rem] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.16),_transparent_28%),linear-gradient(135deg,#ffffff,#f8fafc)] p-8 shadow-sm">
					<p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-600">
						Staff Invite
					</p>
					<h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900">
						Join {invite.stores?.name ?? "this store"} as staff.
					</h1>
					<p className="mt-4 max-w-3xl text-sm leading-6 text-slate-600">
						This invite is locked to <span className="font-semibold">{invite.email}</span>.
						Use that exact email to create or access the account that will scan
						and redeem for this store.
					</p>
				</section>

				{resolvedSearchParams?.error ? (
					<div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
						{resolvedSearchParams.error}
					</div>
				) : null}

				{invite.status !== "pending" ? (
					<section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
						<p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
							Invite status
						</p>
						<h2 className="mt-3 text-2xl font-semibold text-slate-900">
							This invite is {invite.status}.
						</h2>
						<p className="mt-3 text-sm leading-6 text-slate-600">
							If you still need access, ask the store owner to send a new
							invite.
						</p>
					</section>
				) : !user ? (
					<section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
						<p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
							Access required
						</p>
						<h2 className="mt-3 text-2xl font-semibold text-slate-900">
							Sign in or create an account for {invite.email}.
						</h2>
						<p className="mt-3 text-sm leading-6 text-slate-600">
							If you are new, create a staff account with the invited email. If
							you already have an account under that email, sign in and return to
							this invite automatically.
						</p>
						<div className="mt-6 flex flex-wrap gap-3">
							<Link
								href={`/login?next=${encodeURIComponent(nextPath)}&email=${encodeURIComponent(invitedEmail)}`}
								className="inline-flex h-11 items-center justify-center rounded-full bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-700"
							>
								Sign in
							</Link>
							<Link
								href={`/signup?next=${encodeURIComponent(nextPath)}&email=${encodeURIComponent(invitedEmail)}&role=staff`}
								className="inline-flex h-11 items-center justify-center rounded-full border border-slate-300 px-5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
							>
								Create staff account
							</Link>
						</div>
					</section>
				) : signedInEmail !== invitedEmail ? (
					<section className="rounded-[2rem] border border-amber-200 bg-amber-50 p-8 shadow-sm">
						<p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-700">
							Wrong account
						</p>
						<h2 className="mt-3 text-2xl font-semibold text-slate-900">
							You are signed in as {user.email}.
						</h2>
						<p className="mt-3 text-sm leading-6 text-slate-700">
							This invite only works for {invite.email}. Sign out and use the
							invited email to continue.
						</p>
					</section>
				) : (
					<section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
						<p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
							Staff onboarding
						</p>
						<h2 className="mt-3 text-2xl font-semibold text-slate-900">
							Complete your staff profile.
						</h2>
						<form action={completeStaffInvite} className="mt-6 space-y-4">
							<input type="hidden" name="token" value={token} />
							<label className="block">
								<span className="text-sm font-medium text-slate-900">
									Full name
								</span>
								<input
									name="name"
									type="text"
									required
									defaultValue={user.user_metadata?.name ?? ""}
									className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-900"
								/>
							</label>
							<label className="block">
								<span className="text-sm font-medium text-slate-900">
									Work email
								</span>
								<input
									type="email"
									value={invite.email}
									readOnly
									className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 outline-none"
								/>
							</label>
							<label className="block">
								<span className="text-sm font-medium text-slate-900">
									Assigned store
								</span>
								<input
									type="text"
									value={invite.stores?.name ?? "Store"}
									readOnly
									className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 outline-none"
								/>
							</label>
							<button
								type="submit"
								className="inline-flex h-11 items-center justify-center rounded-full bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-700"
							>
								Complete onboarding
							</button>
						</form>
					</section>
				)}
			</div>
		</div>
	);
}
