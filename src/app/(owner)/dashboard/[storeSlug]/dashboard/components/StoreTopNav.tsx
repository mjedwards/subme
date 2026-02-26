"use client";

import React from "react";

export type NavItem = {
	label: string;
	href: string;
};

type StoreTopNavProps = {
	items: NavItem[];
};

export default function StoreTopNav({ items }: StoreTopNavProps) {
	return (
		<nav className='flex flex-wrap items-center gap-3 border-b border-slate-200 bg-white px-6 py-3 text-sm rounded-full w-fit mx-auto'>
			{items.map((item) => (
				<a
					key={item.label}
					href={item.href}
					className='rounded-full px-4 py-2 font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900'>
					{item.label}
				</a>
			))}
		</nav>
	);
}
