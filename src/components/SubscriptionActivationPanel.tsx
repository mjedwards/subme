"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type SubscriptionActivationPanelProps = {
	storeId: string;
	storeSlug: string;
	planId: string;
	storeName: string;
	planName: string;
};

type StatusResponse =
	| {
			status: "active" | "pending" | "none";
	  }
	| {
			error?: string;
	  };

export default function SubscriptionActivationPanel({
	storeId,
	storeSlug,
	planId,
	storeName,
	planName,
}: SubscriptionActivationPanelProps) {
	const [status, setStatus] = useState<"loading" | "pending" | "active" | "error">(
		"loading",
	);
	const [error, setError] = useState("");

	useEffect(() => {
		let isActive = true;
		let timer: ReturnType<typeof setTimeout> | null = null;

		const checkStatus = async () => {
			try {
				const response = await fetch(
					`/api/subscribe/status?storeId=${encodeURIComponent(storeId)}&planId=${encodeURIComponent(planId)}`,
					{
						cache: "no-store",
						credentials: "include",
					},
				);
				const payload = (await response.json()) as StatusResponse;

				if (!isActive) {
					return;
				}

				if (!response.ok || "error" in payload) {
					setStatus("error");
					setError(payload.error ?? "Unable to confirm your subscription yet.");
					return;
				}

				if (payload.status === "active") {
					setStatus("active");
					return;
				}

				setStatus("pending");
				timer = setTimeout(() => {
					void checkStatus();
				}, 2500);
			} catch {
				if (!isActive) {
					return;
				}

				setStatus("error");
				setError("Unable to confirm your subscription yet.");
			}
		};

		void checkStatus();

		return () => {
			isActive = false;
			if (timer) {
				clearTimeout(timer);
			}
		};
	}, [planId, storeId]);

	return (
		<section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
			<p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-600">
				Subscription Activation
			</p>
			<h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
				Finishing {planName} for {storeName}.
			</h1>
			<p className="mt-3 text-sm leading-6 text-slate-600">
				Stripe checkout is complete. We’re waiting for the subscription to finish
				syncing into your customer account.
			</p>

			<div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
				{status === "loading"
					? "Checking your subscription status..."
					: status === "pending"
						? "Payment is confirmed. We’re activating your QR access now..."
						: status === "active"
							? "Your subscription is active. Open your customer account to view the QR."
							: error || "Unable to confirm your subscription yet."}
			</div>

			<div className="mt-6 flex flex-wrap gap-3">
				<Link
					href={`/account?storeId=${encodeURIComponent(storeId)}`}
					className="inline-flex h-11 items-center justify-center rounded-full bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-700"
				>
					Open customer account
				</Link>
				<Link
					href={`/${encodeURIComponent(storeSlug)}`}
					className="inline-flex h-11 items-center justify-center rounded-full border border-slate-300 px-5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
				>
					Back to store
				</Link>
			</div>
		</section>
	);
}
