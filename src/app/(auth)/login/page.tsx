import { Fraunces, Space_Grotesk } from "next/font/google";
import SignInPanel from "./SignInPanel";

const spaceGrotesk = Space_Grotesk({
	subsets: ["latin"],
	display: "swap",
	weight: ["400", "500", "600", "700"],
});

const fraunces = Fraunces({
	subsets: ["latin"],
	display: "swap",
	weight: ["600", "700"],
});

export default async function LoginPage({
	searchParams,
}: {
	searchParams?: Promise<{ error?: string }>;
}) {
	const params = searchParams ? await searchParams : undefined;
	const errorMessage = params?.error ? decodeURIComponent(params.error) : "";
	return (
		<div
			className={`${spaceGrotesk.className} min-h-screen bg-gradient-to-br from-[#0f1c1a] via-[#102a23] to-[#183b33] text-white`}
		>
			<div className="mx-auto grid min-h-screen w-full max-w-6xl grid-cols-1 gap-0 px-6 py-10 lg:grid-cols-[0.95fr_1.05fr] lg:gap-10 lg:px-10">
				<section className="relative overflow-hidden rounded-[28px] bg-[#0b2a24] p-8 shadow-[0_30px_80px_rgba(0,0,0,0.35)] lg:p-12">
					<div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[#1ed18a]/20 blur-3xl" />
					<div className="absolute -bottom-24 -right-12 h-64 w-64 rounded-full bg-[#7ef2a6]/20 blur-3xl" />
					<div className="relative z-10 flex h-full flex-col justify-between gap-12">
						<div className="flex items-center justify-between">
							<span className="text-sm font-semibold tracking-[0.35em] text-[#7ef2a6]">
								SUBME
							</span>
							<span className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/70">
								Franchise Edition
							</span>
						</div>
						<div>
							<p className="text-sm uppercase tracking-[0.3em] text-white/60">
								Your subscriber hub
							</p>
							<h1
								className={`${fraunces.className} mt-4 text-4xl leading-tight text-white sm:text-5xl`}
							>
								Welcome back to
								<br />
								rewarding loyalty
							</h1>
							<p className="mt-4 max-w-sm text-sm text-white/70">
								Check redemptions, manage your plan, and stay connected with
								every store.
							</p>
						</div>
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
							<div className="rounded-2xl border border-white/10 bg-white/5 p-4">
								<p className="text-sm font-semibold text-white">Stay synced</p>
								<p className="mt-2 text-xs text-white/60">
									Track subscription status in real time.
								</p>
							</div>
							<div className="rounded-2xl border border-white/10 bg-white/5 p-4">
								<p className="text-sm font-semibold text-white">Redeem fast</p>
								<p className="mt-2 text-xs text-white/60">
									Open your QR and redeem instantly.
								</p>
							</div>
							<div className="rounded-2xl border border-white/10 bg-white/5 p-4">
								<p className="text-sm font-semibold text-white">Staff ready</p>
								<p className="mt-2 text-xs text-white/60">
									Secure access for every store team.
								</p>
							</div>
						</div>
					</div>
				</section>
				<section className="flex flex-col justify-between rounded-[28px] bg-white p-8 text-slate-900 shadow-[0_30px_80px_rgba(0,0,0,0.18)] lg:p-12">
					<div className="flex items-center justify-between text-sm text-slate-500">
						<p>New here?</p>
						<a className="font-semibold text-slate-900" href="/signup">
							Create account
						</a>
					</div>
					<SignInPanel initialError={errorMessage} />
					<p className="text-center text-xs text-slate-400">
						By signing in, you agree to our Terms of Service and Privacy
						Policy.
					</p>
				</section>
			</div>
		</div>
	);
}
