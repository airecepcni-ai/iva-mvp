"use client";

// HVAC Landing Page - always render the new dark blue UI
import LandingHVAC, { meta as landingMeta } from "./landing/LandingHVAC";

// Re-export meta for React Router SEO
export const meta = landingMeta;

export default function LandingPage() {
  return <LandingHVAC />;
}
