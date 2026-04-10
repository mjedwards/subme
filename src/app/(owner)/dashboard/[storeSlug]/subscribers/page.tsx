import StoreSubscribersView from "@/components/StoreSubscribersView";

type SubscribersPageProps = {
	params: Promise<{ storeSlug: string }>;
};

export default async function SubscribersPage({
	params,
}: SubscribersPageProps) {
	const { storeSlug } = await params;

	return <StoreSubscribersView storeSlug={storeSlug} />;
}
