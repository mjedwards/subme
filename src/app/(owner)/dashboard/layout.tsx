import DashboardShell from "@/components/layouts/DashboardShell";
import { createRouteHandlerSupabaseClient } from "@/lib/supabase/server";

export default async function OwnerAccountLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
	params: { storeSlug: string };
}>) {
	const ownerSections = [
		{
			title: "General",
			items: [
				{ label: "Account Dashboard", href: "/dashboard" },
				{ label: "Account Settings", href: "/dashboard/settings" },
			],
		},
	];

	const supabase = await createRouteHandlerSupabaseClient();
	const { data } = await supabase.auth.getUser();
	const userName = data.user?.user_metadata?.name ?? data.user?.email ?? "";

	return (
		<DashboardShell
			sections={ownerSections}
			userName={userName}
			roleLabel='Owner'>
			{children}
		</DashboardShell>
	);
}
