import { Settings, Mic, Mail, CalendarCheck } from "lucide-react";

const steps = [
  {
    icon: Settings,
    title: "1. Nastavíte si dostupnost",
    description:
      "Jednoduše propojíte svůj kalendář a nastavíte pracovní dobu.",
  },
  {
    icon: Mic,
    title: "2. IVA komunikuje s klienty",
    description: "Automaticky přijímá hovory a zprávy v češtině 24/7.",
  },
  {
    icon: Mail,
    title: "3. Automatické potvrzení",
    description: "Klienti obdrží potvrzení a připomínky automaticky.",
  },
  {
    icon: CalendarCheck,
    title: "4. Získáte nové rezervace",
    description: "Rezervace se automaticky zapíší do vašeho kalendáře.",
  },
];

export function HowItWorksSection() {
  return (
    <section id="jak-to-funguje" className="py-20 lg:py-28 bg-white">
      <div className="container mx-auto px-6 max-w-7xl">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900">
            Jak to funguje
          </h2>
        </div>

        {/* Feature Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <article
                key={index}
                className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col items-center text-center group"
              >
                <div className="w-16 h-16 mb-6 rounded-2xl bg-purple-50 text-[#7B42BC] flex items-center justify-center group-hover:scale-110 group-hover:bg-[#7B42BC] group-hover:text-white transition-all duration-300">
                  <Icon size={28} strokeWidth={1.5} />
                </div>
                <h3 className="font-bold text-lg text-gray-900 mb-3">
                  {step.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {step.description}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

