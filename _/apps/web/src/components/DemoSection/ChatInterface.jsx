import { Phone, Send } from "lucide-react";

export function ChatInterface({
  messages,
  inputValue,
  onInputChange,
  onSendMessage,
}) {
  return (
    <div className="bg-white dark:bg-[#1E1E1E] rounded-2xl border border-[#E5E7EB] dark:border-gray-700 overflow-hidden shadow-xl">
      {/* Chat Header */}
      <div className="bg-gradient-to-r from-[#5A5BFF] to-[#726BFF] dark:from-[#6366FF] dark:to-[#8B5CF6] p-4 flex items-center space-x-3">
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
          <Phone size={20} className="text-white" />
        </div>
        <div>
          <p className="font-inter font-semibold text-white">IVA Assistant</p>
          <p className="font-inter text-xs text-white/80">
            Online • Odpovídá okamžitě
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="h-[400px] overflow-y-auto p-4 space-y-3 bg-[#F9FAFB] dark:bg-[#0A0A0A]">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"} animate-slide-up`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                msg.from === "user"
                  ? "bg-[#5A5BFF] dark:bg-[#6366FF] text-white"
                  : "bg-white dark:bg-[#1E1E1E] text-[#111111] dark:text-white border border-[#E5E7EB] dark:border-gray-700"
              }`}
            >
              <p className="font-inter text-sm">{msg.text}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="p-4 bg-white dark:bg-[#1E1E1E] border-t border-[#E5E7EB] dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && onSendMessage()}
            placeholder="Napište zprávu..."
            className="flex-1 px-4 py-3 rounded-xl bg-[#F9FAFB] dark:bg-[#0A0A0A] border border-[#E5E7EB] dark:border-gray-700 font-inter text-sm text-[#111111] dark:text-white focus:outline-none focus:border-[#5A5BFF] dark:focus:border-[#6366FF] transition-colors"
          />
          <button
            onClick={onSendMessage}
            className="w-12 h-12 rounded-xl bg-[#5A5BFF] dark:bg-[#6366FF] flex items-center justify-center hover:bg-[#4F4FE6] dark:hover:bg-[#5856FF] transition-all active:scale-95"
          >
            <Send size={20} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
