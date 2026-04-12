import { getStripeServerClient } from "@/lib/stripe/server";

type StripePlanParams = {
	stripeAccountId: string;
	storeName: string;
	storeId: string;
	planId: string;
	name: string;
	description?: string;
	amountCents: number;
	currency: string;
	billingInterval: "month" | "year";
};

export async function createStripeCatalogForPlan({
	stripeAccountId,
	storeName,
	storeId,
	planId,
	name,
	description,
	amountCents,
	currency,
	billingInterval,
}: StripePlanParams) {
	const stripe = getStripeServerClient();

	const product = await stripe.products.create(
		{
			name,
			description: description || undefined,
			metadata: {
				store_id: storeId,
				plan_id: planId,
				store_name: storeName,
			},
		},
		{
			stripeAccount: stripeAccountId,
		},
	);

	const price = await stripe.prices.create(
		{
			product: product.id,
			unit_amount: amountCents,
			currency,
			recurring: {
				interval: billingInterval,
			},
			metadata: {
				store_id: storeId,
				plan_id: planId,
			},
		},
		{
			stripeAccount: stripeAccountId,
		},
	);

	return {
		productId: product.id,
		priceId: price.id,
	};
}
