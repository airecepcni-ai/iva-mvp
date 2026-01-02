"use client";

// Feature flag to toggle between V1 and V2 landing page
// Set to true to use the new LandingV2 design
const USE_LANDING_V2 = true;

// V1 imports
import { Header } from "@/components/Header/Header";
import { HeroSection } from "@/components/HeroSection/HeroSection";
import { DemoSection } from "@/components/DemoSection/DemoSection";
import { FeaturesSection } from "@/components/FeaturesSection/FeaturesSection";
import { PricingSection } from "@/components/PricingSection/PricingSection";
import { Footer } from "@/components/Footer/Footer";
import { AnimationStyles } from "@/components/AnimationStyles/AnimationStyles";

// V2 imports
import LandingV2 from "./LandingV2";

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
  if (USE_LANDING_V2) {
    return <LandingV2 />;
  }
  return <LandingPageV1 />;
}
