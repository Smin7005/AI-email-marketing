import { SignIn, SignInButton, SignedIn, SignedOut } from '@clerk/nextjs';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div
      style={{ fontFamily: "'Public Sans', Arial, sans-serif", backgroundColor: '#f8f6f6' }}
      className="relative flex min-h-screen flex-col overflow-x-hidden text-slate-900 antialiased"
    >
      {/* ── Navigation ── */}
      <nav className="sticky top-0 z-50 w-full border-b border-black/10 backdrop-blur-md" style={{ backgroundColor: 'rgba(248,246,246,0.8)' }}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-3xl" style={{ color: '#ec5b13' }}>terminal</span>
            <span className="text-xl font-bold tracking-tight">PrecisionMail</span>
          </div>
          <div className="hidden md:flex items-center gap-10">
            {['Infrastructure', 'Deliverability', 'Pricing', 'Docs'].map((item) => (
              <a key={item} className="text-sm font-medium transition-colors hover:text-[#ec5b13]" href="#">{item}</a>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <SignedOut>
              <SignInButton>
                <button className="text-sm font-bold px-4 py-2 transition-colors hover:text-[#ec5b13]">Login</button>
              </SignInButton>
              <SignInButton>
                <button className="rounded-lg px-5 py-2 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90" style={{ backgroundColor: '#ec5b13' }}>
                  Start Building
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link
                href="/overview"
                className="rounded-lg px-5 py-2 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#ec5b13' }}
              >
                Dashboard
              </Link>
            </SignedIn>
          </div>
        </div>
      </nav>

      <main className="flex-1">
        {/* ── Hero ── */}
        <section className="relative overflow-hidden px-6 py-20 lg:py-32">
          <div className="mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-2">
            {/* Left copy */}
            <div className="flex flex-col gap-8">
              <div
                className="inline-flex w-fit items-center gap-2 rounded-full border border-black/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider"
                style={{ color: '#ec5b13' }}
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style={{ backgroundColor: '#ec5b13' }}></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full" style={{ backgroundColor: '#ec5b13' }}></span>
                </span>
                Now supporting Dedicated IP Warming
              </div>

              <h1 className="text-5xl font-black leading-tight tracking-tight lg:text-7xl">
                <span style={{ color: '#ec5b13' }}>AI-Powered</span>
                <br />
                <span style={{ fontSize: '4rem', letterSpacing: '-0.025em' }}>Email Marketing</span>
              </h1>

              <p className="max-w-xl text-lg leading-relaxed text-slate-600">
                Connect with Australian businesses using personalized AI-generated email campaigns
              </p>

              <div className="flex flex-col gap-4 sm:flex-row">
                <input
                  className="min-w-[280px] rounded-lg border border-black/10 bg-white px-4 py-3 outline-none transition-all focus:border-[#ec5b13] focus:ring-1 focus:ring-[#ec5b13]"
                  placeholder="name@company.com"
                  type="email"
                />
                <button
                  className="rounded-lg px-8 py-3 font-bold text-white transition-all hover:shadow-lg"
                  style={{ backgroundColor: '#ec5b13' }}
                >
                  Send Testing Email
                </button>
              </div>

              <p className="text-xs text-slate-400">Zero setup fee. 10,000 free emails/mo.</p>
            </div>

            {/* Right: sign-in card */}
            <div className="flex items-center justify-center lg:justify-end">
              <SignedOut>
                <SignIn routing="hash" signUpUrl="/sign-up" />
              </SignedOut>

              <SignedIn>
                <div className="w-full max-w-[400px] rounded-2xl border border-black/10 bg-white p-8 shadow-xl text-center">
                  <span className="material-symbols-outlined mb-4 block text-5xl" style={{ color: '#ec5b13' }}>mark_email_read</span>
                  <p className="mb-6 text-sm text-slate-600">You&apos;re signed in and ready to send campaigns</p>
                  <Link
                    href="/overview"
                    className="block w-full rounded-lg py-2.5 text-center text-sm font-bold text-white shadow-lg transition-opacity hover:opacity-90"
                    style={{ backgroundColor: '#ec5b13' }}
                  >
                    Go to Dashboard
                  </Link>
                </div>
              </SignedIn>
            </div>
          </div>
        </section>

        {/* ── Core Features ── */}
        <section className="border-y border-black/10 bg-stone-50/50 px-6 py-24">
          <div className="mx-auto max-w-7xl">
            <div className="mb-16 text-center">
              <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.2em]" style={{ color: '#ec5b13' }}>Core Infrastructure</h2>
              <h3 className="text-3xl font-bold">Engineered for Technical Precision</h3>
            </div>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: 'database', title: '20K+ Local Leads', desc: 'Access our high-integrity database of local B2B contacts, refreshed weekly via proprietary crawlers.' },
                { icon: 'variables', title: 'Hyper-Personalized', desc: 'Dynamic variable injection for true 1:1 messaging at infinite scale powered by AI.' },
                { icon: 'dns', title: 'Custom Domain', desc: 'Built-in SPF, DKIM, and DMARC management. Send from your own infrastructure with zero friction.' },
                { icon: 'insights', title: 'Real-Time Analytics', desc: 'Fine-grained event tracking for opens, clicks, and replies via high-speed webhooks.' },
              ].map(({ icon, title, desc }) => (
                <div
                  key={title}
                  className="group rounded-xl border border-black/10 bg-[#f8f6f6] p-8 transition-colors hover:border-[#ec5b13]"
                >
                  <span className="material-symbols-outlined mb-6 block text-4xl" style={{ color: '#ec5b13' }}>{icon}</span>
                  <h4 className="mb-3 text-lg font-bold">{title}</h4>
                  <p className="text-sm leading-relaxed text-slate-500">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Testimonial ── */}
        <section className="border-b border-black/10 px-6 py-24">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-8 flex justify-center gap-1">
              {[...Array(5)].map((_, i) => (
                <span
                  key={i}
                  className="material-symbols-outlined text-2xl"
                  style={{ color: '#ec5b13', fontVariationSettings: "'FILL' 1, 'wght' 400" }}
                >
                  star
                </span>
              ))}
            </div>
            <blockquote className="mb-8 text-2xl font-medium italic leading-relaxed text-slate-800">
              &ldquo;PrecisionMail replaced our bloated marketing suite with a clean, developer-first API. Our
              deliverability rates jumped from 82% to 98.4% in just two weeks of switching.&rdquo;
            </blockquote>
            <div className="flex items-center justify-center gap-4">
              <div className="h-12 w-12 rounded-full bg-stone-200"></div>
              <div className="text-left">
                <p className="font-bold">Marcus Thorne</p>
                <p className="text-xs uppercase tracking-widest text-slate-500">CTO, DataNexus</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Pricing ── */}
        <section className="bg-stone-50 px-6 py-24">
          <div className="mx-auto max-w-7xl">
            <div className="mb-16 text-center">
              <h2 className="mb-4 text-3xl font-bold">Simple, Volume-Based Pricing</h2>
              <p className="text-slate-500">Scale with your outbound needs. No hidden features.</p>
            </div>
            <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
              {/* Sandbox */}
              <div className="flex flex-col rounded-xl border border-black/10 bg-[#f8f6f6] p-8">
                <p className="mb-2 text-sm font-bold text-slate-500">Sandbox</p>
                <div className="mb-6 flex items-baseline gap-1">
                  <span className="text-4xl font-black">$0</span>
                  <span className="text-slate-400">/mo</span>
                </div>
                <ul className="mb-8 flex-1 space-y-4 text-sm">
                  {['10,000 emails/mo', 'Shared IP', 'Webhooks'].map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-lg text-green-500">check_circle</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <SignInButton>
                  <button className="w-full rounded-lg border border-black/10 py-3 font-bold transition-colors hover:bg-slate-50">
                    Start for Free
                  </button>
                </SignInButton>
              </div>

              {/* Growth (recommended) */}
              <div className="relative flex flex-col rounded-xl bg-[#f8f6f6] p-8" style={{ border: '2px solid #ec5b13' }}>
                <div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white"
                  style={{ backgroundColor: '#ec5b13' }}
                >
                  Recommended
                </div>
                <p className="mb-2 text-sm font-bold text-slate-500">Growth</p>
                <div className="mb-6 flex items-baseline gap-1">
                  <span className="text-4xl font-black">$149</span>
                  <span className="text-slate-400">/mo</span>
                </div>
                <ul className="mb-8 flex-1 space-y-4 text-sm">
                  {['250,000 emails/mo', 'Dedicated IP Address', 'Warm-up Protocols', 'Lead Database Access'].map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-lg" style={{ color: '#ec5b13' }}>check_circle</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <SignInButton>
                  <button
                    className="w-full rounded-lg py-3 font-bold text-white shadow-lg transition-opacity hover:opacity-90"
                    style={{ backgroundColor: '#ec5b13' }}
                  >
                    Select Plan
                  </button>
                </SignInButton>
              </div>

              {/* Enterprise */}
              <div className="flex flex-col rounded-xl border border-black/10 bg-[#f8f6f6] p-8">
                <p className="mb-2 text-sm font-bold text-slate-500">Enterprise</p>
                <div className="mb-6 flex items-baseline gap-1">
                  <span className="text-4xl font-black">$499</span>
                  <span className="text-slate-400">/mo</span>
                </div>
                <ul className="mb-8 flex-1 space-y-4 text-sm">
                  {['1M+ emails/mo', 'Multiple Dedicated IPs', 'SLA Guarantees', 'Custom Data Retention'].map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-lg text-green-500">check_circle</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <button className="w-full rounded-lg border border-black/10 py-3 font-bold transition-colors hover:bg-slate-50">
                  Contact Sales
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA Banner ── */}
        <section className="px-6 py-24">
          <div
            className="relative mx-auto flex max-w-7xl flex-col items-center gap-8 overflow-hidden rounded-3xl px-8 py-16 text-center text-white"
            style={{ backgroundColor: '#ec5b13' }}
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-10"
              style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}
            ></div>
            <h2 className="max-w-2xl text-4xl font-black leading-tight lg:text-5xl">
              Ready to fix your deliverability?
            </h2>
            <p className="max-w-xl text-lg opacity-90">
              Integration takes less than 5 minutes. Start sending your first campaign today with our precision infrastructure.
            </p>
            <div className="flex gap-4">
              <SignInButton>
                <button className="rounded-lg bg-white px-8 py-4 font-bold text-[#ec5b13] shadow-xl transition-colors hover:bg-stone-50">
                  Create Free Account
                </button>
              </SignInButton>
              <button className="rounded-lg border border-white/30 bg-white/20 px-8 py-4 font-bold text-white transition-colors hover:bg-white/30">
                Read Documentation
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-black/10 px-6 py-12">
        <div className="mx-auto grid max-w-7xl gap-12 md:grid-cols-4">
          <div>
            <div className="mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-2xl" style={{ color: '#ec5b13' }}>terminal</span>
              <span className="text-lg font-bold tracking-tight">PrecisionMail</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-500">
              High-performance email infrastructure for modern B2B growth teams. Engineered for precision.
            </p>
          </div>
          {[
            { heading: 'Platform', links: ['Deliverability', 'API Reference', 'Lead Database', 'Status'] },
            { heading: 'Company', links: ['About', 'Blog', 'Careers', 'Security'] },
            { heading: 'Contact', links: ['Support', 'Sales', 'X / Twitter', 'LinkedIn'] },
          ].map(({ heading, links }) => (
            <div key={heading} className="space-y-4">
              <h5 className="text-xs font-bold uppercase tracking-widest text-slate-400">{heading}</h5>
              <ul className="space-y-2 text-sm text-slate-600">
                {links.map((link) => (
                  <li key={link}>
                    <a className="transition-colors hover:text-[#ec5b13]" href="#">{link}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mx-auto mt-12 flex max-w-7xl flex-col items-center justify-between gap-4 border-t border-black/10 pt-8 text-[10px] uppercase tracking-widest text-slate-400 md:flex-row">
          <p>© 2024 PrecisionMail Infrastructure Inc.</p>
          <div className="flex gap-6">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Cookie Policy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
