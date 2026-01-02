"use client";

import { useState, useEffect, useCallback } from "react";
import { Scissors, Plus, Edit, Trash2, Save, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import {
  fetchServices,
  createService,
  updateService,
  deleteService,
  saveServicesBulk,
} from "@/lib/services";
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
          Můžete prozkoumat rozhraní. Služby se uloží až po vytvoření salonu.
        </p>
      </div>
    </div>
  );
}

export default function ServicesPage() {
  const { activeBusinessId, loading: tenantLoading, hasBusiness } = useTenant();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [originalServices, setOriginalServices] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    priceFrom: "",
    priceTo: "",
    durationMinutes: "",
    description: "",
  });

  const fetchServicesData = useCallback(async () => {
    // Skip fetch if no business - show empty UI
    if (!activeBusinessId) {
      setLoading(false);
      setServices([]);
      setOriginalServices([]);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      const data = await fetchServices(activeBusinessId);
      setServices(data);
      setOriginalServices(data); // snapshot for diff
    } catch (err) {
      console.error("Error fetching services:", err);
      setError(err.message || "Nepodařilo se načíst služby");
    } finally {
      setLoading(false);
    }
  }, [activeBusinessId]);

  // Fetch when tenant is ready
  useEffect(() => {
    if (!tenantLoading) {
      fetchServicesData();
    }
  }, [tenantLoading, activeBusinessId, fetchServicesData]);

  // Max bookable services limit
  const MAX_BOOKABLE_SERVICES = 8;

  // Calculate bookable count (treat null as false)
  const bookableCount = services.filter((s) => s.isBookable === true).length;

  // Handle toggle bookable (local state only, no API call)
  const handleToggleBookable = (service, e) => {
    if (e) {
      e.stopPropagation();
    }
    
    const currentIsBookable = service.isBookable === true;
    const newIsBookable = !currentIsBookable;

    if (newIsBookable && bookableCount >= MAX_BOOKABLE_SERVICES) {
      toast.error("Limit dosažen", {
        description:
          "Maximálně 8 služeb může být rezervovatelných. Zrušte výběr u jiné služby, nebo upravte nastavení později.",
      });
      return;
    }

    setServices((prev) =>
      prev.map((s) =>
        s.id === service.id ? { ...s, isBookable: newIsBookable } : s
      )
    );
  };

  // Save selection to backend
  const handleSaveSelection = async () => {
    if (!activeBusinessId) return;
    
    setIsSaving(true);
    setError(null);

    try {
      // Fully sync selection in ONE request to avoid races:
      // TRUE for purple, FALSE otherwise
      const normalized = services.map((s) => ({
        ...s,
        isBookable: s.isBookable === true,
      }));

      const saved = await saveServicesBulk(activeBusinessId, normalized);

      toast.success("Výběr služeb byl uložen.");
      setServices(saved);
      setOriginalServices(saved);
    } catch (err) {
      console.error("Error saving selection:", err);
      toast.error("Chyba", {
        description:
          err.message || "Nepodařilo se uložit výběr služeb. Zkuste to prosím znovu.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!activeBusinessId) return;
    
    setIsSaving(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.name.trim()) {
        throw new Error("Název služby je povinný");
      }
      if (!formData.durationMinutes || parseInt(formData.durationMinutes) < 1) {
        throw new Error("Délka služby musí být alespoň 1 minuta");
      }
      if (!formData.priceFrom || parseFloat(formData.priceFrom) < 0) {
        throw new Error("Cena musí být zadána");
      }

      const serviceInput = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        durationMinutes: parseInt(formData.durationMinutes) || null,
        priceFrom: parseFloat(formData.priceFrom) || null,
        priceTo: formData.priceTo ? parseFloat(formData.priceTo) : null,
      };

      if (editingService) {
        await updateService(activeBusinessId, editingService.id, serviceInput);
      } else {
        await createService(activeBusinessId, serviceInput);
      }

      await fetchServicesData();
      setShowModal(false);
      setEditingService(null);
      setFormData({
        name: "",
        priceFrom: "",
        priceTo: "",
        durationMinutes: "",
        description: "",
      });
    } catch (err) {
      console.error("Error saving service:", err);
      setError(err.message || "Nepodařilo se uložit službu");
      alert(err.message || "Nepodařilo se uložit službu");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!activeBusinessId) return;
    if (!window.confirm("Opravdu chcete tuto službu smazat?")) return;

    try {
      setError(null);
      await deleteService(activeBusinessId, id);
      await fetchServicesData();
    } catch (err) {
      console.error("Error deleting service:", err);
      setError(err.message || "Nepodařilo se smazat službu");
      alert(err.message || "Nepodařilo se smazat službu");
    }
  };

  const openEditModal = (service) => {
    setEditingService(service);
    setFormData({
      name: service.name || "",
      priceFrom: service.priceFrom ? service.priceFrom.toString() : "",
      priceTo: service.priceTo ? service.priceTo.toString() : "",
      durationMinutes: service.durationMinutes ? service.durationMinutes.toString() : "",
      description: service.description || "",
    });
    setShowModal(true);
  };

  // Show spinner only during initial tenant loading
  if (tenantLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-[#5A5BFF] dark:border-[#6366FF] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Show spinner only while services are being fetched (real loading)
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-[#5A5BFF] dark:border-[#6366FF] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // After loading completes, ALWAYS render the full UI (even with no business)

  // Helper to format price display
  const formatPrice = (service) => {
    if (service.priceFrom && service.priceTo && service.priceFrom !== service.priceTo) {
      return `${service.priceFrom} - ${service.priceTo} Kč`;
    }
    if (service.priceFrom) {
      return `${service.priceFrom} Kč`;
    }
    return "Neuvedeno";
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="font-inter font-bold text-3xl text-[#111111] dark:text-white mb-2">
            Služby
          </h1>
          <p className="font-inter text-sm text-[#6B7280] dark:text-white dark:text-opacity-70 mb-1">
            Spravujte služby vašeho salonu
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex flex-row gap-3 mt-4 sm:mt-0">
            <button
              onClick={handleSaveSelection}
              disabled={isSaving}
              className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-green-600 dark:bg-green-500 text-white font-inter font-semibold text-sm hover:bg-green-700 dark:hover:bg-green-600 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={18} className="mr-2" />
              <span>{isSaving ? "Ukládám..." : "Uložit výběr"}</span>
            </button>
            <button
              onClick={() => {
                setEditingService(null);
                setFormData({
                  name: "",
                  priceFrom: "",
                  priceTo: "",
                  durationMinutes: "",
                  description: "",
                });
                setShowModal(true);
              }}
              className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-[#5A5BFF] dark:bg-[#6366FF] text-white font-inter font-semibold text-sm hover:bg-[#4F4FE6] dark:hover:bg-[#5856FF] transition-all active:scale-95"
            >
              <Plus size={20} />
              <span>Přidat službu</span>
            </button>
          </div>
        </div>
      </div>

      {/* No business info banner */}
      {!hasBusiness && <NoBusinessBanner />}

      {/* Info banner */}
      <div className="mb-6 p-4 rounded-xl bg-blue-50 border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
        <p className="font-inter text-sm text-blue-800 dark:text-blue-200">
          <span className="font-semibold">Kliknutím na kartu</span> vyberete službu, kterou může IVA automaticky rezervovat.{" "}
          <span className="font-semibold">
            Vybráno: {bookableCount}/{MAX_BOOKABLE_SERVICES}
          </span>
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <p className="font-inter text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        </div>
      )}

      {/* Services Grid */}
      {services.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-[#1E1E1E] rounded-2xl border border-[#E5E7EB] dark:border-gray-700">
          <Scissors
            size={48}
            className="mx-auto text-[#6B7280] dark:text-white dark:text-opacity-40 mb-4"
          />
          <p className="font-inter text-base text-[#6B7280] dark:text-white dark:text-opacity-70">
            Zatím nemáte žádné služby
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-[#5A5BFF] dark:bg-[#6366FF] text-white font-inter font-semibold text-sm hover:bg-[#4F4FE6] dark:hover:bg-[#5856FF] transition-all"
          >
            <Plus size={18} />
            <span>Přidat první službu</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <div
              key={service.id}
              onClick={(e) => {
                // Only toggle if clicking directly on the card, not on buttons
                if (e.target && e.target.closest && e.target.closest('button')) {
                  return;
                }
                handleToggleBookable(service, e);
              }}
              className={`rounded-2xl p-6 transition-all cursor-pointer border-2 hover:shadow-lg hover:shadow-[#5A5BFF]/10 dark:hover:shadow-[#6366FF]/10 ${
                service.isBookable === true
                  ? "bg-[#5A5BFF]/5 dark:bg-[#6366FF]/10 border-[#5A5BFF] dark:border-[#6366FF]"
                  : "bg-white dark:bg-[#1E1E1E] border-[#E5E7EB] dark:border-gray-700"
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3 flex-1">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      service.isBookable === true
                        ? "bg-[#5A5BFF] dark:bg-[#6366FF]"
                        : "bg-[#F3F4F6] dark:bg-[#262626]"
                    }`}
                  >
                    <Scissors
                      size={24}
                      className={
                        service.isBookable === true
                          ? "text-white"
                          : "text-[#5A5BFF] dark:text-[#6366FF]"
                      }
                    />
                  </div>
                  {service.isBookable === true && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#5A5BFF]/10 dark:bg-[#6366FF]/20 text-[#5A5BFF] dark:text-[#6366FF] border border-[#5A5BFF]/20 dark:border-[#6366FF]/30">
                      IVA online
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditModal(service);
                    }}
                    className="p-2 rounded-lg hover:bg-[#F3F4F6] dark:hover:bg-[#262626] transition-colors"
                  >
                    <Edit
                      size={18}
                      className="text-[#6B7280] dark:text-white dark:text-opacity-70"
                    />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(service.id);
                    }}
                    className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <Trash2
                      size={18}
                      className="text-red-600 dark:text-red-400"
                    />
                  </button>
                </div>
              </div>

              <h3 className="font-inter font-semibold text-lg text-[#111111] dark:text-white mb-2">
                {service.name}
              </h3>
              {service.description && (
                <p className="font-inter text-sm text-[#6B7280] dark:text-white dark:text-opacity-70 mb-4">
                  {service.description}
                </p>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-[#E5E7EB] dark:border-gray-700">
                <div>
                  <p className="font-inter text-xs text-[#6B7280] dark:text-white dark:text-opacity-60 mb-1">
                    Cena
                  </p>
                  <p
                    className={`font-inter font-bold text-lg ${
                      service.isBookable === true
                        ? "text-[#5A5BFF] dark:text-[#6366FF]"
                        : "text-[#111111] dark:text-white"
                    }`}
                  >
                    {formatPrice(service)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-inter text-xs text-[#6B7280] dark:text-white dark:text-opacity-60 mb-1">
                    Délka
                  </p>
                  <p className="font-inter font-semibold text-sm text-[#111111] dark:text-white">
                    {service.durationMinutes ? `${service.durationMinutes} min` : "Neuvedeno"}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#1E1E1E] rounded-2xl max-w-md w-full p-6">
            <h2 className="font-inter font-bold text-xl text-[#111111] dark:text-white mb-6">
              {editingService ? "Upravit službu" : "Nová služba"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block font-inter text-sm font-medium text-[#111111] dark:text-white mb-2">
                  Název služby
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl bg-[#F9FAFB] dark:bg-[#0A0A0A] border border-[#E5E7EB] dark:border-gray-700 font-inter text-sm text-[#111111] dark:text-white focus:outline-none focus:border-[#5A5BFF] dark:focus:border-[#6366FF]"
                  placeholder="např. Střih"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-inter text-sm font-medium text-[#111111] dark:text-white mb-2">
                    Cena od (Kč) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.priceFrom}
                    onChange={(e) =>
                      setFormData({ ...formData, priceFrom: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl bg-[#F9FAFB] dark:bg-[#0A0A0A] border border-[#E5E7EB] dark:border-gray-700 font-inter text-sm text-[#111111] dark:text-white focus:outline-none focus:border-[#5A5BFF] dark:focus:border-[#6366FF]"
                    placeholder="500"
                  />
                </div>

                <div>
                  <label className="block font-inter text-sm font-medium text-[#111111] dark:text-white mb-2">
                    Cena do (Kč)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.priceTo}
                    onChange={(e) =>
                      setFormData({ ...formData, priceTo: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl bg-[#F9FAFB] dark:bg-[#0A0A0A] border border-[#E5E7EB] dark:border-gray-700 font-inter text-sm text-[#111111] dark:text-white focus:outline-none focus:border-[#5A5BFF] dark:focus:border-[#6366FF]"
                    placeholder="600 (volitelné)"
                  />
                </div>
              </div>

              <div>
                <label className="block font-inter text-sm font-medium text-[#111111] dark:text-white mb-2">
                  Délka (min) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.durationMinutes}
                  onChange={(e) =>
                    setFormData({ ...formData, durationMinutes: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl bg-[#F9FAFB] dark:bg-[#0A0A0A] border border-[#E5E7EB] dark:border-gray-700 font-inter text-sm text-[#111111] dark:text-white focus:outline-none focus:border-[#5A5BFF] dark:focus:border-[#6366FF]"
                  placeholder="60"
                />
              </div>

              <div>
                <label className="block font-inter text-sm font-medium text-[#111111] dark:text-white mb-2">
                  Popis (nepovinné)
                </label>
                <textarea
                  rows="3"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl bg-[#F9FAFB] dark:bg-[#0A0A0A] border border-[#E5E7EB] dark:border-gray-700 font-inter text-sm text-[#111111] dark:text-white focus:outline-none focus:border-[#5A5BFF] dark:focus:border-[#6366FF] resize-none"
                  placeholder="Krátký popis služby..."
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingService(null);
                  }}
                  className="flex-1 px-6 py-3 rounded-xl border border-[#E5E7EB] dark:border-gray-700 font-inter font-semibold text-sm text-[#6B7280] dark:text-white dark:text-opacity-70 hover:bg-[#F3F4F6] dark:hover:bg-[#262626] transition-all"
                >
                  Zrušit
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 px-6 py-3 rounded-xl bg-[#5A5BFF] dark:bg-[#6366FF] font-inter font-semibold text-sm text-white hover:bg-[#4F4FE6] dark:hover:bg-[#5856FF] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? "Ukládám..." : editingService ? "Uložit" : "Přidat"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
