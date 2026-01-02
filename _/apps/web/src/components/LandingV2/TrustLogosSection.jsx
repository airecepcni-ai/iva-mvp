export function TrustLogosSection() {
  return (
    <section className="bg-white py-10 border-b border-gray-100" aria-label="Typy salonů">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <h3 className="text-gray-600 font-semibold text-base whitespace-nowrap">
            Pro všechny typy salonů
          </h3>

          {/* Logos Grid */}
          <div className="flex flex-wrap justify-center md:justify-end items-center gap-8 md:gap-14 opacity-50 grayscale hover:grayscale-0 hover:opacity-70 transition-all duration-500" aria-hidden="true">
            <span className="text-xl font-bold font-serif tracking-widest text-gray-500">
              SALON
            </span>
            <span className="text-xl font-bold tracking-tight text-gray-500">
              STUDIO
            </span>
            <span className="text-xl font-medium font-serif italic text-gray-500">
              Beauty
            </span>
            <span className="text-xl font-bold font-mono text-gray-500">
              STYLE
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

