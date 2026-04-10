import Link from "next/link";

import { createRouteHandlerSupabaseClient } from "@/lib/supabase/server";

type PlanStoreRow = {
	store_id: string;
};

type StoreRow = {
	id: string;
	name: string;
	slug: string;
	address_text: string | null;
	timezone: string | null;
};

export default async function DiscoverPage() {
	const supabase = await createRouteHandlerSupabaseClient();
	const { data: planRows } = await supabase
		.from("plans")
		.select("store_id")
		.eq("active", true);

	const activeStoreIds = Array.from(
		new Set((planRows as PlanStoreRow[] | null)?.map((row) => row.store_id) ?? []),
	);

	const { data: stores } = activeStoreIds.length
		? await supabase
				.from("stores")
				.select("id, name, slug, address_text, timezone")
				.in("id", activeStoreIds)
				.order("name", { ascending: true })
		: { data: [] as StoreRow[] };

	const activePlanCounts = ((planRows as PlanStoreRow[] | null) ?? []).reduce<
		Record<string, number>
	>((accumulator, row) => {
		accumulator[row.store_id] = (accumulator[row.store_id] ?? 0) + 1;
		return accumulator;
	}, {});

	return (
		<div className="space-y-6">
			<section className="rounded-[2rem] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.16),_transparent_28%),linear-gradient(135deg,#ffffff,#f8fafc)] p-6 shadow-sm">
				<p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-600">
					Discover Stores
				</p>
				<h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
					Explore active stores and browse their subscription offerings.
				</h1>
				<p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
					Geolocation is not wired yet, so this MVP shows every store that
					currently has at least one active plan. Open a store to view its
					offerings, subscribe instantly, and generate your QR code.
				</p>
			</section>

			<section className="space-y-4">
				<div>
					<p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
						Available Stores
					</p>
					<h2 className="mt-2 text-2xl font-semibold text-slate-900">
						Active discovery feed
					</h2>
				</div>

				{stores?.length ? (
					<div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
						{stores.map((store) => (
							<article
								key={store.id}
								className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"
							>
								<div className="flex items-start justify-between gap-4">
									<div>
										<p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
											Store
										</p>
										<h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
											{store.name}
										</h3>
									</div>
									<span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
										{activePlanCounts[store.id] ?? 0} active{" "}
										{activePlanCounts[store.id] === 1 ? "plan" : "plans"}
									</span>
								</div>

								<div className="mt-5 space-y-3">
									<InfoRow label="Store URL" value={`/${store.slug}`} />
									<InfoRow
										label="Location"
										value={store.address_text || "Location details coming soon"}
									/>
									<InfoRow
										label="Timezone"
										value={store.timezone || "America/New_York"}
									/>
								</div>

								<div className="mt-6">
									<Link
										href={`/${store.slug}`}
										className="inline-flex h-11 w-full items-center justify-center rounded-full bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-700"
									>
										View store
									</Link>
								</div>
							</article>
						))}
					</div>
				) : (
					<div className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-10 text-sm text-slate-500 shadow-sm">
						No stores have active plans yet. Once a store owner publishes a plan,
						it will appear here for customers to browse.
					</div>
				)}
			</section>
		</div>
	);
}

function InfoRow({ label, value }: { label: string; value: string }) {
	return (
		<div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
			<p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
				{label}
			</p>
			<p className="mt-2 text-sm font-medium text-slate-900">{value}</p>
		</div>
	);
}
