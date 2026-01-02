import { Phone, Sparkles, Clock } from "lucide-react";

const features = [
  {
    icon: Phone,
    title: "Automatické rezervace",
    desc: "IVA přijímá hovory a vytváří rezervace automaticky podle vašich časů",
    color: "from-blue-500 to-blue-600",
  },
  {
    icon: Sparkles,
    title: "Česká AI asistentka",
    desc: "Přirozená konverzace v češtině, klienti ani nepoznají rozdíl",
    color: "from-purple-500 to-purple-600",
  },
  {
    icon: Clock,
    title: "Dostupná 24/7",
    desc: "Synchronizace s vaším kalendářem v reálném čase, nikdy nespí",
    color: "from-orange-500 to-orange-600",
  },
];

export function FeaturesSection() {
  return (
    <section
      id="features"
      className="py-20 px-6 bg-[#F9FAFB] dark:bg-[#0A0A0A] relative"
    >
      <div className="max-w-[1240px] mx-auto">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="font-inter font-bold text-3xl md:text-4xl text-[#111111] dark:text-white mb-4">
            Proč IVA?
          </h2>
          <p className="font-inter text-base text-[#6B7280] dark:text-white dark:text-opacity-70 max-w-2xl mx-auto">
            Automatizujte své rezervace a ušetřete čas s naší AI asistentkou
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <div
                key={i}
                className="group bg-white dark:bg-[#1E1E1E] border border-[#E5E7EB] dark:border-gray-700 rounded-2xl p-8 transition-all hover:shadow-2xl hover:scale-105 hover:border-[#5A5BFF] dark:hover:border-[#6366FF] animate-slide-up"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div
                  className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}
                >
                  <Icon size={28} className="text-white" />
                </div>
                <h3 className="font-inter font-semibold text-xl text-[#111111] dark:text-white mb-3">
                  {feature.title}
                </h3>
                <p className="font-inter text-sm text-[#6B7280] dark:text-white dark:text-opacity-70 leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
