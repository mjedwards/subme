"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

type RedeemReviewProps = {
	token: string;
	preview: {
		storeId: string;
		subscriptionId: string;
		customerId: string;
		planId?: string;
		periodStart: string;
		periodEnd?: string;
		expiresAt: string;
	};
};

type RedeemSuccessResponse = {
	success: true;
	redemption: {
		id: string;
		store_id: string;
		subscription_id: string;
		customer_id: string;
		period_start: string;
		redeemed_at: string;
		staff_user_id: string;
		note: string | null;
	};
	subscription: {
		id: string;
		storeId: string;
		customerId: string;
		planId: string;
		status: string | null;
		currentPeriodStart: string | null;
		currentPeriodEnd: string | null;
	};
	staff: {
		userId: string;
		role: string;
	};
};

type RedeemErrorResponse = {
	error: string;
	redemption?: {
		id: string;
		redeemed_at: string;
		staff_user_id: string;
		note: string | null;
	};
};

export default function RedeemReview({
	token,
	preview,
}: RedeemReviewProps) {
	const [note, setNote] = useState("");
	const [error, setError] = useState("");
	const [result, setResult] = useState<RedeemSuccessResponse | null>(null);
	const [isSubmitting, startTransition] = useTransition();

	const handleSubmit = () => {
		setError("");

		startTransition(async () => {
			const response = await fetch("/api/redeem", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				credentials: "include",
				cache: "no-store",
				body: JSON.stringify({
					token,
					note: note.trim() || undefined,
				}),
			});

			const payload = (await response.json()) as
				| RedeemSuccessResponse
				| RedeemErrorResponse;

			if (!response.ok || !("success" in payload)) {
				setResult(null);
				setError(payload.error ?? "Unable to complete redemption.");
				return;
			}

			setResult(payload);
		});
	};

	if (result) {
		return (
			<section className="rounded-[2rem] border border-emerald-200 bg-[linear-gradient(135deg,#ecfdf5,#f8fafc)] p-6 shadow-sm">
				<p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">
					Redemption Complete
				</p>
				<h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
					The customer has been redeemed for this billing period.
				</h2>
				<p className="mt-3 text-sm leading-6 text-slate-700">
					Recorded at {formatDateTime(result.redemption.redeemed_at)} by staff
					role {result.staff.role}.
				</p>

				<div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
					<InfoTile label="Redemption ID" value={result.redemption.id} mono />
					<InfoTile label="Store" value={result.subscription.storeId} mono />
					<InfoTile
						label="Period"
						value={formatPeriod(
							result.subscription.currentPeriodStart,
							result.subscription.currentPeriodEnd,
						)}
					/>
					<InfoTile
						label="Note"
						value={result.redemption.note || "No note added"}
					/>
				</div>

				<div className="mt-6 flex flex-wrap gap-3">
					<Link
						href="/scan"
						className="inline-flex h-11 items-center justify-center rounded-full bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-700"
					>
						Scan next customer
					</Link>
				</div>
			</section>
		);
	}

	return (
		<div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr),minmax(20rem,0.9fr)]">
			<section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
				<p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-600">
					Redeem Preview
				</p>
				<h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">
					Review the scanned token before redeeming.
				</h2>
				<p className="mt-2 text-sm leading-6 text-slate-600">
					This preview comes from the signed QR payload. Final eligibility,
					staff access, and duplicate redemption checks happen when you submit.
				</p>

				<div className="mt-6 grid gap-4 sm:grid-cols-2">
					<InfoTile label="Store" value={preview.storeId} mono />
					<InfoTile label="Subscription" value={preview.subscriptionId} mono />
					<InfoTile label="Customer" value={preview.customerId} mono />
					<InfoTile label="Plan" value={preview.planId || "Unavailable"} mono />
					<InfoTile
						label="Billing period"
						value={formatPeriod(preview.periodStart, preview.periodEnd)}
					/>
					<InfoTile label="Token expires" value={formatDateTime(preview.expiresAt)} />
				</div>
			</section>

			<section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
				<p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
					Confirm Redemption
				</p>
				<h3 className="mt-3 text-xl font-semibold text-slate-900">
					Record this redemption now.
				</h3>
				<p className="mt-2 text-sm leading-6 text-slate-600">
					Add an optional note for context, then submit once. The API will
					reject expired, invalid, or already-used tokens.
				</p>

				<label className="mt-5 block">
					<span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
						Staff note
					</span>
					<textarea
						value={note}
						onChange={(event) => setNote(event.target.value)}
						rows={5}
						placeholder="Optional note for the redemption log"
						className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white"
					/>
				</label>

				{error ? (
					<div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
						<p className="font-semibold">Redemption failed</p>
						<p className="mt-1 text-amber-800">{error}</p>
					</div>
				) : null}

				<div className="mt-5 flex flex-wrap gap-3">
					<button
						type="button"
						onClick={handleSubmit}
						disabled={isSubmitting}
						className="inline-flex h-11 items-center justify-center rounded-full bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
					>
						{isSubmitting ? "Redeeming..." : "Confirm redemption"}
					</button>
					<Link
						href="/scan"
						className="inline-flex h-11 items-center justify-center rounded-full border border-slate-300 px-5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
					>
						Back to scanner
					</Link>
				</div>
			</section>
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
		<div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
			<p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
				{label}
			</p>
			<p
				className={`mt-2 break-all text-sm text-slate-900 ${mono ? "font-mono" : "font-medium"}`}
			>
				{value}
			</p>
		</div>
	);
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

function formatPeriod(start: string | null, end: string | null | undefined) {
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
