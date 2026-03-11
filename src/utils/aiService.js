const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
  "HTTP-Referer": "https://mhrfajle01.github.io/SMWallet/", 
  "X-Title": "SMWallet"
};

const OPENROUTER_URL = "https://openrouter.ai/api/v1";

/**
 * Built-in (Local) AI logic (Rule-based Offline Assistant)
 * Simulates AI responses using local context and returns JSON when requested.
 */
const requestBuiltInAI = (messages, context) => {
    const lastMessage = messages[messages.length - 1].content.toLowerCase();
    const { finance, productivity } = context || {};
    
    // --- JSON Format Request (Locally Created AI) ---
    if (lastMessage.includes('json') || lastMessage.includes('format')) {
        return JSON.stringify({
            ai_status: "Built-in Offline Mode",
            financial_summary: {
                total_balance: finance?.totalBalance || 0,
                active_wallets: finance?.wallets?.length || 0,
                goals_count: finance?.goals?.length || 0
            },
            productivity_summary: {
                pending_tasks: productivity?.pendingTodos?.length || 0,
                habits_count: productivity?.habits?.length || 0,
                notes_count: productivity?.notesCount || 0
            },
            system_info: {
                timestamp: new Date().toISOString(),
                version: "2.2.0-Local"
            }
        }, null, 2);
    }

    // --- Financial Rules ---
    if (lastMessage.includes('balance') || lastMessage.includes('money')) {
        return `Your net worth is ${finance?.totalBalance || 0} BDT. You have ${finance?.wallets?.length || 0} wallets active.`;
    }
    
    if (lastMessage.includes('spend') || lastMessage.includes('spent') || lastMessage.includes('expense')) {
        const last = finance?.recentPurchases?.[0];
        if (!last) return "No recent spending data found.";
        return `Your last spend was ${last.amount} BDT on ${last.item} (${last.date}).`;
    }

    // --- Productivity Rules ---
    if (lastMessage.includes('task') || lastMessage.includes('todo')) {
        const pending = productivity?.pendingTodos || [];
        return pending.length > 0 
            ? `You have ${pending.length} pending tasks. Priority: "${pending[0].title}".` 
            : "No pending tasks! You're all caught up.";
    }

    if (lastMessage.includes('hi') || lastMessage.includes('hello')) {
        return "Hi! I'm your local SM Assistant. I can help you check your balances, tasks, and spending even without an internet connection.";
    }

    return "I'm in Offline Mode. I can answer simple questions about your data. For advanced AI, please provide a valid Gemini or DeepSeek API key in the configuration.";
};

export const aiService = {
  requestAI: async (settings, messages, projectContext = null) => {
    const { preferredModel = 'builtIn', geminiKey, deepseekKey } = settings || {};
    
    // If Built-in is selected, use local logic immediately
    if (preferredModel === 'builtIn') {
        return new Promise(resolve => setTimeout(() => resolve(requestBuiltInAI(messages, projectContext)), 500));
    }

    let url = "";
    let headers = { ...DEFAULT_HEADERS };
    let body = {};

    try {
        if (preferredModel === 'gemini') {
            if (!geminiKey) throw new Error("Gemini key is missing.");
            
            if (geminiKey.startsWith('sk-or-')) {
                url = `${OPENROUTER_URL}/chat/completions`;
                headers["Authorization"] = `Bearer ${geminiKey}`;
                // Using a more stable OpenRouter model ID
                body = { model: "google/gemini-2.0-flash-exp", messages, stream: false };
            } else {
                url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`;
                body = { contents: messages.map(m => ({
                    role: m.role === 'assistant' ? 'model' : 'user',
                    parts: [{ text: m.content }]
                }))};
                headers = { "Content-Type": "application/json" };
            }
        } 
        else if (preferredModel === 'deepseek') {
            if (!deepseekKey) throw new Error("DeepSeek key is missing.");
            
            if (deepseekKey.startsWith('sk-or-')) {
                url = `${OPENROUTER_URL}/chat/completions`;
                headers["Authorization"] = `Bearer ${deepseekKey}`;
                body = { model: "deepseek/deepseek-chat", messages, stream: false };
            } else {
                url = "https://api.deepseek.com/chat/completions";
                headers["Authorization"] = `Bearer ${deepseekKey}`;
                body = { model: "deepseek-chat", messages, stream: false };
            }
        }

        const response = await fetch(url, {
            method: "POST",
            headers,
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errJson = await response.json().catch(() => ({}));
            const apiError = errJson.error?.message || `Status ${response.status}`;
            throw new Error(apiError);
        }

        const data = await response.json();
        if (preferredModel === 'gemini' && !geminiKey.startsWith('sk-or-')) {
            return data.candidates[0].content.parts[0].text;
        } else {
            return data.choices[0].message.content;
        }
    } catch (e) {
        console.warn("AI API failed, falling back to built-in logic:", e.message);
        // Silent fallback to built-in for better UX
        return `[API Error: ${e.message}] \n\nFallback: ${requestBuiltInAI(messages, projectContext)}`;
    }
  },

  parseReceiptWithAI: async (rawText, settings) => {
    // Basic local parser if no key or local selected
    if (settings.preferredModel === 'builtIn' || (!settings.geminiKey && !settings.deepseekKey)) {
        return { 
            merchant: "Local Parse", 
            amount: parseFloat(rawText.match(/\d+\.?\d*/)?.[0] || 0), 
            date: new Date().toISOString().split('T')[0],
            category: "Other" 
        };
    }
    
    try {
        const prompt = `Extract JSON: { "merchant": string, "amount": number, "date": "YYYY-MM-DD", "category": "Food|Shopping|Travel|Other" }`;
        const content = await aiService.requestAI(settings, [
            { role: "system", content: prompt },
            { role: "user", content: rawText }
        ]);
        let jsonStr = content.includes('```') ? content.match(/\{[\s\S]*\}/)?.[0] : content;
        return JSON.parse(jsonStr);
    } catch (e) {
        return null;
    }
  },

  chatWithAI: async (prompt, history, projectContext, settings) => {
      try {
          const messages = [
              { role: "system", content: "You are SM Assistant. Provide helpful financial and productivity advice." },
              ...history,
              { role: "user", content: prompt }
          ];
          return await aiService.requestAI(settings, messages, projectContext);
      } catch (e) {
          return `I'm having trouble connecting to the AI. Error: ${e.message}. I'll use built-in logic: \n\n${requestBuiltInAI([{role:'user', content:prompt}], projectContext)}`;
      }
  }
};