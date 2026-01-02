"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { fetchBookings, createBooking, updateBooking } from "../../../lib/backend";
import { useTenant } from "@/lib/TenantContext";

/**
 * Info banner shown when user has no business yet.
 */
function NoBusinessBanner() {
  return (
    <div className="mb-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 flex items-start gap-3">
      <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
      <div>
        <p className="font-inter text-sm font-medium text-amber-800 dark:text-amber-200">
          Zatím nemáte nastavený salon
        </p>
        <p className="font-inter text-xs text-amber-700 dark:text-amber-300 mt-1">
          Můžete prozkoumat rozhraní. Rezervace se zobrazí až po vytvoření salonu.
        </p>
      </div>
    </div>
  );
}

function today(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

export default function BookingsPage() {
  const { activeBusinessId, loading: tenantLoading, hasBusiness } = useTenant();
  const [bookings, setBookings] = useState([]);
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fromDate, setFromDate] = useState(today(0));
  const [toDate, setToDate] = useState(today(7));
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const [formData, setFormData] = useState({
    customer_name: "",
    customer_phone: "",
    service_name: "",
    booking_date: "",
    booking_time: "",
    location_name: "",
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadBookings = useCallback(() => {
    // Skip fetch if no business - show empty UI
    if (!activeBusinessId) {
      setIsLoading(false);
      setBookings([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    fetchBookings({
      businessId: activeBusinessId,
      from: fromDate,
      to: toDate,
      status: 'all',
    })
      .then(setBookings)
      .catch((err) => {
        console.error(err);
        setError(err.message || 'Nepodařilo se načíst rezervace.');
      })
      .finally(() => setIsLoading(false));
  }, [activeBusinessId, fromDate, toDate]);

  // Fetch when tenant is ready
  useEffect(() => {
    if (!tenantLoading) {
      loadBookings();
    }
  }, [tenantLoading, activeBusinessId, fromDate, toDate, loadBookings]);

  const fetchServices = async () => {
    try {
      const res = await fetch("/api/services");
      if (res.ok) {
        const data = await res.json();
        setServices(data.services || []);
      }
    } catch (error) {
      console.error("Error fetching services:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!activeBusinessId) return;

    setIsSubmitting(true);
    setError(null);

    try {
      if (editingBooking) {
        // Reschedule booking
        await updateBooking({
          businessId: activeBusinessId,
          bookingId: editingBooking.id,
          action: 'reschedule',
          date: formData.booking_date,
          time: formData.booking_time,
        });
      } else {
        // Create new booking
        await createBooking({
          businessId: activeBusinessId,
          serviceName: formData.service_name,
          date: formData.booking_date,
          time: formData.booking_time,
          customerName: formData.customer_name,
          customerPhone: formData.customer_phone,
          locationName: formData.location_name || undefined,
          notes: formData.notes || undefined,
        });
      }

      // Refresh bookings and close modal
      setShowAddModal(false);
      setEditingBooking(null);
      setFormData({
        customer_name: "",
        customer_phone: "",
        service_name: "",
        booking_date: "",
        booking_time: "",
        location_name: "",
        notes: "",
      });
      loadBookings();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Chyba při ukládání rezervace.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Opravdu chcete zrušit tuto rezervaci?")) return;
    if (!activeBusinessId) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await updateBooking({
        businessId: activeBusinessId,
        bookingId: id,
        action: 'cancel',
      });
      loadBookings();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Chyba při rušení rezervace.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (booking) => {
    setEditingBooking(booking);
    setFormData({
      customer_name: booking.customerName || "",
      customer_phone: booking.customerPhone || "",
      service_name: booking.serviceName || "",
      booking_date: booking.date || "",
      booking_time: booking.time || "",
      location_name: booking.locationName || "",
      notes: "",
    });
    setShowAddModal(true);
  };

  const handleStatusChange = async (id, action) => {
    if (!activeBusinessId) return;

    setIsSubmitting(true);
    setError(null);

    try {
      if (action === 'cancel') {
        await updateBooking({
          businessId: activeBusinessId,
          bookingId: id,
          action: 'cancel',
        });
      } else if (action === 'completed') {
        // For now, completed is treated as cancel since backend doesn't have completed status
        await updateBooking({
          businessId: activeBusinessId,
          bookingId: id,
          action: 'cancel',
        });
      }
      loadBookings();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Chyba při změně statusu rezervace.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredBookings = bookings.filter(
    (b) =>
      b.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.customerPhone.includes(searchTerm),
  );

  const statusColors = {
    confirmed:
      "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
    completed:
      "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
    cancelled: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
    no_show: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400",
  };

  // Show spinner only during initial tenant loading
  if (tenantLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-[#5A5BFF] dark:border-[#6366FF] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // After loading completes, ALWAYS render the full UI (even with no business)

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="font-inter font-bold text-3xl text-[#111111] dark:text-white mb-2">
            Rezervace
          </h1>
          <p className="font-inter text-sm text-[#6B7280] dark:text-white dark:text-opacity-70">
            Spravujte rezervace vašich klientů
          </p>
        </div>
        <button
          onClick={() => {
            setEditingBooking(null);
            setFormData({
              customer_name: "",
              customer_phone: "",
              service_name: "",
              booking_date: "",
              booking_time: "",
              location_name: "",
              notes: "",
            });
            setShowAddModal(true);
          }}
          disabled={!hasBusiness}
          className="mt-4 md:mt-0 inline-flex items-center space-x-2 rounded-[20px] bg-[#5A5BFF] dark:bg-[#6366FF] px-6 py-3 font-inter font-semibold text-sm text-white transition-all hover:bg-[#4F4FE6] dark:hover:bg-[#5856FF] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={20} />
          <span>Nová rezervace</span>
        </button>
      </div>

      {/* No business info banner */}
      {!hasBusiness && <NoBusinessBanner />}

      {/* Filters and Search */}
      <div className="mb-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Date Filters */}
          <div className="flex flex-col gap-3 md:flex-row md:items-end">
            <div className="flex flex-col">
              <label className="mb-1 font-inter text-xs font-medium text-[#6B7280] dark:text-white dark:text-opacity-70">
                Od
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="rounded-lg border border-[#D1D5DB] dark:border-gray-600 dark:bg-[#262626] dark:text-white px-4 py-3 font-inter text-sm outline-none transition-all focus:border-[#5A5BFF] dark:focus:border-[#6366FF] focus:ring-2 focus:ring-[#5A5BFF]/20 dark:focus:ring-[#6366FF]/20"
              />
            </div>
            <div className="flex flex-col">
              <label className="mb-1 font-inter text-xs font-medium text-[#6B7280] dark:text-white dark:text-opacity-70">
                Do
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="rounded-lg border border-[#D1D5DB] dark:border-gray-600 dark:bg-[#262626] dark:text-white px-4 py-3 font-inter text-sm outline-none transition-all focus:border-[#5A5BFF] dark:focus:border-[#6366FF] focus:ring-2 focus:ring-[#5A5BFF]/20 dark:focus:ring-[#6366FF]/20"
              />
            </div>
          </div>

          {/* Search */}
          <div className="relative md:w-96">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B7280] dark:text-white dark:text-opacity-60"
              size={20}
            />
            <input
              type="text"
              placeholder="Hledat podle jména nebo telefonu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-lg border border-[#D1D5DB] dark:border-gray-600 dark:bg-[#262626] dark:text-white font-inter text-sm outline-none transition-all focus:border-[#5A5BFF] dark:focus:border-[#6366FF] focus:ring-2 focus:ring-[#5A5BFF]/20 dark:focus:ring-[#6366FF]/20"
            />
          </div>
        </div>
      </div>

      {/* Bookings List */}
      <div className="bg-white dark:bg-[#1E1E1E] border border-[#E5E7EB] dark:border-gray-700 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 border-4 border-[#5A5BFF] dark:border-[#6366FF] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="font-inter text-sm text-[#6B7280] dark:text-white dark:text-opacity-70">
              Načítám rezervace...
            </p>
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <p className="font-inter text-sm text-red-500 dark:text-red-400">
              {error}
            </p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="p-12 text-center">
            <p className="font-inter text-sm text-[#6B7280] dark:text-white dark:text-opacity-70">
              Žádné rezervace v tomto období.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#F9FAFB] dark:bg-[#262626] border-b border-[#E5E7EB] dark:border-gray-700">
                <tr>
                  <th className="px-6 py-4 text-left font-inter text-xs font-semibold text-[#6B7280] dark:text-white dark:text-opacity-70 uppercase">
                    Klient
                  </th>
                  <th className="px-6 py-4 text-left font-inter text-xs font-semibold text-[#6B7280] dark:text-white dark:text-opacity-70 uppercase">
                    Služba
                  </th>
                  <th className="px-6 py-4 text-left font-inter text-xs font-semibold text-[#6B7280] dark:text-white dark:text-opacity-70 uppercase">
                    Datum
                  </th>
                  <th className="px-6 py-4 text-left font-inter text-xs font-semibold text-[#6B7280] dark:text-white dark:text-opacity-70 uppercase">
                    Čas
                  </th>
                  <th className="px-6 py-4 text-left font-inter text-xs font-semibold text-[#6B7280] dark:text-white dark:text-opacity-70 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-4 text-right font-inter text-xs font-semibold text-[#6B7280] dark:text-white dark:text-opacity-70 uppercase">
                    Akce
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] dark:divide-gray-700">
                {filteredBookings.map((booking) => (
                  <tr
                    key={booking.id}
                    className="hover:bg-[#F9FAFB] dark:hover:bg-[#262626]"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-inter font-medium text-sm text-[#111111] dark:text-white">
                          {booking.customerName}
                        </p>
                        <p className="font-inter text-xs text-[#6B7280] dark:text-white dark:text-opacity-60">
                          {booking.customerPhone}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-inter text-sm text-[#374151] dark:text-white dark:text-opacity-87">
                      {booking.serviceName || "-"}
                    </td>
                    <td className="px-6 py-4 font-inter text-sm text-[#374151] dark:text-white dark:text-opacity-87">
                      {new Date(booking.date).toLocaleDateString("cs-CZ")}
                    </td>
                    <td className="px-6 py-4 font-inter text-sm text-[#374151] dark:text-white dark:text-opacity-87">
                      {booking.time}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-3 py-1 rounded-full font-inter text-xs font-medium ${
                          statusColors[booking.status] || statusColors.confirmed
                        }`}
                      >
                        {booking.status === "confirmed" && "Potvrzeno"}
                        {booking.status === "completed" && "Dokončeno"}
                        {booking.status === "cancelled" && "Zrušeno"}
                        {booking.status === "no_show" && "Nedostavil se"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end space-x-2">
                        {booking.status === "confirmed" && (
                          <button
                            onClick={() =>
                              handleStatusChange(booking.id, "cancel")
                            }
                            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                            title="Zrušit"
                          >
                            <XCircle size={18} />
                          </button>
                        )}
                        <button
                          onClick={() => handleEdit(booking)}
                          className="p-2 text-[#5A5BFF] dark:text-[#6366FF] hover:bg-[#5A5BFF]/10 dark:hover:bg-[#6366FF]/20 rounded-lg transition-all"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(booking.id)}
                          className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#E5E7EB] dark:border-gray-700 w-full max-w-md p-6">
            <h2 className="font-inter font-bold text-xl text-[#111111] dark:text-white mb-6">
              {editingBooking ? "Přesunout rezervaci" : "Nová rezervace"}
            </h2>
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <p className="font-inter text-sm text-red-600 dark:text-red-400">
                  {error}
                </p>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block font-inter text-sm font-medium text-[#374151] dark:text-white mb-2">
                  Jméno klienta
                </label>
                <input
                  type="text"
                  value={formData.customer_name}
                  onChange={(e) =>
                    setFormData({ ...formData, customer_name: e.target.value })
                  }
                  required
                  className="w-full px-4 py-3 rounded-lg border border-[#D1D5DB] dark:border-gray-600 dark:bg-[#262626] dark:text-white font-inter text-sm outline-none transition-all focus:border-[#5A5BFF] dark:focus:border-[#6366FF] focus:ring-2 focus:ring-[#5A5BFF]/20 dark:focus:ring-[#6366FF]/20"
                />
              </div>
              <div>
                <label className="block font-inter text-sm font-medium text-[#374151] dark:text-white mb-2">
                  Telefon
                </label>
                <input
                  type="tel"
                  value={formData.customer_phone}
                  onChange={(e) =>
                    setFormData({ ...formData, customer_phone: e.target.value })
                  }
                  required
                  className="w-full px-4 py-3 rounded-lg border border-[#D1D5DB] dark:border-gray-600 dark:bg-[#262626] dark:text-white font-inter text-sm outline-none transition-all focus:border-[#5A5BFF] dark:focus:border-[#6366FF] focus:ring-2 focus:ring-[#5A5BFF]/20 dark:focus:ring-[#6366FF]/20"
                />
              </div>
              <div>
                <label className="block font-inter text-sm font-medium text-[#374151] dark:text-white mb-2">
                  Služba
                </label>
                <input
                  type="text"
                  value={formData.service_name}
                  onChange={(e) =>
                    setFormData({ ...formData, service_name: e.target.value })
                  }
                  required
                  placeholder="Název služby"
                  className="w-full px-4 py-3 rounded-lg border border-[#D1D5DB] dark:border-gray-600 dark:bg-[#262626] dark:text-white font-inter text-sm outline-none transition-all focus:border-[#5A5BFF] dark:focus:border-[#6366FF] focus:ring-2 focus:ring-[#5A5BFF]/20 dark:focus:ring-[#6366FF]/20"
                />
              </div>
              <div>
                <label className="block font-inter text-sm font-medium text-[#374151] dark:text-white mb-2">
                  Lokace (volitelné)
                </label>
                <input
                  type="text"
                  value={formData.location_name}
                  onChange={(e) =>
                    setFormData({ ...formData, location_name: e.target.value })
                  }
                  placeholder="Název lokace"
                  className="w-full px-4 py-3 rounded-lg border border-[#D1D5DB] dark:border-gray-600 dark:bg-[#262626] dark:text-white font-inter text-sm outline-none transition-all focus:border-[#5A5BFF] dark:focus:border-[#6366FF] focus:ring-2 focus:ring-[#5A5BFF]/20 dark:focus:ring-[#6366FF]/20"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-inter text-sm font-medium text-[#374151] dark:text-white mb-2">
                    Datum
                  </label>
                  <input
                    type="date"
                    value={formData.booking_date}
                    onChange={(e) =>
                      setFormData({ ...formData, booking_date: e.target.value })
                    }
                    required
                    className="w-full px-4 py-3 rounded-lg border border-[#D1D5DB] dark:border-gray-600 dark:bg-[#262626] dark:text-white font-inter text-sm outline-none transition-all focus:border-[#5A5BFF] dark:focus:border-[#6366FF] focus:ring-2 focus:ring-[#5A5BFF]/20 dark:focus:ring-[#6366FF]/20"
                  />
                </div>
                <div>
                  <label className="block font-inter text-sm font-medium text-[#374151] dark:text-white mb-2">
                    Čas
                  </label>
                  <input
                    type="time"
                    value={formData.booking_time}
                    onChange={(e) =>
                      setFormData({ ...formData, booking_time: e.target.value })
                    }
                    required
                    className="w-full px-4 py-3 rounded-lg border border-[#D1D5DB] dark:border-gray-600 dark:bg-[#262626] dark:text-white font-inter text-sm outline-none transition-all focus:border-[#5A5BFF] dark:focus:border-[#6366FF] focus:ring-2 focus:ring-[#5A5BFF]/20 dark:focus:ring-[#6366FF]/20"
                  />
                </div>
              </div>
              <div>
                <label className="block font-inter text-sm font-medium text-[#374151] dark:text-white mb-2">
                  Poznámky
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border border-[#D1D5DB] dark:border-gray-600 dark:bg-[#262626] dark:text-white font-inter text-sm outline-none transition-all focus:border-[#5A5BFF] dark:focus:border-[#6366FF] focus:ring-2 focus:ring-[#5A5BFF]/20 dark:focus:ring-[#6366FF]/20"
                />
              </div>
              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingBooking(null);
                    setError(null);
                  }}
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 rounded-[20px] border-2 border-[#D1D5DB] dark:border-gray-600 font-inter font-semibold text-sm text-[#374151] dark:text-white transition-all hover:bg-[#F3F4F6] dark:hover:bg-[#262626] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Zrušit
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 rounded-[20px] bg-[#5A5BFF] dark:bg-[#6366FF] font-inter font-semibold text-sm text-white transition-all hover:bg-[#4F4FE6] dark:hover:bg-[#5856FF] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Ukládám..." : editingBooking ? "Přesunout" : "Vytvořit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
