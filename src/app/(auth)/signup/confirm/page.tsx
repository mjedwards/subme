"use client";
import { Fraunces, Space_Grotesk } from "next/font/google";
import { useSearchParams } from "next/navigation";

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

export default function ConfirmEmail() {
	const params = useSearchParams();
	const message =
		params.get("message") ?? "Check your email to verify your account.";

	return (
		<div
			className={`${spaceGrotesk.className} min-h-screen bg-gradient-to-br from-[#0f1c1a] via-[#102a23] to-[#183b33] text-white`}>
			<div className='mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center gap-0 px-6 py-10'>
				<section className='relative overflow-hidden rounded-[28px] bg-[#0b2a24] p-8 shadow-[0_30px_80px_rgba(0,0,0,0.35)] lg:p-12'>
					<div className='absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[#1ed18a]/20 blur-3xl' />
					<div className='absolute -bottom-24 -right-12 h-64 w-64 rounded-full bg-[#7ef2a6]/20 blur-3xl' />
					<div className='relative z-10 flex h-full flex-col justify-center gap-12'>
						<div className='flex items-center justify-between'>
							<span className='text-sm font-semibold tracking-[0.35em] text-center w-full text-[#7ef2a6]'>
								SUBME
							</span>
						</div>
						<div>
							<p className='text-sm uppercase tracking-[0.3em] text-white/60 text-center'>
								Confirm Email
							</p>
							<h1
								className={`w-sm text-center ${fraunces.className} mt-4 text-3xl leading-tight text-white sm:text-4xl`}>
								{message}
							</h1>
							<p className='mt-4 text-sm text-white/70 text-center'>
								You can close this page!
							</p>
						</div>
					</div>
				</section>
			</div>
		</div>
	);
}
