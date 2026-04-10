import SubscribersTable, {
	type SubscriberTableRow,
} from "@/components/SubscribersTable";
import { createRouteHandlerSupabaseClient } from "@/lib/supabase/server";

type SubscribersPageProps = {
	params: Promise<{ storeSlug: string }>;
};

type CustomerRow = {
	id: string;
	email: string | null;
	name: string | null;
	created_at: string;
};

type SubscriptionRow = {
	id: string;
	customer_id: string;
	plan_id: string;
	status: string | null;
	current_period_start: string | null;
	current_period_end: string | null;
	created_at: string;
};

type PlanRow = {
	id: string;
	name: string;
	benefit_type: string | null;
	redemptions_per_period: number | null;
};

export default async function SubscribersPage({
	params,
}: SubscribersPageProps) {
	const { storeSlug } = await params;
	const supabase = await createRouteHandlerSupabaseClient();

	const { data: store } = await supabase
		.from("stores")
		.select("id, name, slug")
		.eq("slug", storeSlug)
		.maybeSingle();

	if (!store) {
		return (
			<div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
				Store not found.
			</div>
		);
	}

	const [{ data: customers }, { data: subscriptions }, { data: plans }] =
		await Promise.all([
			supabase
				.from("customers")
				.select("id, email, name, created_at")
				.eq("store_id", store.id)
				.order("created_at", { ascending: false }),
			supabase
				.from("subscriptions")
				.select(
					"id, customer_id, plan_id, status, current_period_start, current_period_end, created_at",
				)
				.eq("store_id", store.id)
				.order("created_at", { ascending: false }),
			supabase
				.from("plans")
				.select("id, name, benefit_type, redemptions_per_period")
				.eq("store_id", store.id),
		]);

	const { data: redemptions } = await supabase
		.from("redemptions")
		.select("subscription_id, period_start, redeemed_at")
		.eq("store_id", store.id);

	const plansById = new Map(
		((plans ?? []) as PlanRow[]).map((plan) => [plan.id, plan]),
	);
	const customersById = new Map(
		((customers ?? []) as CustomerRow[]).map((customer) => [customer.id, customer]),
	);
	const redemptionsBySubscriptionAndPeriod = new Map(
		(redemptions ?? []).map((redemption) => [
			`${redemption.subscription_id}:${redemption.period_start}`,
			redemption,
		]),
	);
	const activeSubscriptions = getDistinctActiveSubscriptions(
		((subscriptions ?? []) as SubscriptionRow[]).filter((subscription) =>
			["active", "trialing"].includes(subscription.status ?? ""),
		),
	);
	const tableRows: SubscriberTableRow[] = activeSubscriptions.map((subscription) => {
		const customer = customersById.get(subscription.customer_id);
		const plan = plansById.get(subscription.plan_id);
		const redemptionKey = subscription.current_period_start
			? `${subscription.id}:${subscription.current_period_start}`
			: "";
		const redemption = redemptionKey
			? redemptionsBySubscriptionAndPeriod.get(redemptionKey)
			: undefined;

		return {
			id: subscription.id,
			customerName: customer?.name || customer?.email || "Customer",
			customerEmail: customer?.email || "No email on file",
			planName: plan?.name || "Unknown plan",
			redeemed: !!redemption,
			redeemedAt: redemption?.redeemed_at ?? null,
			periodStart: subscription.current_period_start,
			periodEnd: subscription.current_period_end,
			joinedAt: customer?.created_at || subscription.created_at,
		};
	});

	return (
		<div className="min-w-0 space-y-6">
			<section className="rounded-[2rem] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.16),_transparent_28%),linear-gradient(135deg,#ffffff,#f8fafc)] p-6 shadow-sm">
				<p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-600">
					Subscribers
				</p>
				<h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
					Customers subscribed to {store.name}
				</h1>
				<p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
					Review who is currently subscribed, which plan they joined, and what
					billing window their QR redemption applies to.
				</p>
			</section>

			<section className="min-w-0 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
				<div className="flex flex-wrap gap-3">
					<SummaryTile label="Customers" value={`${customers?.length ?? 0}`} />
					<SummaryTile
						label="Active subscriptions"
						value={`${tableRows.length}`}
					/>
				</div>

				<div className="mt-6">
					{tableRows.length ? (
						<SubscribersTable rows={tableRows} />
					) : (
						<div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-slate-50 p-8 text-sm text-slate-500">
							No subscribers yet. Once customers join a plan, they will appear
							here.
						</div>
					)}
				</div>
			</section>
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

function getDistinctActiveSubscriptions(subscriptions: SubscriptionRow[]) {
	const distinctByStoreAndPlan = new Map<string, SubscriptionRow>();

	for (const subscription of subscriptions) {
		const key = `${subscription.customer_id}:${subscription.plan_id}`;
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
