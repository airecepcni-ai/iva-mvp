"use client";

import { useEffect, useMemo, useState } from "react";

function formatPhone(phone) {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits.startsWith("1")) {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return phone;
}

function getInitials(name, fallback) {
  if (name) {
    const parts = name.trim().split(" ");
    const initials = parts
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");
    if (initials) return initials;
  }

  if (fallback) {
    const formatted = formatPhone(fallback);
    if (formatted) return formatted;
    return fallback.replace(/\D/g, "").slice(-2) || "NA";
  }

  return "NA";
}

function formatRelativeTime(timestamp) {
  if (!timestamp) return "--";
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} mins ago`;
  if (hours < 24) return `${hours} hrs ago`;
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

function formatCallTime(timestamp) {
  if (!timestamp) return "--";
  const date = new Date(timestamp);
  const now = new Date();
  const isSameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (isSameDay) {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate();

  if (isYesterday) {
    return "Yesterday";
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function getSeverityStyles(severity) {
  const normalized = (severity || "high").toLowerCase();
  if (normalized.includes("urgent")) {
    return {
      label: "URGENT",
      badgeClass: "text-red-400 bg-red-400/10 font-bold",
      borderClass: "border-red-500",
      actionLabel: "Dispatch",
      actionClass: "bg-red-600 hover:bg-red-500",
    };
  }
  if (normalized.includes("high")) {
    return {
      label: "HIGH",
      badgeClass: "text-accent-orange bg-accent-orange/10",
      borderClass: "border-accent-orange",
      actionLabel: "Review",
      actionClass: "bg-border-dark hover:bg-slate-600",
    };
  }
  if (normalized.includes("medium")) {
    return {
      label: "MEDIUM",
      badgeClass: "text-yellow-400 bg-yellow-400/10",
      borderClass: "border-yellow-400/40",
      actionLabel: "Review",
      actionClass: "bg-border-dark hover:bg-slate-600",
    };
  }
  if (normalized.includes("low")) {
    return {
      label: "LOW",
      badgeClass: "text-gray-400 bg-gray-400/10",
      borderClass: "border-gray-500/40",
      actionLabel: "Review",
      actionClass: "bg-border-dark hover:bg-slate-600",
    };
  }
  // TODO: Handle unexpected alert severity values.
  return {
    label: normalized.toUpperCase(),
    badgeClass: "text-gray-400 bg-gray-400/10",
    borderClass: "border-border-dark",
    actionLabel: "Review",
    actionClass: "bg-border-dark hover:bg-slate-600",
  };
}

export default function DashboardV2() {
  const [summary, setSummary] = useState(null);
  const [summaryStatus, setSummaryStatus] = useState("idle");
  const [chartStatus, setChartStatus] = useState("idle");
  const [chartErrorType, setChartErrorType] = useState(null);
  const [chartSummary, setChartSummary] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [alertsStatus, setAlertsStatus] = useState("idle");
  const [contacts, setContacts] = useState([]);
  const [repeatMap, setRepeatMap] = useState({});
  const [contactsStatus, setContactsStatus] = useState("idle");

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }),
    []
  );

  const chartDays = useMemo(() => {
    const result = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 29; i >= 0; i -= 1) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const key = date.toISOString().slice(0, 10);
      const label = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      result.push({ key, label });
    }
    return result;
  }, []);

  const summaryMap = useMemo(() => {
    return chartSummary.reduce((acc, row) => {
      acc[row.date] = {
        calls: row.calls_count ?? 0,
        bookings: row.bookings_count ?? 0,
      };
      return acc;
    }, {});
  }, [chartSummary]);

  const chartData = useMemo(() => {
    return chartDays.map((day) => ({
      key: day.key,
      label: day.label,
      calls: summaryMap[day.key]?.calls ?? 0,
      bookings: summaryMap[day.key]?.bookings ?? 0,
    }));
  }, [chartDays, summaryMap]);

  const chartMax = useMemo(() => {
    return chartData.reduce((max, item) => Math.max(max, item.calls, item.bookings), 0);
  }, [chartData]);

  const chartHasData = useMemo(() => {
    return chartData.some((item) => item.calls > 0 || item.bookings > 0);
  }, [chartData]);

  const chartYAxisLabels = useMemo(() => {
    if (!chartMax) return [0];
    return [chartMax, Math.round(chartMax / 2), 0];
  }, [chartMax]);

  useEffect(() => {
    async function loadSummary() {
      setSummaryStatus("loading");
      try {
        const response = await fetch("/api/dashboard/summary");
        if (!response.ok) {
          setSummaryStatus("error");
          return;
        }
        const data = await response.json();
        setSummary(data);
        setSummaryStatus("success");
      } catch (error) {
        console.error("Dashboard summary fetch error:", error);
        setSummaryStatus("error");
      }
    }

    async function loadChart() {
      setChartStatus("loading");
      try {
        const response = await fetch("/api/dashboard/chart");
        const data = await response.json();
        if (!response.ok || data?.errorType === "view_missing") {
          setChartErrorType(data?.errorType || "error");
          setChartStatus("error");
          return;
        }
        if (data?.errorType === "no_activity") {
          setChartErrorType(null);
          setChartSummary([]);
          setChartStatus("success");
          return;
        }
        setChartErrorType(null);
        setChartSummary(data || []);
        setChartStatus("success");
      } catch (error) {
        console.error("Dashboard chart fetch error:", error);
        setChartErrorType("error");
        setChartStatus("error");
      }
    }

    async function loadAlerts() {
      setAlertsStatus("loading");
      try {
        const response = await fetch("/api/alerts");
        const data = await response.json();
        if (!response.ok || data?.errorType === "table_missing") {
          setAlerts([]);
          setAlertsStatus("success");
          return;
        }
        setAlerts(data || []);
        setAlertsStatus("success");
      } catch (error) {
        console.error("Alerts fetch error:", error);
        setAlertsStatus("error");
      }
    }

    async function loadContacts() {
      setContactsStatus("loading");
      try {
        const response = await fetch("/api/contacts/recent");
        if (!response.ok) {
          setContactsStatus("error");
          return;
        }
        const data = await response.json();
        setContacts(data.contacts || []);
        setRepeatMap(data.repeatMap || {});
        setContactsStatus("success");
      } catch (error) {
        console.error("Contacts fetch error:", error);
        setContactsStatus("error");
      }
    }

    loadSummary();
    loadChart();
    loadAlerts();
    loadContacts();
  }, []);

  const summaryReady = summaryStatus === "success" && summary;
  const revenue = summaryReady ? summary.revenue : 0;
  const revenueTrend = summaryReady ? summary.revenueTrend : null;
  const callsCount = summaryReady ? summary.callsCount : 0;
  const bookingsCount = summaryReady ? summary.bookingsCount : 0;
  const afterHoursBookings = summaryReady ? summary.afterHoursBookings : 0;

  return (
    <div className="font-display bg-background-light dark:bg-background-dark text-slate-900 dark:text-white antialiased overflow-hidden">
      <div className="flex h-screen w-full overflow-hidden">
        <div className="hidden md:flex flex-col w-64 border-r border-border-dark bg-background-dark flex-shrink-0">
          <div className="flex flex-col h-full p-4 justify-between">
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-3 px-2">
                <div
                  className="bg-center bg-no-repeat bg-cover rounded-full size-10 flex-shrink-0 relative"
                  style={{
                    backgroundImage: "linear-gradient(135deg, #136dec 0%, #0b3d86 100%)",
                  }}
                >
                  <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-xs">
                    AI
                  </div>
                </div>
                <div className="flex flex-col min-w-0">
                  <h1 className="text-white text-base font-bold leading-tight truncate">IVA Admin</h1>
                  <p className="text-[#92a9c9] text-xs font-normal leading-normal truncate">Dashboard</p>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <a
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-primary/20 text-primary border border-primary/20"
                  href="/dashboard"
                >
                  <span className="material-symbols-outlined text-primary">dashboard</span>
                  <p className="text-sm font-bold leading-normal">Dashboard</p>
                </a>
                <a
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-card-dark transition-colors"
                  href="/dashboard/rezervace"
                >
                  <span className="material-symbols-outlined">call</span>
                  <p className="text-sm font-medium leading-normal">Call Logs</p>
                </a>
              </div>
            </div>
          </div>
        </div>

        <main className="flex-1 flex flex-col h-full overflow-hidden bg-background-dark relative">
          <header className="h-16 border-b border-border-dark flex items-center justify-between px-6 lg:px-8 bg-background-dark/95 backdrop-blur z-10 flex-shrink-0">
            <div className="flex items-center gap-4">
              <button className="md:hidden text-slate-400">
                <span className="material-symbols-outlined">menu</span>
              </button>
              <h2 className="text-white text-lg font-bold">ROI &amp; Overview</h2>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
              <div className="flex flex-col justify-between p-6 rounded-xl bg-card-dark border border-border-dark relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <span className="material-symbols-outlined text-8xl text-emerald-500">payments</span>
                </div>
                <div className="flex items-center gap-3 mb-2 relative z-10">
                  <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
                    <span className="material-symbols-outlined">attach_money</span>
                  </div>
                  <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider">Est. Revenue Won</h3>
                </div>
                <div className="relative z-10">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl lg:text-4xl font-extrabold text-white">
                      {summaryStatus === "loading" ? "—" : currencyFormatter.format(revenue)}
                    </span>
                    <span className="text-emerald-500 text-sm font-bold flex items-center">
                      <span className="material-symbols-outlined text-[16px]">trending_up</span>{" "}
                      {revenueTrend !== null ? `${revenueTrend}%` : "—"}
                    </span>
                  </div>
                  <p className="text-slate-500 text-xs mt-2">Revenue from AI-booked jobs this month</p>
                </div>
              </div>
              <div className="flex flex-col justify-between p-6 rounded-xl bg-card-dark border border-border-dark relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <span className="material-symbols-outlined text-8xl text-primary">phone_missed</span>
                </div>
                <div className="flex items-center gap-3 mb-2 relative z-10">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <span className="material-symbols-outlined">call_missed_outgoing</span>
                  </div>
                  <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider">Missed Calls Captured</h3>
                </div>
                <div className="relative z-10">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl lg:text-4xl font-extrabold text-white">
                      {summaryStatus === "loading" ? "—" : callsCount}
                    </span>
                    <span className="text-slate-400 text-sm">calls</span>
                  </div>
                  <p className="text-slate-500 text-xs mt-2">Potential leads saved by answering instantly</p>
                </div>
              </div>
              <div className="flex flex-col justify-between p-6 rounded-xl bg-card-dark border border-border-dark relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <span className="material-symbols-outlined text-8xl text-accent-orange">bedtime</span>
                </div>
                <div className="flex items-center gap-3 mb-2 relative z-10">
                  <div className="p-2 bg-accent-orange/10 rounded-lg text-accent-orange">
                    <span className="material-symbols-outlined">nightlight_round</span>
                  </div>
                  <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider">After-Hours Jobs</h3>
                </div>
                <div className="relative z-10">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl lg:text-4xl font-extrabold text-white">
                      {summaryStatus === "loading" ? "—" : afterHoursBookings}
                    </span>
                    <span className="text-accent-orange text-sm font-bold flex items-center">
                      <span className="material-symbols-outlined text-[16px]">bolt</span>{" "}
                      {afterHoursBookings ? "Hot" : "—"}
                    </span>
                  </div>
                  <p className="text-slate-500 text-xs mt-2">Emergency jobs booked between 6PM - 7AM</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[320px]">
              <div className="lg:col-span-2 bg-card-dark border border-border-dark rounded-xl p-6 flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-white text-lg font-bold">Call Volume vs. Bookings (Last 30 Days)</h3>
                    <p className="text-slate-400 text-sm">Total Calls vs. Jobs Booked</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-medium">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-sm bg-primary/50"></span>
                      <span className="text-slate-300">Total Calls</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-sm bg-accent-orange"></span>
                      <span className="text-slate-300">Jobs Booked</span>
                    </div>
                  </div>
                </div>
                <div className="flex-1 flex flex-col justify-end px-2 pb-2 relative">
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none z-0">
                    <div className="w-full h-px bg-border-dark border-t border-dashed border-slate-700/50"></div>
                    <div className="w-full h-px bg-border-dark border-t border-dashed border-slate-700/50"></div>
                    <div className="w-full h-px bg-border-dark border-t border-dashed border-slate-700/50"></div>
                    <div className="w-full h-px bg-border-dark border-t border-dashed border-slate-700/50"></div>
                  </div>
                  {chartStatus === "loading" ? (
                    <div className="text-xs text-slate-500 relative z-10">Loading trend data...</div>
                  ) : chartErrorType ? (
                    <div className="text-slate-400 italic text-sm text-center py-8 relative z-10">
                      <span className="material-symbols-outlined text-base align-middle mr-1">warning</span>
                      {chartErrorType === "view_missing"
                        ? "Chart unavailable — data view not found."
                        : "Chart unavailable — check if the data view exists."}
                    </div>
                  ) : !chartHasData ? (
                    <div className="text-slate-400 italic text-sm text-center py-8 relative z-10">
                      No activity yet — chart will appear once calls or bookings are recorded.
                    </div>
                  ) : (
                    <div className="relative z-10 overflow-x-auto">
                      <div className="flex items-end gap-3 min-w-[720px]">
                        <div className="flex flex-col justify-between h-full text-[10px] text-slate-500 pb-4">
                          {chartYAxisLabels.map((label) => (
                            <span key={label}>{label}</span>
                          ))}
                        </div>
                        <div className="flex gap-1 h-full items-end w-full">
                          {chartData.map((item, index) => {
                            const callsHeight = chartMax ? Math.max(8, Math.round((item.calls / chartMax) * 100)) : 0;
                            const bookingsHeight = chartMax
                              ? Math.max(8, Math.round((item.bookings / chartMax) * 100))
                              : 0;
                            const showLabel = index % 5 === 0 || index === chartData.length - 1;
                            return (
                              <div
                                key={item.key}
                                className="flex flex-col justify-end items-center gap-1 h-full w-full group cursor-pointer"
                              >
                                <div className="flex gap-0.5 items-end h-full w-full justify-center">
                                  <div
                                    className="w-2 md:w-3 bg-primary/50 rounded-t-sm group-hover:bg-primary transition-colors"
                                    style={{ height: `${callsHeight}%` }}
                                  ></div>
                                  <div
                                    className="w-2 md:w-3 bg-accent-orange rounded-t-sm group-hover:opacity-90 transition-opacity"
                                    style={{ height: `${bookingsHeight}%` }}
                                  ></div>
                                </div>
                                <div
                                  className={`text-[10px] text-slate-500 hidden sm:block ${
                                    showLabel ? "opacity-100" : "opacity-0"
                                  }`}
                                >
                                  {item.label}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="lg:col-span-1 flex flex-col bg-card-dark border border-red-900/30 rounded-xl overflow-hidden shadow-lg relative">
                <div className="absolute top-0 right-0 p-3">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                </div>
                <div className="p-5 border-b border-border-dark bg-gradient-to-r from-red-500/10 to-transparent">
                  <div className="flex items-center gap-2 text-red-400 mb-1">
                    <span className="material-symbols-outlined">warning</span>
                    <span className="text-xs font-bold uppercase tracking-wider">Attention Needed</span>
                  </div>
                  <h3 className="text-white text-xl font-bold">Priority Calls</h3>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-red-500/5">
                  {alertsStatus === "loading" ? (
                    <div className="text-xs text-slate-500">Loading priority alerts...</div>
                  ) : alerts.length === 0 ? (
                    <div className="text-xs text-slate-500">No active alerts.</div>
                  ) : (
                    alerts.map((alert) => {
                      const severity = getSeverityStyles(alert.severity);
                      return (
                        <a
                          key={alert.id}
                          href={`/alerts/${alert.id}`}
                          className={`bg-card-dark p-4 rounded-lg border-l-4 ${severity.borderClass} shadow-sm flex flex-col gap-2`}
                        >
                          <div className="flex justify-between items-start">
                            <h4 className="text-white font-bold text-sm">{alert.title || "Priority Alert"}</h4>
                            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${severity.badgeClass}`}>
                              {severity.label}
                            </span>
                          </div>
                          <p className="text-slate-400 text-xs line-clamp-2">
                            {alert.description || "Open alert requiring immediate review."}
                          </p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs text-slate-500">{formatRelativeTime(alert.created_at)}</span>
                            <span
                              className={`text-xs font-bold text-white px-3 py-1.5 rounded transition-colors ${severity.actionClass}`}
                            >
                              {severity.actionLabel}
                            </span>
                          </div>
                        </a>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full min-h-[400px]">
              <div className="lg:col-span-2 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-white text-lg font-bold">Recent Call Activity</h3>
                  <a className="text-primary text-sm font-bold hover:underline" href="/dashboard/rezervace">
                    View All History
                  </a>
                </div>
                <div className="bg-card-dark border border-border-dark rounded-xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-background-dark/50 border-b border-border-dark">
                          <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Caller</th>
                          <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Time</th>
                          <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">AI Action</th>
                          <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Sentiment</th>
                          <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-dark">
                        {contactsStatus === "loading" ? (
                          <tr>
                            <td className="p-4 text-sm text-slate-500" colSpan={5}>
                              Loading recent calls...
                            </td>
                          </tr>
                        ) : contacts.length === 0 ? (
                          <tr>
                            <td className="p-4 text-sm text-slate-500" colSpan={5}>
                              No recent calls yet.
                            </td>
                          </tr>
                        ) : (
                          contacts.map((call) => {
                            const phone = call.phone || "";
                            const name = call.name || "Unknown";
                            // TODO: Add outcome field to contacts table.
                            const outcomeValue = "Info Provided";
                            const initials = getInitials(name, phone);
                            const timestamp = call.created_at || null;
                            const phoneDisplay = formatPhone(phone);
                            const repeatCount = phone ? repeatMap[phone] ?? 0 : 0;
                            const isRepeat = repeatCount > 1;

                            return (
                              <tr key={call.id} className="hover:bg-white/5 transition-colors group">
                                <td className="p-4">
                                  <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white">
                                      {initials}
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-white">{name || "Unknown"}</span>
                                        <span
                                          className={`text-[10px] px-1.5 py-0.5 rounded ${
                                            isRepeat
                                              ? "bg-blue-500/10 text-blue-400"
                                              : "bg-emerald-500/10 text-emerald-400"
                                          }`}
                                        >
                                          {isRepeat ? "Repeat" : "New"}
                                        </span>
                                      </div>
                                      <div className="text-xs text-slate-500">{phoneDisplay || phone || "—"}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="p-4 text-sm text-slate-400">{formatCallTime(timestamp)}</td>
                                <td className="p-4">
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                    {outcomeValue}
                                  </span>
                                </td>
                                <td className="p-4">
                                  {/* TODO: Add sentiment field to contacts table for real classification. */}
                                  <div className="flex items-center gap-1.5" title="Neutral">
                                    <span className="material-symbols-outlined text-slate-400 text-[20px]">
                                      sentiment_neutral
                                    </span>
                                    <span className="text-sm text-slate-300">Neutral</span>
                                  </div>
                                </td>
                                <td className="p-4 text-right">
                                  <a
                                    href="/dashboard/rezervace"
                                    className="inline-flex p-2 hover:bg-white/10 rounded text-slate-400 hover:text-white"
                                  >
                                    <span className="material-symbols-outlined">chevron_right</span>
                                  </a>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-1 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-white text-lg font-bold">Knowledge Base</h3>
                  <button className="text-primary text-sm font-bold hover:underline">Manage</button>
                </div>
                <div className="bg-card-dark border border-border-dark rounded-xl p-5 flex flex-col gap-6 h-full">
                  <div className="flex flex-col gap-3">
                    <h4 className="text-white text-sm font-bold">Train your AI</h4>
                    <p className="text-slate-400 text-xs">
                      Upload price lists, manuals, or policies to improve answers.
                    </p>
                    <div className="border-2 border-dashed border-border-dark hover:border-primary/50 bg-background-dark/50 hover:bg-background-dark transition-all rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer group">
                      <span className="material-symbols-outlined text-slate-500 group-hover:text-primary mb-2">
                        cloud_upload
                      </span>
                      <p className="text-slate-300 text-sm font-medium">
                        Drop PDF here or <span className="text-primary">Browse</span>
                      </p>
                    </div>
                  </div>
                  <div className="h-px bg-border-dark w-full"></div>
                  <div className="flex flex-col gap-3">
                    <h4 className="text-white text-sm font-bold">Recent Updates</h4>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-3 p-2 rounded-lg bg-background-dark/50 border border-border-dark/50">
                        <span className="material-symbols-outlined text-red-400 text-[20px]">picture_as_pdf</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-slate-300 text-sm font-medium truncate">Winter_Pricing_2024.pdf</p>
                          <p className="text-xs text-emerald-500">Learned • 2h ago</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-2 rounded-lg bg-background-dark/50 border border-border-dark/50">
                        <span className="material-symbols-outlined text-blue-400 text-[20px]">language</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-slate-300 text-sm font-medium truncate">yourbusiness.com/faq</p>
                          <p className="text-xs text-yellow-500">Processing...</p>
                        </div>
                        <div className="animate-spin h-3 w-3 border-2 border-yellow-500 border-t-transparent rounded-full mr-1"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
