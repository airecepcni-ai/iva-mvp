export function Header() {
  return (
    <header className="border-b border-[#E5E7EB] dark:border-gray-700 relative z-10">
      <div className="max-w-[1240px] mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#5A5BFF] to-[#726BFF] dark:from-[#6366FF] dark:to-[#8B5CF6] animate-pulse" />
          <span className="font-inter font-bold text-xl text-[#111111] dark:text-white">
            IVA
          </span>
        </div>

        {/* Navigation Links - Desktop */}
        <nav className="hidden md:flex items-center space-x-6">
          <a
            href="#demo"
            className="font-inter text-sm font-medium text-[#6B7280] dark:text-white dark:text-opacity-70 hover:text-[#111111] dark:hover:text-white transition-colors"
          >
            Vyzkoušejte IVA zdarma
          </a>
          <a
            href="#features"
            className="font-inter text-sm font-medium text-[#6B7280] dark:text-white dark:text-opacity-70 hover:text-[#111111] dark:hover:text-white transition-colors"
          >
            Proč IVA?
          </a>
          <a
            href="#pricing"
            className="font-inter text-sm font-medium text-[#6B7280] dark:text-white dark:text-opacity-70 hover:text-[#111111] dark:hover:text-white transition-colors"
          >
            Cena
          </a>
        </nav>

        <div className="flex items-center space-x-4">
          <a
            href="/account/signin"
            className="font-inter text-sm font-medium text-[#6B7280] dark:text-white dark:text-opacity-70 hover:text-[#111111] dark:hover:text-white transition-colors"
          >
            Přihlášení
          </a>
          <a
            href="/account/signup"
            className="rounded-[20px] bg-[#5A5BFF] dark:bg-[#6366FF] px-5 py-2 font-inter font-semibold text-sm text-white transition-all hover:bg-[#4F4FE6] dark:hover:bg-[#5856FF] active:scale-95"
          >
            Zkušební verze zdarma
          </a>
        </div>
      </div>
    </header>
  );
}
