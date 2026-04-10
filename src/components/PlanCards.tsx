import Link from "next/link";

type Plan = {
	id: string;
	name: string;
	description: string | null;
	benefit_type: string | null;
	redemptions_per_period: number | null;
	active: boolean | null;
};

type PlanCardsProps = {
	storeSlug: string;
	isAuthenticated: boolean;
	plans: Plan[];
	activePlanIds?: string[];
	hasActiveStoreSubscription?: boolean;
};

export default function PlanCards({
	storeSlug,
	isAuthenticated,
	plans,
	activePlanIds = [],
	hasActiveStoreSubscription = false,
}: PlanCardsProps) {
	return (
		<div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
			{plans.map((plan) => {
				const subscribeHref = `/subscribe?storeSlug=${encodeURIComponent(storeSlug)}&planId=${encodeURIComponent(plan.id)}`;
				const authHref = `/login?next=${encodeURIComponent(subscribeHref)}`;
				const isCurrentPlan = activePlanIds.includes(plan.id);
				const disableSubscribe = isAuthenticated && hasActiveStoreSubscription;

				return (
					<article
						key={plan.id}
						className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"
					>
						<div className="flex items-start justify-between gap-4">
							<div>
								<p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
									Manual Plan
								</p>
								<h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
									{plan.name}
								</h2>
							</div>
							<span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
								{plan.active ? "Active" : "Hidden"}
							</span>
						</div>
						<p className="mt-4 text-sm leading-6 text-slate-600">
							{plan.description || "No description has been added yet."}
						</p>
						<div className="mt-5 grid gap-3">
							<StatRow
								label="Benefit"
								value={plan.benefit_type || "Not specified"}
							/>
							<StatRow
								label="Redemptions per period"
								value={`${plan.redemptions_per_period ?? 1}`}
							/>
						</div>
						<div className="mt-6">
							{disableSubscribe ? (
								<div className="inline-flex h-11 w-full items-center justify-center rounded-full bg-slate-200 px-5 text-sm font-semibold text-slate-500">
									{isCurrentPlan ? "Already subscribed" : "Store subscription active"}
								</div>
							) : (
								<Link
									href={isAuthenticated ? subscribeHref : authHref}
									className="inline-flex h-11 w-full items-center justify-center rounded-full bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-700"
								>
									{isAuthenticated ? "Subscribe now" : "Log in to subscribe"}
								</Link>
							)}
							{isAuthenticated ? (
								<p className="mt-3 text-xs text-slate-500">
									{hasActiveStoreSubscription
										? isCurrentPlan
											? "You already have this plan active for this store."
											: "You already have an active subscription for this store."
										: "This creates an active manual subscription immediately for QR testing."}
								</p>
							) : (
								<p className="mt-3 text-xs text-slate-500">
									You can browse plans while signed out. Subscription requires a
									customer account.
								</p>
							)}
						</div>
					</article>
				);
			})}
		</div>
	);
}

function StatRow({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
			<p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
				{label}
			</p>
			<p className="text-sm font-medium text-slate-900">{value}</p>
		</div>
	);
}
