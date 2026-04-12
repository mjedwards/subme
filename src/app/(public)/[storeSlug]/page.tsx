import PlanCards from "@/components/PlanCards";
import StoreLanding from "@/components/StoreLanding";
import { createRouteHandlerSupabaseClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

type PublicStorePageProps = {
	params: Promise<{ storeSlug: string }>;
};

export default async function PublicStorePage({ params }: PublicStorePageProps) {
	const { storeSlug } = await params;
	const supabase = await createRouteHandlerSupabaseClient();
	const [{ data: authData }, { data: store }] = await Promise.all([
		supabase.auth.getUser(),
		supabase
			.from("stores")
			.select("id, name, slug")
			.eq("slug", storeSlug)
			.maybeSingle(),
	]);

	if (!store) {
		notFound();
	}

	const { data: plans } = await supabase
		.from("plans")
		.select(
			"id, name, description, benefit_type, redemptions_per_period, amount_cents, currency, billing_interval, active",
		)
		.eq("store_id", store.id)
		.eq("active", true)
		.order("created_at", { ascending: false });

	let activePlanIds: string[] = [];
	let hasActiveStoreSubscription = false;

	if (authData.user) {
		const { data: customer } = await supabase
			.from("customers")
			.select("id")
			.eq("store_id", store.id)
			.eq("profile_id", authData.user.id)
			.maybeSingle();

		if (customer) {
			const { data: subscriptions } = await supabase
				.from("subscriptions")
				.select("plan_id, status, current_period_end")
				.eq("customer_id", customer.id)
				.eq("store_id", store.id);

			const now = new Date();
			const activeSubscriptions = (subscriptions ?? []).filter((subscription) => {
				if (!subscription.status || !["active", "trialing"].includes(subscription.status)) {
					return false;
				}

				if (!subscription.current_period_end) {
					return true;
				}

				return new Date(subscription.current_period_end).getTime() > now.getTime();
			});

			activePlanIds = activeSubscriptions.map((subscription) => subscription.plan_id);
			hasActiveStoreSubscription = activeSubscriptions.length > 0;
		}
	}

	return (
		<div className="min-h-screen bg-slate-50 px-6 py-8 text-slate-900 lg:px-10">
			<div className="mx-auto max-w-7xl space-y-8">
				<StoreLanding
					storeName={store.name}
					storeSlug={store.slug}
					planCount={plans?.length ?? 0}
				/>

				<section className="space-y-4">
					<div>
						<p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
							Available Offerings
						</p>
						<h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
							Choose a plan and subscribe.
						</h2>
					</div>

					{plans?.length ? (
						<PlanCards
							storeSlug={store.slug}
							isAuthenticated={!!authData.user}
							plans={plans}
							activePlanIds={activePlanIds}
							hasActiveStoreSubscription={hasActiveStoreSubscription}
						/>
					) : (
						<div className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-10 text-sm text-slate-500 shadow-sm">
							This store does not have any active plans yet.
						</div>
					)}
				</section>
			</div>
		</div>
	);
}
