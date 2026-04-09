type OnboardingHeaderProps = {
	title: string;
	subtitle?: string;
};

export default function OnboardingHeader({
	title,
	subtitle,
}: OnboardingHeaderProps) {
	return (
		<header className="space-y-2">
			<p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
				Owner Onboarding
			</p>
			<h1 className="text-3xl font-semibold text-slate-900">{title}</h1>
			{subtitle ? <p className="text-slate-600">{subtitle}</p> : null}
		</header>
	);
}
