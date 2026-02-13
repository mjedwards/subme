import SideNav, { type NavSection } from "@/components/navigation/SideNav";
import TopNav from "@/components/navigation/TopNav";

type DashboardShellProps = {
	children: React.ReactNode;
	sections: NavSection[];
	userName?: string;
	roleLabel?: string;
};

export default function DashboardShell({
	children,
	sections,
	userName,
	roleLabel,
}: DashboardShellProps) {
	return (
		<div className="min-h-screen bg-slate-50 text-slate-900">
			<TopNav userName={userName} roleLabel={roleLabel} />
			<div className="flex min-h-[calc(100vh-4rem)]">
				<SideNav sections={sections} />
				<main className="flex-1 px-8 py-6">{children}</main>
			</div>
		</div>
	);
}
