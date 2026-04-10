"use client";

import { useMemo, useState } from "react";

export type SubscriberTableRow = {
	id: string;
	customerName: string;
	customerEmail: string;
	planName: string;
	redeemed: boolean;
	redeemedAt: string | null;
	periodStart: string | null;
	periodEnd: string | null;
	joinedAt: string;
};

type SortKey =
	| "customerName"
	| "planName"
	| "redeemed"
	| "redeemedAt"
	| "periodStart"
	| "joinedAt";

type SubscribersTableProps = {
	rows: SubscriberTableRow[];
};

export default function SubscribersTable({ rows }: SubscribersTableProps) {
	const [query, setQuery] = useState("");
	const [range, setRange] = useState<"all" | "last30" | "thisMonth">("all");
	const [sortKey, setSortKey] = useState<SortKey>("joinedAt");
	const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

	const filteredRows = useMemo(() => {
		const normalizedQuery = query.trim().toLowerCase();
		const now = new Date();
		const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
		const last30Start = now.getTime() - 30 * 24 * 60 * 60 * 1000;

		return rows
			.filter((row) => {
				if (!normalizedQuery) {
					return true;
				}

				return [
					row.customerName,
					row.customerEmail,
					row.planName,
				].some((value) => value.toLowerCase().includes(normalizedQuery));
			})
			.filter((row) => {
				if (range === "all") {
					return true;
				}

				const anchor = row.periodStart
					? new Date(row.periodStart).getTime()
					: new Date(row.joinedAt).getTime();

				if (range === "last30") {
					return anchor >= last30Start;
				}

				return anchor >= monthStart;
			})
			.sort((left, right) => {
				const leftValue = getSortValue(left, sortKey);
				const rightValue = getSortValue(right, sortKey);

				if (leftValue < rightValue) {
					return sortDirection === "asc" ? -1 : 1;
				}

				if (leftValue > rightValue) {
					return sortDirection === "asc" ? 1 : -1;
				}

				return 0;
			});
	}, [query, range, rows, sortDirection, sortKey]);

	const toggleSort = (key: SortKey) => {
		if (sortKey === key) {
			setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
			return;
		}

		setSortKey(key);
		setSortDirection(key === "customerName" || key === "planName" ? "asc" : "desc");
	};

	return (
		<div className="min-w-0 space-y-4">
			<div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
				<div className="flex flex-1 flex-col gap-3 sm:flex-row">
					<input
						type="search"
						value={query}
						onChange={(event) => setQuery(event.target.value)}
						placeholder="Search customer name, email, or plan"
						className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-900 sm:max-w-md"
					/>
					<select
						value={range}
						onChange={(event) =>
							setRange(event.target.value as "all" | "last30" | "thisMonth")
						}
						className="h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-900"
					>
						<option value="all">All active subscriptions</option>
						<option value="last30">Last 30 days</option>
						<option value="thisMonth">This month</option>
					</select>
				</div>
				<p className="text-sm text-slate-500">
					Showing {filteredRows.length} of {rows.length} subscriptions
				</p>
			</div>

			<div className="min-w-0 overflow-hidden rounded-[1.75rem] border border-slate-200">
				<div className="w-full overflow-x-auto">
					<table className="w-full min-w-[860px] divide-y divide-slate-200 bg-white">
						<thead className="bg-slate-50">
							<tr>
								<HeaderCell
									label="Subscriber"
									active={sortKey === "customerName"}
									direction={sortDirection}
									onClick={() => toggleSort("customerName")}
								/>
								<HeaderCell
									label="Plan"
									active={sortKey === "planName"}
									direction={sortDirection}
									onClick={() => toggleSort("planName")}
								/>
								<HeaderCell
									label="Redeemed"
									active={sortKey === "redeemed"}
									direction={sortDirection}
									onClick={() => toggleSort("redeemed")}
								/>
								<HeaderCell
									label="Redeemed at"
									active={sortKey === "redeemedAt"}
									direction={sortDirection}
									onClick={() => toggleSort("redeemedAt")}
								/>
								<HeaderCell
									label="Billing period"
									active={sortKey === "periodStart"}
									direction={sortDirection}
									onClick={() => toggleSort("periodStart")}
								/>
								<HeaderCell
									label="Joined"
									active={sortKey === "joinedAt"}
									direction={sortDirection}
									onClick={() => toggleSort("joinedAt")}
								/>
								<th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
									Actions
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-slate-200">
							{filteredRows.length ? (
								filteredRows.map((row) => (
									<tr key={row.id} className="align-top">
										<td className="px-5 py-4">
											<p className="text-sm font-semibold text-slate-900">
												{row.customerName}
											</p>
											<p className="mt-1 text-sm text-slate-500">
												{row.customerEmail}
											</p>
										</td>
										<td className="px-5 py-4 text-sm text-slate-700">
											{row.planName}
										</td>
										<td className="px-5 py-4">
											<span
												className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
													row.redeemed
														? "bg-emerald-100 text-emerald-700"
														: "bg-amber-100 text-amber-700"
												}`}
											>
												{row.redeemed ? "Yes" : "No"}
											</span>
										</td>
										<td className="px-5 py-4 text-sm text-slate-700">
											{row.redeemedAt ? formatDateTime(row.redeemedAt) : "Not yet"}
										</td>
										<td className="px-5 py-4 text-sm text-slate-700">
											{formatPeriod(row.periodStart, row.periodEnd)}
										</td>
										<td className="px-5 py-4 text-sm text-slate-700">
											{formatDate(row.joinedAt)}
										</td>
										<td className="px-5 py-4">
											<button
												type="button"
												disabled={row.redeemed}
												className="inline-flex h-10 items-center justify-center rounded-full border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
											>
												Send reminder
											</button>
										</td>
									</tr>
								))
							) : (
								<tr>
									<td
										colSpan={7}
										className="px-5 py-8 text-center text-sm text-slate-500"
									>
										No subscriptions match the current search or filter.
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}

function HeaderCell({
	label,
	active,
	direction,
	onClick,
}: {
	label: string;
	active: boolean;
	direction: "asc" | "desc";
	onClick: () => void;
}) {
	return (
		<th className="px-5 py-4 text-left">
			<button
				type="button"
				onClick={onClick}
				className={`inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] ${
					active ? "text-slate-900" : "text-slate-400"
				}`}
			>
				<span>{label}</span>
				<span className="text-[10px]">{active ? (direction === "asc" ? "↑" : "↓") : "↕"}</span>
			</button>
		</th>
	);
}

function getSortValue(row: SubscriberTableRow, key: SortKey) {
	switch (key) {
		case "customerName":
			return row.customerName.toLowerCase();
		case "planName":
			return row.planName.toLowerCase();
		case "redeemed":
			return row.redeemed ? 1 : 0;
		case "redeemedAt":
			return row.redeemedAt ? new Date(row.redeemedAt).getTime() : 0;
		case "periodStart":
			return row.periodStart ? new Date(row.periodStart).getTime() : 0;
		case "joinedAt":
			return new Date(row.joinedAt).getTime();
	}
}

function formatDate(value: string) {
	return new Intl.DateTimeFormat("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	}).format(new Date(value));
}

function formatDateTime(value: string) {
	return new Intl.DateTimeFormat("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
		hour: "numeric",
		minute: "2-digit",
	}).format(new Date(value));
}

function formatPeriod(start: string | null, end: string | null) {
	if (!start) {
		return "Unavailable";
	}

	const formatter = new Intl.DateTimeFormat("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});

	if (!end) {
		return `Started ${formatter.format(new Date(start))}`;
	}

	return `${formatter.format(new Date(start))} - ${formatter.format(new Date(end))}`;
}
