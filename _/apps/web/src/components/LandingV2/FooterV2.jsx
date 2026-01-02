import { MessageCircle } from "lucide-react";

export function FooterV2() {
  return (
    <footer className="bg-white border-t border-gray-100 py-12">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7B42BC] to-[#9B5DE5] flex items-center justify-center">
              <MessageCircle size={16} className="text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">IVA</span>
          </div>

          {/* Navigation */}
          <nav className="flex items-center gap-8">
            <a
              href="#jak-to-funguje"
              className="text-sm text-gray-600 hover:text-[#7B42BC] transition-colors"
            >
              Jak to funguje
            </a>
            <a
              href="#cena"
              className="text-sm text-gray-600 hover:text-[#7B42BC] transition-colors"
            >
              Cena
            </a>
            <a
              href="/account/signin"
              className="text-sm text-gray-600 hover:text-[#7B42BC] transition-colors"
            >
              Přihlášení
            </a>
          </nav>

          {/* Copyright */}
          <p className="text-sm text-gray-500">
            © 2025 IVA. Všechna práva vyhrazena.
          </p>
        </div>
      </div>
    </footer>
  );
}

