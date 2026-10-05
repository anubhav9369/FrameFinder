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

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-xl font-bold tracking-tight">
            Frame<span className="text-indigo-400">Finder</span>
          </Link>
          <div className="hidden items-center gap-8 text-sm text-zinc-400 md:flex">
            <Link href="#features" className="hover:text-zinc-100">Features</Link>
            <Link href="#how" className="hover:text-zinc-100">How it works</Link>
            <Link href="#pricing" className="hover:text-zinc-100">Pricing</Link>
            <Link href="#faq" className="hover:text-zinc-100">FAQ</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/studio"
              className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium hover:border-zinc-500"
            >
              Open Studio
            </Link>
            <Link
              href="/login"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold hover:bg-indigo-500"
            >
              Start free
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 py-24 text-center sm:py-32">
        <p className="mx-auto inline-block rounded-full border border-indigo-800 bg-indigo-950/40 px-4 py-1 text-sm text-indigo-300">
          Built for wedding &amp; event photographers
        </p>
        <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
          AI-powered photo delivery for event photographers
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-400">
          Upload your shots, let guests find themselves with a selfie, collect
          album selections on WhatsApp, and sell photos with watermarks — all
          from one studio.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/login"
            className="w-full rounded-xl bg-indigo-600 px-8 py-4 text-lg font-semibold hover:bg-indigo-500 sm:w-auto"
          >
            Start free
          </Link>
          <Link
            href="#how"
            className="w-full rounded-xl border border-zinc-700 px-8 py-4 text-lg font-medium hover:border-zinc-500 sm:w-auto"
          >
            See how it works
          </Link>
        </div>
        <p className="mt-4 text-sm text-zinc-500">
          One free event · Up to 200 photos · No card required
        </p>
      </section>

      {/* Stats strip */}
      <section className="border-y border-zinc-800/80 bg-zinc-900/40">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-6 py-10 text-center md:grid-cols-4">
          {[
            ["AI face search", "Find any guest in seconds"],
            ["Ceremony folders", "Haldi → Mehndi → Sangeet → Wedding"],
            ["WhatsApp handoff", "Selections arrive as messages"],
            ["Watermarked previews", "Sell before you deliver"],
          ].map(([t, d]) => (
            <div key={t}>
              <p className="font-semibold text-zinc-100">{t}</p>
              <p className="mt-1 text-sm text-zinc-500">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-24">
        <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
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
              className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6"
            >
              <h3 className="text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-y border-zinc-800/80 bg-zinc-900/40 scroll-mt-20">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
            How it works
          </h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {STEPS.map((s) => (
              <div
                key={s.n}
                className="rounded-2xl border border-zinc-800 bg-zinc-950 p-8"
              >
                <p className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 font-bold">
                  {s.n}
                </p>
                <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-24">
        <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
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
                  ? "border-indigo-500 bg-zinc-900"
                  : "border-zinc-800 bg-zinc-900/60"
              }`}
            >
              <h3 className="text-xl font-bold">{plan.name}</h3>
              <p className="mt-1 text-sm text-zinc-400">{plan.blurb}</p>
              <p className="mt-6">
                <span className="text-4xl font-bold">
                  ₹{plan.priceInr.toLocaleString("en-IN")}
                </span>
                <span className="ml-2 text-sm text-zinc-400">
                  {plan.id === "free" ? "forever" : "/ month"}
                </span>
              </p>
              <ul className="mt-6 flex-1 space-y-3 text-sm text-zinc-300">
                {plan.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <span className="text-emerald-400">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                {plan.id === "free" ? (
                  <Link
                    href="/login"
                    className="block w-full rounded-xl border border-zinc-700 px-4 py-3 text-center font-semibold hover:border-zinc-500"
                  >
                    Start free
                  </Link>
                ) : (
                  <Link
                    href="/pricing"
                    className="block w-full rounded-xl bg-indigo-600 px-4 py-3 text-center font-semibold hover:bg-indigo-500"
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
        <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
          FAQ
        </h2>
        <div className="mt-10">
          <Faq items={FAQS} />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800/80">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-10 text-sm text-zinc-500 sm:flex-row">
          <p className="font-bold text-zinc-200">
            Frame<span className="text-indigo-400">Finder</span>
          </p>
          <div className="flex gap-6">
            <Link href="/pricing" className="hover:text-zinc-200">Pricing</Link>
            <Link href="/login" className="hover:text-zinc-200">Sign in</Link>
            <Link href="/studio" className="hover:text-zinc-200">Open Studio</Link>
          </div>
          <p>© 2026 FrameFinder. Your photos stay yours.</p>
        </div>
      </footer>
    </div>
  );
}
