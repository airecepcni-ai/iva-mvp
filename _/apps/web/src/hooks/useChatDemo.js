import { useState } from "react";

export function useChatDemo() {
  const [messages, setMessages] = useState([
    {
      from: "iva",
      text: "Dobrý den! Jsem IVA, virtuální asistentka salonu. Můžu vám pomoci s rezervací?",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [calendarEvents, setCalendarEvents] = useState([
    { time: "09:00", title: "Střih - Jana Nováková", color: "bg-blue-500" },
    {
      time: "11:00",
      title: "Barvení - Petra Svobodová",
      color: "bg-purple-500",
    },
  ]);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage = inputValue.trim();
    setMessages((prev) => [...prev, { from: "user", text: userMessage }]);
    setInputValue("");

    // Simulate IVA responses
    setTimeout(() => {
      if (
        userMessage.toLowerCase().includes("rezerv") ||
        userMessage.toLowerCase().includes("objedn")
      ) {
        setMessages((prev) => [
          ...prev,
          {
            from: "iva",
            text: "Samozřejmě! Na jaký den a čas byste chtěl/a rezervaci?",
          },
        ]);
      } else if (
        userMessage.match(/\d{1,2}[:\.]\d{2}/) ||
        userMessage.toLowerCase().includes("zítra") ||
        userMessage.toLowerCase().includes("dnes")
      ) {
        setMessages((prev) => [
          ...prev,
          {
            from: "iva",
            text: "Výborně! Jakou službu si přejete? Máme střih, barvení, melír...",
          },
        ]);
      } else if (
        userMessage.toLowerCase().includes("stř") ||
        userMessage.toLowerCase().includes("barv") ||
        userMessage.toLowerCase().includes("mel")
      ) {
        setMessages((prev) => [
          ...prev,
          {
            from: "iva",
            text: "Perfektní! Mohu vás zapsat na 14:00. Jak se jmenujete?",
          },
        ]);
      } else if (userMessage.match(/[a-zA-ZčďěňřšťůýžČĎĚŇŘŠŤŮÝŽ]{2,}/)) {
        setMessages((prev) => [
          ...prev,
          {
            from: "iva",
            text: "Skvělé! Vytvořila jsem rezervaci na vaše jméno. Uvidíme se!",
          },
        ]);

        // Add to calendar
        setTimeout(() => {
          setCalendarEvents((prev) => [
            ...prev,
            {
              time: "14:00",
              title: "Střih - " + userMessage,
              color: "bg-green-500",
              new: true,
            },
          ]);
        }, 500);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            from: "iva",
            text: "Ráda vám pomohu s rezervací. Zkuste mi říct, na kdy byste chtěl/a termín.",
          },
        ]);
      }
    }, 800);
  };

  return {
    messages,
    inputValue,
    setInputValue,
    calendarEvents,
    handleSendMessage,
  };
}
