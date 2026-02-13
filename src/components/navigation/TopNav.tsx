type TopNavProps = {
	userName?: string;
	roleLabel?: string;
};

export default function TopNav({ userName, roleLabel }: TopNavProps) {
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
				<div className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
					{userName ? userName.charAt(0).toUpperCase() : "U"}
				</div>
			</div>
		</nav>
	);
}
