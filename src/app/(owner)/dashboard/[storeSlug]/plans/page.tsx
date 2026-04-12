import Link from "next/link";
import { getOwnerBillingStatus } from "@/lib/stripe/connect";
import { createRouteHandlerSupabaseClient } from "@/lib/supabase/server";
import { createDashboardPlan } from "./actions";

type StorePlansPageProps = {
	params: Promise<{ storeSlug: string }>;
	searchParams?: Promise<{ error?: string }>;
};

export default async function SubscriptionPage({
	params,
	searchParams,
}: StorePlansPageProps) {
	const { storeSlug } = await params;
	const resolvedSearchParams = await searchParams;
	const supabase = await createRouteHandlerSupabaseClient();
	const { data: authData } = await supabase.auth.getUser();
	const user = authData.user;
	const billing = user ? await getOwnerBillingStatus(user.id) : null;
	const paymentsEnabled = !!(
		billing?.stripeAccountId &&
		billing.chargesEnabled &&
		billing.payoutsEnabled
	);
	const { data: store } = await supabase
		.from("stores")
		.select("id, name, slug")
		.eq("slug", storeSlug)
		.maybeSingle();
	const { data: plans } = store
				? await supabase
						.from("plans")
						.select(
							"id, name, description, benefit_type, redemptions_per_period, stripe_price_id, active, created_at",
						)
				.eq("store_id", store.id)
				.order("created_at", { ascending: false })
		: { data: [] };

	return (
		<div className="space-y-6">
			<section className="rounded-[2rem] border border-slate-200 bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.16),_transparent_30%),linear-gradient(135deg,#ffffff,#f8fafc)] p-6 shadow-sm">
				<p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-600">
					Store Plans
				</p>
				<h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
					Create subscription offerings for{" "}
					{store?.name ?? storeSlug}.
				</h1>
				<p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
					Build plans inside SubMe first, then enable payments when you are
					ready to publish live customer offerings.
				</p>
			</section>

			{resolvedSearchParams?.error ? (
				<div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
					{resolvedSearchParams.error}
				</div>
			) : null}
			{!paymentsEnabled ? (
				<div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
					Payments are not enabled yet. Plans can be created as drafts, but they
					cannot go live until you{" "}
					<Link href="/dashboard/settings" className="font-semibold text-amber-950">
						enable payments
					</Link>
					.
				</div>
			) : null}

			<div className="grid gap-6 xl:grid-cols-[minmax(0,1fr),minmax(24rem,28rem)]">
				<section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
					<div className="flex items-center justify-between gap-4">
						<div>
							<p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
								Current Offerings
							</p>
							<h2 className="mt-2 text-2xl font-semibold text-slate-900">
								Manual plans
							</h2>
						</div>
						<Link
							href={`/${storeSlug}`}
							className="inline-flex h-11 items-center justify-center rounded-full border border-slate-300 px-5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
						>
							View public page
						</Link>
					</div>

					<div className="mt-6 space-y-4">
						{plans?.length ? (
							plans.map((plan) => (
								<article
									key={plan.id}
									className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5"
								>
									<div className="flex items-start justify-between gap-4">
										<div>
											<h3 className="text-lg font-semibold text-slate-900">
												{plan.name}
											</h3>
											<p className="mt-2 text-sm leading-6 text-slate-600">
												{plan.description || "No description yet."}
											</p>
										</div>
										<span
											className={`rounded-full px-3 py-1 text-xs font-semibold ${
												plan.active
													? "bg-emerald-100 text-emerald-700"
													: "bg-slate-200 text-slate-600"
											}`}
										>
											{plan.active ? "Live" : "Draft"}
										</span>
									</div>
									<div className="mt-4 grid gap-3 sm:grid-cols-3">
										<InfoTile
											label="Benefit"
											value={plan.benefit_type || "Not set"}
										/>
										<InfoTile
											label="Redemptions"
											value={`${plan.redemptions_per_period ?? 1} / period`}
										/>
										<InfoTile
											label="Billing"
											value={paymentsEnabled && plan.active ? "Payments enabled" : "Draft only"}
										/>
									</div>
								</article>
							))
						) : (
							<div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-8 text-sm text-slate-500">
								No plans yet. Create one to start testing the subscribe and QR
								flow.
							</div>
						)}
					</div>
				</section>

				<section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
					<p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
						Add Plan
					</p>
					<h2 className="mt-2 text-2xl font-semibold text-slate-900">
						Create a subscription offering
					</h2>
					<form action={createDashboardPlan} className="mt-6 space-y-4">
						<input type="hidden" name="storeSlug" value={storeSlug} />
						<label className="block">
							<span className="text-sm font-medium text-slate-900">Plan name</span>
							<input
								name="name"
								type="text"
								required
								placeholder="e.g. Monthly Coffee Club"
								className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-900"
							/>
						</label>
						<label className="block">
							<span className="text-sm font-medium text-slate-900">
								Description
							</span>
							<textarea
								name="description"
								rows={3}
								placeholder="Optional details customers will see."
								className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-900"
							/>
						</label>
						<div className="grid gap-4 sm:grid-cols-2">
							<label className="block">
								<span className="text-sm font-medium text-slate-900">
									Benefit type
								</span>
								<input
									name="benefitType"
									type="text"
									placeholder="e.g. Free drink"
									className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-900"
								/>
							</label>
							<label className="block">
								<span className="text-sm font-medium text-slate-900">
									Redemptions per period
								</span>
								<input
									name="redemptions"
									type="number"
									min={1}
									defaultValue={1}
									className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-900"
								/>
							</label>
						</div>
						<label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
							<input
								type="checkbox"
								name="active"
								defaultChecked={paymentsEnabled}
								disabled={!paymentsEnabled}
								className="h-4 w-4"
							/>
							{paymentsEnabled
								? "Publish this plan on the public store page immediately"
								: "Enable payments before publishing this plan"}
						</label>
						{!paymentsEnabled ? (
							<p className="text-xs text-slate-500">
								This plan will be saved as a draft until payments are enabled.
							</p>
						) : null}
						<button
							type="submit"
							className="inline-flex h-11 items-center justify-center rounded-full bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
						>
							Create plan
						</button>
					</form>
				</section>
			</div>
		</div>
	);
}

function InfoTile({ label, value }: { label: string; value: string }) {
	return (
		<div className="rounded-2xl border border-slate-200 bg-white p-4">
			<p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
				{label}
			</p>
			<p className="mt-2 text-sm font-medium text-slate-900">{value}</p>
		</div>
	);
}
