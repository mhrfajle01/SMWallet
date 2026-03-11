const DEEPSEEK_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY;
const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const BASE_URL = "https://openrouter.ai/api/v1";

export const aiService = {
  /**
   * Powerful parsing of messy receipt text using DeepSeek
   */
  parseReceiptWithAI: async (rawText) => {
    try {
      const response = await fetch(`${BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${DEEPSEEK_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://smwallet.com", 
          "X-Title": "SMWallet"
        },
        body: JSON.stringify({
          model: "deepseek/deepseek-chat",
          messages: [
            {
              role: "system",
              content: "You are a receipt parsing expert. Extract the Merchant Name, Total Amount, and Date from messy OCR text. Return ONLY valid JSON with keys: merchant, amount, date (YYYY-MM-DD), and category (one of: Food, Travel, Shopping, Health, Bills, Other)."
            },
            {
              role: "user",
              content: rawText
            }
          ],
          response_format: { type: "json_object" }
        })
      });

      const result = await response.json();
      return JSON.parse(result.choices[0].message.content);
    } catch (e) {
      console.error("AI Parse Error:", e);
      return null;
    }
  },

  /**
   * Financial Health Analysis using Gemini
   */
  getFinancialInsights: async (dataSummary) => {
    try {
      const response = await fetch(`${BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${GEMINI_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "google/gemini-2.0-flash-001",
          messages: [
            {
              role: "system",
              content: "You are a professional financial advisor. Analyze the user's spending data and give 3 short, punchy, actionable bullet points to improve their savings. Be encouraging but realistic."
            },
            {
              role: "user",
              content: `Here is my data: ${JSON.stringify(dataSummary)}`
            }
          ]
        })
      });

      const result = await response.json();
      return result.choices[0].message.content;
    } catch (e) {
      console.error("AI Insight Error:", e);
      return "AI is currently unavailable. Try again later.";
    }
  }
};