export function BillingToggle({ billingPeriod, onToggle }) {
  return (
    <div className="flex items-center justify-center mb-12">
      <div className="inline-flex items-center space-x-3 p-1 bg-[#F9FAFB] dark:bg-[#1E1E1E] rounded-full border border-[#E5E7EB] dark:border-gray-700">
        <button
          onClick={() => onToggle("monthly")}
          className={`px-6 py-2 rounded-full font-inter text-sm font-medium transition-all ${
            billingPeriod === "monthly"
              ? "bg-[#5A5BFF] dark:bg-[#6366FF] text-white shadow-lg"
              : "text-[#6B7280] dark:text-white dark:text-opacity-70 hover:text-[#111111] dark:hover:text-white"
          }`}
        >
          Měsíčně
        </button>
        <button
          onClick={() => onToggle("yearly")}
          className={`px-6 py-2 rounded-full font-inter text-sm font-medium transition-all relative ${
            billingPeriod === "yearly"
              ? "bg-[#5A5BFF] dark:bg-[#6366FF] text-white shadow-lg"
              : "text-[#6B7280] dark:text-white dark:text-opacity-70 hover:text-[#111111] dark:hover:text-white"
          }`}
        >
          Ročně
          <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            -20%
          </span>
        </button>
      </div>
    </div>
  );
}
