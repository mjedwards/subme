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
			<main className="mx-auto w-full max-w-6xl min-w-0 px-6 py-6 lg:px-8">
				{children}
			</main>
		</>
	);
}
