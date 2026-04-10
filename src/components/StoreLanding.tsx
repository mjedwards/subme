type StoreLandingProps = {
	storeName: string;
	storeSlug: string;
	planCount: number;
};

export default function StoreLanding({
	storeName,
	storeSlug,
	planCount,
}: StoreLandingProps) {
	return (
		<section className="rounded-[2rem] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.16),_transparent_28%),linear-gradient(135deg,#ffffff,#f8fafc)] p-6 shadow-sm">
			<p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-600">
				Public Store
			</p>
			<h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900">
				{storeName}
			</h1>
			<p className="mt-4 max-w-3xl text-sm leading-6 text-slate-600">
				Choose a manual subscription offering for the QR MVP test loop. Once
				you subscribe, your active redemption QR will appear in your customer
				account immediately.
			</p>
			<div className="mt-6 flex flex-wrap gap-3">
				<span className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800">
					{planCount} active {planCount === 1 ? "plan" : "plans"}
				</span>
				<span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700">
					Store URL: /{storeSlug}
				</span>
			</div>
		</section>
	);
}
