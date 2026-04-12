import Link from "next/link";
import { getOwnerBillingStatus } from "@/lib/stripe/connect";
import { createRouteHandlerSupabaseClient } from "@/lib/supabase/server";
import OnboardingHeader from "../components/OnboardingHeader";
import OnboardingStepper from "../components/OnboardingStepper";

const steps = [
	{ id: "billing", label: "Connect Stripe", href: "/dashboard/onboarding/billing" },
	{ id: "store", label: "Create Store" },
	{ id: "plan", label: "Add Plan" },
	{ id: "staff", label: "Invite Staff" },
];

type BillingOnboardingPageProps = {
	searchParams?: Promise<{ error?: string; refresh?: string }>;
};

export default async function BillingOnboardingPage({
	searchParams,
}: BillingOnboardingPageProps) {
	const resolvedSearchParams = await searchParams;
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
		<div className="space-y-8">
			<OnboardingHeader
				title="Connect Stripe first"
				subtitle="Your owner billing account powers paid plans across every store you create."
			/>
			<OnboardingStepper steps={steps} currentId="billing" />
			{resolvedSearchParams?.error ? (
				<div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
					{resolvedSearchParams.error}
				</div>
			) : null}
			{resolvedSearchParams?.refresh ? (
				<div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
					Stripe setup is still in progress. Finish the Stripe onboarding form,
					then return here.
				</div>
			) : null}
			<div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
				<h2 className="text-lg font-semibold text-slate-900">
					One billing connection for all of your stores
				</h2>
				<p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
					Connect Stripe once at the owner account level. Every store you create
					can then publish paid plans under that same billing environment while
					SubMe keeps store and plan ownership separate in the app.
				</p>
				<div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
					<p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
						Billing status
					</p>
					<p className="mt-2 text-sm font-semibold text-slate-900">
						{isConnected
							? "Stripe connected and ready for paid plans."
							: billing?.stripeAccountId
								? "Stripe account found, but onboarding is not complete yet."
								: "No Stripe account connected yet."}
					</p>
				</div>
				<div className="mt-6 flex flex-wrap gap-3">
					<Link
						href="/api/stripe/connect?next=/dashboard/onboarding/store"
						className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
					>
						{billing?.stripeAccountId ? "Continue Stripe setup" : "Connect Stripe"}
					</Link>
					{isConnected ? (
						<Link
							href="/dashboard/onboarding/store"
							className="inline-flex items-center justify-center rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
						>
							Continue to store setup
						</Link>
					) : null}
				</div>
			</div>
		</div>
	);
}
