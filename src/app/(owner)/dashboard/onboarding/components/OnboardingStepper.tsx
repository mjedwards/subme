import Link from "next/link";

type OnboardingStep = {
	id: string;
	label: string;
	href?: string;
};

type OnboardingStepperProps = {
	steps: OnboardingStep[];
	currentId: string;
};

export default function OnboardingStepper({
	steps,
	currentId,
}: OnboardingStepperProps) {
	return (
		<ol className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
			{steps.map((step, index) => {
				const isCurrent = step.id === currentId;
				const isComplete = steps.findIndex((item) => item.id === currentId) > index;
				const baseClass = isCurrent
					? "border-slate-900 bg-slate-900 text-white"
					: isComplete
						? "border-emerald-500 bg-emerald-500 text-white"
						: "border-slate-300 bg-white text-slate-600";
				const label = (
					<span className={`inline-flex items-center gap-2`}>
						<span
							className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold ${baseClass}`}
						>
							{index + 1}
						</span>
						<span className={isCurrent ? "font-semibold text-slate-900" : ""}>
							{step.label}
						</span>
					</span>
				);

				return (
					<li key={step.id} className="flex items-center gap-3">
						{step.href ? (
							<Link href={step.href} className="hover:text-slate-900">
								{label}
							</Link>
						) : (
							label
						)}
						{index < steps.length - 1 ? (
							<span className="hidden text-slate-300 sm:inline">/</span>
						) : null}
					</li>
				);
			})}
		</ol>
	);
}
