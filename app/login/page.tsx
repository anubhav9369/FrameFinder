"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function friendlyError(raw: string | null): string | null {
  if (!raw) return null;
  const lower = raw.toLowerCase();
  if (lower.includes("rate limit")) {
    return "Too many login emails sent. Please wait about an hour, then request one fresh link — and click it only once.";
  }
  return raw;
}

function LoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const linkError =
    searchParams.get("error") === "link_expired"
      ? "That login link expired or was already used. Request a fresh one below — then open the newest email and click its link exactly once."
      : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (otpError) throw otpError;
      setSent(true);
    } catch (err) {
      setError(friendlyError(err instanceof Error ? err.message : "Something went wrong."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8">
        <Link href="/" className="text-sm text-zinc-400 hover:text-zinc-200">
          ← Back home
        </Link>
        <h1 className="mt-6 text-2xl font-bold">Sign in to FrameFinder</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Password-free login — we email you a secure sign-in link.
        </p>

        {linkError && !sent && (
          <div className="mt-6 rounded-xl border border-amber-800 bg-amber-950/40 p-4">
            <p className="text-sm text-amber-200">{linkError}</p>
          </div>
        )}

        {sent ? (
          <div className="mt-6 rounded-xl border border-emerald-800 bg-emerald-950/40 p-4">
            <p className="font-medium text-emerald-300">Check your email</p>
            <p className="mt-1 text-sm text-zinc-300">
              We sent a login link to <span className="font-medium">{email}</span>.
              Click it to open FrameFinder Studio.
            </p>
            <button
              type="button"
              onClick={() => setSent(false)}
              className="mt-3 text-sm text-zinc-400 hover:text-zinc-200 underline underline-offset-4"
            >
              Use a different email
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <label className="block">
              <span className="text-sm text-zinc-300">Email address</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 placeholder:text-zinc-600 focus:border-brand focus:outline-none"
              />
            </label>
            {error && (
              <p className="text-sm text-red-400">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-brand px-4 py-3 font-semibold text-white hover:bg-brand-deep disabled:opacity-50"
            >
              {loading ? "Sending link…" : "Email me a login link"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
