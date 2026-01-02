import { Zap } from "lucide-react";
import { useChatDemo } from "@/hooks/useChatDemo";
import { ChatInterface } from "./ChatInterface";
import { CalendarMockup } from "./CalendarMockup";

export function DemoSection() {
  const {
    messages,
    inputValue,
    setInputValue,
    calendarEvents,
    handleSendMessage,
  } = useChatDemo();

  return (
    <section
      id="demo"
      className="py-20 px-6 bg-white dark:bg-[#121212] relative overflow-hidden"
    >
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-[#5A5BFF]/5 dark:bg-[#6366FF]/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-[#726BFF]/5 dark:bg-[#8B5CF6]/5 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-[1240px] mx-auto relative z-10">
        <div className="text-center mb-12">
          <h2 className="font-inter font-bold text-3xl md:text-4xl text-[#111111] dark:text-white mb-4">
            Vyzkoušejte IVA Zdarma
          </h2>
          <p className="font-inter text-base text-[#6B7280] dark:text-white dark:text-opacity-70 max-w-2xl mx-auto">
            Napište si s IVA a sledujte, jak automaticky vytváří rezervace ve
            vašem kalendáři
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChatInterface
            messages={messages}
            inputValue={inputValue}
            onInputChange={setInputValue}
            onSendMessage={handleSendMessage}
          />
          <CalendarMockup calendarEvents={calendarEvents} />
        </div>

        {/* Demo CTA */}
        <div className="mt-8 text-center">
          <p className="font-inter text-sm text-[#6B7280] dark:text-white dark:text-opacity-70 mb-4">
            💡 Tip: Zkuste napsat "Chtěl bych rezervaci na zítřek na 14:00"
          </p>
          <a
            href="/account/signup"
            className="inline-flex items-center space-x-2 rounded-[20px] bg-[#5A5BFF] dark:bg-[#6366FF] px-6 py-3 font-inter font-semibold text-base text-white transition-all hover:bg-[#4F4FE6] dark:hover:bg-[#5856FF] active:scale-95 shadow-lg"
          >
            <span>Začít používat IVA</span>
            <Zap size={18} />
          </a>
        </div>
      </div>
    </section>
  );
}
