"use client";

import { useRouter } from "next/navigation";
import {
	useCallback,
	useEffect,
	useId,
	useMemo,
	useRef,
	useState,
	useTransition,
} from "react";

type Html5QrcodeInstance = {
	start: (
		cameraConfig: { facingMode: string } | string,
		configuration: {
			fps?: number;
			qrbox?: { width: number; height: number };
			aspectRatio?: number;
		},
		qrCodeSuccessCallback: (decodedText: string) => void,
		qrCodeErrorCallback?: (errorMessage: string) => void,
	) => Promise<unknown>;
	stop: () => Promise<unknown>;
	clear: () => Promise<void>;
	isScanning: boolean;
};

export default function Scanner() {
	const router = useRouter();
	const scannerRegionId = useId().replace(/:/g, "");
	const scannerRef = useRef<Html5QrcodeInstance | null>(null);
	const lastScannedTokenRef = useRef("");
	const [manualToken, setManualToken] = useState("");
	const [cameraState, setCameraState] = useState<
		"idle" | "starting" | "ready" | "error"
	>("idle");
	const [cameraError, setCameraError] = useState("");
	const [isSubmitting, startTransition] = useTransition();

	const cameraStatusText = useMemo(() => {
		switch (cameraState) {
			case "starting":
				return "Starting camera...";
			case "ready":
				return "Camera ready. Hold the QR code inside the frame.";
			case "error":
				return "Camera unavailable. Use the manual token field below.";
			default:
				return "Preparing scanner...";
		}
	}, [cameraState]);

	const stopScanner = useCallback(async () => {
		const scanner = scannerRef.current;
		scannerRef.current = null;

		if (!scanner) {
			return;
		}

		try {
			if (scanner.isScanning) {
				await scanner.stop();
			}
		} catch {
			// Ignore stop failures during teardown.
		}

		try {
			await scanner.clear();
		} catch {
			// Ignore clear failures during teardown.
		}
	}, []);

	const navigateToRedeem = useCallback((token: string) => {
		const normalizedToken = token.trim();
		if (!normalizedToken) {
			return;
		}

		startTransition(() => {
			void stopScanner().finally(() => {
				router.push(`/redeem/${encodeURIComponent(normalizedToken)}`);
			});
		});
	}, [router, stopScanner]);

	useEffect(() => {
		let isDisposed = false;

		const startScanner = async () => {
			setCameraState("starting");
			setCameraError("");

			try {
				const { Html5Qrcode } = await import("html5-qrcode");

				if (isDisposed) {
					return;
				}

				const instance = new Html5Qrcode(scannerRegionId, {
					formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
					verbose: false,
				});
				scannerRef.current = instance as Html5QrcodeInstance;

				await instance.start(
					{ facingMode: "environment" },
					{
						fps: 10,
						qrbox: { width: 220, height: 220 },
						aspectRatio: 1,
					},
					(decodedText) => {
						if (!decodedText || decodedText === lastScannedTokenRef.current) {
							return;
						}

						lastScannedTokenRef.current = decodedText;
						navigateToRedeem(decodedText);
					},
				);

				if (!isDisposed) {
					setCameraState("ready");
				}
			} catch (error) {
				if (isDisposed) {
					return;
				}

				setCameraState("error");
				setCameraError(
					error instanceof Error
						? error.message
						: "Could not access the camera.",
				);
			}
		};

		void startScanner();

		return () => {
			isDisposed = true;
			void stopScanner();
		};
	}, [navigateToRedeem, scannerRegionId, stopScanner]);

	const handleManualSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		navigateToRedeem(manualToken);
	};

	return (
		<div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr),minmax(20rem,0.8fr)]">
			<section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
				<div className="flex items-start justify-between gap-4">
					<div>
						<p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-600">
							Camera Scan
						</p>
						<h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">
							Scan the customer QR code at checkout.
						</h2>
						<p className="mt-2 text-sm leading-6 text-slate-600">
							Use the rear camera when available. Once a QR code is detected,
							you’ll be taken to the redeem confirmation flow.
						</p>
					</div>
					<div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500">
						{cameraStatusText}
					</div>
				</div>

				<div className="mt-6 overflow-hidden rounded-[1.75rem] border border-slate-200 bg-slate-950 p-4">
					<div
						id={scannerRegionId}
						className="min-h-[360px] [&_video]:h-[360px] [&_video]:w-full [&_video]:rounded-[1.25rem] [&_video]:object-cover"
					/>
				</div>

				{cameraError ? (
					<div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
						<p className="font-semibold">Camera issue</p>
						<p className="mt-1 text-amber-800">{cameraError}</p>
					</div>
				) : null}
			</section>

			<div className="space-y-6">
				<section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
					<p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
						Manual Fallback
					</p>
					<h3 className="mt-3 text-xl font-semibold text-slate-900">
						Paste a token if scanning isn’t available.
					</h3>
					<p className="mt-2 text-sm leading-6 text-slate-600">
						This covers desktop testing, denied camera permissions, or damaged
						phone screens.
					</p>

					<form className="mt-5 space-y-4" onSubmit={handleManualSubmit}>
						<label className="block">
							<span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
								QR token
							</span>
							<textarea
								value={manualToken}
								onChange={(event) => setManualToken(event.target.value)}
								rows={5}
								placeholder="Paste the signed token from the QR payload"
								className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white"
							/>
						</label>

						<button
							type="submit"
							disabled={isSubmitting || !manualToken.trim()}
							className="inline-flex h-11 items-center justify-center rounded-full bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
						>
							{isSubmitting ? "Opening..." : "Open redeem flow"}
						</button>
					</form>
				</section>

				<section className="rounded-[2rem] border border-slate-200 bg-[linear-gradient(135deg,#ecfdf5,#f8fafc)] p-6 shadow-sm">
					<p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">
						Scan Notes
					</p>
					<ul className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
						<li>Ask the customer to open a fresh QR code right before checkout.</li>
						<li>Keep the code centered and avoid glare from overhead lights.</li>
						<li>The next screen will validate the token before redemption.</li>
					</ul>
				</section>
			</div>
		</div>
	);
}

const Html5QrcodeSupportedFormats = {
	QR_CODE: 0,
} as const;
