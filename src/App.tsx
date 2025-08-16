import { useState, useEffect, useRef } from "react";
import axios, {
  AxiosError,
  AxiosRequestConfig,
  CancelTokenSource,
} from "axios";

interface Message {
  id: number;
  user_id: string;
  message: string;
  reply: string;
  created_at: string;
}

const App: React.FC = () => {
  const [message, setMessage] = useState<string>("");
  const [reply, setReply] = useState<string>("");
  const [displayedReply, setDisplayedReply] = useState<string>(""); // برای انیمیشن تایپ
  const [history, setHistory] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [openAccordion, setOpenAccordion] = useState<number | null>(null); // برای آکاردئون
  const typingRef = useRef<NodeJS.Timeout | null>(null);
  const cancelTokenRef = useRef<CancelTokenSource | null>(null);
  const userId = "user123";
  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY || "YOUR_API_KEY";
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  // تمیز کردن پاسخ برای حذف undefined و مقادیر نامعتبر
  const cleanResponse = (text: string | undefined): string => {
    if (!text || text === "undefined" || text === "null" || text.trim() === "")
      return "";
    return text
      .replace(/undefined|null/gi, "")
      .replace(/\s+/g, " ")
      .trim();
  };

  // تبدیل پاسخ به HTML با سرفصل‌های h2
  const formatResponse = (text: string): string => {
    if (!text) return "";
    const lines = text
      .split("\n")
      .filter((line) => line.trim() !== "")
      .map((line) => {
        // سرفصل‌هایی مثل **شاهکار معماری و هنر:** یا **عنوان:**
        if (line.match(/^\*\*(.*?):\*\*/)) {
          const title = line.replace(/\*\*(.*?):\*\*/, "$1").trim();
          return `<h2 class="text-xl sm:text-2xl font-extrabold text-indigo-900 mt-6 mb-3 tracking-tight">${title}</h2>`;
        }
        // لیست‌ها
        if (line.match(/^\* /)) {
          return `<li class="text-gray-800 ml-6 leading-relaxed">${line
            .replace(/\* /, "")
            .trim()}</li>`;
        }
        // پاراگراف‌های معمولی
        return `<p class="text-gray-800 leading-relaxed">${line.trim()}</p>`;
      });
    return lines.join("");
  };

  // انیمیشن تایپ کلمه‌به‌کلمه
  useEffect(() => {
    if (reply) {
      setDisplayedReply("");
      const words = reply.split(" ").filter((word) => word.trim() !== "");
      let index = 0;

      typingRef.current = setInterval(() => {
        if (index < words.length) {
          setDisplayedReply((prev) => prev + (prev ? " " : "") + words[index]);
          index++;
        } else {
          clearInterval(typingRef.current!);
        }
      }, 100); // سرعت تایپ

      return () => clearInterval(typingRef.current!);
    }
  }, [reply]);

  // تابع لغو درخواست
  const cancelRequest = () => {
    if (cancelTokenRef.current) {
      cancelTokenRef.current.cancel("درخواست توسط کاربر لغو شد");
      setLoading(false);
      setError("درخواست لغو شد");
      setReply("");
      setDisplayedReply("");
      clearInterval(typingRef.current!);
    }
  };

  const sendMessage = async () => {
    if (!message.trim()) return;
    setLoading(true);
    setError("");
    setReply("");
    setDisplayedReply("");

    cancelTokenRef.current = axios.CancelToken.source();

    try {
      const res = await axios.post(
        apiUrl,
        { contents: [{ parts: [{ text: message }] }] },
        {
          timeout: 10000,
          cancelToken: cancelTokenRef.current.token,
        } as AxiosRequestConfig
      );
      const replyText = cleanResponse(
        res.data.candidates?.[0]?.content?.parts?.[0]?.text
      );
      if (!replyText) throw new Error("پاسخ معتبر دریافت نشد");
      setReply(replyText);
      setHistory((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          user_id: userId,
          message,
          reply: replyText,
          created_at: new Date().toISOString(),
        },
      ]);
      setMessage("");
      // console.log("Response received:", replyText);
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log("Request canceled:", error.message);
      } else {
        const axiosError = error as AxiosError;
        console.error(
          "خطا در ارسال پیام:",
          axiosError.message,
          axiosError.response?.status
        );
        setError("خطا در اتصال به API یا دریافت پاسخ");
      }
    }
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // تابع برای باز/بسته کردن آکاردئون
  const toggleAccordion = (id: number) => {
    setOpenAccordion(openAccordion === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-100 to-purple-100 flex flex-col items-center p-4 sm:p-8">
      <h1 className="text-4xl sm:text-5xl font-extrabold text-indigo-900 mb-10 font-vazir animate-fade-in tracking-tight drop-shadow-lg">
        چت‌بات TCOD
      </h1>
      {error && (
        <p className="text-red-600 mb-6 font-vazir bg-red-100 p-4 rounded-xl animate-pulse text-base max-w-3xl w-full shadow-lg">
          {error}
        </p>
      )}
      <div className="w-full max-w-3xl bg-white shadow-2xl rounded-2xl p-6 sm:p-8 mb-10 animate-slide-up border border-indigo-200/50">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="سؤالت رو اینجا بنویس..."
          className="w-full p-5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 mb-6 resize-none font-vazir text-gray-800 text-base transition-all duration-300 bg-gray-50 hover:bg-white focus:bg-white shadow-sm"
          rows={4}
          disabled={loading}
        />
        <div className="flex gap-4">
          <button
            onClick={sendMessage}
            disabled={loading || !message.trim()}
            className={`flex-1 py-3 px-6 rounded-xl text-white font-medium font-vazir text-lg transition-all duration-300 ${
              loading || !message.trim()
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700 hover:shadow-xl animate-glow"
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin h-5 w-5 mr-3 text-white"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  />
                </svg>
                در حال پردازش...
              </span>
            ) : (
              "ارسال"
            )}
          </button>
          <button
            onClick={cancelRequest}
            disabled={!loading}
            className={`flex-1 py-3 px-6 rounded-xl text-white font-medium font-vazir text-lg transition-all duration-300 ${
              !loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-red-600 hover:bg-red-700 hover:shadow-xl"
            }`}
          >
            لغو
          </button>
        </div>
        <div className="mt-8">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-indigo-900 font-vazir mb-4 tracking-tight drop-shadow-md">
            پاسخ:
          </h2>
          <div
            className="text-gray-800 font-vazir bg-gray-50 p-6 rounded-xl min-h-[120px] text-base leading-relaxed prose prose-indigo max-w-none shadow-inner"
            dangerouslySetInnerHTML={{
              __html: displayedReply
                ? formatResponse(displayedReply)
                : "اینجا پاسخ نمایش داده می‌شود...",
            }}
          />
        </div>
      </div>
      <div className="w-full max-w-3xl">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-indigo-900 mb-6 font-vazir tracking-tight drop-shadow-md">
          تاریخچه پیام‌ها:
        </h2>
        {history.length === 0 ? (
          <p className="text-gray-500 font-vazir bg-white p-6 rounded-xl shadow-lg text-base">
            هیچ پیامی وجود ندارد
          </p>
        ) : (
          <ul className="space-y-4">
            {history.map((msg) => (
              <li
                key={msg.id}
                className="bg-white p-6 rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl border border-gray-100/50"
              >
                <button
                  onClick={() => toggleAccordion(msg.id)}
                  className="w-full flex justify-between items-center text-right font-vazir text-base text-gray-800 hover:text-indigo-700 transition-colors duration-200"
                >
                  <span className="font-medium">{msg.message}</span>
                  <svg
                    className={`w-6 h-6 transform transition-transform duration-300 ${
                      openAccordion === msg.id ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    openAccordion === msg.id
                      ? "max-h-screen animate-accordionSlide"
                      : "max-h-0"
                  }`}
                >
                  <div
                    className="text-gray-800 font-vazir p-5 mt-3 bg-gray-50 rounded-lg text-base leading-relaxed prose prose-indigo max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: formatResponse(msg.reply),
                    }}
                  />
                </div>
                <p className="text-sm text-gray-500 mt-3 font-vazir">
                  {new Date(msg.created_at).toLocaleString("fa-IR")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default App;
