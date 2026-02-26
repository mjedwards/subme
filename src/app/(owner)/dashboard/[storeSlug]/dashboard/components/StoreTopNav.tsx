"use client";

import { usePathname } from "next/navigation";
import React from "react";

export type NavItem = {
	label: string;
	href: string;
};

type StoreTopNavProps = {
	items: NavItem[];
};

export default function StoreTopNav({ items }: StoreTopNavProps) {
	const pathname = usePathname();
	const bestMatch =
		items
			.filter(
				(item) =>
					pathname === item.href ||
					(pathname.startsWith(item.href + "/") && item.href !== "/"),
			)
			.sort((a, b) => b.href.length - a.href.length)[0]?.href ?? "";
	return (
		<nav className='flex flex-wrap items-center gap-3 border-b border-slate-200 bg-white px-6 py-3 text-sm rounded-full w-fit mx-auto'>
			{items.map((item) => {
				const isActive = bestMatch === item.href;
				return (
					<a
						key={item.label}
						href={item.href}
						className={`rounded-full px-4 py-2 font-medium transition ${
							isActive
								? "bg-[#e6f9ef] text-[#0b2a24]"
								: "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
						}`}
					>
						{item.label}
					</a>
				);
			})}
		</nav>
	);
}
