type OnboardingShellProps = {
	children: React.ReactNode;
};

export default function OnboardingShell({ children }: OnboardingShellProps) {
	return (
		<section className="mx-auto w-full max-w-3xl px-6 py-8">
			{children}
		</section>
	);
}
