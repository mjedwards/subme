import SubscriptionActivationPanel from "@/components/SubscriptionActivationPanel";
import { createRouteHandlerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

type SubscribeSuccessPageProps = {
	searchParams?: Promise<{
		storeId?: string;
		storeSlug?: string;
		planId?: string;
	}>;
};

export default async function SubscribeSuccessPage({
	searchParams,
}: SubscribeSuccessPageProps) {
	const params = await searchParams;
	const storeId = params?.storeId?.trim() ?? "";
	const storeSlug = params?.storeSlug?.trim() ?? "";
	const planId = params?.planId?.trim() ?? "";

	if (!storeId || !storeSlug || !planId) {
		redirect("/");
	}

	const supabase = await createRouteHandlerSupabaseClient();
	const { data: authData } = await supabase.auth.getUser();

	if (!authData.user) {
		redirect(
			`/login?next=${encodeURIComponent(
				`/subscribe/success?storeId=${storeId}&storeSlug=${storeSlug}&planId=${planId}`,
			)}`,
		);
	}

	const [{ data: store }, { data: plan }] = await Promise.all([
		supabase
			.from("stores")
			.select("id, name, slug")
			.eq("id", storeId)
			.eq("slug", storeSlug)
			.maybeSingle(),
		supabase
			.from("plans")
			.select("id, name")
			.eq("id", planId)
			.eq("store_id", storeId)
			.maybeSingle(),
	]);

	if (!store || !plan) {
		redirect("/");
	}

	return (
		<div className="min-h-screen bg-slate-50 px-6 py-8 text-slate-900 lg:px-10">
			<div className="mx-auto max-w-4xl space-y-6">
				<section className="rounded-[2rem] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.16),_transparent_28%),linear-gradient(135deg,#ffffff,#f8fafc)] p-6 shadow-sm">
					<p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-600">
						Checkout Complete
					</p>
					<h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900">
						Wrapping up your subscription.
					</h1>
					<p className="mt-4 max-w-3xl text-sm leading-6 text-slate-600">
						Your payment went through. We’re waiting for the live subscription
						record to sync so your QR can appear in the customer account.
					</p>
				</section>

				<SubscriptionActivationPanel
					storeId={store.id}
					storeSlug={store.slug}
					planId={plan.id}
					storeName={store.name}
					planName={plan.name}
				/>
			</div>
		</div>
	);
}
