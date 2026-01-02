"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { fetchBookings, type Booking } from "../../../lib/backend";
import { useTenant } from "@/lib/TenantContext";

function today(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

export default function BookingsPage() {
  const { activeBusinessId, loading: tenantLoading } = useTenant();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState(today(0));
  const [toDate, setToDate] = useState(today(7));
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [formData, setFormData] = useState({
    customer_name: "",
    customer_phone: "",
    service_id: "",
    booking_date: "",
    booking_time: "",
    notes: "",
  });

  const loadBookings = useCallback(() => {
    if (!activeBusinessId) return;

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
        setError('Nepodařilo se načíst rezervace.');
      })
      .finally(() => setIsLoading(false));
  }, [activeBusinessId, fromDate, toDate]);

  useEffect(() => {
    if (activeBusinessId) {
      loadBookings();
    }
  }, [activeBusinessId, fromDate, toDate, loadBookings]);

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

  // TODO: Implement create/edit/delete handlers later
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    alert("Vytváření a úprava rezervací bude brzy dostupné.");
  };

  const handleDelete = async (id: string) => {
    alert("Mazání rezervací bude brzy dostupné.");
  };

  const handleEdit = (booking: Booking) => {
    alert("Úprava rezervací bude brzy dostupná.");
  };

  const handleStatusChange = async (id: string, status: string) => {
    alert("Změna statusu rezervací bude brzy dostupná.");
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

  if (tenantLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-[#5A5BFF] dark:border-[#6366FF] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!activeBusinessId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="font-inter text-lg text-[#6B7280] dark:text-white dark:text-opacity-70">
            Nemáte žádný podnik. Kontaktujte podporu.
          </p>
        </div>
      </div>
    );
  }

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
              service_id: "",
              booking_date: "",
              booking_time: "",
              notes: "",
            });
            setShowAddModal(true);
          }}
          className="mt-4 md:mt-0 inline-flex items-center space-x-2 rounded-[20px] bg-[#5A5BFF] dark:bg-[#6366FF] px-6 py-3 font-inter font-semibold text-sm text-white transition-all hover:bg-[#4F4FE6] dark:hover:bg-[#5856FF] active:scale-95"
        >
          <Plus size={20} />
          <span>Nová rezervace</span>
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B7280] dark:text-white dark:text-opacity-60"
            size={20}
          />
          <input
            type="text"
            placeholder="Hledat podle jména nebo telefonu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-96 pl-12 pr-4 py-3 rounded-lg border border-[#D1D5DB] dark:border-gray-600 dark:bg-[#262626] dark:text-white font-inter text-sm outline-none transition-all focus:border-[#5A5BFF] dark:focus:border-[#6366FF] focus:ring-2 focus:ring-[#5A5BFF]/20 dark:focus:ring-[#6366FF]/20"
          />
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
                              handleStatusChange(booking.id, "completed")
                            }
                            className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-all"
                            title="Označit jako dokončeno"
                          >
                            <CheckCircle size={18} />
                          </button>
                        )}
                        {booking.status === "confirmed" && (
                          <button
                            onClick={() =>
                              handleStatusChange(booking.id, "cancelled")
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
              {editingBooking ? "Upravit rezervaci" : "Nová rezervace"}
            </h2>
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
                <select
                  value={formData.service_id}
                  onChange={(e) =>
                    setFormData({ ...formData, service_id: e.target.value })
                  }
                  required
                  className="w-full px-4 py-3 rounded-lg border border-[#D1D5DB] dark:border-gray-600 dark:bg-[#262626] dark:text-white font-inter text-sm outline-none transition-all focus:border-[#5A5BFF] dark:focus:border-[#6366FF] focus:ring-2 focus:ring-[#5A5BFF]/20 dark:focus:ring-[#6366FF]/20"
                >
                  <option value="">Vyberte službu</option>
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name} ({service.price} Kč, {service.duration}{" "}
                      min)
                    </option>
                  ))}
                </select>
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
                  }}
                  className="flex-1 px-6 py-3 rounded-[20px] border-2 border-[#D1D5DB] dark:border-gray-600 font-inter font-semibold text-sm text-[#374151] dark:text-white transition-all hover:bg-[#F3F4F6] dark:hover:bg-[#262626] active:scale-95"
                >
                  Zrušit
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 rounded-[20px] bg-[#5A5BFF] dark:bg-[#6366FF] font-inter font-semibold text-sm text-white transition-all hover:bg-[#4F4FE6] dark:hover:bg-[#5856FF] active:scale-95"
                >
                  {editingBooking ? "Uložit" : "Vytvořit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
