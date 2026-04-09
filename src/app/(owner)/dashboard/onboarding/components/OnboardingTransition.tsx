"use client";

import { usePathname } from "next/navigation";

type OnboardingTransitionProps = {
	children: React.ReactNode;
};

export default function OnboardingTransition({
	children,
}: OnboardingTransitionProps) {
	const pathname = usePathname();

	return (
		<div key={pathname} className="onboarding-transition">
			{children}
		</div>
	);
}
