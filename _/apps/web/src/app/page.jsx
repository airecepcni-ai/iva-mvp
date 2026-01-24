"use client";

import { useEffect, useState } from "react";

// Feature flag to toggle between V1 and V2 landing page.
const uiVersion = import.meta.env.NEXT_PUBLIC_UI_VERSION ?? import.meta.env.VITE_UI_VERSION;
const isV2 = uiVersion === "v2";
const buildStamp = "ui-debug-2026-01-23";

// V1 imports
import { Header } from "@/components/Header/Header";
import { HeroSection } from "@/components/HeroSection/HeroSection";
import { DemoSection } from "@/components/DemoSection/DemoSection";
import { FeaturesSection } from "@/components/FeaturesSection/FeaturesSection";
import { PricingSection } from "@/components/PricingSection/PricingSection";
import { Footer } from "@/components/Footer/Footer";
import { AnimationStyles } from "@/components/AnimationStyles/AnimationStyles";

// V2 imports
import LandingHVAC from "./landing/LandingHVAC";

// V1 Landing Page Component
function LandingPageV1() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#121212] overflow-hidden">
      <Header />
      <HeroSection />
      <DemoSection />
      <FeaturesSection />
      <PricingSection />
      <Footer />
      <AnimationStyles />
    </div>
  );
}

export default function LandingPage() {
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    setShowDebug(params.get("debug") === "1");
  }, []);

  return (
    <>
      {isV2 ? <LandingHVAC /> : <LandingPageV1 />}
      {showDebug && (
        <div className="fixed bottom-3 right-3 z-[999] rounded-lg border border-blue-500/30 bg-[#0d121c] px-3 py-2 text-[11px] text-blue-100 shadow-lg">
          <div>uiVersion: {uiVersion ?? "null"}</div>
          <div>isV2: {String(isV2)}</div>
          <div>build: {buildStamp}</div>
        </div>
      )}
    </>
  );
}
