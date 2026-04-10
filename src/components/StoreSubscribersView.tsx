"use client";

import SubscribersTable from "@/components/SubscribersTable";
import type { StoreSubscribersPayload } from "@/lib/dashboard/subscribers";
import { useEffect, useState } from "react";

type StoreSubscribersViewProps = {
	storeSlug: string;
};

export default function StoreSubscribersView({
	storeSlug,
}: StoreSubscribersViewProps) {
	const [payload, setPayload] = useState<StoreSubscribersPayload | null>(null);
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		let isActive = true;

		const loadSubscribers = async () => {
			setIsLoading(true);
			setError("");

			try {
				const response = await fetch(
					`/api/dashboard/stores/${encodeURIComponent(storeSlug)}/subscribers`,
					{
						cache: "no-store",
						credentials: "include",
					},
				);
				const nextPayload = (await response.json()) as
					| StoreSubscribersPayload
					| { error?: string };

				if (!isActive) {
					return;
				}

				if (!response.ok || !("rows" in nextPayload)) {
					setPayload(null);
					setError(nextPayload.error ?? "Unable to load subscribers.");
					return;
				}

				setPayload(nextPayload);
			} catch {
				if (!isActive) {
					return;
				}

				setPayload(null);
				setError("Unable to load subscribers.");
			} finally {
				if (isActive) {
					setIsLoading(false);
				}
			}
		};

		void loadSubscribers();

		return () => {
			isActive = false;
		};
	}, [storeSlug]);

	if (isLoading) {
		return (
			<div className="min-w-0 space-y-6">
				<section className="rounded-[2rem] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.16),_transparent_28%),linear-gradient(135deg,#ffffff,#f8fafc)] p-6 shadow-sm">
					<p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-600">
						Subscribers
					</p>
					<h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
						Loading subscriber activity
					</h1>
					<p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
						Fetching the latest active subscriptions and redemption state for
						this store.
					</p>
				</section>

				<section className="min-w-0 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
					<div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-slate-50 p-8 text-sm text-slate-500">
						Loading subscribers...
					</div>
				</section>
			</div>
		);
	}

	if (error || !payload) {
		return (
			<div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
				{error || "Unable to load subscribers."}
			</div>
		);
	}

	return (
		<div className="min-w-0 space-y-6">
			<section className="rounded-[2rem] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.16),_transparent_28%),linear-gradient(135deg,#ffffff,#f8fafc)] p-6 shadow-sm">
				<p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-600">
					Subscribers
				</p>
				<h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
					Customers subscribed to {payload.store.name}
				</h1>
				<p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
					Review who is currently subscribed, which plan they joined, and what
					billing window their QR redemption applies to.
				</p>
			</section>

			<section className="min-w-0 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
				<div className="flex flex-wrap gap-3">
					<SummaryTile
						label="Customers"
						value={`${payload.summary.customers}`}
					/>
					<SummaryTile
						label="Active subscriptions"
						value={`${payload.summary.activeSubscriptions}`}
					/>
				</div>

				<div className="mt-6">
					{payload.rows.length ? (
						<SubscribersTable rows={payload.rows} />
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
