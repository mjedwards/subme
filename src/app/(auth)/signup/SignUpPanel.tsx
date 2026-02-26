"use client";

import { makeFetch } from "@/utils/helper";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Role = "customer" | "owner";

const roleCopy = {
	customer: {
		headline: "Create your customer account",
		subtitle: "Get access to rewards and redeem perks in seconds.",
		button: "Create customer account",
		fields: [
			{ label: "First name", type: "text", name: "firstName" },
			{ label: "Last name", type: "text", name: "lastName" },
			{ label: "Email", type: "email", name: "email" },
			{ label: "Password", type: "password", name: "password" },
		],
	},
	owner: {
		headline: "Create your store account",
		subtitle: "Launch subscriptions for every location you manage.",
		button: "Create store account",
		fields: [
			{ label: "Store name", type: "text", name: "storeName" },
			{ label: "Work email", type: "email", name: "email" },
			{ label: "Password", type: "password", name: "password" },
			{ label: "Number of locations", type: "text", name: "locations" },
		],
	},
};

export default function SignUpPanel() {
	const router = useRouter();
	const [role, setRole] = useState<Role>("customer");
	const copy = roleCopy[role];
	const [user, setUser] = useState({
		firstName: "",
		lastName: "",
		email: "",
		password: "",
		storeName: "",
		locations: "",
	});
	const [error, setError] = useState("");
	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
	const [isLoading, setIsLoading] = useState(false);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setUser((prev) => ({ ...prev, [name]: value }));
		setFieldErrors((prev) => ({ ...prev, [name]: "" }));
	};

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setError("");
		const nextFieldErrors: Record<string, string> = {};
		copy.fields.forEach((field) => {
			const value = user[field.name as keyof typeof user];
			if (!value) {
				nextFieldErrors[field.name] = `${field.label} is required.`;
			}
		});
		if (Object.keys(nextFieldErrors).length > 0) {
			setFieldErrors(nextFieldErrors);
			return;
		}
		setIsLoading(true);
		const result = await makeFetch({
			url: "/api/signup",
			method: "POST",
			data: {
				name:
					role === "owner"
						? user.storeName
						: `${user.firstName} ${user.lastName}`,
				email: user.email,
				password: user.password,
				role
			},
		});

		if (result.error) {
			setError(result.error);
			setIsLoading(false);
			return;
		}

		if (result.data?.needsConfirmation) {
			router.push(`/signup/confirm?message=${encodeURIComponent(result.data.message)}`);
		} else {
			const roles = (result.data?.user?.roles as string[]) ?? [];
			if (roles.includes("owner") || roles.includes("staff")) {
				router.push("/dashboard");
				return;
			}
			router.push("/account");
		}
	};

	return (
		<div className='flex flex-1 flex-col justify-center'>
			<div className='mx-auto flex w-full max-w-md flex-col gap-6'>
				<div className='flex items-center justify-center gap-4 rounded-full bg-slate-100 p-1 text-sm'>
					<button
						type='button'
						onClick={() => setRole("customer")}
						className={`flex-1 rounded-full px-4 py-2 font-medium transition ${
							role === "customer"
								? "bg-white text-slate-900 shadow-sm"
								: "text-slate-500"
						}`}>
						Customer
					</button>
					<button
						type='button'
						onClick={() => setRole("owner")}
						className={`flex-1 rounded-full px-4 py-2 font-medium transition ${
							role === "owner"
								? "bg-white text-slate-900 shadow-sm"
								: "text-slate-500"
						}`}>
						Store
					</button>
				</div>
				<div className='text-center'>
					<h2 className='text-3xl font-semibold text-slate-900'>
						{copy.headline}
					</h2>
					<p className='mt-2 text-sm text-slate-500'>{copy.subtitle}</p>
				</div>
				<form className='grid grid-cols-1 gap-4' onSubmit={handleSubmit}>
					<div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
						{copy.fields.slice(0, 2).map((field) => (
							<label
								key={field.name}
								className='flex flex-col gap-2 text-xs font-medium uppercase tracking-wider text-slate-500'>
								{field.label}
								<input
									onChange={handleChange}
									type={field.type}
									name={field.name}
									className={`h-11 rounded-xl border bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition focus:ring-2 ${
										fieldErrors[field.name]
											? "border-red-300 focus:border-red-400 focus:ring-red-100"
											: "border-slate-200 focus:border-slate-400 focus:ring-slate-200"
									}`}
								/>
								{fieldErrors[field.name] ? (
									<span className='text-[11px] font-normal text-red-500'>
										{fieldErrors[field.name]}
									</span>
								) : null}
							</label>
						))}
					</div>
					{copy.fields.slice(2).map((field) => (
						<label
							key={field.name}
							className='flex flex-col gap-2 text-xs font-medium uppercase tracking-wider text-slate-500'>
							{field.label}
							<input
								onChange={handleChange}
								type={field.type}
								name={field.name}
								className={`h-11 rounded-xl border bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition focus:ring-2 ${
									fieldErrors[field.name]
										? "border-red-300 focus:border-red-400 focus:ring-red-100"
										: "border-slate-200 focus:border-slate-400 focus:ring-slate-200"
								}`}
							/>
							{fieldErrors[field.name] ? (
								<span className='text-[11px] font-normal text-red-500'>
									{fieldErrors[field.name]}
								</span>
							) : null}
						</label>
					))}
					<button
						type='submit'
						disabled={isLoading}
						className='mt-2 h-12 rounded-full bg-slate-900 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70'>
						{isLoading ? "Creating account..." : copy.button}
					</button>
				</form>
				{error ? (
					<p className='rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700'>
						{error}
					</p>
				) : null}
			</div>
		</div>
	);
}
