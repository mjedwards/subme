import SubscribePanel from "@/components/SubscribePanel";
import { createRouteHandlerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

type SubscribePageProps = {
	searchParams?: Promise<{ storeSlug?: string; planId?: string }>;
};

export default async function SubscribePage({
	searchParams,
}: SubscribePageProps) {
	const params = await searchParams;
	const storeSlug = params?.storeSlug?.trim() ?? "";
	const planId = params?.planId?.trim() ?? "";

	if (!storeSlug || !planId) {
		redirect("/");
	}

	const supabase = await createRouteHandlerSupabaseClient();
	const { data: authData } = await supabase.auth.getUser();

	if (!authData.user) {
		redirect(
			`/login?next=${encodeURIComponent(
				`/subscribe?storeSlug=${storeSlug}&planId=${planId}`,
			)}`,
		);
	}

	const { data: store } = await supabase
		.from("stores")
		.select("id, name, slug")
		.eq("slug", storeSlug)
		.maybeSingle();

	if (!store) {
		redirect("/");
	}

	const { data: plan } = await supabase
		.from("plans")
		.select("id, name, active")
		.eq("id", planId)
		.eq("store_id", store.id)
		.maybeSingle();

	if (!plan || !plan.active) {
		redirect(`/${store.slug}`);
	}

	return (
		<div className="min-h-screen bg-slate-50 px-6 py-8 text-slate-900 lg:px-10">
			<div className="mx-auto max-w-4xl space-y-6">
				<section className="rounded-[2rem] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.16),_transparent_28%),linear-gradient(135deg,#ffffff,#f8fafc)] p-6 shadow-sm">
					<p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-600">
						Instant Subscribe
					</p>
					<h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900">
						Preparing your subscription.
					</h1>
					<p className="mt-4 max-w-3xl text-sm leading-6 text-slate-600">
						If this plan has a Stripe price attached, you’ll be sent through
						checkout. Manual plans still activate immediately for local QR
						testing.
					</p>
				</section>

				<SubscribePanel
					storeSlug={store.slug}
					planId={plan.id}
					storeName={store.name}
					planName={plan.name}
				/>
			</div>
		</div>
	);
}
