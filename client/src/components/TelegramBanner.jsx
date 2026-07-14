const TELEGRAM_URL = "https://t.me/Shakil_Bangla_Movie";

function TelegramBanner() {
  return (
    <a
      href={TELEGRAM_URL|| "https://t.me/Shakil_Bangla_Movie"}
      target="_blank"
      rel="noopener noreferrer"
      className="block mx-4 md:mx-12 my-4 rounded overflow-hidden transition-opacity hover:opacity-90"
    >
      <div className="bg-gradient-to-r from-[#0a1628] to-[#1a2332] px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <svg
            className="w-10 h-10 flex-shrink-0"
            viewBox="0 0 24 24"
            fill="#0088cc"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
          </svg>
          <div>
            <h3 className="text-white font-semibold text-base md:text-lg leading-tight">
              Join Our Telegram Channel
            </h3>
            <p className="text-gray-400 text-xs md:text-sm mt-0.5">
              Get the latest movies &amp; updates directly
            </p>
          </div>
        </div>
        <span className="flex-shrink-0 bg-[#0088cc] hover:bg-[#006daa] text-white px-4 py-2 md:px-5 md:py-2.5 rounded font-semibold text-sm transition-colors">
          Join Now
        </span>
      </div>
    </a>
  );
}

export default TelegramBanner;
