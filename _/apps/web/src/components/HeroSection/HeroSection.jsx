import { Sparkles, Zap, Phone } from "lucide-react";

export function HeroSection() {
  return (
    <section className="pt-20 pb-16 px-6 relative">
      {/* Animated background shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 -left-20 w-72 h-72 bg-[#5A5BFF]/10 dark:bg-[#6366FF]/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute top-40 -right-20 w-96 h-96 bg-[#726BFF]/10 dark:bg-[#8B5CF6]/10 rounded-full blur-3xl animate-float-delayed"></div>
        <div className="absolute bottom-20 left-1/3 w-64 h-64 bg-[#5A5BFF]/5 dark:bg-[#6366FF]/5 rounded-full blur-3xl animate-float-slow"></div>
      </div>

      <div className="max-w-[1240px] mx-auto text-center relative z-10">
        {/* Badge */}
        <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-[#5A5BFF]/10 dark:bg-[#6366FF]/20 border border-[#5A5BFF]/20 dark:border-[#6366FF]/30 mb-8 animate-fade-in">
          <Sparkles size={16} className="text-[#5A5BFF] dark:text-[#6366FF]" />
          <span className="font-inter text-sm font-medium text-[#5A5BFF] dark:text-[#6366FF]">
            AI-powered receptionist pro váš salon
          </span>
        </div>

        <h1 className="font-plus-jakarta-sans font-bold text-4xl md:text-5xl lg:text-6xl text-[#111111] dark:text-white leading-tight mb-6 animate-slide-up">
          Inteligentní Virtuální Asistentka
          <br />
          Pro Váš{" "}
          <span className="text-[#5A5BFF] dark:text-[#6366FF] relative">
            Salon
            <svg
              className="absolute -bottom-2 left-0 w-full"
              height="12"
              viewBox="0 0 200 12"
              fill="none"
            >
              <path
                d="M2 10C60 2 140 2 198 10"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                className="text-[#5A5BFF] dark:text-[#6366FF]"
              />
            </svg>
          </span>
        </h1>
        <p className="font-inter text-lg text-[#6B7280] dark:text-white dark:text-opacity-70 max-w-2xl mx-auto mb-10 animate-slide-up-delayed">
          IVA automaticky přijímá hovory, objednává klienty a spravuje váš
          kalendář 24/7. Nikdy už neztratíte zákazníka.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-slide-up-more-delayed">
          <a
            href="/account/signup"
            className="inline-flex items-center space-x-2 rounded-[20px] bg-[#5A5BFF] dark:bg-[#6366FF] px-8 py-4 font-inter font-semibold text-lg text-white transition-all hover:bg-[#4F4FE6] dark:hover:bg-[#5856FF] active:scale-95 shadow-lg hover:shadow-xl"
          >
            <span>Začít zdarma</span>
            <Zap size={20} />
          </a>
          <a
            href="#features"
            className="inline-flex items-center space-x-2 rounded-[20px] bg-white dark:bg-[#1E1E1E] border-2 border-[#E5E7EB] dark:border-gray-700 px-8 py-4 font-inter font-semibold text-lg text-[#111111] dark:text-white transition-all hover:border-[#5A5BFF] dark:hover:border-[#6366FF] active:scale-95"
          >
            <span>Zjistit více</span>
          </a>
        </div>

        {/* Hero illustration with animated phone mockup */}
        <div className="relative max-w-4xl mx-auto animate-scale-in">
          <div className="relative bg-gradient-to-br from-[#5A5BFF]/5 to-[#726BFF]/5 dark:from-[#6366FF]/10 dark:to-[#8B5CF6]/10 rounded-3xl p-8 md:p-12 border border-[#5A5BFF]/10 dark:border-[#6366FF]/20">
            {/* Decorative elements */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-[#5A5BFF] dark:bg-[#6366FF] rounded-2xl opacity-10 animate-float"></div>
            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-[#726BFF] dark:bg-[#8B5CF6] rounded-2xl opacity-10 animate-float-delayed"></div>

            {/* Phone mockup */}
            <div className="relative mx-auto max-w-sm">
              <div className="bg-white dark:bg-[#1E1E1E] rounded-[2.5rem] shadow-2xl border-8 border-[#111111] dark:border-gray-800 overflow-hidden">
                <div className="bg-[#111111] dark:bg-black h-8 flex items-center justify-center">
                  <div className="w-24 h-4 bg-[#333] dark:bg-[#222] rounded-full"></div>
                </div>
                <div className="p-6 space-y-4">
                  {/* Incoming call UI */}
                  <div className="text-center space-y-3 py-8">
                    <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-[#5A5BFF] to-[#726BFF] dark:from-[#6366FF] dark:to-[#8B5CF6] flex items-center justify-center animate-pulse">
                      <Phone size={32} className="text-white" />
                    </div>
                    <div>
                      <p className="font-inter font-bold text-lg text-[#111111] dark:text-white">
                        Incoming call...
                      </p>
                      <p className="font-inter text-sm text-[#6B7280] dark:text-white dark:text-opacity-70">
                        +420 XXX XXX XXX
                      </p>
                    </div>
                  </div>

                  {/* Call details */}
                  <div className="space-y-2">
                    {[
                      "Dobrý den, volám ohledně rezervace",
                      "IVA: Dobrý den! Ráda vám pomohu...",
                      "Chtěl bych střih na zítřek",
                      "IVA: Mám volno v 10:00 nebo 14:00",
                    ].map((text, i) => (
                      <div
                        key={i}
                        className={`p-3 rounded-xl animate-slide-in-${i}`}
                        style={{
                          backgroundColor:
                            i % 2 === 0
                              ? "rgb(249 250 251)"
                              : "rgb(90 91 255 / 0.1)",
                          animationDelay: `${i * 0.3}s`,
                        }}
                      >
                        <p className="font-inter text-xs text-[#374151] dark:text-white dark:text-opacity-87">
                          {text}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
