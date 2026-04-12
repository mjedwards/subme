import { createAdminClient } from "@/lib/supabase/admin";
import { getStripeServerClient } from "@/lib/stripe/server";

type BillingStatus = {
	stripeAccountId: string | null;
	chargesEnabled: boolean;
	payoutsEnabled: boolean;
	detailsSubmitted: boolean;
};

export async function syncStripeBillingStatus(userId: string) {
	const admin = createAdminClient();
	const { data: profile } = await admin
		.from("profiles")
		.select(
			"stripe_account_id, stripe_charges_enabled, stripe_payouts_enabled, stripe_details_submitted",
		)
		.eq("user_id", userId)
		.maybeSingle<{
			stripe_account_id: string | null;
			stripe_charges_enabled: boolean | null;
			stripe_payouts_enabled: boolean | null;
			stripe_details_submitted: boolean | null;
		}>();

	if (!profile?.stripe_account_id) {
		return {
			stripeAccountId: null,
			chargesEnabled: false,
			payoutsEnabled: false,
			detailsSubmitted: false,
		} satisfies BillingStatus;
	}

	const stripe = getStripeServerClient();
	const account = await stripe.accounts.retrieve(profile.stripe_account_id);
	const nextStatus: BillingStatus = {
		stripeAccountId: account.id,
		chargesEnabled: !!account.charges_enabled,
		payoutsEnabled: !!account.payouts_enabled,
		detailsSubmitted: !!account.details_submitted,
	};

	await admin
		.from("profiles")
		.update({
			stripe_account_id: nextStatus.stripeAccountId,
			stripe_charges_enabled: nextStatus.chargesEnabled,
			stripe_payouts_enabled: nextStatus.payoutsEnabled,
			stripe_details_submitted: nextStatus.detailsSubmitted,
		})
		.eq("user_id", userId);

	return nextStatus;
}

export async function getOwnerBillingStatus(userId: string) {
	const admin = createAdminClient();
	const { data: profile } = await admin
		.from("profiles")
		.select(
			"stripe_account_id, stripe_charges_enabled, stripe_payouts_enabled, stripe_details_submitted",
		)
		.eq("user_id", userId)
		.maybeSingle<{
			stripe_account_id: string | null;
			stripe_charges_enabled: boolean | null;
			stripe_payouts_enabled: boolean | null;
			stripe_details_submitted: boolean | null;
		}>();

	return {
		stripeAccountId: profile?.stripe_account_id ?? null,
		chargesEnabled: !!profile?.stripe_charges_enabled,
		payoutsEnabled: !!profile?.stripe_payouts_enabled,
		detailsSubmitted: !!profile?.stripe_details_submitted,
	} satisfies BillingStatus;
}
