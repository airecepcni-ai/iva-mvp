"use client";

import { useEffect, useState } from "react";
import { useParams } from "react-router";

export default function AlertDetailPage() {
  const { id } = useParams();
  const [alert, setAlert] = useState(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    async function loadAlert() {
      try {
        const response = await fetch(`/api/alerts/${id}`);
        if (!response.ok) {
          setStatus("error");
          return;
        }
        const data = await response.json();
        if (data?.errorType === "table_missing") {
          setAlert(null);
          setStatus("error");
          return;
        }
        setAlert(data || null);
        setStatus("success");
      } catch (error) {
        console.error("Alert detail fetch error:", error);
        setStatus("error");
      }
    }

    loadAlert();
  }, [id]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background-dark text-white flex items-center justify-center">
        Loading alert...
      </div>
    );
  }

  if (status === "error" || !alert) {
    return (
      <div className="min-h-screen bg-background-dark text-white flex items-center justify-center">
        Alert not found.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-dark text-white flex items-center justify-center p-6">
      <div className="bg-card-dark border border-border-dark rounded-xl p-6 w-full max-w-xl">
        <h1 className="text-xl font-bold mb-2">{alert.title || "Alert"}</h1>
        <p className="text-sm text-slate-400 mb-4">Status: {alert.status || "unknown"}</p>
        <p className="text-xs text-slate-500">Created: {alert.created_at || "--"}</p>
      </div>
    </div>
  );
}
