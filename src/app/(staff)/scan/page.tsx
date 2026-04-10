import Scanner from "@/components/Scanner";

export default function StaffScanPage() {
	return (
		<div className="space-y-6">
			<section className="rounded-[2rem] border border-slate-200 bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.2),_transparent_30%),linear-gradient(135deg,#ffffff,#f8fafc)] p-6 shadow-sm">
				<p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-600">
					Staff Scanner
				</p>
				<h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
					Scan and route each customer to a redemption check.
				</h1>
				<p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
					Use the camera for live scanning or paste a token manually during
					testing. The next step will verify the QR payload against the
					customer’s active subscription before anything is redeemed.
				</p>
			</section>

			<Scanner />
		</div>
	);
}
