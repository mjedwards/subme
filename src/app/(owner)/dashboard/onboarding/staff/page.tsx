import Link from "next/link";
import OnboardingHeader from "../components/OnboardingHeader";
import OnboardingStepper from "../components/OnboardingStepper";
import { inviteStaff } from "../actions/inviteStaff";
import { completeOnboarding } from "../actions/advanceOnboarding";

type StaffOnboardingPageProps = {
	searchParams?: Promise<{ storeSlug?: string; error?: string }>;
};

export default async function StaffOnboardingPage({
	searchParams,
}: StaffOnboardingPageProps) {
	const resolvedSearchParams = await searchParams;
	const storeSlug = resolvedSearchParams?.storeSlug ?? "";
	const steps = [
		{ id: "store", label: "Create Store", href: "/dashboard/onboarding/store" },
		{
			id: "plan",
			label: "Add Plan",
			href: storeSlug
				? `/dashboard/onboarding/plan?storeSlug=${encodeURIComponent(storeSlug)}`
				: undefined,
		},
		{
			id: "staff",
			label: "Invite Staff",
			href: storeSlug
				? `/dashboard/onboarding/staff?storeSlug=${encodeURIComponent(
						storeSlug,
					)}`
				: undefined,
		},
	];

	return (
		<div className="space-y-8">
			<OnboardingHeader
				title="Invite your team"
				subtitle="Add staff members so they can scan and redeem in-store."
			/>
			<OnboardingStepper steps={steps} currentId="staff" />
			{resolvedSearchParams?.error ? (
				<div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
					{resolvedSearchParams.error}
				</div>
			) : null}
			{!storeSlug ? (
				<div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-700">
					Create a store before inviting staff.
					<Link
						href="/dashboard/onboarding/store"
						className="ml-2 font-semibold text-amber-900"
					>
						Go to store setup
					</Link>
				</div>
			) : (
				<form action={inviteStaff} className="space-y-6">
					<input type="hidden" name="storeSlug" value={storeSlug} />
					<div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
						<div className="space-y-2">
							<label
								className="text-sm font-medium text-slate-900"
								htmlFor="email"
							>
								Staff email
							</label>
							<input
								id="email"
								name="email"
								type="email"
								placeholder="person@yourstore.com"
								className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
								required
							/>
							<p className="text-xs text-slate-500">
								They must already have an account to be added.
							</p>
						</div>
					</div>
					<div className="flex flex-wrap items-center gap-3">
						<button
							type="submit"
							className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
						>
							Invite staff member
						</button>
						<button
							type="submit"
							formAction={completeOnboarding}
							formNoValidate
							className="text-sm font-semibold text-slate-600 hover:text-slate-900"
						>
							Skip for now
						</button>
					</div>
				</form>
			)}
		</div>
	);
}
