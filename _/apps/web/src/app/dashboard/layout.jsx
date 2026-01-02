"use client";

import { useState, useEffect } from "react";
import useUser from "@/utils/useUser";
import {
  LayoutDashboard,
  Calendar,
  Scissors,
  Clock,
  Settings,
  CreditCard,
  Phone,
  Menu,
  X,
  LogOut,
  ChevronDown,
  Building2,
} from "lucide-react";
import { TenantProvider, useTenant } from "@/lib/TenantContext";

function BusinessSelector() {
  const { businesses, activeBusinessId, activeBusiness, setActiveBusinessId, loading } = useTenant();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  if (loading) {
    return (
      <div className="px-4 py-2 rounded-lg bg-[#F3F4F6] dark:bg-[#262626] animate-pulse">
        <div className="h-5 w-32 bg-gray-200 dark:bg-gray-600 rounded"></div>
      </div>
    );
  }

  if (businesses.length === 0) {
    return (
      <div className="px-4 py-2 text-sm text-[#6B7280] dark:text-white dark:text-opacity-70">
        Žádný podnik
      </div>
    );
  }

  // Single business - just show name, no dropdown
  if (businesses.length === 1) {
    return (
      <div className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-[#F3F4F6] dark:bg-[#262626]">
        <Building2 size={16} className="text-[#5A5BFF] dark:text-[#6366FF]" />
        <span className="font-inter text-sm font-medium text-[#111111] dark:text-white truncate max-w-[140px]">
          {activeBusiness?.name || 'Podnik'}
        </span>
      </div>
    );
  }

  // Multiple businesses - show dropdown
  return (
    <div className="relative">
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-[#F3F4F6] dark:bg-[#262626] hover:bg-[#E5E7EB] dark:hover:bg-[#333333] transition-colors"
      >
        <Building2 size={16} className="text-[#5A5BFF] dark:text-[#6366FF]" />
        <span className="font-inter text-sm font-medium text-[#111111] dark:text-white truncate max-w-[140px]">
          {activeBusiness?.name || 'Vybrat podnik'}
        </span>
        <ChevronDown
          size={16}
          className={`text-[#6B7280] dark:text-white dark:text-opacity-60 transition-transform ${
            dropdownOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {dropdownOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setDropdownOpen(false)}
          />
          <div className="absolute left-0 mt-2 w-56 rounded-xl bg-white dark:bg-[#1E1E1E] border border-[#E5E7EB] dark:border-gray-700 shadow-lg z-50 py-2">
            {businesses.map((business) => (
              <button
                key={business.id}
                onClick={() => {
                  setActiveBusinessId(business.id);
                  setDropdownOpen(false);
                }}
                className={`w-full text-left px-4 py-2 font-inter text-sm hover:bg-[#F3F4F6] dark:hover:bg-[#262626] transition-colors ${
                  business.id === activeBusinessId
                    ? 'text-[#5A5BFF] dark:text-[#6366FF] font-semibold bg-[#5A5BFF]/5 dark:bg-[#6366FF]/10'
                    : 'text-[#111111] dark:text-white'
                }`}
              >
                {business.name}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function DashboardLayoutInner({ children }) {
  const { data: user } = useUser();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pathname, setPathname] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setPathname(window.location.pathname);
    }
  }, []);

  const navItems = [
    { name: "Přehled", href: "/dashboard", icon: LayoutDashboard },
    { name: "Rezervace", href: "/dashboard/rezervace", icon: Calendar },
    { name: "Služby", href: "/dashboard/sluzby", icon: Scissors },
    { name: "Otevírací doba", href: "/dashboard/oteviraci-doba", icon: Clock },
    {
      name: "Nastavení podniku",
      href: "/dashboard/nastaveni",
      icon: Settings,
    },
    { name: "Platby", href: "/dashboard/platby", icon: CreditCard },
    {
      name: "Telefonní číslo",
      href: "/dashboard/telefonni-cislo",
      icon: Phone,
    },
  ];

  return (
    <div className="min-h-screen bg-[#F9FAFB] dark:bg-[#0A0A0A]">
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden w-10 h-10 flex items-center justify-center rounded-lg bg-white dark:bg-[#1E1E1E] border border-[#E5E7EB] dark:border-gray-700 shadow-lg"
      >
        {sidebarOpen ? (
          <X size={20} className="text-[#111111] dark:text-white" />
        ) : (
          <Menu size={20} className="text-[#111111] dark:text-white" />
        )}
      </button>

      {/* Sidebar overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white dark:bg-[#1E1E1E] border-r border-[#E5E7EB] dark:border-gray-700 z-40 transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          {/* Logo + Business Selector */}
          <div className="p-6 border-b border-[#E5E7EB] dark:border-gray-700">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#5A5BFF] to-[#726BFF] dark:from-[#6366FF] dark:to-[#8B5CF6]" />
              <span className="font-inter font-bold text-xl text-[#111111] dark:text-white">
                IVA
              </span>
            </div>
            <BusinessSelector />
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg font-inter text-sm font-medium transition-all ${
                    isActive
                      ? "bg-[#5A5BFF]/10 dark:bg-[#6366FF]/20 text-[#5A5BFF] dark:text-[#6366FF]"
                      : "text-[#6B7280] dark:text-white dark:text-opacity-70 hover:bg-[#F3F4F6] dark:hover:bg-[#262626]"
                  }`}
                >
                  <Icon size={20} />
                  <span>{item.name}</span>
                </a>
              );
            })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-[#E5E7EB] dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-[#5A5BFF]/20 dark:bg-[#6366FF]/20 flex items-center justify-center">
                  <span className="font-inter font-semibold text-sm text-[#5A5BFF] dark:text-[#6366FF]">
                    {user.email?.[0]?.toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-inter text-sm font-medium text-[#111111] dark:text-white truncate">
                    {user.email}
                  </p>
                </div>
              </div>
            </div>
            <a
              href="/account/logout"
              className="flex items-center space-x-2 px-4 py-2 rounded-lg font-inter text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
            >
              <LogOut size={16} />
              <span>Odhlásit se</span>
            </a>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="lg:ml-64 min-h-screen">{children}</main>
    </div>
  );
}

// Wrap the layout with TenantProvider
export default function DashboardLayout({ children }) {
  return (
    <TenantProvider>
      <DashboardLayoutInner>{children}</DashboardLayoutInner>
    </TenantProvider>
  );
}
