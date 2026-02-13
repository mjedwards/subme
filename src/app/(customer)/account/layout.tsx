import DashboardShell from "@/components/layouts/DashboardShell";
import { createRouteHandlerSupabaseClient } from "@/lib/supabase/server";

const customerSections = [
	{
		title: "Main Menu",
		items: [
			{ label: "Subscriptions", href: "/account" },
			{ label: "QR Codes", href: "/account/qr" },
			{ label: "Discover", href: "/account/discover" },
		],
	},
	{
		title: "General",
		items: [{ label: "Settings", href: "/account/settings" }],
	},
];

export default async function CustomerAccountLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const supabase = await createRouteHandlerSupabaseClient();
	const { data } = await supabase.auth.getUser();
	const userName = data.user?.user_metadata?.name ?? data.user?.email ?? "";

	return (
		<DashboardShell
			sections={customerSections}
			userName={userName}
			roleLabel="Customer"
		>
			{children}
		</DashboardShell>
	);
}
