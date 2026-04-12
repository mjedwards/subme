import OnboardingHeader from "../components/OnboardingHeader";
import OnboardingStepper from "../components/OnboardingStepper";
import { createStore } from "../actions/createStore";

const steps = [
	{ id: "billing", label: "Connect Stripe", href: "/dashboard/onboarding/billing" },
	{ id: "store", label: "Create Store", href: "/dashboard/onboarding/store" },
	{ id: "plan", label: "Add Plan" },
	{ id: "staff", label: "Invite Staff" },
];

type StoreOnboardingPageProps = {
	searchParams?: Promise<{ error?: string }>;
};

export default async function StoreOnboardingPage({
	searchParams,
}: StoreOnboardingPageProps) {
	const resolvedSearchParams = await searchParams;
	return (
		<div className="space-y-8">
			<OnboardingHeader
				title="Create your first store"
				subtitle="This will be the home for your subscriptions, customers, and redemptions."
			/>
			<OnboardingStepper steps={steps} currentId="store" />
			{resolvedSearchParams?.error ? (
				<div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
					{resolvedSearchParams.error}
				</div>
			) : null}
			<form action={createStore} className="space-y-6">
				<div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
					<div className="space-y-2">
						<label className="text-sm font-medium text-slate-900" htmlFor="name">
							Store name
						</label>
						<input
							id="name"
							name="name"
							type="text"
							placeholder="e.g. Moonlight Coffee"
							className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
							required
						/>
					</div>
					<div className="mt-4 space-y-2">
						<label className="text-sm font-medium text-slate-900" htmlFor="slug">
							Store slug
						</label>
						<input
							id="slug"
							name="slug"
							type="text"
							placeholder="e.g. moonlight-coffee (optional)"
							className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
						/>
						<p className="text-xs text-slate-500">
							Used in your dashboard URL. We’ll generate one if you leave it blank.
						</p>
					</div>
					<div className="mt-4 space-y-2">
						<label
							className="text-sm font-medium text-slate-900"
							htmlFor="timezone"
						>
							Timezone
						</label>
						<input
							id="timezone"
							name="timezone"
							type="text"
							defaultValue="America/New_York"
							className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
						/>
					</div>
				</div>
				<button
					type="submit"
					className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
				>
					Continue
				</button>
			</form>
		</div>
	);
}
