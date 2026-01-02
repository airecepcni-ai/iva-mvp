"use client";

import { useState, useEffect, useCallback } from "react";
import { Clock, Save, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import {
  fetchOpeningHours,
  updateOpeningHours,
} from "@/lib/openingHours";
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
          Můžete prozkoumat rozhraní. Otevírací doba se uloží až po vytvoření salonu.
        </p>
      </div>
    </div>
  );
}

// Map weekday to Czech day name and display order
const WEEKDAY_CONFIG = [
  { weekday: "mon", name: "Pondělí", order: 1 },
  { weekday: "tue", name: "Úterý", order: 2 },
  { weekday: "wed", name: "Středa", order: 3 },
  { weekday: "thu", name: "Čtvrtek", order: 4 },
  { weekday: "fri", name: "Pátek", order: 5 },
  { weekday: "sat", name: "Sobota", order: 6 },
  { weekday: "sun", name: "Neděle", order: 7 },
];

export default function OpeningHoursPage() {
  const { activeBusinessId, loading: tenantLoading, hasBusiness } = useTenant();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [openPickerId, setOpenPickerId] = useState(null); // e.g. "opens-mon" / "closes-fri"
  const [hours, setHours] = useState({
    mon: null,
    tue: null,
    wed: null,
    thu: null,
    fri: null,
    sat: null,
    sun: null,
  });

  // Initialize default hours for all weekdays
  const getDefaultHours = useCallback(() => {
    const hoursMap = {};
    WEEKDAY_CONFIG.forEach(({ weekday }) => {
      hoursMap[weekday] = {
        id: `default-${weekday}`,
        weekday,
        opensAt: weekday === "sun" ? null : "09:00",
        closesAt: weekday === "sun" ? null : "17:00",
        closed: weekday === "sun",
      };
    });
    return hoursMap;
  }, []);

  const fetchOpeningHoursData = useCallback(async () => {
    // If no business, initialize with defaults
    if (!activeBusinessId) {
      setLoading(false);
      setHours(getDefaultHours());
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      const data = await fetchOpeningHours(activeBusinessId);

      // Convert array to object keyed by weekday, with defaults for missing days
      const hoursMap = getDefaultHours();

      data.forEach((hour) => {
        hoursMap[hour.weekday] = hour;
      });

      // Preserve last-known times in memory when backend represents "closed" by null times.
      // This allows reopening to restore previous times without forcing defaults.
      setHours((prev) => {
        if (!prev) return hoursMap;
        const merged = { ...hoursMap };
        WEEKDAY_CONFIG.forEach(({ weekday }) => {
          const next = merged[weekday];
          const prevDay = prev?.[weekday];
          if (
            next &&
            next.closed === true &&
            (!next.opensAt || !next.closesAt) &&
            prevDay &&
            prevDay.opensAt &&
            prevDay.closesAt
          ) {
            merged[weekday] = {
              ...next,
              opensAt: prevDay.opensAt,
              closesAt: prevDay.closesAt,
            };
          }
        });
        return merged;
      });
    } catch (err) {
      console.error("Error fetching opening hours:", err);
      setError(err?.message || "Nepodařilo se načíst otevírací dobu");
    } finally {
      setLoading(false);
    }
  }, [activeBusinessId, getDefaultHours]);

  // Fetch when tenant is ready
  useEffect(() => {
    if (!tenantLoading) {
      fetchOpeningHoursData();
    }
  }, [tenantLoading, activeBusinessId, fetchOpeningHoursData]);

  const handleSave = async () => {
    if (!activeBusinessId) return;
    
    setSaving(true);
    setError(null);

    try {
      // Convert hours object to array for backend
      const hoursArray = WEEKDAY_CONFIG.map(({ weekday }) => {
        const hour = hours[weekday];
        if (!hour) {
          return {
            weekday,
            opensAt: null,
            closesAt: null,
            closed: true,
          };
        }
        return {
          weekday: hour.weekday,
          // Preserve stored times even when closed (closed flag determines availability)
          opensAt: hour.opensAt,
          closesAt: hour.closesAt,
          closed: hour.closed,
        };
      });

      // Validate times for open days
      for (const h of hoursArray) {
        if (h.closed) continue;
        if (!isValidHHMM(h.opensAt) || !isValidHHMM(h.closesAt)) {
          throw new Error("Zadejte prosím platný čas ve formátu HH:MM.");
        }
      }

      await updateOpeningHours(activeBusinessId, hoursArray);
      
      // Refetch to get updated data with IDs
      await fetchOpeningHoursData();
      
      toast.success("Uloženo", {
        description: "Otevírací doba byla úspěšně aktualizována.",
      });
    } catch (err) {
      console.error("Error saving opening hours:", err);
      setError(err?.message || "Nepodařilo se uložit otevírací dobu");
      toast.error("Nepodařilo se uložit otevírací dobu", {
        description: err?.message || "Zkuste to prosím znovu.",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateDay = (weekday, field, value) => {
    setHours((prev) => {
      const current = prev[weekday];
      if (!current) {
        // Create new entry
        const newHour = {
          id: `temp-${weekday}`,
          weekday,
          opensAt: field === "closed" && value ? null : "09:00",
          closesAt: field === "closed" && value ? null : "17:00",
          closed: field === "closed" ? value : false,
        };
        newHour[field] = value;
        return { ...prev, [weekday]: newHour };
      } else {
        // Update existing entry
        const updated = {
          ...current,
          [field]: value,
        };
        // If toggling closed:
        // - closed=true: do NOT wipe times; just mark closed
        // - closed=false: restore previous times; only set defaults if both missing
        if (field === "closed" && value === false && !updated.opensAt && !updated.closesAt) {
          updated.opensAt = "09:00";
          updated.closesAt = "17:00";
        }
        return { ...prev, [weekday]: updated };
      }
    });
  };

  // 24h dropdown time options in 15-minute steps
  const TIME_OPTIONS = (() => {
    const out = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 15) {
        const hh = String(h).padStart(2, "0");
        const mm = String(m).padStart(2, "0");
        out.push(`${hh}:${mm}`);
      }
    }
    return out;
  })();

  // Close picker on outside click
  useEffect(() => {
    if (!openPickerId) return;
    const onPointerDown = (e) => {
      const root = e.target?.closest?.("[data-timepicker-id]");
      if (!root) {
        setOpenPickerId(null);
        return;
      }
      if (root.getAttribute("data-timepicker-id") !== openPickerId) {
        setOpenPickerId(null);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
    };
  }, [openPickerId]);

  // Force 24h display in UI by using a controlled HH:mm text input.
  // Native <input type="time"> can show AM/PM based on browser/OS locale.
  const formatTimeInput = (raw) => {
    const digits = String(raw || "").replace(/\D/g, "").slice(0, 4);
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, 2)}:${digits.slice(2)}`;
  };

  const isValidHHMM = (value) => {
    if (!value || typeof value !== "string") return false;
    if (!/^\d{2}:\d{2}$/.test(value)) return false;
    const [hh, mm] = value.split(":").map((n) => parseInt(n, 10));
    return hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59;
  };

  // Show spinner only during initial tenant loading
  if (tenantLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-[#5A5BFF] dark:border-[#6366FF] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Show spinner only while opening hours are being fetched (real loading)
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-[#5A5BFF] dark:border-[#6366FF] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // After loading completes, ALWAYS render the full UI (even with no business)

  // Sort days by order (Monday first, Sunday last)
  const sortedDays = [...WEEKDAY_CONFIG].sort((a, b) => a.order - b.order);

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="font-inter font-bold text-3xl text-[#111111] dark:text-white mb-2">
            Otevírací doba
          </h1>
          <p className="font-inter text-sm text-[#6B7280] dark:text-white dark:text-opacity-70">
            Nastavte provozní hodiny vašeho salonu
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-4 sm:mt-0 inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-[#5A5BFF] dark:bg-[#6366FF] text-white font-inter font-semibold text-sm hover:bg-[#4F4FE6] dark:hover:bg-[#5856FF] transition-all active:scale-95 disabled:opacity-50"
        >
          <Save size={20} />
          <span>{saving ? "Ukládání..." : "Uložit změny"}</span>
        </button>
      </div>

      {/* No business info banner */}
      {!hasBusiness && <NoBusinessBanner />}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <p className="font-inter text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        </div>
      )}

      {/* Opening Hours */}
      <div className="bg-white dark:bg-[#1E1E1E] rounded-2xl border border-[#E5E7EB] dark:border-gray-700 overflow-hidden">
        <div className="p-6 space-y-4">
          {sortedDays.map(({ weekday, name }) => {
            const dayHours = hours[weekday];
            if (!dayHours) {
              // Should not happen due to defaults, but handle gracefully
              return null;
            }

            return (
              <div
                key={weekday}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 rounded-xl bg-[#F9FAFB] dark:bg-[#0A0A0A] space-y-3 sm:space-y-0"
              >
                <div className="flex items-center space-x-3">
                  <Clock
                    size={20}
                    className="text-[#6B7280] dark:text-white dark:text-opacity-60"
                  />
                  <span className="font-inter font-semibold text-base text-[#111111] dark:text-white min-w-[100px]">
                    {name}
                  </span>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="relative w-24 shrink-0" data-timepicker-id={`opens-${weekday}`}>
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="08:00"
                          maxLength={5}
                          value={formatTimeInput(dayHours.opensAt || "09:00")}
                          onChange={(e) => {
                            const next = formatTimeInput(e.target.value);
                            updateDay(weekday, "opensAt", next);
                          }}
                          onFocus={() => {
                            if (!dayHours.closed) setOpenPickerId(`opens-${weekday}`);
                          }}
                          onBlur={() => {
                            const current = dayHours.opensAt || "";
                            if (current && !isValidHHMM(current)) {
                              updateDay(weekday, "opensAt", "09:00");
                            }
                          }}
                          disabled={dayHours.closed}
                          className={`w-24 px-3 py-2 pr-9 tabular-nums rounded-lg border font-inter text-sm focus:outline-none focus:border-[#5A5BFF] dark:focus:border-[#6366FF] ${
                            dayHours.closed
                              ? "bg-[#F3F4F6] dark:bg-[#262626] border-[#E5E7EB] dark:border-gray-700 text-[#6B7280] dark:text-white dark:text-opacity-50 cursor-not-allowed"
                              : "bg-white dark:bg-[#1E1E1E] border-[#E5E7EB] dark:border-gray-700 text-[#111111] dark:text-white"
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (dayHours.closed) return;
                            setOpenPickerId((prev) =>
                              prev === `opens-${weekday}` ? null : `opens-${weekday}`
                            );
                          }}
                          className={`absolute right-2 top-1/2 -translate-y-1/2 transition-colors ${
                            dayHours.closed
                              ? "text-[#9CA3AF] dark:text-white/30 cursor-not-allowed"
                              : "text-[#6B7280] dark:text-white dark:text-opacity-60 hover:text-[#111111] dark:hover:text-white"
                          }`}
                          aria-label="Vybrat čas otevření"
                          disabled={dayHours.closed}
                        >
                          <Clock size={16} />
                        </button>
                        {openPickerId === `opens-${weekday}` && !dayHours.closed && (
                          <div className="absolute z-50 mt-2 w-28 max-h-56 overflow-auto rounded-xl border border-[#E5E7EB] dark:border-gray-700 bg-white dark:bg-[#1E1E1E] shadow-lg">
                            {TIME_OPTIONS.map((t) => (
                              <button
                                key={t}
                                type="button"
                                onClick={() => {
                                  updateDay(weekday, "opensAt", t);
                                  setOpenPickerId(null);
                                }}
                                className={`w-full text-left px-3 py-2 font-inter text-sm hover:bg-[#F3F4F6] dark:hover:bg-[#262626] ${
                                  (dayHours.opensAt || "") === t
                                    ? "text-[#5A5BFF] dark:text-[#6366FF] font-semibold"
                                    : "text-[#111111] dark:text-white"
                                }`}
                              >
                                {t}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    <span className="text-[#6B7280] dark:text-white dark:text-opacity-60">
                      -
                    </span>
                    <div className="relative w-24 shrink-0" data-timepicker-id={`closes-${weekday}`}>
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="20:00"
                          maxLength={5}
                          value={formatTimeInput(dayHours.closesAt || "17:00")}
                          onChange={(e) => {
                            const next = formatTimeInput(e.target.value);
                            updateDay(weekday, "closesAt", next);
                          }}
                          onFocus={() => {
                            if (!dayHours.closed) setOpenPickerId(`closes-${weekday}`);
                          }}
                          onBlur={() => {
                            const current = dayHours.closesAt || "";
                            if (current && !isValidHHMM(current)) {
                              updateDay(weekday, "closesAt", "17:00");
                            }
                          }}
                          disabled={dayHours.closed}
                          className={`w-24 px-3 py-2 pr-9 tabular-nums rounded-lg border font-inter text-sm focus:outline-none focus:border-[#5A5BFF] dark:focus:border-[#6366FF] ${
                            dayHours.closed
                              ? "bg-[#F3F4F6] dark:bg-[#262626] border-[#E5E7EB] dark:border-gray-700 text-[#6B7280] dark:text-white dark:text-opacity-50 cursor-not-allowed"
                              : "bg-white dark:bg-[#1E1E1E] border-[#E5E7EB] dark:border-gray-700 text-[#111111] dark:text-white"
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (dayHours.closed) return;
                            setOpenPickerId((prev) =>
                              prev === `closes-${weekday}` ? null : `closes-${weekday}`
                            );
                          }}
                          className={`absolute right-2 top-1/2 -translate-y-1/2 transition-colors ${
                            dayHours.closed
                              ? "text-[#9CA3AF] dark:text-white/30 cursor-not-allowed"
                              : "text-[#6B7280] dark:text-white dark:text-opacity-60 hover:text-[#111111] dark:hover:text-white"
                          }`}
                          aria-label="Vybrat čas zavření"
                          disabled={dayHours.closed}
                        >
                          <Clock size={16} />
                        </button>
                        {openPickerId === `closes-${weekday}` && !dayHours.closed && (
                          <div className="absolute z-50 mt-2 w-28 max-h-56 overflow-auto rounded-xl border border-[#E5E7EB] dark:border-gray-700 bg-white dark:bg-[#1E1E1E] shadow-lg">
                            {TIME_OPTIONS.map((t) => (
                              <button
                                key={t}
                                type="button"
                                onClick={() => {
                                  updateDay(weekday, "closesAt", t);
                                  setOpenPickerId(null);
                                }}
                                className={`w-full text-left px-3 py-2 font-inter text-sm hover:bg-[#F3F4F6] dark:hover:bg-[#262626] ${
                                  (dayHours.closesAt || "") === t
                                    ? "text-[#5A5BFF] dark:text-[#6366FF] font-semibold"
                                    : "text-[#111111] dark:text-white"
                                }`}
                              >
                                {t}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setOpenPickerId(null);
                        updateDay(weekday, "closed", !dayHours.closed);
                      }}
                      className={
                        dayHours.closed
                          ? "px-4 py-2 rounded-lg bg-[#5A5BFF]/10 dark:bg-[#6366FF]/20 text-[#5A5BFF] dark:text-[#6366FF] font-inter text-sm font-medium hover:bg-[#5A5BFF]/20 dark:hover:bg-[#6366FF]/30 transition-colors"
                          : "px-4 py-2 rounded-lg border border-[#E5E7EB] dark:border-gray-700 text-[#6B7280] dark:text-white dark:text-opacity-70 font-inter text-sm font-medium hover:bg-[#F3F4F6] dark:hover:bg-[#262626] transition-colors"
                      }
                    >
                      {dayHours.closed ? "Otevřít" : "Zavřít"}
                    </button>
                  </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
