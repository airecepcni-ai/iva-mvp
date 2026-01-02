"use client";

import { MessageCircle, Menu, X } from "lucide-react";
import { useState } from "react";

export function HeaderV2() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="w-full bg-white/95 backdrop-blur-md fixed top-0 z-50 border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#7B42BC] to-[#9B5DE5] flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:shadow-purple-500/30 transition-shadow">
            <MessageCircle size={20} className="text-white" />
          </div>
          <span className="text-2xl font-extrabold text-gray-900 tracking-tight">
            IVA
          </span>
        </a>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <a
            href="#jak-to-funguje"
            className="text-sm font-medium text-gray-600 hover:text-[#7B42BC] transition-colors"
          >
            Jak to funguje
          </a>
          <a
            href="#cena"
            className="text-sm font-medium text-gray-600 hover:text-[#7B42BC] transition-colors"
          >
            Cena
          </a>
          <a
            href="/account/signin"
            className="text-sm font-medium text-gray-600 hover:text-[#7B42BC] transition-colors"
          >
            Přihlášení
          </a>
        </nav>

        {/* CTA Button */}
        <div className="flex items-center gap-4">
          <a
            href="/account/signin"
            className="hidden md:inline-flex items-center justify-center px-6 py-2.5 bg-[#7B42BC] text-white text-sm font-semibold rounded-lg hover:bg-[#6a39a3] transition-all shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:-translate-y-0.5"
          >
            Vyzkoušet zdarma
          </a>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 py-4 px-6 shadow-lg">
          <nav className="flex flex-col gap-4">
            <a
              href="#jak-to-funguje"
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-medium text-gray-700 hover:text-[#7B42BC] transition-colors py-2"
            >
              Jak to funguje
            </a>
            <a
              href="#cena"
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-medium text-gray-700 hover:text-[#7B42BC] transition-colors py-2"
            >
              Cena
            </a>
            <a
              href="/account/signin"
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-medium text-gray-700 hover:text-[#7B42BC] transition-colors py-2"
            >
              Přihlášení
            </a>
            <a
              href="/account/signin"
              onClick={() => setMobileMenuOpen(false)}
              className="mt-2 inline-flex items-center justify-center px-6 py-3 bg-[#7B42BC] text-white font-semibold rounded-lg hover:bg-[#6a39a3] transition-all"
            >
              Vyzkoušet zdarma
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}

