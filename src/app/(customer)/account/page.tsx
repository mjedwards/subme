import QrCodeCard from "@/components/QrCodeCard";

export default function CustomerAccountPage() {
	return (
		<div className="space-y-6">
			<div className="rounded-[2rem] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.16),_transparent_32%),linear-gradient(135deg,#ffffff,#f8fafc)] p-6 shadow-sm">
				<p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-600">
					Customer Account
				</p>
				<h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
					Your subscription and redemption pass live here.
				</h1>
				<p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
					Open your QR code before you reach the counter, refresh it if needed,
					and let staff scan it to redeem your current billing-period perk.
				</p>
			</div>

			<QrCodeCard />
		</div>
	);
}
