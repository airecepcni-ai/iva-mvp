"use client";

export default function LandingHVAC() {
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
              <a
                className="text-sm font-medium text-slate-600 hover:text-primary dark:text-text-muted dark:hover:text-white transition-colors"
                href="#features"
              >
                Features
              </a>
              <a
                className="text-sm font-medium text-slate-600 hover:text-primary dark:text-text-muted dark:hover:text-white transition-colors"
                href="#how-it-works"
              >
                How it Works
              </a>
              <a
                className="text-sm font-medium text-slate-600 hover:text-primary dark:text-text-muted dark:hover:text-white transition-colors"
                href="#comparison"
              >
                Why IVA?
              </a>
            </nav>
            {/* CTA */}
            <div>
              <button className="bg-primary hover:bg-primary-hover text-white text-sm font-bold px-5 py-2.5 rounded-lg transition-colors shadow-lg shadow-primary/20">
                Join Waitlist
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
                  <span className="text-xs font-semibold text-primary uppercase tracking-wide">Accepting Beta Users</span>
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight tracking-tight text-slate-900 dark:text-white">
                  Never Miss a <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">
                    Service Call
                  </span>{" "}
                  Again
                </h1>
                <p className="text-lg text-slate-600 dark:text-text-muted leading-relaxed">
                  The AI receptionist built specifically for{" "}
                  <span className="text-slate-900 dark:text-white font-bold">
                    Plumbers, HVAC Techs, and Electricians
                  </span>
                  . Answer every call, book jobs directly into your calendar, and route emergencies 24/7.
                </p>
                {/* Email Input Group */}
                <form className="flex flex-col sm:flex-row gap-3 w-full max-w-md mt-2">
                  <div className="relative flex-grow">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                      <span className="material-symbols-outlined">mail</span>
                    </div>
                    <input
                      className="block w-full pl-10 pr-4 py-3 bg-white dark:bg-border-dark border border-gray-200 dark:border-border-dark rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-text-muted focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                      placeholder="Enter your email"
                      required
                      type="email"
                    />
                  </div>
                  <button
                    className="bg-primary hover:bg-primary-hover text-white font-bold py-3 px-6 rounded-lg whitespace-nowrap transition-all shadow-lg shadow-primary/25"
                    type="button"
                  >
                    Join Waitlist
                  </button>
                </form>
                <p className="text-xs text-slate-500 dark:text-text-muted">
                  <span className="material-symbols-outlined text-[14px] align-middle mr-1 text-accent-orange">
                    verified
                  </span>
                  No credit card required. Cancel anytime.
                </p>
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
                  data-alt="Professional electrician working on a panel with focused expression"
                  style={{
                    backgroundImage:
                      "linear-gradient(to bottom, rgba(16, 24, 34, 0.2), rgba(16, 24, 34, 0.8)), url('https://lh3.googleusercontent.com/aida-public/AB6AXuDWQzRBIJWHByfwWjOTt48RVala2Ft9Sc4Y3rjNFVLyyxObieo0wM6S4_WVijlmV04pzaOhURBujnKh_lqnt_QzZVscql6gk2Jx6tenekJgRwU_V_iibiLeLAVB7XBG8aQ5cJQg1K9i1FhDqlTKwhV1snMc4uyOFf84JsG42ShbN1hRV_MD5TTrx-GuNwbzc1vm9nqzt0k9doefOz3Kui6RbQbNwLurySHUO_2jkHrKn8Re6CLNZrZ-Bu19PYbJg2nThgX7oTPFZ2k')",
                  }}
                ></div>
              </div>
            </div>
          </div>
        </section>

        {/* Trust / Partners Section */}
        <section className="border-y border-gray-200 dark:border-border-dark bg-white/50 dark:bg-card-dark/30 py-10">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-sm font-semibold text-slate-500 dark:text-text-muted uppercase tracking-wider mb-6">
              Seamlessly Integrates With
            </p>
            <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-8 opacity-60 dark:opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
              {/* Placeholder Logos using Text for simplicity, imagining real logos */}
              <div className="flex items-center gap-2 text-xl font-bold text-slate-800 dark:text-white">
                <span className="material-symbols-outlined">build</span> ServiceTitan
              </div>
              <div className="flex items-center gap-2 text-xl font-bold text-slate-800 dark:text-white">
                <span className="material-symbols-outlined">home_repair_service</span> Housecall Pro
              </div>
              <div className="flex items-center gap-2 text-xl font-bold text-slate-800 dark:text-white">
                <span className="material-symbols-outlined">calendar_month</span> Google Calendar
              </div>
              <div className="flex items-center gap-2 text-xl font-bold text-slate-800 dark:text-white">
                <span className="material-symbols-outlined">payments</span> QuickBooks
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-background-light dark:bg-background-dark" id="features">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-16">
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-4">
                How IVA Works
              </h2>
              <p className="text-lg text-slate-600 dark:text-text-muted max-w-2xl">
                Designed specifically for the unique workflow of trade professionals. We handle the noise so you can
                handle the tools.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <div className="group p-8 rounded-2xl bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark hover:border-primary/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:hover:shadow-primary/5">
                <div className="size-14 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-3xl">support_agent</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">24/7 Live Call Handling</h3>
                <p className="text-slate-600 dark:text-text-muted leading-relaxed">
                  Answers instantly, day or night. IVA handles inquiries, screens spam, and takes detailed messages so
                  you never miss an opportunity.
                </p>
              </div>
              {/* Feature 2 */}
              <div className="group p-8 rounded-2xl bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark hover:border-primary/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:hover:shadow-primary/5">
                <div className="size-14 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-3xl">calendar_clock</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Smart Appointment Booking</h3>
                <p className="text-slate-600 dark:text-text-muted leading-relaxed">
                  Integrates directly with your existing calendar. IVA checks your availability and books appointments
                  automatically based on your rules.
                </p>
              </div>
              {/* Feature 3 */}
              <div className="group p-8 rounded-2xl bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark hover:border-primary/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:hover:shadow-primary/5">
                <div className="size-14 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-3xl">notification_important</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Urgent Call Routing</h3>
                <p className="text-slate-600 dark:text-text-muted leading-relaxed">
                  Intelligent triaging knows the difference between a leaky faucet and a flooded basement, escalating
                  true emergencies to your cell.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Comparison Table Section */}
        <section className="py-20 bg-white dark:bg-[#0d121c]" id="comparison">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-4">
                Why Choose IVA?
              </h2>
              <p className="text-lg text-slate-600 dark:text-text-muted">Stop losing business to voicemail.</p>
            </div>
            {/* Table Container with scroll on mobile */}
            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-border-dark shadow-2xl dark:shadow-black/20">
              <table className="w-full min-w-[800px] border-collapse bg-white dark:bg-card-dark text-left">
                <thead>
                  <tr className="bg-gray-50 dark:bg-[#111822] border-b border-gray-200 dark:border-border-dark">
                    <th className="p-6 text-sm font-bold text-slate-900 dark:text-white w-1/4 uppercase tracking-wider">
                      Feature
                    </th>
                    <th className="p-6 text-sm font-bold text-primary w-1/4 uppercase tracking-wider bg-blue-50/50 dark:bg-primary/5">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined">smart_toy</span> IVA (AI)
                      </div>
                    </th>
                    <th className="p-6 text-sm font-bold text-slate-500 dark:text-text-muted w-1/4 uppercase tracking-wider">
                      Traditional Call Center
                    </th>
                    <th className="p-6 text-sm font-bold text-slate-500 dark:text-text-muted w-1/4 uppercase tracking-wider">
                      Standard Voicemail
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-border-dark">
                  {/* Row 1 */}
                  <tr className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    <td className="p-6 text-slate-900 dark:text-white font-medium">Response Time</td>
                    <td className="p-6 bg-blue-50/30 dark:bg-primary/5">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400">
                        Instant
                      </span>
                    </td>
                    <td className="p-6 text-slate-600 dark:text-text-muted">2-5 Minutes</td>
                    <td className="p-6 text-slate-600 dark:text-text-muted">Hours/Days</td>
                  </tr>
                  {/* Row 2 */}
                  <tr className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    <td className="p-6 text-slate-900 dark:text-white font-medium">Availability</td>
                    <td className="p-6 bg-blue-50/30 dark:bg-primary/5">
                      <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold">
                        <span className="material-symbols-outlined text-primary text-sm">check_circle</span> 24/7/365
                      </div>
                    </td>
                    <td className="p-6 text-slate-600 dark:text-text-muted">Shift-based</td>
                    <td className="p-6 text-slate-600 dark:text-text-muted">Passive</td>
                  </tr>
                  {/* Row 3 */}
                  <tr className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    <td className="p-6 text-slate-900 dark:text-white font-medium">Cost Efficiency</td>
                    <td className="p-6 bg-blue-50/30 dark:bg-primary/5">
                      <span className="text-slate-900 dark:text-white font-bold">$ Low Flat Rate</span>
                    </td>
                    <td className="p-6 text-slate-600 dark:text-text-muted">$$ High (Per Minute)</td>
                    <td className="p-6 text-slate-600 dark:text-text-muted">Free (But costly in lost jobs)</td>
                  </tr>
                  {/* Row 4 */}
                  <tr className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    <td className="p-6 text-slate-900 dark:text-white font-medium">Direct Booking</td>
                    <td className="p-6 bg-blue-50/30 dark:bg-primary/5">
                      <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold">
                        <span className="material-symbols-outlined text-primary text-sm">check_circle</span> Integrated
                      </div>
                    </td>
                    <td className="p-6 text-slate-600 dark:text-text-muted">Manual / Errors</td>
                    <td className="p-6 text-slate-600 dark:text-text-muted">None</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-primary/10 dark:bg-primary/5"></div>
          {/* Decorative circle */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-accent-orange/10 rounded-full blur-3xl"></div>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-6">
              Ready to modernize your business?
            </h2>
            <p className="text-xl text-slate-600 dark:text-text-muted mb-10 max-w-2xl mx-auto">
              Join hundreds of plumbers and electricians who are booking more jobs while they sleep.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <input
                className="w-full sm:w-80 px-5 py-4 bg-white dark:bg-card-dark border border-gray-300 dark:border-border-dark rounded-xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary shadow-sm"
                placeholder="Enter your work email"
                type="email"
              />
              <button className="w-full sm:w-auto bg-primary hover:bg-primary-hover text-white text-lg font-bold px-8 py-4 rounded-xl shadow-lg shadow-primary/30 transition-all hover:scale-105">
                Get Early Access
              </button>
            </div>
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
                AI-powered reception for the modern trade professional. Built with pride in the USA.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-text-muted">
                <li>
                  <a className="hover:text-primary transition-colors" href="#">
                    Features
                  </a>
                </li>
                <li>
                  <a className="hover:text-primary transition-colors" href="#">
                    Pricing
                  </a>
                </li>
                <li>
                  <a className="hover:text-primary transition-colors" href="#">
                    Integrations
                  </a>
                </li>
                <li>
                  <a className="hover:text-primary transition-colors" href="#">
                    Updates
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-text-muted">
                <li>
                  <a className="hover:text-primary transition-colors" href="#">
                    Help Center
                  </a>
                </li>
                <li>
                  <a className="hover:text-primary transition-colors" href="#">
                    Case Studies
                  </a>
                </li>
                <li>
                  <a className="hover:text-primary transition-colors" href="#">
                    Blog
                  </a>
                </li>
                <li>
                  <a className="hover:text-primary transition-colors" href="#">
                    Community
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
                <li>
                  <a className="hover:text-primary transition-colors" href="#">
                    Security
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-100 dark:border-border-dark pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-slate-500 dark:text-text-muted">© 2024 IVA AI Inc. All rights reserved.</p>
            <div className="flex gap-4">
              <a className="text-slate-400 hover:text-primary transition-colors" href="#">
                <span className="sr-only">Twitter</span>
                <svg aria-hidden="true" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path>
                </svg>
              </a>
              <a className="text-slate-400 hover:text-primary transition-colors" href="#">
                <span className="sr-only">LinkedIn</span>
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
    </div>
  );
}
