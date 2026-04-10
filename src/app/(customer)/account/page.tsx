import QrCodeCard from "@/components/QrCodeCard";
import { createRouteHandlerSupabaseClient } from "@/lib/supabase/server";
import Link from "next/link";

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["active", "trialing"]);

type CustomerAccountPageProps = {
	searchParams?: Promise<{ storeId?: string }>;
};

type CustomerRow = {
	id: string;
	store_id: string;
};

type SubscriptionRow = {
	id: string;
	store_id: string;
	customer_id: string;
	plan_id: string;
	status: string | null;
	provider: string | null;
	current_period_start: string | null;
	current_period_end: string | null;
	cancel_at_period_end: boolean | null;
	created_at: string;
};

type PlanRow = {
	id: string;
	name: string;
	description: string | null;
	benefit_type: string | null;
	redemptions_per_period: number | null;
};

type StoreRow = {
	id: string;
	name: string;
	slug: string;
	address_text: string | null;
	timezone: string | null;
};

type RedemptionRow = {
	subscription_id: string;
	period_start: string;
	redeemed_at: string;
	note: string | null;
};

export default async function CustomerAccountPage({
	searchParams,
}: CustomerAccountPageProps) {
	const resolvedSearchParams = await searchParams;
	const selectedStoreId = resolvedSearchParams?.storeId?.trim() ?? "";
	const supabase = await createRouteHandlerSupabaseClient();
	const { data: authData } = await supabase.auth.getUser();
	const user = authData.user;

	if (!user) {
		return null;
	}

	const { data: customerRows } = await supabase
		.from("customers")
		.select("id, store_id")
		.eq("profile_id", user.id);

	const customers = (customerRows ?? []) as CustomerRow[];
	const customerIds = customers.map((customer) => customer.id);
	const customerStoreIds = customers.map((customer) => customer.store_id);

	const { data: subscriptionRows } = customerIds.length
		? await supabase
				.from("subscriptions")
				.select(
					"id, store_id, customer_id, plan_id, status, provider, current_period_start, current_period_end, cancel_at_period_end, created_at",
				)
				.in("customer_id", customerIds)
				.order("created_at", { ascending: false })
		: { data: [] as SubscriptionRow[] };

	const subscriptions = ((subscriptionRows ?? []) as SubscriptionRow[]).filter(
		(subscription) =>
			subscription.status && ACTIVE_SUBSCRIPTION_STATUSES.has(subscription.status),
	);
	const distinctSubscriptions = getDistinctActiveSubscriptions(subscriptions);

	const planIds = Array.from(
		new Set(distinctSubscriptions.map((subscription) => subscription.plan_id)),
	);
	const storeIds = Array.from(
		new Set([
			...customerStoreIds,
			...distinctSubscriptions.map((subscription) => subscription.store_id),
		]),
	);

	const [{ data: planRows }, { data: storeRows }, { data: redemptionRows }] =
		await Promise.all([
			planIds.length
				? supabase
						.from("plans")
						.select(
							"id, name, description, benefit_type, redemptions_per_period",
						)
						.in("id", planIds)
				: Promise.resolve({ data: [] as PlanRow[] }),
			storeIds.length
				? supabase
						.from("stores")
						.select("id, name, slug, address_text, timezone")
						.in("id", storeIds)
				: Promise.resolve({ data: [] as StoreRow[] }),
			distinctSubscriptions.length
				? supabase
						.from("redemptions")
						.select("subscription_id, period_start, redeemed_at, note")
						.in(
							"subscription_id",
							distinctSubscriptions.map((subscription) => subscription.id),
						)
				: Promise.resolve({ data: [] as RedemptionRow[] }),
		]);

	const plansById = new Map((planRows ?? []).map((plan) => [plan.id, plan]));
	const storesById = new Map((storeRows ?? []).map((store) => [store.id, store]));
	const redemptionsBySubscriptionAndPeriod = new Map(
		(redemptionRows ?? []).map((redemption) => [
			`${redemption.subscription_id}:${redemption.period_start}`,
			redemption,
		]),
	);

	const selectedSubscription =
		distinctSubscriptions.find(
			(subscription) => subscription.store_id === selectedStoreId,
		) ??
		distinctSubscriptions[0] ??
		null;

	return (
		<div className="space-y-6">
			<div className="rounded-[2rem] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.16),_transparent_32%),linear-gradient(135deg,#ffffff,#f8fafc)] p-6 shadow-sm">
				<p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-600">
					Customer Account
				</p>
				<h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
					Your subscription and redemption pass live here.
				</h1>
				<p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
					Open your QR code before you reach the counter, refresh it if needed,
					and let staff scan it to redeem your current billing-period perk.
				</p>
			</div>

			<section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
				<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
					<div>
						<p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
							Subscriptions
						</p>
						<h2 className="mt-2 text-2xl font-semibold text-slate-900">
							Your active subscriptions
						</h2>
					</div>
					<div className="flex flex-wrap gap-3">
						<SummaryTile label="Active" value={`${distinctSubscriptions.length}`} />
						<SummaryTile
							label="Selected store"
							value={
								selectedSubscription
									? storesById.get(selectedSubscription.store_id)?.name ?? "Store"
									: "None"
							}
						/>
					</div>
				</div>

				<div className="mt-6 grid gap-4 xl:grid-cols-2">
					{distinctSubscriptions.length ? (
						distinctSubscriptions.map((subscription) => {
							const store = storesById.get(subscription.store_id);
							const plan = plansById.get(subscription.plan_id);
							const redemptionKey = subscription.current_period_start
								? `${subscription.id}:${subscription.current_period_start}`
								: "";
							const redemption = redemptionKey
								? redemptionsBySubscriptionAndPeriod.get(redemptionKey)
								: undefined;
							const isSelected = selectedSubscription?.id === subscription.id;

							return (
								<article
									key={subscription.id}
									className={`rounded-[1.75rem] border p-5 transition ${
										isSelected
											? "border-emerald-300 bg-emerald-50/50"
											: "border-slate-200 bg-slate-50"
									}`}
								>
									<div className="flex items-start justify-between gap-4">
										<div>
											<p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
												{store?.name ?? "Store"}
											</p>
											<h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
												{plan?.name ?? "Subscription"}
											</h3>
										</div>
										<span
											className={`rounded-full px-3 py-1 text-xs font-semibold ${
												redemption
													? "bg-emerald-100 text-emerald-700"
													: "bg-amber-100 text-amber-700"
											}`}
										>
											{redemption ? "Redeemed this period" : "Ready to redeem"}
										</span>
									</div>

									<p className="mt-3 text-sm leading-6 text-slate-600">
										{plan?.description || "No description has been added for this plan yet."}
									</p>

									<div className="mt-5 grid gap-3 sm:grid-cols-2">
										<InfoCard
											label="Benefit"
											value={plan?.benefit_type || "Not specified"}
										/>
										<InfoCard
											label="Provider"
											value={formatProvider(subscription.provider)}
										/>
										<InfoCard
											label="Billing period"
											value={formatPeriod(
												subscription.current_period_start,
												subscription.current_period_end,
											)}
										/>
										<InfoCard
											label="Redemptions"
											value={`${plan?.redemptions_per_period ?? 1} per period`}
										/>
									</div>

									<div className="mt-5 flex flex-wrap gap-3">
										<Link
											href={`/account?storeId=${encodeURIComponent(subscription.store_id)}`}
											className={`inline-flex h-11 items-center justify-center rounded-full px-5 text-sm font-semibold transition ${
												isSelected
													? "bg-slate-900 text-white hover:bg-slate-700"
													: "border border-slate-300 text-slate-700 hover:border-slate-400 hover:text-slate-900"
											}`}
										>
											{isSelected ? "Viewing QR" : "View this QR"}
										</Link>
										<Link
											href={store ? `/${store.slug}` : "/account/discover"}
											className="inline-flex h-11 items-center justify-center rounded-full border border-slate-300 px-5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
										>
											View store
										</Link>
									</div>

									{redemption ? (
										<p className="mt-4 text-sm text-emerald-700">
											Redeemed on {formatDateTime(redemption.redeemed_at)}
											{redemption.note ? ` • ${redemption.note}` : ""}
										</p>
									) : null}
								</article>
							);
						})
					) : (
						<div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-slate-50 p-8 text-sm text-slate-500 xl:col-span-2">
							You do not have any active subscriptions yet. Visit{" "}
							<Link href="/account/discover" className="font-semibold text-slate-900">
								Discover
							</Link>{" "}
							to browse stores and subscribe to a plan.
						</div>
					)}
				</div>
			</section>

			<QrCodeCard />
		</div>
	);
}

function SummaryTile({ label, value }: { label: string; value: string }) {
	return (
		<div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
			<p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
				{label}
			</p>
			<p className="mt-2 text-sm font-semibold text-slate-900">{value}</p>
		</div>
	);
}

function InfoCard({ label, value }: { label: string; value: string }) {
	return (
		<div className="rounded-2xl border border-slate-200 bg-white p-4">
			<p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
				{label}
			</p>
			<p className="mt-2 text-sm font-medium text-slate-900">{value}</p>
		</div>
	);
}

function formatProvider(provider: string | null) {
	if (!provider) {
		return "Unknown";
	}

	return provider.charAt(0).toUpperCase() + provider.slice(1);
}

function formatPeriod(start: string | null, end: string | null) {
	if (!start) {
		return "Unavailable";
	}

	const formatter = new Intl.DateTimeFormat("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});

	if (!end) {
		return `Started ${formatter.format(new Date(start))}`;
	}

	return `${formatter.format(new Date(start))} - ${formatter.format(new Date(end))}`;
}

function formatDateTime(value: string) {
	return new Intl.DateTimeFormat("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
		hour: "numeric",
		minute: "2-digit",
	}).format(new Date(value));
}

function getDistinctActiveSubscriptions(subscriptions: SubscriptionRow[]) {
	const distinctByStoreAndPlan = new Map<string, SubscriptionRow>();

	for (const subscription of subscriptions) {
		const key = `${subscription.store_id}:${subscription.plan_id}`;
		const existing = distinctByStoreAndPlan.get(key);

		if (!existing) {
			distinctByStoreAndPlan.set(key, subscription);
			continue;
		}

		const existingCreatedAt = new Date(existing.created_at).getTime();
		const nextCreatedAt = new Date(subscription.created_at).getTime();

		if (nextCreatedAt > existingCreatedAt) {
			distinctByStoreAndPlan.set(key, subscription);
		}
	}

	return Array.from(distinctByStoreAndPlan.values()).sort(
		(left, right) =>
			new Date(right.created_at).getTime() - new Date(left.created_at).getTime(),
	);
}
