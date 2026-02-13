import DashboardShell from "@/components/layouts/DashboardShell";
import { createRouteHandlerSupabaseClient } from "@/lib/supabase/server";

const ownerSections = [
	{
		title: "Main Menu",
		items: [
			{ label: "Dashboard", href: "/dashboard" },
			{ label: "Subscribers", href: "/dashboard/subscribers" },
			{ label: "Redemptions", href: "/dashboard/redemptions" },
			{ label: "Plans", href: "/dashboard/plans" },
			{ label: "Staff", href: "/dashboard/staff" },
			{ label: "Campaigns", href: "/dashboard/campaigns" },
		],
	},
	{
		title: "General",
		items: [
			{ label: "Stores", href: "/dashboard/stores" },
			{ label: "Settings", href: "/dashboard/settings" },
		],
	},
];

const staffSections = [
	{
		title: "Main Menu",
		items: [
			{ label: "Scan QR", href: "/scan" },
			{ label: "Recent Redemptions", href: "/dashboard/redemptions" },
		],
	},
	{
		title: "General",
		items: [{ label: "Settings", href: "/dashboard/settings" }],
	},
];

export default async function DashboardLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const supabase = await createRouteHandlerSupabaseClient();
	const { data } = await supabase.auth.getUser();
	const roles = (data.user?.app_metadata?.roles as string[]) ?? [];
	const isOwner = roles.includes("owner");
	const roleLabel = isOwner ? "Owner" : "Staff";
	const userName = data.user?.user_metadata?.name ?? data.user?.email ?? "";

	return (
		<DashboardShell
			sections={isOwner ? ownerSections : staffSections}
			userName={userName}
			roleLabel={roleLabel}
		>
			{children}
		</DashboardShell>
	);
}
