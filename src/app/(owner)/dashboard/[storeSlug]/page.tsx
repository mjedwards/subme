type DashboardStorePageProps = {
	params: {
		storeSlug: string;
	};
};

export default function DashboardStorePage({
	params,
}: DashboardStorePageProps) {
	return (
		<div className='space-y-4'>
			<h1 className='text-2xl font-semibold text-slate-900'>
				Store Dashboard
			</h1>
			<p className='text-slate-600'>
				View subscribers, plans, and redemptions for{" "}
				<span className='font-semibold'>{params.storeSlug}</span>.
			</p>
		</div>
	);
}
