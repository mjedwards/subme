import Link from "next/link";
import { getOwnerBillingStatus } from "@/lib/stripe/connect";
import { createRouteHandlerSupabaseClient } from "@/lib/supabase/server";
import OnboardingHeader from "../components/OnboardingHeader";
import OnboardingStepper from "../components/OnboardingStepper";
import { createPlan } from "../actions/createPlan";
import { skipPlan } from "../actions/advanceOnboarding";

type PlanOnboardingPageProps = {
	searchParams?: Promise<{ storeSlug?: string; error?: string }>;
};

export default async function PlanOnboardingPage({
	searchParams,
}: PlanOnboardingPageProps) {
	const resolvedSearchParams = await searchParams;
	const storeSlug = resolvedSearchParams?.storeSlug ?? "";
	const supabase = await createRouteHandlerSupabaseClient();
	const { data: authData } = await supabase.auth.getUser();
	const user = authData.user;
	const billing = user ? await getOwnerBillingStatus(user.id) : null;
	const paymentsEnabled = !!(
		billing?.stripeAccountId &&
		billing.chargesEnabled &&
		billing.payoutsEnabled
	);
	const steps = [
		{ id: "store", label: "Create Store", href: "/dashboard/onboarding/store" },
		{
			id: "plan",
			label: "Add Plan",
			href: storeSlug
				? `/dashboard/onboarding/plan?storeSlug=${encodeURIComponent(storeSlug)}`
				: undefined,
		},
		{ id: "staff", label: "Invite Staff" },
	];

	return (
		<div className="space-y-8">
			<OnboardingHeader
				title="Add your first plan"
				subtitle="Plans define the subscription options your customers can choose."
			/>
			<OnboardingStepper steps={steps} currentId="plan" />
			{resolvedSearchParams?.error ? (
				<div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
					{resolvedSearchParams.error}
				</div>
			) : null}
			{!paymentsEnabled ? (
				<div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
					Plans can be created now, but they will stay in draft mode until you{" "}
					<Link href="/dashboard/settings" className="font-semibold text-amber-950">
						enable payments
					</Link>
					.
				</div>
			) : null}
			{!storeSlug ? (
				<div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-700">
					Create a store before adding a plan.
					<Link
						href="/dashboard/onboarding/store"
						className="ml-2 font-semibold text-amber-900"
					>
						Go to store setup
					</Link>
				</div>
			) : (
				<form action={createPlan} className="space-y-6">
					<input type="hidden" name="storeSlug" value={storeSlug} />
					<div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
						<div className="space-y-2">
							<label
								className="text-sm font-medium text-slate-900"
								htmlFor="name"
							>
								Plan name
							</label>
							<input
								id="name"
								name="name"
								type="text"
								placeholder="e.g. Monthly Coffee Club"
								className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
								required
							/>
						</div>
						<div className="mt-4 space-y-2">
							<label
								className="text-sm font-medium text-slate-900"
								htmlFor="description"
							>
								Description
							</label>
							<textarea
								id="description"
								name="description"
								rows={3}
								placeholder="Optional details for your customers."
								className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
							/>
						</div>
						<div className="mt-4 grid gap-4 sm:grid-cols-2">
							<div className="space-y-2">
								<label
									className="text-sm font-medium text-slate-900"
									htmlFor="benefitType"
								>
									Benefit type
								</label>
								<input
									id="benefitType"
									name="benefitType"
									type="text"
									placeholder="e.g. Free drink"
									className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
								/>
							</div>
							<div className="space-y-2">
								<label
									className="text-sm font-medium text-slate-900"
									htmlFor="amount"
								>
									Price
								</label>
								<input
									id="amount"
									name="amount"
									type="number"
									min="1"
									step="0.01"
									placeholder="9.99"
									className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
									required
								/>
							</div>
						</div>
						<div className="mt-4 grid gap-4 sm:grid-cols-2">
							<div className="space-y-2">
								<label
									className="text-sm font-medium text-slate-900"
									htmlFor="billingInterval"
								>
									Billing interval
								</label>
								<select
									id="billingInterval"
									name="billingInterval"
									defaultValue="month"
									className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
								>
									<option value="month">Monthly</option>
									<option value="year">Yearly</option>
								</select>
							</div>
							<div className="space-y-2">
								<label
									className="text-sm font-medium text-slate-900"
									htmlFor="redemptions"
								>
									Redemptions per period
								</label>
								<input
									id="redemptions"
									name="redemptions"
									type="number"
									min={1}
									defaultValue={1}
									className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
								/>
							</div>
						</div>
						<label className="mt-4 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
							<input
								type="checkbox"
								name="active"
								defaultChecked={paymentsEnabled}
								disabled={!paymentsEnabled}
								className="h-4 w-4"
							/>
							{paymentsEnabled
								? "Publish this plan after creation"
								: "Enable payments to publish this plan"}
						</label>
					</div>
					<div className="flex flex-wrap items-center gap-3">
						<button
							type="submit"
							className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
						>
							Continue
						</button>
						<button
							type="submit"
							formAction={skipPlan}
							formNoValidate
							className="text-sm font-semibold text-slate-600 hover:text-slate-900"
						>
							Skip for now
						</button>
					</div>
				</form>
			)}
		</div>
	);
}
