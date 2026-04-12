"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

type SubscribePanelProps = {
	storeSlug: string;
	planId: string;
	storeName: string;
	planName: string;
};

type SubscribeResponse = {
	success: true;
	alreadySubscribed?: boolean;
	redirectTo?: string;
	checkoutUrl?: string;
};

export default function SubscribePanel({
	storeSlug,
	planId,
	storeName,
	planName,
}: SubscribePanelProps) {
	const router = useRouter();
	const hasStartedRef = useRef(false);
	const [error, setError] = useState("");
	const [status, setStatus] = useState<
		"idle" | "submitting" | "already-subscribed" | "success"
	>("idle");
	const [isPending, startTransition] = useTransition();

	useEffect(() => {
		if (hasStartedRef.current) {
			return;
		}

		hasStartedRef.current = true;

		startTransition(async () => {
			setStatus("submitting");
			setError("");

			const response = await fetch("/api/subscribe", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				credentials: "include",
				body: JSON.stringify({ storeSlug, planId }),
			});

			const payload = (await response.json()) as
				| SubscribeResponse
				| { error?: string };

			if (!response.ok || !("success" in payload)) {
				setStatus("idle");
				setError(payload.error ?? "Unable to create the subscription.");
				return;
			}

			setStatus(payload.alreadySubscribed ? "already-subscribed" : "success");

			if (payload.checkoutUrl) {
				window.location.assign(payload.checkoutUrl);
				return;
			}

			if (payload.redirectTo) {
				router.replace(payload.redirectTo);
				router.refresh();
				window.location.assign(payload.redirectTo);
				return;
			}

			setStatus("idle");
			setError("Subscription response did not include a destination.");
		});
	}, [planId, router, storeSlug]);

	return (
		<section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
			<p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-600">
				Subscribe
			</p>
			<h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
				Activating {planName} for {storeName}.
			</h1>
			<p className="mt-3 text-sm leading-6 text-slate-600">
				We’re creating your manual test subscription now. Once it’s ready, you’ll
				be sent to your customer account to view the QR code.
			</p>
			<div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
				{status === "submitting" || isPending
					? "Preparing your subscription..."
					: status === "already-subscribed"
						? "You already have an active test subscription for this plan. Redirecting to your account..."
						: status === "success"
							? "Subscription ready. Redirecting now..."
							: "Ready to create your subscription."}
			</div>
			{error ? (
				<div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
					{error}
				</div>
			) : null}
		</section>
	);
}
