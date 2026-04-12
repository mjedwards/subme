import Link from "next/link";
import OnboardingHeader from "./components/OnboardingHeader";
import OnboardingStepper from "./components/OnboardingStepper";

const steps = [
	{ id: "billing", label: "Connect Stripe", href: "/dashboard/onboarding/billing" },
	{ id: "store", label: "Create Store", href: "/dashboard/onboarding/store" },
	{ id: "plan", label: "Add Plan" },
	{ id: "staff", label: "Invite Staff" },
];

export default function OnboardingStartPage() {
	return (
		<div className="space-y-8">
			<OnboardingHeader
				title="Let’s set up your business"
				subtitle="We’ll collect the essentials so you can start tracking subscribers and redemptions."
			/>
			<OnboardingStepper steps={steps} currentId="store" />
			<div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
				<h2 className="text-lg font-semibold text-slate-900">
					You’ll complete three quick steps
				</h2>
				<ul className="mt-4 space-y-2 text-slate-600">
					<li>Connect Stripe once for owner-level billing.</li>
					<li>Create your first store.</li>
					<li>Add a subscription plan (optional).</li>
					<li>Invite staff members (optional).</li>
				</ul>
				<Link
					href="/dashboard/onboarding/billing"
					className="mt-6 inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
				>
					Get started
				</Link>
			</div>
		</div>
	);
}
