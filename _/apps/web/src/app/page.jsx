"use client";

// Feature flag to toggle between V1 and V2 landing page.
const uiVersion = import.meta.env.NEXT_PUBLIC_UI_VERSION ?? import.meta.env.VITE_UI_VERSION;
const isV2 = uiVersion === "v2";

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
  return isV2 ? <LandingHVAC /> : <LandingPageV1 />;
}
