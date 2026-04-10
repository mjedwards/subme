type DashboardStorePageProps = {
	params: Promise<{
		storeSlug: string;
	}>;
};

export default async function DashboardStorePage({
	params,
}: DashboardStorePageProps) {
	const { storeSlug } = await params;
	return (
		<div className='space-y-4'>
			<h1 className='text-2xl font-semibold text-slate-900'>Store Dashboard</h1>
			<p className='text-slate-600'>
				View subscribers, plans, and redemptions for{" "}
				<span className='font-semibold'>{storeSlug}</span>.
			</p>
		</div>
	);
}
