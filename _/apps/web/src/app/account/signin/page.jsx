"use client";

import { useEffect, useState } from "react";
import useAuth from "@/utils/useAuth";

export default function SignInPage() {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { signInWithCredentials, signInWithGoogle } = useAuth();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const err = params.get("error");
    if (!err) return;

    if (process.env.NODE_ENV !== "production" && err === "OAuthAccountNotLinked") {
      // We typically don't get the email from the error redirect; the fix endpoint needs the email explicitly.
      // eslint-disable-next-line no-console
      console.warn(
        "[auth][dev] OAuthAccountNotLinked. Hint: POST /api/debug/auth-fix-google with { email, mode: 'relink' } to clear stale google link."
      );
    }

    const message =
      err === "CredentialsSignin"
        ? "Neplatný email nebo heslo"
        : err === "OAuthAccountNotLinked"
          ? "Tento email je už registrovaný jinou metodou. Přihlaste se prosím emailem a poté připojte Google."
          : err === "AccessDenied"
            ? "Přístup byl zamítnut"
            : "Přihlášení se nezdařilo";

    setError(message);
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!email || !password) {
      setError("Vyplňte prosím všechna pole");
      setLoading(false);
      return;
    }

    try {
      const res = await signInWithCredentials({
        email,
        password,
        callbackUrl: "/dashboard",
        redirect: false,
      });
      if (res?.error) {
        setError("Neplatný email nebo heslo");
        setLoading(false);
        return;
      }
      if (res?.url) {
        window.location.href = res.url;
        return;
      }
      // Fallback
      window.location.href = "/dashboard";
    } catch (err) {
      setError("Chyba při přihlášení");
      setLoading(false);
    }
  };

  const onGoogle = async () => {
    setGoogleLoading(true);
    setError(null);
    try {
      await signInWithGoogle({ callbackUrl: "/dashboard", redirect: true });
    } catch (err) {
      setError("Chyba při přihlášení přes Google");
      setGoogleLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-[#5A5BFF]/10 to-[#6366FF]/5 px-6">
      <form
        noValidate
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-2xl bg-white dark:bg-[#1E1E1E] border border-[#E5E7EB] dark:border-gray-700 p-8 shadow-xl"
      >
        <h1 className="mb-2 text-center font-inter text-3xl font-bold text-[#111111] dark:text-white">
          Přihlášení
        </h1>
        <p className="mb-8 text-center font-inter text-sm text-[#6B7280] dark:text-white dark:text-opacity-70">
          Přihlaste se do svého účtu IVA
        </p>

        <div className="space-y-5">
          <div className="space-y-2">
            <label className="block font-inter text-sm font-medium text-[#374151] dark:text-white">
              Email
            </label>
            <input
              required
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vas@email.cz"
              className="w-full rounded-lg border border-[#D1D5DB] dark:border-gray-600 dark:bg-[#262626] dark:text-white px-4 py-3 font-inter text-base outline-none transition-all focus:border-[#5A5BFF] dark:focus:border-[#6366FF] focus:ring-2 focus:ring-[#5A5BFF]/20 dark:focus:ring-[#6366FF]/20"
            />
          </div>
          <div className="space-y-2">
            <label className="block font-inter text-sm font-medium text-[#374151] dark:text-white">
              Heslo
            </label>
            <input
              required
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-[#D1D5DB] dark:border-gray-600 dark:bg-[#262626] dark:text-white px-4 py-3 font-inter text-base outline-none transition-all focus:border-[#5A5BFF] dark:focus:border-[#6366FF] focus:ring-2 focus:ring-[#5A5BFF]/20 dark:focus:ring-[#6366FF]/20"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 font-inter text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-[20px] bg-[#5A5BFF] dark:bg-[#6366FF] px-6 py-3 font-inter font-semibold text-base text-white transition-all hover:bg-[#4F4FE6] dark:hover:bg-[#5856FF] active:bg-[#4248D6] dark:active:bg-[#4F46E5] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-[#5A5BFF]/30 dark:focus:ring-[#6366FF]/30"
          >
            {loading ? "Přihlašování..." : "Přihlásit se"}
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#E5E7EB] dark:border-gray-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white dark:bg-[#1E1E1E] px-2 font-inter text-[#6B7280] dark:text-white dark:text-opacity-60">
                nebo
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onGoogle}
            disabled={googleLoading || loading}
            className="w-full rounded-[20px] border border-[#5A5BFF] dark:border-[#6366FF] bg-white dark:bg-[#1E1E1E] px-6 py-3 font-inter font-semibold text-base text-[#5A5BFF] dark:text-[#6366FF] transition-all hover:bg-[#5A5BFF]/5 dark:hover:bg-[#6366FF]/10 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-[#5A5BFF]/20 dark:focus:ring-[#6366FF]/20 flex items-center justify-center gap-3"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 48 48"
              aria-hidden="true"
              focusable="false"
            >
              <path
                fill="#FFC107"
                d="M43.611 20.083H42V20H24v8h11.303C33.687 32.657 29.28 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.047 6.053 29.268 4 24 4 12.954 4 4 12.954 4 24s8.954 20 20 20 20-8.954 20-20c0-1.341-.138-2.65-.389-3.917z"
              />
              <path
                fill="#FF3D00"
                d="M6.306 14.691l6.571 4.819C14.655 16.108 18.961 13 24 13c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.047 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
              />
              <path
                fill="#4CAF50"
                d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.166 35.091 26.715 36 24 36c-5.259 0-9.655-3.319-11.279-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
              />
              <path
                fill="#1976D2"
                d="M43.611 20.083H42V20H24v8h11.303a12.08 12.08 0 0 1-4.084 5.571l.003-.002 6.19 5.238C36.97 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
              />
            </svg>
            {googleLoading ? "Přesměrování..." : "Pokračovat s Googlem"}
          </button>
          <p className="text-center font-inter text-sm text-[#6B7280] dark:text-white dark:text-opacity-60">
            Nemáte účet?{" "}
            <a
              href="/account/signup"
              className="text-[#5A5BFF] dark:text-[#6366FF] font-medium hover:underline"
            >
              Zaregistrujte se
            </a>
          </p>
        </div>
      </form>
    </div>
  );
}
