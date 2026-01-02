"use client";

import useAuth from "@/utils/useAuth";

export default function LogoutPage() {
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut({
      callbackUrl: "/",
      redirect: true,
    });
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-[#5A5BFF]/10 to-[#6366FF]/5 px-6">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#1E1E1E] border border-[#E5E7EB] dark:border-gray-700 p-8 shadow-xl text-center">
        <h1 className="mb-6 font-inter text-3xl font-bold text-[#111111] dark:text-white">
          Odhlášení
        </h1>
        <p className="mb-8 font-inter text-base text-[#6B7280] dark:text-white dark:text-opacity-70">
          Opravdu se chcete odhlásit?
        </p>

        <button
          onClick={handleSignOut}
          className="w-full rounded-[20px] bg-[#5A5BFF] dark:bg-[#6366FF] px-6 py-3 font-inter font-semibold text-base text-white transition-all hover:bg-[#4F4FE6] dark:hover:bg-[#5856FF] active:bg-[#4248D6] dark:active:bg-[#4F46E5] active:scale-95 focus:outline-none focus:ring-4 focus:ring-[#5A5BFF]/30 dark:focus:ring-[#6366FF]/30"
        >
          Odhlásit se
        </button>
      </div>
    </div>
  );
}
