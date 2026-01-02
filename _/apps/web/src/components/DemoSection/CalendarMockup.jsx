import { Calendar } from "lucide-react";

export function CalendarMockup({ calendarEvents }) {
  return (
    <div className="bg-white dark:bg-[#1E1E1E] rounded-2xl border border-[#E5E7EB] dark:border-gray-700 overflow-hidden shadow-xl">
      {/* Calendar Header */}
      <div className="bg-white dark:bg-[#1E1E1E] p-4 border-b border-[#E5E7EB] dark:border-gray-700 flex items-center space-x-3">
        <Calendar size={24} className="text-[#4285F4]" />
        <div>
          <p className="font-inter font-semibold text-[#111111] dark:text-white">
            Google Calendar
          </p>
          <p className="font-inter text-xs text-[#6B7280] dark:text-white dark:text-opacity-70">
            Dnes • Automatická synchronizace
          </p>
        </div>
      </div>

      {/* Calendar View */}
      <div className="p-6 space-y-3 h-[456px] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-inter font-semibold text-lg text-[#111111] dark:text-white">
            {new Date().toLocaleDateString("cs-CZ", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </h3>
        </div>

        {/* Time slots */}
        <div className="space-y-2">
          {[
            "08:00",
            "09:00",
            "10:00",
            "11:00",
            "12:00",
            "13:00",
            "14:00",
            "15:00",
            "16:00",
            "17:00",
          ].map((time) => {
            const event = calendarEvents.find((e) => e.time === time);
            return (
              <div key={time} className="flex items-start space-x-3">
                <span className="font-inter text-sm text-[#6B7280] dark:text-white dark:text-opacity-60 w-16 pt-2">
                  {time}
                </span>
                <div className="flex-1">
                  {event ? (
                    <div
                      className={`${event.color} rounded-lg p-3 ${event.new ? "animate-scale-in" : ""}`}
                    >
                      <p className="font-inter text-sm font-medium text-white">
                        {event.title}
                      </p>
                      {event.new && (
                        <p className="font-inter text-xs text-white/80 mt-1">
                          ✨ Nová rezervace přes IVA
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="border border-dashed border-[#E5E7EB] dark:border-gray-700 rounded-lg p-3">
                      <p className="font-inter text-xs text-[#9CA3AF] dark:text-white dark:text-opacity-40">
                        Volno
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
