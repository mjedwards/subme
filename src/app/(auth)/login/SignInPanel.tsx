"use client";

import { makeFetch } from "@/utils/helper";
import { useState } from "react";

type Role = "customer" | "store";
const roleCopy = {
	customer: {
		headline: "Sign in to your account",
		subtitle: "Access your rewards and redemption history.",
		button: "Sign in as customer",
	},
	store: {
		headline: "Sign in to manage stores",
		subtitle: "Track subscribers, redemptions, and plans.",
		button: "Sign in as store",
	},
};

export default function SignInPanel() {
	const [user, setUser] = useState({
		email: "",
		password: "",
	});
	const [error, setError] = useState<string>("");

	const [role, setRole] = useState<Role>("customer");
	const copy = roleCopy[role];

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setUser((prev) => ({ ...prev, [name]: value }));
	};

	const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setError("");
		const result = await makeFetch({
			url: "/api/signin",
			method: "POST",
			data: { email: user.email, password: user.password },
		});
		if (result.error) {
			setError(result.error);
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
						onClick={() => setRole("store")}
						className={`flex-1 rounded-full px-4 py-2 font-medium transition ${
							role === "store"
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
				<form className='grid grid-cols-1 gap-4' onSubmit={handleSignIn}>
					<label className='flex flex-col gap-2 text-xs font-medium uppercase tracking-wider text-slate-500'>
						Email
						<input
							onChange={handleChange}
							type='email'
							name='email'
							className='h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200'
						/>
					</label>
					<label className='flex flex-col gap-2 text-xs font-medium uppercase tracking-wider text-slate-500'>
						Password
						<input
							onChange={handleChange}
							type='password'
							name='password'
							className='h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200'
						/>
					</label>
					<button
						type='submit'
						className='mt-2 h-12 rounded-full bg-slate-900 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:-translate-y-0.5 hover:bg-slate-800'>
						{copy.button}
					</button>
				</form>
				{error ? (
					<p className='rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700'>
						{error}
					</p>
				) : null}
				<button
					type='button'
					className='text-center text-xs font-medium text-slate-500 hover:text-slate-700'>
					Forgot your password?
				</button>
			</div>
		</div>
	);
}
