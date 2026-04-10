"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";

type TopNavProps = {
	userName?: string;
	roleLabel?: string;
};

export default function TopNav({ userName, roleLabel }: TopNavProps) {
	const router = useRouter();
	const menuRef = useRef<HTMLDivElement | null>(null);
	const [menuOpen, setMenuOpen] = useState(false);
	const [logoutError, setLogoutError] = useState("");
	const [isPending, startTransition] = useTransition();
	const supabase = useMemo(() => createClient(), []);
	const profileLabel = userName ? userName.charAt(0).toUpperCase() : "U";

	useEffect(() => {
		if (!menuOpen) {
			return;
		}

		const handlePointerDown = (event: MouseEvent) => {
			if (!menuRef.current?.contains(event.target as Node)) {
				setMenuOpen(false);
			}
		};

		const handleEscape = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				setMenuOpen(false);
			}
		};

		document.addEventListener("mousedown", handlePointerDown);
		document.addEventListener("keydown", handleEscape);

		return () => {
			document.removeEventListener("mousedown", handlePointerDown);
			document.removeEventListener("keydown", handleEscape);
		};
	}, [menuOpen]);

	const handleLogout = () => {
		setLogoutError("");

		startTransition(async () => {
			const { error } = await supabase.auth.signOut();

			if (error) {
				setLogoutError("Unable to log out right now. Please try again.");
				return;
			}

			setMenuOpen(false);
			router.replace("/login");
			router.refresh();
		});
	};

	return (
		<nav className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
			<div>
				<p className="text-xs uppercase tracking-[0.25em] text-slate-400">
					{roleLabel ?? "Account"}
				</p>
				<p className="text-lg font-semibold text-slate-900">
					{userName ? `Welcome back ${userName}` : "Welcome back"}
				</p>
			</div>
			<div className="flex items-center gap-3">
				<button
					type="button"
					className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
					aria-label="Help"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						strokeWidth={1.5}
						stroke="currentColor"
						className="h-5 w-5"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M9.09 9a3 3 0 015.82 1c0 2-3 2-3 4"
						/>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M12 17h.01"
						/>
					</svg>
				</button>
				<div className="relative" ref={menuRef}>
					<button
						type="button"
						onClick={() => setMenuOpen((current) => !current)}
						className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600 transition hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
						aria-haspopup="menu"
						aria-expanded={menuOpen}
						aria-label="Open profile menu"
					>
						{profileLabel}
					</button>

					{menuOpen ? (
						<div
							className="absolute right-0 mt-3 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-lg"
							role="menu"
							aria-label="Profile menu"
						>
							<div className="rounded-xl px-3 py-2">
								<p className="text-sm font-semibold text-slate-900">
									{userName || "Signed in user"}
								</p>
								<p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">
									{roleLabel ?? "Account"}
								</p>
							</div>

							<div className="my-2 h-px bg-slate-100" />

							<button
								type="button"
								onClick={handleLogout}
								disabled={isPending}
								className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
								role="menuitem"
							>
								<span>{isPending ? "Logging out..." : "Log out"}</span>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
									strokeWidth={1.5}
									stroke="currentColor"
									className="h-4 w-4"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6A2.25 2.25 0 005.25 5.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15"
									/>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										d="M18 12H9m0 0l3-3m-3 3l3 3"
									/>
								</svg>
							</button>

							{logoutError ? (
								<p className="px-3 pb-2 pt-2 text-xs text-rose-600">
									{logoutError}
								</p>
							) : null}
						</div>
					) : null}
				</div>
			</div>
		</nav>
	);
}
