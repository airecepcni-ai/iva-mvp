"use client";

import { useState } from "react";
import useAuth from "@/utils/useAuth";

export default function SignUpPage() {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const { signUpWithCredentials } = useAuth();

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!email || !password || !confirmPassword) {
      setError("Vyplňte prosím všechna pole");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Hesla se neshodují");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Heslo musí mít alespoň 6 znaků");
      setLoading(false);
      return;
    }

    try {
      const res = await signUpWithCredentials({
        email,
        password,
        callbackUrl: "/dashboard",
        redirect: false,
      });
      if (res?.error) {
        setError("Tento email je již registrován");
        setLoading(false);
        return;
      }
      if (res?.url) {
        window.location.href = res.url;
        return;
      }
      window.location.href = "/dashboard";
    } catch (err) {
      setError("Tento email je již registrován");
      setLoading(false);
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
          Registrace
        </h1>
        <p className="mb-8 text-center font-inter text-sm text-[#6B7280] dark:text-white dark:text-opacity-70">
          Vytvořte si účet pro správu vašeho salonu
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
          <div className="space-y-2">
            <label className="block font-inter text-sm font-medium text-[#374151] dark:text-white">
              Potvrďte heslo
            </label>
            <input
              required
              name="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
            {loading ? "Vytváření účtu..." : "Vytvořit účet"}
          </button>
          <p className="text-center font-inter text-sm text-[#6B7280] dark:text-white dark:text-opacity-60">
            Již máte účet?{" "}
            <a
              href="/account/signin"
              className="text-[#5A5BFF] dark:text-[#6366FF] font-medium hover:underline"
            >
              Přihlaste se
            </a>
          </p>
        </div>
      </form>
    </div>
  );
}
