import Link from "next/link";
import { PLANS } from "@/lib/plans";
import CheckoutButton from "@/components/CheckoutButton";

export default function PricingPage() {
  return (
    <main className="min-h-screen px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <Link href="/" className="text-sm text-zinc-400 hover:text-zinc-200">
          ← Back home
        </Link>
        <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">
          Simple pricing, honest limits
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-zinc-400">
          Your first event is free — up to 200 photos, no card required. Upgrade
          when your bookings grow.
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
              <h2 className="text-xl font-bold">{plan.name}</h2>
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
                  <CheckoutButton planId={plan.id} />
                )}
              </div>
            </div>
          ))}
        </div>

        <p className="mt-10 text-center text-sm text-zinc-500">
          Payments are processed securely by Razorpay. Your photos always stay
          yours — upgrading only raises your limits.
        </p>
      </div>
    </main>
  );
}
