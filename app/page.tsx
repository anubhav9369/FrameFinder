import Image from "next/image";
import Link from "next/link";
import { PLANS } from "@/lib/plans";
import Faq from "@/components/Faq";

const FEATURES = [
  {
    title: "AI face search",
    desc: "Guests take a selfie and instantly find every photo they're in — no more scrolling through thousands of shots.",
  },
  {
    title: "Ceremony folders",
    desc: "Organise each event into Haldi, Mehndi, Sangeet, Wedding and custom folders with drag-free, simple structure.",
  },
  {
    title: "Client album selection",
    desc: "Clients star their favourite photos in a private gallery and send you the shortlist on WhatsApp — no spreadsheets.",
  },
  {
    title: "WhatsApp ordering",
    desc: "Photo purchases and selection hand-offs flow through WhatsApp, the channel your clients already use.",
  },
  {
    title: "Watermarked selling",
    desc: "Show watermarked previews, price per photo or the whole event, and collect payment via UPI.",
  },
  {
    title: "On-device AI",
    desc: "Face detection runs on the device — fast for you and private for your clients.",
  },
];

const STEPS = [
  {
    n: "1",
    title: "Create an event",
    desc: "Sign in, create an event, and upload your photos into ceremony folders.",
  },
  {
    n: "2",
    title: "Share the gallery",
    desc: "Send clients a private gallery link. They find themselves with a selfie and star their favourites.",
  },
  {
    n: "3",
    title: "Get selections & sell",
    desc: "Import their WhatsApp shortlist in one tap and sell prints or full albums with watermarks.",
  },
];

const FAQS = [
  {
    q: "Is my first event really free?",
    a: "Yes. The free plan includes one event with up to 200 photos — no credit card required. When you need more events or photos, upgrade to a paid plan.",
  },
  {
    q: "Who owns my photos?",
    a: "You do. Your photos stay yours, always. FrameFinder never claims rights over your work, and deleting an event removes it from our systems.",
  },
  {
    q: "How do clients find their photos?",
    a: "They open your shared gallery, take or upload a selfie, and our on-device AI shows them every photo they appear in. Then they star the ones they want for their album.",
  },
  {
    q: "What happens after my free event?",
    a: "You'll need a paid plan to create more events or upload more photos. Your existing event and data stay accessible — paid plans only raise your limits.",
  },
  {
    q: "How do I get paid?",
    a: "You set per-photo or whole-event pricing. Clients order through WhatsApp and pay you directly via UPI; paid plan checkout uses Razorpay for your subscription.",
  },
];

function LogoMark() {
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" fill="none" aria-hidden>
      <defs>
        <linearGradient id="ff-ring" x1="4" y1="4" x2="30" y2="30">
          <stop offset="0" stopColor="#FF6B4A" />
          <stop offset="1" stopColor="#8f2f18" />
        </linearGradient>
      </defs>
      <circle cx="17" cy="17" r="12.5" stroke="url(#ff-ring)" strokeWidth="5" />
      <circle cx="17" cy="17" r="5" fill="#fff" />
    </svg>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0a0c] text-zinc-100">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0a0a0c]/85 backdrop-blur">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <LogoMark />
            <span className="text-lg font-extrabold tracking-tight">
              FrameFinder
            </span>
            <span className="hidden text-sm text-zinc-500 sm:inline">
              for event photographers
            </span>
          </Link>
          <div className="hidden items-center gap-8 text-[15px] font-medium text-zinc-300 md:flex">
            <Link href="#features" className="hover:text-white">
              Features
            </Link>
            <Link href="#how" className="hover:text-white">
              How it works
            </Link>
            <Link href="#pricing" className="hover:text-white">
              Pricing
            </Link>
            <Link href="#faq" className="hover:text-white">
              FAQ
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/studio"
              className="rounded-xl border border-white/15 px-5 py-2.5 text-sm font-semibold hover:border-white/30"
            >
              Open Studio
            </Link>
            <Link
              href="/login"
              className="rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-white shadow-[0_8px_24px_-8px_rgba(255,107,74,0.7)] hover:bg-brand-deep"
            >
              Start free
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-7xl items-center gap-14 px-6 py-16 lg:grid-cols-2 lg:py-24">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand">
            — AI photo delivery, built for events
          </p>
          <h1 className="mt-6 text-5xl font-extrabold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
            AI-powered
            <br />
            tool for your
            <br />
            <span className="text-brand">media assets.</span>
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-relaxed text-zinc-400">
            Turn a crowded event gallery into a personal experience. Guests find
            their photos with a selfie, while you deliver faster, build your
            portfolio, and sell more.
          </p>
          <div className="mt-9 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/login"
              className="rounded-xl bg-brand px-8 py-4 text-center text-base font-bold text-white shadow-[0_12px_32px_-10px_rgba(255,107,74,0.8)] hover:bg-brand-deep"
            >
              Start free
            </Link>
            <Link
              href="#how"
              className="rounded-xl border border-white/15 px-8 py-4 text-center text-base font-semibold hover:border-white/30"
            >
              See how it works <span aria-hidden>→</span>
            </Link>
          </div>
          <p className="mt-5 text-sm text-zinc-500">
            <span className="mr-1.5 text-emerald-400">✓</span>
            One free event · Up to 200 photos · No card required
          </p>
        </div>

        {/* Hero visual */}
        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 shadow-2xl">
            <Image
              src="/hero-sangeet.jpg"
              alt="Sangeet night celebration captured by a FrameFinder photographer"
              width={880}
              height={1100}
              className="aspect-[4/5] w-full object-cover"
              priority
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-6">
              <div>
                <p className="text-lg font-bold">Sangeet Night</p>
                <p className="text-sm text-zinc-300">Personal gallery ready</p>
              </div>
              <p className="text-sm font-medium text-zinc-200">1,248 photos</p>
            </div>
            {/* face-detection brackets */}
            <div
              aria-hidden
              className="pointer-events-none absolute right-[16%] top-[36%] h-28 w-24"
            >
              <span className="absolute left-0 top-0 h-7 w-7 rounded-tl-xl border-l-[3px] border-t-[3px] border-brand" />
              <span className="absolute right-0 top-0 h-7 w-7 rounded-tr-xl border-r-[3px] border-t-[3px] border-brand" />
              <span className="absolute bottom-0 left-0 h-7 w-7 rounded-bl-xl border-b-[3px] border-l-[3px] border-brand" />
              <span className="absolute bottom-0 right-0 h-7 w-7 rounded-br-xl border-b-[3px] border-r-[3px] border-brand" />
            </div>
          </div>

          {/* Match found card */}
          <div className="absolute -left-4 top-10 w-60 rounded-2xl border border-white/10 bg-zinc-900/95 p-4 shadow-2xl backdrop-blur sm:-left-10">
            <div className="flex items-center gap-3">
              <div
                className="h-11 w-11 shrink-0 rounded-full bg-cover ring-2 ring-brand"
                style={{
                  backgroundImage: "url(/hero-sangeet.jpg)",
                  backgroundPosition: "28% 18%",
                }}
              />
              <div>
                <p className="text-sm font-bold">Match found</p>
                <p className="text-xs text-zinc-400">18 moments collected</p>
              </div>
            </div>
            <div className="mt-3 flex gap-1.5">
              {["72% 42%", "42% 68%", "86% 58%"].map((pos) => (
                <div
                  key={pos}
                  className="h-12 w-12 rounded-lg bg-cover"
                  style={{
                    backgroundImage: "url(/hero-sangeet.jpg)",
                    backgroundPosition: pos,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Brand badge */}
          <div className="absolute -right-3 top-6 rounded-full border border-white/10 bg-zinc-900/95 px-4 py-2 text-sm font-semibold shadow-xl backdrop-blur sm:-right-6">
            Your brand. Their gallery.
          </div>
        </div>
      </section>

      {/* Spec strip */}
      <section className="border-y border-white/[0.06] bg-white/[0.02]">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-6 py-12 md:grid-cols-4">
          {[
            ["AI face search", "Find any guest in seconds"],
            ["Ceremony folders", "Haldi → Mehndi → Sangeet → Wedding"],
            ["WhatsApp handoff", "Selections arrive as messages"],
            ["Watermarked previews", "Sell before you deliver"],
          ].map(([t, d]) => (
            <div key={t}>
              <p className="font-bold text-zinc-100">{t}</p>
              <p className="mt-1 text-sm text-zinc-500">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl scroll-mt-20 px-6 py-24">
        <h2 className="text-center text-3xl font-extrabold tracking-tight sm:text-4xl">
          Everything after the shutter clicks
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-zinc-400">
          FrameFinder handles the part of the job that eats your weekends:
          organising, sharing, selecting and selling.
        </p>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 transition-colors hover:border-brand/40"
            >
              <h3 className="text-lg font-bold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section
        id="how"
        className="scroll-mt-20 border-y border-white/[0.06] bg-white/[0.02]"
      >
        <div className="mx-auto max-w-7xl px-6 py-24">
          <h2 className="text-center text-3xl font-extrabold tracking-tight sm:text-4xl">
            How it works
          </h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {STEPS.map((s) => (
              <div
                key={s.n}
                className="rounded-2xl border border-white/[0.06] bg-[#0a0a0c] p-8"
              >
                <p className="flex h-10 w-10 items-center justify-center rounded-full bg-brand font-extrabold text-white">
                  {s.n}
                </p>
                <h3 className="mt-4 text-lg font-bold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-7xl scroll-mt-20 px-6 py-24">
        <h2 className="text-center text-3xl font-extrabold tracking-tight sm:text-4xl">
          Pricing
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-zinc-400">
          Start with one free event. Upgrade when your calendar fills up.
        </p>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`flex flex-col rounded-2xl border p-8 ${
                plan.id === "starter"
                  ? "border-brand bg-brand-muted"
                  : "border-white/[0.06] bg-white/[0.03]"
              }`}
            >
              <h3 className="text-xl font-extrabold">{plan.name}</h3>
              <p className="mt-1 text-sm text-zinc-400">{plan.blurb}</p>
              <p className="mt-6">
                <span className="text-4xl font-extrabold">
                  ₹{plan.priceInr.toLocaleString("en-IN")}
                </span>
                <span className="ml-2 text-sm text-zinc-400">
                  {plan.id === "free" ? "forever" : "/ month"}
                </span>
              </p>
              <ul className="mt-6 flex-1 space-y-3 text-sm text-zinc-300">
                {plan.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <span className="text-brand">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                {plan.id === "free" ? (
                  <Link
                    href="/login"
                    className="block w-full rounded-xl border border-white/15 px-4 py-3 text-center font-bold hover:border-white/30"
                  >
                    Start free
                  </Link>
                ) : (
                  <Link
                    href="/pricing"
                    className="block w-full rounded-xl bg-brand px-4 py-3 text-center font-bold text-white hover:bg-brand-deep"
                  >
                    Choose {plan.name}
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl scroll-mt-20 px-6 py-24">
        <h2 className="text-center text-3xl font-extrabold tracking-tight sm:text-4xl">
          FAQ
        </h2>
        <div className="mt-10">
          <Faq items={FAQS} />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-10 text-sm text-zinc-500 sm:flex-row">
          <p className="flex items-center gap-2 font-extrabold text-zinc-200">
            <LogoMark />
            FrameFinder
          </p>
          <div className="flex gap-6">
            <Link href="/pricing" className="hover:text-zinc-200">
              Pricing
            </Link>
            <Link href="/login" className="hover:text-zinc-200">
              Sign in
            </Link>
            <Link href="/studio" className="hover:text-zinc-200">
              Open Studio
            </Link>
          </div>
          <p>© 2026 FrameFinder. Your photos stay yours.</p>
        </div>
      </footer>
    </div>
  );
}
