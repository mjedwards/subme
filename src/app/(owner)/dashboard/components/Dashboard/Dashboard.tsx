"use client";
import React, { useEffect, useState } from "react";
import { makeFetch } from "@/utils/helper";

type Store = {
	id: string;
	slug: string;
	name: string;
	address_text?: string | null;
};

export default function Dashboard() {
	const [stores, setStores] = useState<Store[]>([]);
	const [error, setError] = useState<string | null>(null);

	const fetchResults = async () => {
		return makeFetch({
			url: "/api/store",
			method: "GET",
		});
	};

	useEffect(() => {
		const getStores = async () => {
			const { data, error } = await fetchResults();

			if (error) {
				setError(error);
				return;
			}
			const storeList = data?.stores?.data ?? [];
			setStores(storeList);
		};

		getStores();
	}, []);

	console.log(stores, "stores");
	return (
		<>
			<p className='text-slate-600'>
				Select a store to view subscribers, plans, and redemptions.
			</p>
			{error ? (
				<p className='mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700'>
					{error}
				</p>
			) : null}

			<div className='mt-4 grid gap-4'>
				{stores.map((store) => (
					<div key={store.id} className='rounded-lg border p-4'>
						<h3 className='text-lg font-semibold'>{store.name}</h3>
						{store.address_text ? (
							<span className='text-sm text-slate-500'>
								{store.address_text}
							</span>
						) : null}
						<div className='mt-2'>
							<a
								className='text-sm font-semibold text-slate-700 hover:text-slate-900'
								href={`/dashboard/${store.slug}`}>
								View Store
							</a>
						</div>
					</div>
				))}
			</div>
		</>
	);
}
