export interface FetchInfo<TBody extends Record<string, unknown>> {
	url: string;
	method: "POST" | "PUT" | "GET";
	data?: TBody;
}

export async function makeFetch<TBody extends Record<string, unknown>>(
	info: FetchInfo<TBody>,
) {
	const { url, method, data } = info;
	try {
		let response;
		let result;
		if (method === "POST" || method === "PUT") {
			response = await fetch(url, {
				method,
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(data),
			});
			result = await response.json();
		}

		if (method === "GET") {
			response = await fetch(url, {
				method,
				headers: {
					"Content-Type": "application/json",
				},
			});
			result = await response.json();
		}

		if (!response?.ok) {
			return { data: null, error: result?.error ?? "Request failed" };
		}

		return { data: result, error: null };
	} catch {
		return { data: null, error: "Network error" };
	}
}
