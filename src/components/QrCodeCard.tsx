"use client";

import Image from "next/image";
import QRCode from "qrcode";
import { useCallback, useEffect, useState, useTransition } from "react";

type QrCodeResponse = {
	qrCode: {
		token: string;
		expiresAt: string;
		storeId: string;
		subscriptionId: string;
		customerId: string;
		planId?: string;
		status: string | null;
		currentPeriodStart: string;
		currentPeriodEnd: string | null;
	};
};

export default function QrCodeCard() {
	const [qrCode, setQrCode] = useState<QrCodeResponse["qrCode"] | null>(null);
	const [qrImageUrl, setQrImageUrl] = useState("");
	const [error, setError] = useState("");
	const [isLoading, startTransition] = useTransition();

	const loadQrCode = useCallback(async () => {
		setError("");

		const response = await fetch("/api/qr", {
			cache: "no-store",
			credentials: "include",
		});

		const payload = (await response.json()) as
			| QrCodeResponse
			| { error?: string; storeIds?: string[] };

		if (!response.ok || !("qrCode" in payload)) {
			setQrCode(null);
			setQrImageUrl("");
			setError(payload.error ?? "Unable to load your QR code.");
			return;
		}

		const imageUrl = await QRCode.toDataURL(payload.qrCode.token, {
			margin: 1,
			scale: 10,
			color: {
				dark: "#0f172a",
				light: "#f8fafc",
			},
		});

		setQrCode(payload.qrCode);
		setQrImageUrl(imageUrl);
	}, []);

	useEffect(() => {
		startTransition(() => {
			void loadQrCode();
		});
	}, [loadQrCode]);

	return (
		<section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
			<div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
				<div className="max-w-xl">
					<p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-600">
						Live QR Code
					</p>
					<h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
						Show this at checkout to redeem your perk.
					</h2>
					<p className="mt-3 text-sm leading-6 text-slate-600">
						Each code is signed and short-lived. Ask staff to scan it when
						you’re ready to redeem for this billing period.
					</p>
				</div>
				<button
					type="button"
					onClick={() =>
						startTransition(() => {
							void loadQrCode();
						})
					}
					className="inline-flex h-11 items-center justify-center rounded-full border border-slate-300 px-5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
					disabled={isLoading}
				>
					{isLoading ? "Refreshing..." : "Refresh code"}
				</button>
			</div>

			<div className="mt-8 grid gap-6 lg:grid-cols-[minmax(18rem,22rem),1fr]">
				<div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
					{qrImageUrl ? (
						<Image
							src={qrImageUrl}
							alt="Redeemable subscription QR code"
							width={320}
							height={320}
							unoptimized
							className="mx-auto aspect-square w-full max-w-[320px] rounded-2xl bg-white p-3 shadow-sm"
						/>
					) : (
						<div className="mx-auto flex aspect-square w-full max-w-[320px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
							{isLoading ? "Generating your QR code..." : "QR code unavailable."}
						</div>
					)}
				</div>

				<div className="space-y-4">
					{error ? (
						<div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
							<p className="font-semibold">QR unavailable</p>
							<p className="mt-1 text-amber-800">{error}</p>
						</div>
					) : null}

					<div className="grid gap-4 sm:grid-cols-2">
						<InfoTile
							label="Status"
							value={formatStatus(qrCode?.status ?? null)}
						/>
						<InfoTile
							label="Expires"
							value={qrCode ? formatDateTime(qrCode.expiresAt) : "Loading..."}
						/>
						<InfoTile
							label="Billing period"
							value={
								qrCode
									? formatPeriod(
											qrCode.currentPeriodStart,
											qrCode.currentPeriodEnd,
										)
									: "Loading..."
							}
						/>
						<InfoTile
							label="Store"
							value={qrCode?.storeId ?? "Loading..."}
							mono
						/>
					</div>

					<div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
						<p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
							What staff checks
						</p>
						<p className="mt-3 text-sm leading-6 text-slate-600">
							Staff will verify the signed token, confirm your subscription is
							active, and redeem only once for the current billing period.
						</p>
					</div>
				</div>
			</div>
		</section>
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
				className={`mt-2 text-sm text-slate-900 ${mono ? "font-mono" : "font-medium"}`}
			>
				{value}
			</p>
		</div>
	);
}

function formatStatus(status: string | null) {
	if (!status) {
		return "Unavailable";
	}

	return status.charAt(0).toUpperCase() + status.slice(1);
}

function formatDateTime(value: string) {
	return new Intl.DateTimeFormat("en-US", {
		month: "short",
		day: "numeric",
		hour: "numeric",
		minute: "2-digit",
	}).format(new Date(value));
}

function formatPeriod(start: string, end: string | null) {
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
