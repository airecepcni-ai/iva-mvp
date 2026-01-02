"use client";

import { Clock, Calendar, Phone } from "lucide-react";

export function HeroSectionV2() {
  return (
    <section className="relative pt-28 pb-20 lg:pt-36 lg:pb-28 overflow-hidden">
      {/* Background gradient - soft pink/lavender/blue */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(110deg, #fff0f6 0%, #f3e7ff 40%, #eef5ff 100%)",
        }}
      />

      {/* Decorative blurs */}
      <div className="absolute top-0 right-0 -mr-10 -mt-10 w-72 h-72 bg-purple-200/40 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-10 -mb-10 w-64 h-64 bg-blue-200/40 rounded-full blur-3xl" />

      <div className="container mx-auto px-6 max-w-7xl relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left Column: Content */}
          <div className="space-y-8 max-w-xl">
            {/* Headlines */}
            <div className="space-y-5">
              <h1 className="text-4xl lg:text-5xl xl:text-6xl font-extrabold text-gray-900 leading-[1.1]">
                AI recepční pro váš salon{" "}
                <span className="text-[#7B42BC]">v češtině</span>
              </h1>
              <p className="text-lg lg:text-xl text-gray-600 leading-relaxed">
                IVA automaticky přijímá hovory, vyřizuje rezervace a spravuje
                váš kalendář 24/7.
              </p>
            </div>

            {/* Feature List with Icons */}
            <ul className="space-y-4 text-gray-700">
              <li className="flex items-center gap-3">
                <span className="w-10 h-10 flex items-center justify-center rounded-lg bg-purple-100 text-[#7B42BC]">
                  <Clock size={20} />
                </span>
                <span className="font-medium">Rezervace 24/7</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="w-10 h-10 flex items-center justify-center rounded-lg bg-purple-100 text-[#7B42BC]">
                  <Calendar size={20} />
                </span>
                <span className="font-medium">Napojení na Google Kalendář</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="w-10 h-10 flex items-center justify-center rounded-lg bg-purple-100 text-[#7B42BC]">
                  <Phone size={20} />
                </span>
                <span className="font-medium">Bez zmeškaných hovorů</span>
              </li>
            </ul>

            {/* CTA Buttons & Trust Text */}
            <div className="space-y-5 pt-2">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <a
                  href="/account/signin"
                  className="inline-flex items-center justify-center px-8 py-4 bg-[#7B42BC] text-white font-semibold rounded-xl hover:bg-[#6a39a3] transition-all shadow-xl shadow-purple-500/30 hover:shadow-purple-500/40 hover:-translate-y-0.5 w-full sm:w-auto text-center"
                >
                  Vyzkoušet zdarma
                </a>
                <a
                  href="#cena"
                  className="inline-flex items-center justify-center px-6 py-4 text-gray-700 font-semibold hover:text-[#7B42BC] transition-colors w-full sm:w-auto text-center"
                >
                  Zobrazit cenu
                </a>
              </div>
              <p className="text-sm text-gray-500 font-medium">
                Bez karty • Zrušení kdykoli • Nastavení za 10 minut
              </p>
            </div>
          </div>

          {/* Right Column: Chat UI Visual */}
          <div className="relative w-full flex justify-center lg:justify-end">
            {/* Chat Card Container */}
            <div className="relative bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md border border-gray-100 animate-float">
              {/* Incoming Call Notification Header */}
              <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-100">
                <div className="w-12 h-12 rounded-full bg-[#7B42BC] flex items-center justify-center text-white shadow-lg shadow-purple-500/30 flex-shrink-0">
                  <Phone size={24} />
                </div>
                <div>
                  <div className="text-xs text-gray-400 uppercase tracking-wide font-bold">
                    Příchozí hovor...
                  </div>
                  <div className="text-gray-900 font-bold text-lg">
                    +420 XXX XXX XXX
                  </div>
                </div>
              </div>

              {/* Chat Messages Area */}
              <div className="space-y-4">
                {/* Message 1: User */}
                <div className="flex justify-end">
                  <div className="bg-[#6d76ce] text-white px-5 py-3 rounded-2xl rounded-tr-none text-sm max-w-[85%] shadow-sm leading-relaxed">
                    Dobrý den, chtěl bych se objednat na stříhání.
                  </div>
                </div>

                {/* Message 2: IVA */}
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-800 px-5 py-3 rounded-2xl rounded-tl-none text-sm max-w-[85%] leading-relaxed">
                    <span className="font-bold text-gray-900 block mb-1">
                      IVA:
                    </span>
                    Dobrý den! Ráda vás objednám. Kdy se vám to hodí?
                  </div>
                </div>

                {/* Message 3: User */}
                <div className="flex justify-end">
                  <div className="bg-[#6d76ce] text-white px-5 py-3 rounded-2xl rounded-tr-none text-sm max-w-[85%] shadow-sm leading-relaxed">
                    Ideálně zítra odpoledne po 16. hodině.
                  </div>
                </div>

                {/* Message 4: IVA */}
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-800 px-5 py-3 rounded-2xl rounded-tl-none text-sm max-w-[85%] leading-relaxed">
                    <span className="font-bold text-gray-900 block mb-1">
                      IVA:
                    </span>
                    Mám volno v 16:30 nebo 17:15. Co vám lépe vyhovuje?
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Animation keyframes */}
      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
}

