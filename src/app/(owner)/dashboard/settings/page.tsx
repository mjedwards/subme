import Link from "next/link";
import { getOwnerBillingStatus } from "@/lib/stripe/connect";
import { createRouteHandlerSupabaseClient } from "@/lib/supabase/server";

export default async function DashboardSettingsPage() {
	const supabase = await createRouteHandlerSupabaseClient();
	const { data: authData } = await supabase.auth.getUser();
	const user = authData.user;
	const billing = user ? await getOwnerBillingStatus(user.id) : null;
	const isConnected = !!(
		billing?.stripeAccountId &&
		billing.chargesEnabled &&
		billing.payoutsEnabled
	);

	return (
		<div className='space-y-4'>
			<h1 className='text-2xl font-semibold text-slate-900'>
				Account Settings
			</h1>
			<p className='text-slate-600'>Details about account</p>
			<section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
				<p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
					Owner Billing
				</p>
				<h2 className="mt-2 text-2xl font-semibold text-slate-900">
					Stripe connection
				</h2>
				<p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
					Connect Stripe once at the owner level. Paid plans from all of your
					stores will bill through this account, while SubMe keeps store and
					plan ownership separate in the app.
				</p>
				<div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
					<p className="text-sm font-semibold text-slate-900">
						{isConnected
							? "Stripe connected and ready for paid plans."
							: billing?.stripeAccountId
								? "Stripe account found, but onboarding is not complete yet."
								: "No Stripe account connected yet."}
					</p>
				</div>
				<div className="mt-5">
					<Link
						href="/api/stripe/connect?next=/dashboard/settings"
						className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
					>
						{billing?.stripeAccountId ? "Manage Stripe setup" : "Connect Stripe"}
					</Link>
				</div>
			</section>
		</div>
	);
}
