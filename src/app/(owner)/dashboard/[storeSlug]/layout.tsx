import StoreDashboardShell from "./dashboard/layouts/StoreDashboardShell";

export default async function StoreAccountLayout({
	children,
	params,
}: Readonly<{
	children: React.ReactNode;
	params: Promise<{ storeSlug: string }>;
}>) {
	const resolvedParams = await params;
	const storeBase = `/dashboard/${resolvedParams.storeSlug}`;
	const storeMenuItems = [
				{ label: "Subscriptions", href: `${storeBase}/plans` },
				{ label: "Subscribers", href: `${storeBase}/subscribers` },
				{ label: "Redemptions", href: `${storeBase}/redemptions` },
				{ label: "Store Settings", href: `${storeBase}/settings` },
	];

	return (
		<StoreDashboardShell items={storeMenuItems}>
			{children}
		</StoreDashboardShell>
	);
}
