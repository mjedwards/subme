import Dashboard from "./components/Dashboard/Dashboard";

export default function DashboardPage() {
	return (
		<div className='space-y-4'>
			<h1 className='text-2xl font-semibold text-slate-900'>
				Account Dashboard
			</h1>
			<Dashboard />
		</div>
	);
}
