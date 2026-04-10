import { createRouteHandlerSupabaseClient } from "@/lib/supabase/server";

type StoreRedeemPageProps = {
	params: Promise<{ storeSlug: string }>;
};

type RedemptionRow = {
	id: string;
	subscription_id: string;
	customer_id: string;
	period_start: string;
	redeemed_at: string;
	staff_user_id: string | null;
	note: string | null;
};

type CustomerRow = {
	id: string;
	email: string | null;
	name: string | null;
};

type SubscriptionRow = {
	id: string;
	plan_id: string;
};

type PlanRow = {
	id: string;
	name: string;
	benefit_type: string | null;
};

type StaffRow = {
	user_id: string;
	email: string;
	name: string | null;
};

export default async function StoreRedeemPage({
	params,
}: StoreRedeemPageProps) {
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

	const { data: redemptionRows } = await supabase
		.from("redemptions")
		.select(
			"id, subscription_id, customer_id, period_start, redeemed_at, staff_user_id, note",
		)
		.eq("store_id", store.id)
		.order("redeemed_at", { ascending: false });

	const redemptions = (redemptionRows ?? []) as RedemptionRow[];
	const customerIds = Array.from(new Set(redemptions.map((redemption) => redemption.customer_id)));
	const subscriptionIds = Array.from(
		new Set(redemptions.map((redemption) => redemption.subscription_id)),
	);
	const staffIds = Array.from(
		new Set(
			redemptions
				.map((redemption) => redemption.staff_user_id)
				.filter((value): value is string => !!value),
		),
	);

	const [{ data: customers }, { data: subscriptions }, { data: plans }, { data: staffProfiles }] =
		await Promise.all([
			customerIds.length
				? supabase
						.from("customers")
						.select("id, email, name")
						.in("id", customerIds)
				: Promise.resolve({ data: [] as CustomerRow[] }),
			subscriptionIds.length
				? supabase
						.from("subscriptions")
						.select("id, plan_id")
						.in("id", subscriptionIds)
				: Promise.resolve({ data: [] as SubscriptionRow[] }),
			subscriptionIds.length
				? supabase
						.from("plans")
						.select("id, name, benefit_type")
						.eq("store_id", store.id)
				: Promise.resolve({ data: [] as PlanRow[] }),
			staffIds.length
				? supabase
						.from("profiles")
						.select("user_id, email, name")
						.in("user_id", staffIds)
				: Promise.resolve({ data: [] as StaffRow[] }),
		]);

	const customersById = new Map(((customers ?? []) as CustomerRow[]).map((customer) => [customer.id, customer]));
	const subscriptionsById = new Map(
		((subscriptions ?? []) as SubscriptionRow[]).map((subscription) => [
			subscription.id,
			subscription,
		]),
	);
	const plansById = new Map(((plans ?? []) as PlanRow[]).map((plan) => [plan.id, plan]));
	const staffById = new Map(((staffProfiles ?? []) as StaffRow[]).map((staff) => [staff.user_id, staff]));

	return (
		<div className="space-y-6">
			<section className="rounded-[2rem] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.16),_transparent_28%),linear-gradient(135deg,#ffffff,#f8fafc)] p-6 shadow-sm">
				<p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-600">
					Redemptions
				</p>
				<h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
					Recent redemptions for {store.name}
				</h1>
				<p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
					Track which customers redeemed, which plan was used, and which staff
					member completed the scan.
				</p>
			</section>

			<section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
				<div className="flex flex-wrap gap-3">
					<SummaryTile label="Total redemptions" value={`${redemptions.length}`} />
					<SummaryTile
						label="Unique customers"
						value={`${new Set(redemptions.map((redemption) => redemption.customer_id)).size}`}
					/>
				</div>

				<div className="mt-6 space-y-4">
					{redemptions.length ? (
						redemptions.map((redemption) => {
							const customer = customersById.get(redemption.customer_id);
							const subscription = subscriptionsById.get(redemption.subscription_id);
							const plan = subscription ? plansById.get(subscription.plan_id) : undefined;
							const staff = redemption.staff_user_id
								? staffById.get(redemption.staff_user_id)
								: undefined;

							return (
								<article
									key={redemption.id}
									className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5"
								>
									<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
										<div>
											<p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
												{plan?.name ?? "Plan"}
											</p>
											<h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
												{customer?.name || customer?.email || "Customer"}
											</h2>
											<p className="mt-2 text-sm text-slate-600">
												{customer?.email || "No email on file"}
											</p>
										</div>
										<span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
											Redeemed {formatDateTime(redemption.redeemed_at)}
										</span>
									</div>

									<div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
										<InfoTile
											label="Benefit"
											value={plan?.benefit_type || "Not specified"}
										/>
										<InfoTile
											label="Billing period"
											value={formatDate(redemption.period_start)}
										/>
										<InfoTile
											label="Staff"
											value={staff?.name || staff?.email || "Unknown staff"}
										/>
										<InfoTile
											label="Redemption ID"
											value={redemption.id}
											mono
										/>
									</div>

									{redemption.note ? (
										<p className="mt-4 text-sm text-slate-600">
											Note: {redemption.note}
										</p>
									) : null}
								</article>
							);
						})
					) : (
						<div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-slate-50 p-8 text-sm text-slate-500">
							No redemptions have been recorded yet.
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

function InfoTile({
	label,
	value,
	mono = false,
}: {
	label: string;
	value: string;
	mono?: boolean;
}) {
	return (
		<div className="rounded-2xl border border-slate-200 bg-white p-4">
			<p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
				{label}
			</p>
			<p
				className={`mt-2 text-sm font-medium text-slate-900 ${mono ? "font-mono break-all" : ""}`}
			>
				{value}
			</p>
		</div>
	);
}

function formatDate(value: string) {
	return new Intl.DateTimeFormat("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	}).format(new Date(value));
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
