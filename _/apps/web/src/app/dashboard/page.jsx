"use client";

import { useState, useEffect, useCallback } from "react";
import { Calendar, Users, TrendingUp, Phone, AlertCircle } from "lucide-react";
import { fetchBookings } from "../../lib/backend";
import { fetchServices } from "../../lib/services";
import { useTenant } from "@/lib/TenantContext";

// Helper function to get today's date in YYYY-MM-DD format
function today() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

// Helper function to get start of week (Monday) in YYYY-MM-DD format
function getWeekStart() {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().slice(0, 10);
}

// Helper function to get end of week (Sunday) in YYYY-MM-DD format
function getWeekEnd() {
  const weekStart = getWeekStart();
  const d = new Date(weekStart);
  d.setDate(d.getDate() + 6); // Add 6 days to get Sunday
  return d.toISOString().slice(0, 10);
}

/**
 * Info banner shown when user has no business yet.
 * Explains they can explore the UI but data won't be saved until they create a business.
 */
function NoBusinesBanner() {
  return (
    <div className="mb-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 flex items-start gap-3">
      <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
      <div>
        <p className="font-inter text-sm font-medium text-amber-800 dark:text-amber-200">
          Zatím nemáte nastavený salon
        </p>
        <p className="font-inter text-xs text-amber-700 dark:text-amber-300 mt-1">
          Můžete prozkoumat rozhraní. Data se uloží až po vytvoření salonu.
        </p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  // Get tenant context - hasBusiness indicates if user has any business
  const { activeBusinessId, loading: tenantLoading, hasBusiness } = useTenant();
  const [todayCount, setTodayCount] = useState(0);
  const [weekCount, setWeekCount] = useState(0);
  const [activeServicesCount, setActiveServicesCount] = useState(0);
  const [upcoming, setUpcoming] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    // Skip fetch if no business - we'll show empty/default values
    if (!activeBusinessId) {
      setLoading(false);
      setTodayCount(0);
      setWeekCount(0);
      setActiveServicesCount(0);
      setUpcoming([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const todayDate = today();
      const weekStart = getWeekStart();
      const weekEnd = getWeekEnd();

      // Log businessId in dev for debugging
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[Dashboard] Fetching data for business: ${activeBusinessId}`);
      }

      // Fetch bookings for this week
      const bookings = await fetchBookings({
        businessId: activeBusinessId,
        from: weekStart,
        to: weekEnd,
        status: 'all',
      });

      // Calculate today's count
      const todayBookings = bookings.filter(b => b.date === todayDate);
      setTodayCount(todayBookings.length);

      // Calculate week count
      setWeekCount(bookings.length);

      // Filter upcoming bookings (confirmed, date >= today, sorted by date + time)
      const now = new Date();
      const upcomingBookings = bookings
        .filter(b => {
          if (b.status !== 'confirmed') return false;
          const bookingDate = new Date(`${b.date}T${b.time || '00:00'}`);
          return bookingDate >= now;
        })
        .sort((a, b) => {
          const dateA = new Date(`${a.date}T${a.time || '00:00'}`);
          const dateB = new Date(`${b.date}T${b.time || '00:00'}`);
          return dateA - dateB;
        })
        .slice(0, 5);
      
      setUpcoming(upcomingBookings);

      // Fetch services
      const services = await fetchServices(activeBusinessId);
      setActiveServicesCount(services.length);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError('Nepodařilo se načíst přehled. Zkuste to prosím znovu.');
    } finally {
      setLoading(false);
    }
  }, [activeBusinessId]);

  // Fetch data when tenant is ready
  useEffect(() => {
    // Only start loading once tenant context is ready
    if (!tenantLoading) {
      fetchDashboardData();
    }
  }, [tenantLoading, activeBusinessId, fetchDashboardData]);

  // Determine display values - show defaults when no business or loading
  const displayLoading = tenantLoading || loading;
  const statCards = [
    {
      title: "Dnešní rezervace",
      value: displayLoading ? "…" : todayCount,
      icon: Calendar,
      color: "bg-blue-500",
    },
    {
      title: "Tento týden",
      value: displayLoading ? "…" : weekCount,
      icon: Users,
      color: "bg-green-500",
    },
    {
      title: "Měsíční tržby",
      value: displayLoading ? "…" : "0 Kč",
      icon: TrendingUp,
      color: "bg-purple-500",
    },
    {
      title: "Aktivní služby",
      value: displayLoading ? "…" : activeServicesCount,
      icon: Phone,
      color: "bg-orange-500",
    },
  ];

  // Show skeleton only during initial tenant loading
  if (tenantLoading) {
    return (
      <div className="p-6 md:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl"
              ></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ALWAYS render the full UI after tenant loading completes
  // If no business, show info banner + empty values (no infinite spinner)

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-inter font-bold text-3xl text-[#111111] dark:text-white mb-2">
          Přehled
        </h1>
        <p className="font-inter text-sm text-[#6B7280] dark:text-white dark:text-opacity-70">
          Vítejte zpět! Zde je přehled vašeho salonu.
        </p>
      </div>

      {/* No business info banner */}
      {!hasBusiness && <NoBusinesBanner />}

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="font-inter text-sm text-red-800 dark:text-red-200">
            {error}
          </p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              className="bg-white dark:bg-[#1E1E1E] border border-[#E5E7EB] dark:border-gray-700 rounded-xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`w-12 h-12 ${stat.color} bg-opacity-10 rounded-lg flex items-center justify-center`}
                >
                  <Icon
                    size={24}
                    className={`${stat.color.replace("bg-", "text-")}`}
                  />
                </div>
              </div>
              <p className="font-inter text-2xl font-bold text-[#111111] dark:text-white mb-1">
                {stat.value}
              </p>
              <p className="font-inter text-sm text-[#6B7280] dark:text-white dark:text-opacity-70">
                {stat.title}
              </p>
            </div>
          );
        })}
      </div>

      {/* Upcoming Bookings */}
      <div className="bg-white dark:bg-[#1E1E1E] border border-[#E5E7EB] dark:border-gray-700 rounded-xl p-6">
        <h2 className="font-inter font-bold text-xl text-[#111111] dark:text-white mb-4">
          Nadcházející rezervace
        </h2>
        {loading ? (
          <p className="font-inter text-sm text-[#6B7280] dark:text-white dark:text-opacity-70 text-center py-8">
            Načítání...
          </p>
        ) : upcoming.length === 0 ? (
          <p className="font-inter text-sm text-[#6B7280] dark:text-white dark:text-opacity-70 text-center py-8">
            Nemáte žádné nadcházející rezervace.
          </p>
        ) : (
          <div className="space-y-3">
            {upcoming.map((booking) => (
              <div
                key={booking.id}
                className="flex items-center justify-between p-4 rounded-lg bg-[#F9FAFB] dark:bg-[#262626] border border-[#E5E7EB] dark:border-gray-700"
              >
                <div className="flex-1">
                  <p className="font-inter font-semibold text-sm text-[#111111] dark:text-white">
                    {booking.customerName}
                  </p>
                  <p className="font-inter text-xs text-[#6B7280] dark:text-white dark:text-opacity-70">
                    {booking.serviceName}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-inter text-sm font-medium text-[#111111] dark:text-white">
                    {new Date(booking.date).toLocaleDateString("cs-CZ")}
                  </p>
                  <p className="font-inter text-xs text-[#6B7280] dark:text-white dark:text-opacity-70">
                    {booking.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
        {upcoming.length > 0 && (
          <a
            href="/dashboard/rezervace"
            className="block mt-4 text-center font-inter text-sm font-medium text-[#5A5BFF] dark:text-[#6366FF] hover:underline"
          >
            Zobrazit všechny rezervace
          </a>
        )}
      </div>
    </div>
  );
}
