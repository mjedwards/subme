import RedeemReview from "@/components/RedeemReview";
import { QrTokenError, decodeQrToken } from "@/lib/qr/sign";
import Link from "next/link";

type RedeemPageProps = {
	params: Promise<{
		token: string;
	}>;
};

export default async function StaffRedeemPage({ params }: RedeemPageProps) {
	const { token: encodedToken } = await params;
	const token = decodeURIComponent(encodedToken);
	let preview:
		| {
				storeId: string;
				subscriptionId: string;
				customerId: string;
				planId?: string;
				periodStart: string;
				periodEnd?: string;
				expiresAt: string;
		  }
		| null = null;
	let errorMessage = "";

	try {
		const payload = decodeQrToken(token);
		preview = {
			storeId: payload.storeId,
			subscriptionId: payload.subscriptionId,
			customerId: payload.customerId,
			planId: payload.planId,
			periodStart: payload.periodStart,
			periodEnd: payload.periodEnd,
			expiresAt: new Date(payload.exp * 1000).toISOString(),
		};
	} catch (error) {
		errorMessage =
			error instanceof QrTokenError
				? error.message
				: "The scanned QR token could not be read.";
	}

	if (!preview) {
		return (
			<div className="space-y-6">
				<section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
					<p className="text-xs font-semibold uppercase tracking-[0.3em] text-rose-500">
						Invalid Token
					</p>
					<h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
						This QR token cannot be reviewed.
					</h1>
					<p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
						{errorMessage}
					</p>
					<Link
						href="/scan"
						className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-700"
					>
						Back to scanner
					</Link>
				</section>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<section className="rounded-[2rem] border border-slate-200 bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.2),_transparent_28%),linear-gradient(135deg,#ffffff,#f8fafc)] p-6 shadow-sm">
				<p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-600">
					Redeem Checkout
				</p>
				<h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
					Validate this customer redemption.
				</h1>
				<p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
					The QR payload has been parsed successfully. Submit to run the
					server-side signature, access, subscription, and duplicate redemption
					checks.
				</p>
			</section>

			<RedeemReview token={token} preview={preview} />
		</div>
	);
}
