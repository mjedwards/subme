import OnboardingShell from "./layouts/OnboardingShell";
import OnboardingTransition from "./components/OnboardingTransition";

export default function OnboardingLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	return (
		<OnboardingShell>
			<OnboardingTransition>{children}</OnboardingTransition>
		</OnboardingShell>
	);
}
