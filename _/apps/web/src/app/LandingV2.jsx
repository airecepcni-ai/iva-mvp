"use client";

import {
  HeaderV2,
  HeroSectionV2,
  TrustLogosSection,
  HowItWorksSection,
  TestimonialsSection,
  PricingSectionV2,
  FooterV2,
} from "@/components/LandingV2";

export default function LandingV2() {
  return (
    <div className="min-h-screen bg-white overflow-hidden">
      <HeaderV2 />
      <main>
        <HeroSectionV2 />
        <TrustLogosSection />
        <HowItWorksSection />
        <TestimonialsSection />
        <PricingSectionV2 />
      </main>
      <FooterV2 />
    </div>
  );
}


