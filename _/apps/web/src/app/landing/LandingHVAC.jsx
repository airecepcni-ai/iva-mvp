"use client";

import { useState } from "react";

// Meta export for React Router SEO
export const meta = () => [
  { title: "IVA - AI Receptionist for HVAC, Plumbers & Electricians | Never Miss a Service Call" },
  { name: "description", content: "IVA answers calls 24/7, captures job details, books appointments, and routes emergencies for trade professionals. Stop losing jobs while you're on-site." },
  { name: "keywords", content: "AI receptionist, HVAC answering service, plumber phone service, electrician call answering, 24/7 phone answering, trade business phone" },
];

export default function LandingHVAC() {
  const [email, setEmail] = useState("");
  const [bottomEmail, setBottomEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // 'success' | 'error' | null
  const [errorMessage, setErrorMessage] = useState("");

  const handleWaitlistSubmit = async (e, emailValue) => {
    e.preventDefault();
    if (!emailValue || isSubmitting) return;

    setIsSubmitting(true);
    setSubmitStatus(null);
    setErrorMessage("");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailValue }),
      });

      if (res.ok) {
        setSubmitStatus("success");
        setEmail("");
        setBottomEmail("");
      } else {
        const data = await res.json();
        setSubmitStatus("error");
        setErrorMessage(data.error || "Something went wrong. Please try again.");
      }
    } catch (err) {
      setSubmitStatus("error");
      setErrorMessage("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-white font-display antialiased overflow-x-hidden flex flex-col min-h-screen">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-border-dark bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="size-8 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl">smart_toy</span>
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">IVA</span>
            </div>
            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-8">
              <button
                onClick={() => scrollToSection("how-it-works")}
                className="text-sm font-medium text-slate-600 hover:text-primary dark:text-text-muted dark:hover:text-white transition-colors cursor-pointer"
              >
                How it Works
              </button>
              <button
                onClick={() => scrollToSection("comparison")}
                className="text-sm font-medium text-slate-600 hover:text-primary dark:text-text-muted dark:hover:text-white transition-colors cursor-pointer"
              >
                Why IVA?
              </button>
              <button
                onClick={() => scrollToSection("faq")}
                className="text-sm font-medium text-slate-600 hover:text-primary dark:text-text-muted dark:hover:text-white transition-colors cursor-pointer"
              >
                FAQ
              </button>
            </nav>
            {/* CTA */}
            <div>
              <button
                onClick={() => scrollToSection("final-cta")}
                className="bg-primary hover:bg-primary-hover text-white text-sm font-bold px-5 py-2.5 rounded-lg transition-colors shadow-lg shadow-primary/20"
              >
                Get Early Access
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-12 pb-16 lg:pt-24 lg:pb-32">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Content */}
              <div className="flex flex-col gap-6 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 w-fit">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </span>
                  <span className="text-xs font-semibold text-primary uppercase tracking-wide">Limited Early Access</span>
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight tracking-tight text-slate-900 dark:text-white">
                  Never Miss a{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">
                    Service Call
                  </span>{" "}
                  Again
                </h1>
                <p className="text-lg text-slate-600 dark:text-text-muted leading-relaxed">
                  IVA answers calls instantly, captures job details, books appointments, and routes emergencies — so you stop losing jobs while you're on-site.
                  <span className="block mt-2 text-slate-900 dark:text-white font-semibold">
                    Built for HVAC, Plumbers & Electricians.
                  </span>
                </p>
                
                {/* Key Benefits */}
                <ul className="flex flex-col gap-2 text-slate-700 dark:text-slate-300">
                  <li className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-lg">check_circle</span>
                    <span>Capture after-hours emergencies</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-lg">check_circle</span>
                    <span>Book jobs automatically</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-lg">check_circle</span>
                    <span>Turn missed calls into scheduled work</span>
                  </li>
                </ul>

                {/* Email Input Group */}
                <form
                  id="hero-form"
                  className="flex flex-col sm:flex-row gap-3 w-full max-w-md mt-2"
                  onSubmit={(e) => handleWaitlistSubmit(e, email)}
                >
                  <div className="relative flex-grow">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                      <span className="material-symbols-outlined">mail</span>
                    </div>
                    <input
                      className="block w-full pl-10 pr-4 py-3 bg-white dark:bg-border-dark border border-gray-200 dark:border-border-dark rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-text-muted focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                      placeholder="Enter your email"
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                  <button
                    className="bg-primary hover:bg-primary-hover text-white font-bold py-3 px-6 rounded-lg whitespace-nowrap transition-all shadow-lg shadow-primary/25 disabled:opacity-50"
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Submitting..." : "Get Early Access"}
                  </button>
                </form>
                
                {/* Submit Status */}
                {submitStatus === "success" && (
                  <p className="text-sm text-green-500 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    You're on the list! We'll be in touch soon.
                  </p>
                )}
                {submitStatus === "error" && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">error</span>
                    {errorMessage}
                  </p>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs text-slate-500 dark:text-text-muted">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] text-accent-orange">verified</span>
                    No credit card required
                  </span>
                  <span className="hidden sm:inline">•</span>
                  <button
                    type="button"
                    onClick={() => scrollToSection("how-it-works")}
                    className="text-primary hover:underline cursor-pointer text-left"
                  >
                    See How It Works →
                  </button>
                </div>
              </div>
              {/* Hero Image */}
              <div className="relative lg:h-full min-h-[400px] w-full rounded-2xl overflow-hidden group shadow-2xl shadow-black/50 border border-gray-200 dark:border-border-dark">
                {/* Abstract UI Overlay */}
                <div className="absolute top-6 left-6 right-6 z-10 flex flex-col gap-3">
                  <div className="self-end bg-white/10 backdrop-blur-md border border-white/20 p-3 rounded-lg rounded-tr-none text-white text-sm max-w-[240px] shadow-lg animate-[fadeIn_0.5s_ease-out]">
                    <p>Can you come fix a leak today?</p>
                  </div>
                  <div className="self-start bg-primary/90 backdrop-blur-md text-white p-3 rounded-lg rounded-tl-none text-sm max-w-[280px] shadow-lg flex gap-2 items-start animate-[fadeIn_0.5s_ease-out_0.5s_both]">
                    <span className="material-symbols-outlined text-base mt-0.5">smart_toy</span>
                    <div>
                      <p className="font-bold text-xs mb-1 opacity-80">IVA Assistant</p>
                      <p>I can help with that. Are you experiencing an active leak right now?</p>
                    </div>
                  </div>
                </div>
                <div
                  className="w-full h-full bg-cover bg-center min-h-[400px] lg:min-h-[500px]"
                  role="img"
                  aria-label="AI receptionist handling service calls for HVAC and plumbing businesses"
                  style={{
                    backgroundImage:
                      "linear-gradient(to bottom, rgba(16, 24, 34, 0.2), rgba(16, 24, 34, 0.8)), url('https://lh3.googleusercontent.com/aida-public/AB6AXuDWQzRBIJWHByfwWjOTt48RVala2Ft9Sc4Y3rjNFVLyyxObieo0wM6S4_WVijlmV04pzaOhURBujnKh_lqnt_QzZVscql6gk2Jx6tenekJgRwU_V_iibiLeLAVB7XBG8aQ5cJQg1K9i1FhDqlTKwhV1snMc4uyOFf84JsG42ShbN1hRV_MD5TTrx-GuNwbzc1vm9nqzt0k9doefOz3Kui6RbQbNwLurySHUO_2jkHrKn8Re6CLNZrZ-Bu19PYbJg2nThgX7oTPFZ2k')",
                  }}
                ></div>
              </div>
            </div>
          </div>
        </section>

        {/* Trust Strip */}
        <section className="border-y border-gray-200 dark:border-border-dark bg-white/50 dark:bg-card-dark/30 py-8">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div className="flex flex-col items-center gap-2">
                <span className="material-symbols-outlined text-primary text-2xl">person_check</span>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Human handoff when needed</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <span className="material-symbols-outlined text-primary text-2xl">tune</span>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">You control business rules</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <span className="material-symbols-outlined text-primary text-2xl">calendar_month</span>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Works with your calendar</span>
              </div>
            </div>
          </div>
        </section>

        {/* How IVA Works Section */}
        <section className="py-20 bg-background-light dark:bg-background-dark" id="how-it-works">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-16 text-center">
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-4">
                How IVA Works
              </h2>
              <p className="text-lg text-slate-600 dark:text-text-muted max-w-2xl mx-auto">
                Three simple steps from missed call to booked job.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <div className="relative group p-8 rounded-2xl bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark hover:border-primary/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:hover:shadow-primary/5">
                <div className="absolute -top-4 left-8 bg-primary text-white text-sm font-bold px-3 py-1 rounded-full">
                  Step 1
                </div>
                <div className="size-14 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-3xl">support_agent</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Answer & Qualify</h3>
                <p className="text-slate-600 dark:text-text-muted leading-relaxed">
                  IVA answers instantly and collects the essentials: name, phone, address, issue description, and urgency level.
                </p>
              </div>
              {/* Step 2 */}
              <div className="relative group p-8 rounded-2xl bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark hover:border-primary/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:hover:shadow-primary/5">
                <div className="absolute -top-4 left-8 bg-primary text-white text-sm font-bold px-3 py-1 rounded-full">
                  Step 2
                </div>
                <div className="size-14 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-3xl">calendar_clock</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Book or Capture Lead</h3>
                <p className="text-slate-600 dark:text-text-muted leading-relaxed">
                  Based on your rules, IVA books directly into your calendar or captures the lead for callback.
                </p>
              </div>
              {/* Step 3 */}
              <div className="relative group p-8 rounded-2xl bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark hover:border-primary/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:hover:shadow-primary/5">
                <div className="absolute -top-4 left-8 bg-primary text-white text-sm font-bold px-3 py-1 rounded-full">
                  Step 3
                </div>
                <div className="size-14 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-3xl">notifications_active</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Notify & Track</h3>
                <p className="text-slate-600 dark:text-text-muted leading-relaxed">
                  Get instant alerts for emergencies. Track every call, lead, and booking in your dashboard.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Dashboard Preview Section */}
        <section className="py-20 bg-white dark:bg-[#0d121c]" id="dashboard-preview">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-4">
                Track ROI in Your Dashboard
              </h2>
              <p className="text-lg text-slate-600 dark:text-text-muted max-w-2xl mx-auto">
                See exactly how many jobs IVA captures. No guessing.
              </p>
            </div>
            
            {/* Dashboard Preview Label */}
            <div className="text-center mb-6">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-400">
                <span className="material-symbols-outlined text-sm">visibility</span>
                Dashboard Preview — Example Metrics
              </span>
            </div>

            {/* Metrics Cards */}
            <div className="grid md:grid-cols-3 gap-6 mb-10">
              <div className="p-6 rounded-xl bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/20 dark:to-card-dark border border-blue-100 dark:border-blue-900/30">
                <div className="flex items-center justify-between mb-4">
                  <span className="material-symbols-outlined text-primary text-3xl">phone_callback</span>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-2 py-1 rounded">This Week</span>
                </div>
                <p className="text-3xl font-black text-slate-900 dark:text-white mb-1">—</p>
                <p className="text-sm text-slate-600 dark:text-text-muted">Missed calls captured</p>
              </div>
              <div className="p-6 rounded-xl bg-gradient-to-br from-green-50 to-white dark:from-green-900/20 dark:to-card-dark border border-green-100 dark:border-green-900/30">
                <div className="flex items-center justify-between mb-4">
                  <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-3xl">event_available</span>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-2 py-1 rounded">This Week</span>
                </div>
                <p className="text-3xl font-black text-slate-900 dark:text-white mb-1">—</p>
                <p className="text-sm text-slate-600 dark:text-text-muted">Jobs booked</p>
              </div>
              <div className="p-6 rounded-xl bg-gradient-to-br from-orange-50 to-white dark:from-orange-900/20 dark:to-card-dark border border-orange-100 dark:border-orange-900/30">
                <div className="flex items-center justify-between mb-4">
                  <span className="material-symbols-outlined text-orange-600 dark:text-orange-400 text-3xl">nightlight</span>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-2 py-1 rounded">This Week</span>
                </div>
                <p className="text-3xl font-black text-slate-900 dark:text-white mb-1">—</p>
                <p className="text-sm text-slate-600 dark:text-text-muted">After-hours calls handled</p>
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={() => scrollToSection("hero-form")}
                className="bg-primary hover:bg-primary-hover text-white font-bold py-3 px-8 rounded-lg transition-all shadow-lg shadow-primary/25"
              >
                Join the Beta to See Your Numbers
              </button>
            </div>
          </div>
        </section>

        {/* Comparison Section */}
        <section className="py-20 bg-background-light dark:bg-background-dark" id="comparison">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-4">
                Why Choose IVA?
              </h2>
              <p className="text-lg text-slate-600 dark:text-text-muted">Compare your options.</p>
            </div>
            
            {/* Comparison Cards */}
            <div className="grid md:grid-cols-4 gap-4">
              {/* Voicemail */}
              <div className="p-6 rounded-xl bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark">
                <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-slate-400">voicemail</span>
                  Voicemail
                </h3>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center gap-2 text-slate-500">
                    <span className="material-symbols-outlined text-red-400 text-base">close</span>
                    Answers 24/7
                  </li>
                  <li className="flex items-center gap-2 text-slate-500">
                    <span className="material-symbols-outlined text-red-400 text-base">close</span>
                    Books appointments
                  </li>
                  <li className="flex items-center gap-2 text-slate-500">
                    <span className="material-symbols-outlined text-red-400 text-base">close</span>
                    Handles emergencies
                  </li>
                  <li className="flex items-center gap-2 text-slate-500">
                    <span className="material-symbols-outlined text-green-500 text-base">check</span>
                    Low cost
                  </li>
                </ul>
              </div>
              
              {/* Call Center */}
              <div className="p-6 rounded-xl bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark">
                <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-slate-400">headset_mic</span>
                  Call Center
                </h3>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <span className="material-symbols-outlined text-yellow-500 text-base">remove</span>
                    Shift-based coverage
                  </li>
                  <li className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <span className="material-symbols-outlined text-yellow-500 text-base">remove</span>
                    Manual booking
                  </li>
                  <li className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <span className="material-symbols-outlined text-green-500 text-base">check</span>
                    Can escalate
                  </li>
                  <li className="flex items-center gap-2 text-slate-500">
                    <span className="material-symbols-outlined text-red-400 text-base">close</span>
                    Expensive per-minute
                  </li>
                </ul>
              </div>
              
              {/* Receptionist */}
              <div className="p-6 rounded-xl bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark">
                <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-slate-400">person</span>
                  Receptionist
                </h3>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center gap-2 text-slate-500">
                    <span className="material-symbols-outlined text-red-400 text-base">close</span>
                    24/7 availability
                  </li>
                  <li className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <span className="material-symbols-outlined text-green-500 text-base">check</span>
                    Books appointments
                  </li>
                  <li className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <span className="material-symbols-outlined text-green-500 text-base">check</span>
                    Handles emergencies
                  </li>
                  <li className="flex items-center gap-2 text-slate-500">
                    <span className="material-symbols-outlined text-red-400 text-base">close</span>
                    High salary + benefits
                  </li>
                </ul>
              </div>
              
              {/* IVA - Highlighted */}
              <div className="p-6 rounded-xl bg-gradient-to-br from-primary/10 to-blue-500/5 border-2 border-primary relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full">
                  Best Value
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">smart_toy</span>
                  IVA
                </h3>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center gap-2 text-slate-900 dark:text-white font-medium">
                    <span className="material-symbols-outlined text-green-500 text-base">check</span>
                    Answers 24/7/365
                  </li>
                  <li className="flex items-center gap-2 text-slate-900 dark:text-white font-medium">
                    <span className="material-symbols-outlined text-green-500 text-base">check</span>
                    Auto-books jobs
                  </li>
                  <li className="flex items-center gap-2 text-slate-900 dark:text-white font-medium">
                    <span className="material-symbols-outlined text-green-500 text-base">check</span>
                    Routes emergencies
                  </li>
                  <li className="flex items-center gap-2 text-slate-900 dark:text-white font-medium">
                    <span className="material-symbols-outlined text-green-500 text-base">check</span>
                    Flat predictable rate
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 bg-white dark:bg-[#0d121c]" id="faq">
          <div className="max-w-[800px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-lg text-slate-600 dark:text-text-muted">
                Get answers to common questions about IVA.
              </p>
            </div>
            
            <div className="space-y-4">
              <FAQItem
                question="Will it sound like a robot?"
                answer="IVA uses advanced voice AI that sounds natural and conversational. Callers typically can't tell they're talking to an AI. You can customize the voice and tone to match your business personality."
              />
              <FAQItem
                question="What if IVA can't answer a question?"
                answer="IVA is trained to recognize when it's outside its scope. It will collect the caller's info and flag the call for you to follow up personally. You can also set up instant alerts for specific situations."
              />
              <FAQItem
                question="Can IVA handle emergencies (burst pipe, no heat)?"
                answer="Yes. IVA is trained to identify true emergencies and can immediately alert you via text/call. You define what counts as an emergency and how you want to be notified."
              />
              <FAQItem
                question="Does it book into Google Calendar?"
                answer="Yes, IVA integrates with Google Calendar to check your availability and book appointments directly. It respects your existing schedule and buffer times."
              />
              <FAQItem
                question="How fast can I set it up?"
                answer="Most users are up and running within a day. We help you configure your business rules, connect your calendar, and test calls before going live."
              />
              <FAQItem
                question="Can I review calls and leads?"
                answer="Every call is logged in your dashboard with transcripts, recordings, and captured lead info. You can see exactly what was said and what action was taken."
              />
              <FAQItem
                question="What happens if I need to change my availability?"
                answer="Just update your calendar. IVA reads your availability in real-time, so changes take effect immediately without any manual updates."
              />
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section id="final-cta" className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-primary/10 dark:bg-primary/5"></div>
          {/* Decorative circle */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-accent-orange/10 rounded-full blur-3xl"></div>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-6">
              Ready to Stop Losing Calls?
            </h2>
            <p className="text-xl text-slate-600 dark:text-text-muted mb-4 max-w-2xl mx-auto">
              Join tradespeople who are capturing more jobs — even while they're on-site.
            </p>
            
            {/* Beta Urgency Note */}
            <p className="text-sm text-primary font-medium mb-8">
              Limited early access spots — get setup help as a founding customer.
            </p>

            <form
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
              onSubmit={(e) => handleWaitlistSubmit(e, bottomEmail)}
            >
              <input
                className="w-full sm:w-80 px-5 py-4 bg-white dark:bg-card-dark border border-gray-300 dark:border-border-dark rounded-xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary shadow-sm"
                placeholder="Enter your work email"
                type="email"
                required
                value={bottomEmail}
                onChange={(e) => setBottomEmail(e.target.value)}
                disabled={isSubmitting}
              />
              <button
                type="submit"
                className="w-full sm:w-auto bg-primary hover:bg-primary-hover text-white text-lg font-bold px-8 py-4 rounded-xl shadow-lg shadow-primary/30 transition-all hover:scale-105 disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Get Early Access"}
              </button>
            </form>

            {/* Submit Status for bottom form */}
            {submitStatus === "success" && (
              <p className="mt-4 text-sm text-green-500 flex items-center justify-center gap-1">
                <span className="material-symbols-outlined text-sm">check_circle</span>
                You're on the list! We'll be in touch soon.
              </p>
            )}
            {submitStatus === "error" && (
              <p className="mt-4 text-sm text-red-500 flex items-center justify-center gap-1">
                <span className="material-symbols-outlined text-sm">error</span>
                {errorMessage}
              </p>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-background-dark border-t border-gray-200 dark:border-border-dark pt-16 pb-8">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-primary text-2xl">smart_toy</span>
                <span className="text-xl font-bold text-slate-900 dark:text-white">IVA</span>
              </div>
              <p className="text-sm text-slate-500 dark:text-text-muted mb-4">
                AI-powered reception for trade professionals. Never miss another service call.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-text-muted">
                <li>
                  <button onClick={() => scrollToSection("how-it-works")} className="hover:text-primary transition-colors cursor-pointer">
                    How it Works
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection("comparison")} className="hover:text-primary transition-colors cursor-pointer">
                    Pricing
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection("dashboard-preview")} className="hover:text-primary transition-colors cursor-pointer">
                    Dashboard
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-text-muted">
                <li>
                  <button onClick={() => scrollToSection("faq")} className="hover:text-primary transition-colors cursor-pointer">
                    FAQ
                  </button>
                </li>
                <li>
                  <a className="hover:text-primary transition-colors" href="mailto:support@iva.ai">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-text-muted">
                <li>
                  <a className="hover:text-primary transition-colors" href="#">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a className="hover:text-primary transition-colors" href="#">
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-100 dark:border-border-dark pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-slate-500 dark:text-text-muted">© 2026 IVA AI Inc. All rights reserved.</p>
            <div className="flex gap-4">
              <a className="text-slate-400 hover:text-primary transition-colors" href="#" aria-label="Twitter">
                <svg aria-hidden="true" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path>
                </svg>
              </a>
              <a className="text-slate-400 hover:text-primary transition-colors" href="#" aria-label="LinkedIn">
                <svg aria-hidden="true" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path
                    clipRule="evenodd"
                    d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"
                    fillRule="evenodd"
                  ></path>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* TODO: Add JSON-LD SoftwareApplication schema when safe injection pattern is established */}
    </div>
  );
}

// FAQ Item Component
function FAQItem({ question, answer }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-gray-200 dark:border-border-dark rounded-xl overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 text-left flex items-center justify-between bg-white dark:bg-card-dark hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
      >
        <span className="font-semibold text-slate-900 dark:text-white">{question}</span>
        <span className={`material-symbols-outlined text-primary transition-transform ${isOpen ? "rotate-180" : ""}`}>
          expand_more
        </span>
      </button>
      {isOpen && (
        <div className="px-6 py-4 bg-gray-50 dark:bg-slate-800/30 border-t border-gray-200 dark:border-border-dark">
          <p className="text-slate-600 dark:text-text-muted leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
}
