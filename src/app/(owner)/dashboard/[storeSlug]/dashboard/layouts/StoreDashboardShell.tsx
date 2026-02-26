"use client";

import React from "react";
import StoreTopNav from "../components/StoreTopNav";

type MenuItem = {
	label: string;
	href: string;
};
type StoreDashboardShellProps = {
	children: React.ReactNode;
	items: MenuItem[];
};

export default function StoreDashboardShell({
	children,
	items,
}: StoreDashboardShellProps) {
	return (
		<>
			<StoreTopNav items={items} />
			<main className='flex-1 px-8 py-6'>{children}</main>
		</>
	);
}
