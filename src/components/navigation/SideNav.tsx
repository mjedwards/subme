"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";

export type NavItem = {
	label: string;
	href: string;
};

export type NavSection = {
	title: string;
	items: NavItem[];
};

type SideNavProps = {
	sections: NavSection[];
};

export default function SideNav({ sections }: SideNavProps) {
	const [collapsed, setCollapsed] = useState(false);
	const pathname = usePathname();
	const allItems = sections.flatMap((section) => section.items);
	const bestMatch =
		allItems
			.filter(
				(item) =>
					pathname === item.href ||
					(pathname.startsWith(item.href + "/") && item.href !== "/"),
			)
			.sort((a, b) => b.href.length - a.href.length)[0]?.href ?? "";

	return (
		<aside
			className={`relative hidden min-h-screen shrink-0 border-r border-slate-200 bg-white pb-6 pt-7 transition-all duration-300 lg:block ${
				collapsed ? "w-20 px-3" : "w-64 px-5"
			}`}
		>
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#0b2a24] text-white">
						S
					</div>
					{collapsed ? null : (
						<div>
							<p className="text-sm font-semibold text-slate-900">Subme</p>
							<p className="text-xs text-slate-400">Dashboard</p>
						</div>
					)}
				</div>
				<button
					type="button"
					aria-label="Collapse navigation"
					onClick={() => setCollapsed((prev) => !prev)}
					className="absolute -right-3 top-10 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-sm transition hover:text-slate-700"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth={1.5}
						className={`h-4 w-4 transition ${
							collapsed ? "rotate-180" : "rotate-0"
						}`}
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M15 19l-7-7 7-7"
						/>
					</svg>
				</button>
			</div>
			<div className="mt-8 space-y-8">
				{sections.map((section) => (
					<div key={section.title}>
						{collapsed ? null : (
							<div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
								{section.title}
							</div>
						)}
						<nav className="mt-3 flex flex-col gap-2 text-sm">
							{section.items.map((item) => {
								const isActive = bestMatch === item.href;
								return (
									<a
										key={item.label}
										href={item.href}
										className={`cursor-pointer rounded-xl px-3 py-2 font-medium transition hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7ef2a6]/60 ${
											isActive
												? "bg-[#e6f9ef] text-[#0b2a24]"
												: "text-slate-700 hover:bg-[#e6f9ef] hover:text-[#0b2a24]"
										} ${collapsed ? "text-center text-xs" : ""}`}
									>
										{collapsed ? item.label.slice(0, 2) : item.label}
									</a>
								);
							})}
						</nav>
					</div>
				))}
			</div>
			{collapsed ? null : (
				<div className="mt-10 rounded-2xl border border-[#b7f0d4] bg-[#e6f9ef] p-4 text-sm text-[#0b2a24]">
					<p className="font-semibold">Upgrade Pro!</p>
					<p className="mt-2 text-xs text-[#12634a]">
						Unlock advanced analytics and campaigns.
					</p>
					<button
						type="button"
						className="mt-4 w-full cursor-pointer rounded-full bg-[#0b2a24] px-3 py-2 text-xs font-semibold text-white"
					>
						Upgrade
					</button>
				</div>
			)}
		</aside>
	);
}
