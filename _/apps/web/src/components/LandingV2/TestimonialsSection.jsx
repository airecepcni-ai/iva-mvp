"use client";

import { Star, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

const testimonials = [
  {
    name: "Jana Nováková",
    salon: "Salon Krása",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDeFKeSkYu9L6kyoUt2_eYdHleOCRHumrfs1NUeiqn9cF4de69n5ExzhkM-CsREOo1ioPKJuYvPIsHqBb7ivuiJOVb5mpOJsRhuTOvqWw4z26BYW1NTQHVJaohBfscf4cRHB1uEt8mW4qpv9isWe1-mh3fvfYpaE6zx4Gf6P5C_ihCZV4gubH6GUcm9PCeTYCJQXro9N0aJZOF6z5VJC21SXFTsEfI4C5rOWkgTTJcJNX0HHDLPD6vIZXGzTDi9YmSmlpLHkMtPh-4",
    text: "IVA nám ušetřila hodiny času. Klienti si pochvalují rychlé rezervace. Skvělé!",
    rating: 5,
  },
  {
    name: "Petra Svobodová",
    salon: "Studio Vital",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCACNUMPzKQLbATEZvaQeH1CelBsxGRtXhX1p_0wPda9hlIYsqKZU2Vqujlvyj62zcB7xFGDMSxt6nmltmhHk7hIQnDSI69frB97tBl4ZEXzRCFPgjTyZ94PmJPSDl_o4urgR_W61JnEy9GNv3WaPbcHGn8TBTlL_QAAyhYqu1Y7QYDQbl-GfaeEPv7UDuV-JwhDhQAC9nBjMARuEayoZ54VvAdrF165VxzYj4cADPf6ThA7kzWIh3LQfP9M4u2z3-4yXiFTL3PaT0",
    text: "Perfektní řešení pro malé salony. Už žádné zmeškané hovory. Doporučuji!",
    rating: 5,
  },
  {
    name: "Eva Malá",
    salon: "Kadeřnictví Eva",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCvpLnKs_vbGN0tq2PQTx0sUAYnJNSODyZvumeMNZe2CBVkevU2evVEvUq748VBdytFMqrHsDeXb33tTghX-yV3VLA2WYOuGorPkyNfeHiuyNnRde0o6QLM7yEnixyAO23L3NknvNEQQLGfzNJ7MjKW0McwKPfQRfyieAu-R-ckusp6kLRgOYcC583o9EfOtlJHn4fKkX27kokyMsrjQmtUKTsbX0SPkyBoRCz4QKWG5MMPNEzNR4oCHeuxgaurE7x3jmUypyoatC4",
    text: "Velmi jednoduché na nastavení. Zvýšil se nám počet rezervací.",
    rating: 5,
  },
];

export function TestimonialsSection() {
  const [activeIndex, setActiveIndex] = useState(1);

  const handlePrev = () => {
    setActiveIndex((prev) =>
      prev === 0 ? testimonials.length - 1 : prev - 1
    );
  };

  const handleNext = () => {
    setActiveIndex((prev) =>
      prev === testimonials.length - 1 ? 0 : prev + 1
    );
  };

  return (
    <section
      className="relative py-16 md:py-24 overflow-hidden"
      style={{
        background: "linear-gradient(90deg, #F8EEFF 0%, #E6F4FF 100%)",
      }}
    >
      <div className="container mx-auto px-4 relative z-10">
        {/* Heading */}
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900">
          Co říkají salony
        </h2>

        {/* Carousel Wrapper */}
        <div className="relative max-w-6xl mx-auto">
          {/* Left Arrow Button */}
          <button
            onClick={handlePrev}
            aria-label="Předchozí recenze"
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-12 z-20 w-10 h-10 bg-[#7B42BC] text-white rounded-lg flex items-center justify-center hover:bg-[#6a39a3] shadow-lg transition-colors hidden md:flex"
          >
            <ChevronLeft size={20} />
          </button>

          {/* Cards Container */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-8 shadow-lg flex flex-col items-center text-center transform transition-all duration-300 hover:-translate-y-2 hover:shadow-xl"
              >
                {/* Avatar */}
                <div className="w-20 h-20 rounded-full overflow-hidden mb-4 border-4 border-white shadow-md">
                  <img
                    src={testimonial.avatar}
                    alt={`Fotografie ${testimonial.name}`}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Star Rating */}
                <div className="flex gap-1 mb-3 text-[#7B42BC]">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} size={18} fill="currentColor" />
                  ))}
                </div>

                {/* Name & Salon */}
                <h3 className="font-bold text-lg text-gray-900">
                  {testimonial.name}
                </h3>
                <p className="text-sm text-gray-500 mb-4 font-medium">
                  {testimonial.salon}
                </p>

                {/* Testimonial Text */}
                <p className="text-gray-600 text-sm leading-relaxed">
                  {testimonial.text}
                </p>
              </div>
            ))}
          </div>

          {/* Right Arrow Button */}
          <button
            onClick={handleNext}
            aria-label="Další recenze"
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-12 z-20 w-10 h-10 bg-[#7B42BC] text-white rounded-lg flex items-center justify-center hover:bg-[#6a39a3] shadow-lg transition-colors hidden md:flex"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Pagination Dots */}
        <div className="flex justify-center mt-10 gap-2" role="tablist" aria-label="Přepínač recenzí">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveIndex(index)}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                index === activeIndex ? "bg-[#7B42BC]" : "bg-purple-200"
              }`}
              role="tab"
              aria-selected={index === activeIndex}
              aria-label={`Zobrazit recenzi ${index + 1} z ${testimonials.length}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

