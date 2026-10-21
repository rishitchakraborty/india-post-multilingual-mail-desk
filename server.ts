import express, { type Request, type Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// LLM Server Configuration State
let serverLLMConfig = {
  provider: (process.env.LLM_PROVIDER as 'gemini' | 'qwen_self_hosted') || 'qwen_self_hosted',
  geminiModel: 'gemini-3.1-flash-lite',
  qwenEndpoint: process.env.QWEN_ENDPOINT || 'https://fastllm.quarkgen.ai/vllm/chat/stream',
  qwenModel: process.env.QWEN_MODEL || 'default',
  qwenApiKey: process.env.QWEN_API_KEY || '',
  temperature: 0.2,
  maxTokens: 2048,
  fallbackToGemini: Boolean(
    process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'
  ),
};

// Normalize OpenAI or streaming LLM endpoints
function resolveLLMEndpoint(rawUrl: string): string {
  const endpoint = rawUrl.trim().replace(/\/+$/, '');
  if (
    endpoint.endsWith('/stream') ||
    endpoint.endsWith('/chat/stream') ||
    endpoint.endsWith('/chat/completions') ||
    endpoint.includes('/api/chat') ||
    endpoint.endsWith('/generate')
  ) {
    return endpoint;
  }
  return `${endpoint}/chat/completions`;
}

// Gemini Client initialization with required headers
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error('GEMINI_API_KEY is not configured in environment variables');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Call FastLLM / self-hosted Qwen via OpenAI-compatible or streaming API
async function callSelfHostedQwen(
  systemPrompt: string,
  userPrompt: string,
  options?: { jsonMode?: boolean }
): Promise<string> {
  const endpoint = resolveLLMEndpoint(serverLLMConfig.qwenEndpoint);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (serverLLMConfig.qwenApiKey && serverLLMConfig.qwenApiKey.trim()) {
    headers['Authorization'] = `Bearer ${serverLLMConfig.qwenApiKey.trim()}`;
  }

  const payload: any = {
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: serverLLMConfig.temperature ?? 0.2,
    max_tokens: serverLLMConfig.maxTokens ?? 2048,
  };

  if (serverLLMConfig.qwenModel && serverLLMConfig.qwenModel !== 'default') {
    payload.model = serverLLMConfig.qwenModel;
  }

  if (options?.jsonMode) {
    payload.response_format = { type: 'json_object' };
  }

  let lastError: any = null;
  const maxRetries = 2;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

    try {
      if (attempt > 0) {
        console.info(`Retrying LLM endpoint call (attempt ${attempt + 1}/${maxRetries + 1})...`);
        await new Promise((r) => setTimeout(r, 1000 * attempt));
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!res.ok) {
        clearTimeout(timeoutId);
        const errText = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status}: ${errText}`);
      }

      const rawText = await res.text();
      clearTimeout(timeoutId);

      let content = '';
      try {
        const data = JSON.parse(rawText);
        if (data.choices?.[0]?.message?.content) {
          content = data.choices[0].message.content;
        } else if (typeof data.response === 'string') {
          content = data.response;
        } else if (typeof data.text === 'string') {
          content = data.text;
        } else {
          content = rawText;
        }
      } catch {
        content = rawText;
      }

      if (!content || !content.trim()) {
        throw new Error('LLM endpoint returned empty response content');
      }
      return content.trim();
    } catch (err: any) {
      clearTimeout(timeoutId);
      const cause = err.cause ? ` (${err.cause.message || err.cause.code || err.cause})` : '';
      const fullMsg = `${err.message || 'fetch failed'}${cause}`;
      lastError = new Error(fullMsg);
      console.warn(`LLM attempt ${attempt + 1} encountered error: ${fullMsg}`);
    }
  }

  throw lastError || new Error('LLM request failed after retries');
}

// Call Gemini with automatic fallback on transient 503 or overload spikes
async function callGeminiWithResilience(
  systemPrompt: string,
  userPrompt: string,
  options?: { jsonMode?: boolean }
): Promise<{ text: string; modelUsed: string }> {
  const geminiClient = getGeminiClient();
  const primaryModel = serverLLMConfig.geminiModel || 'gemini-3.8-flash';
  const fallbackModel = 'gemini-3.1-flash-lite';

  try {
    const response = await geminiClient.models.generateContent({
      model: primaryModel,
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: serverLLMConfig.temperature ?? 0.2,
        ...(options?.jsonMode ? { responseMimeType: 'application/json' } : {}),
      },
    });
    return {
      text: response.text || '',
      modelUsed: primaryModel,
    };
  } catch (err: any) {
    console.warn(`Primary Gemini model (${primaryModel}) encountered error:`, err.message);
    if (primaryModel !== fallbackModel) {
      console.info(`Attempting fallback to ${fallbackModel}...`);
      const fallbackResponse = await geminiClient.models.generateContent({
        model: fallbackModel,
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
          temperature: serverLLMConfig.temperature ?? 0.2,
          ...(options?.jsonMode ? { responseMimeType: 'application/json' } : {}),
        },
      });
      return {
        text: fallbackResponse.text || '',
        modelUsed: fallbackModel,
      };
    }
    throw err;
  }
}

// Unified LLM Generator: routes to either Qwen/FastLLM or Gemini with automatic fallback
async function generateWithConfiguredLLM(
  systemPrompt: string,
  userPrompt: string,
  options?: { jsonMode?: boolean }
): Promise<{ text: string; modelUsed: string }> {
  if (serverLLMConfig.provider === 'qwen_self_hosted') {
    try {
      const qwenText = await callSelfHostedQwen(systemPrompt, userPrompt, options);
      const modelName =
        serverLLMConfig.qwenModel && serverLLMConfig.qwenModel !== 'default'
          ? serverLLMConfig.qwenModel
          : 'Custom LLM / Self-Hosted';
      return {
        text: qwenText,
        modelUsed: `${modelName} [${serverLLMConfig.qwenEndpoint}]`,
      };
    } catch (qwenError: any) {
      console.warn('LLM endpoint call failed:', qwenError.message);
      const hasRealGeminiKey = Boolean(
        process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'
      );
      if (serverLLMConfig.fallbackToGemini && hasRealGeminiKey) {
        console.info('Falling back to Gemini as per policy.');
        const fallbackResult = await callGeminiWithResilience(systemPrompt, userPrompt, options);
        return {
          text: fallbackResult.text,
          modelUsed: `${fallbackResult.modelUsed} (Fallback from LLM)`,
        };
      }
      throw new Error(`LLM endpoint failed: ${qwenError.message}`);
    }
  }

  // Default: Gemini with resilience
  return await callGeminiWithResilience(systemPrompt, userPrompt, options);
}

// Auto-repairs truncated or partially complete JSON strings from streaming LLMs
function repairTruncatedJSON(raw: string): string {
  let s = raw.trim();

  // Strip markdown code block wrappers or prefixes if any
  if (s.startsWith('```json')) s = s.replace(/^```json\s*/i, '').replace(/```\s*$/, '');
  else if (s.startsWith('```')) s = s.replace(/^```\s*/, '').replace(/```\s*$/, '');

  const firstBrace = s.indexOf('{');
  if (firstBrace !== -1) s = s.substring(firstBrace);

  // 1. Scan character by character tracking string state and brackets
  let inStr = false;
  let esc = false;
  let brackets: string[] = [];

  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '\\' && !esc) {
      esc = true;
      continue;
    }
    if (c === '"' && !esc) {
      inStr = !inStr;
    }
    if (!inStr) {
      if (c === '{' || c === '[') {
        brackets.push(c);
      } else if (c === '}' && brackets[brackets.length - 1] === '{') {
        brackets.pop();
      } else if (c === ']' && brackets[brackets.length - 1] === '[') {
        brackets.pop();
      }
    }
    esc = false;
  }

  // If still inside an open string literal, close it!
  if (inStr) {
    s += '"';
  }

  // Clean trailing commas or hanging keys (e.g. , "key": or ,)
  s = s.replace(/,\s*$/g, '');
  s = s.replace(/,\s*"[^"]*":?\s*$/g, '');

  // Now recalculate brackets and close them cleanly
  brackets = [];
  inStr = false;
  esc = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '\\' && !esc) {
      esc = true;
      continue;
    }
    if (c === '"' && !esc) {
      inStr = !inStr;
    }
    if (!inStr) {
      if (c === '{' || c === '[') {
        brackets.push(c);
      } else if (c === '}' && brackets[brackets.length - 1] === '{') {
        brackets.pop();
      } else if (c === ']' && brackets[brackets.length - 1] === '[') {
        brackets.pop();
      }
    }
    esc = false;
  }

  while (brackets.length > 0) {
    const b = brackets.pop();
    s += b === '{' ? '}' : ']';
  }

  return s;
}

// Clean and parse JSON safely with robust auto-repair for LLM quirks
function cleanAndParseJSON(rawText: string): any {
  let cleaned = rawText.trim();

  // Strip markdown code block wrappers
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/```\s*$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/```\s*$/, '');
  }

  // Extract from the outermost { ... } if there is surrounding conversational text
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  try {
    return JSON.parse(cleaned);
  } catch (initialErr) {
    // Attempt multi-pass JSON repair
    try {
      // 1. Remove trailing commas before } or ]
      const noTrailingCommas = cleaned.replace(/,\s*([}\]])/g, '$1');
      return JSON.parse(noTrailingCommas);
    } catch {
      try {
        // 2. Escape literal unescaped newlines and tabs inside string literals
        let inString = false;
        let escaped = false;
        let fixed = '';
        for (let i = 0; i < cleaned.length; i++) {
          const char = cleaned[i];
          if (char === '\\' && !escaped) {
            escaped = true;
            fixed += char;
            continue;
          }
          if (char === '"' && !escaped) {
            inString = !inString;
          }
          if (inString && (char === '\n' || char === '\r')) {
            fixed += '\\n';
          } else if (inString && char === '\t') {
            fixed += '\\t';
          } else {
            fixed += char;
          }
          escaped = false;
        }

        fixed = fixed.replace(/,\s*([}\]])/g, '$1');
        return JSON.parse(fixed);
      } catch {
        try {
          // 3. Attempt truncation recovery
          const closed = repairTruncatedJSON(cleaned);
          return JSON.parse(closed);
        } catch (finalErr: any) {
          throw new Error(
            `Failed to parse LLM JSON: ${finalErr.message}. Excerpt: ${cleaned.slice(0, 150)}...`
          );
        }
      }
    }
  }
}

// API Routes
app.get('/api/settings', (req: Request, res: Response) => {
  res.json({
    ...serverLLMConfig,
    qwenApiKey: serverLLMConfig.qwenApiKey ? '••••••••' : '',
    hasGeminiKey: Boolean(
      process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'
    ),
  });
});

app.post('/api/settings', (req: Request, res: Response) => {
  const updates = req.body;
  if (updates.provider) serverLLMConfig.provider = updates.provider;
  if (updates.geminiModel) serverLLMConfig.geminiModel = updates.geminiModel;
  if (updates.qwenEndpoint) serverLLMConfig.qwenEndpoint = updates.qwenEndpoint;
  if (updates.qwenModel) serverLLMConfig.qwenModel = updates.qwenModel;
  if (typeof updates.qwenApiKey === 'string' && updates.qwenApiKey !== '••••••••') {
    serverLLMConfig.qwenApiKey = updates.qwenApiKey;
  }
  if (typeof updates.temperature === 'number') serverLLMConfig.temperature = updates.temperature;
  if (typeof updates.maxTokens === 'number') serverLLMConfig.maxTokens = updates.maxTokens;
  if (typeof updates.fallbackToGemini === 'boolean') {
    serverLLMConfig.fallbackToGemini = updates.fallbackToGemini;
  }

  res.json({
    success: true,
    message: 'LLM settings updated successfully',
    config: {
      ...serverLLMConfig,
      qwenApiKey: serverLLMConfig.qwenApiKey ? '••••••••' : '',
      hasGeminiKey: Boolean(
        process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'
      ),
    },
  });
});

// Test Connection Endpoint for Admin diagnostics
app.post('/api/settings/test-connection', async (req: Request, res: Response) => {
  const targetProvider = req.body.provider || serverLLMConfig.provider;
  const startTime = Date.now();

  try {
    if (targetProvider === 'qwen_self_hosted') {
      const endpoint = req.body.qwenEndpoint || serverLLMConfig.qwenEndpoint;
      const model = req.body.qwenModel || serverLLMConfig.qwenModel;
      const apiKey =
        req.body.qwenApiKey && req.body.qwenApiKey !== '••••••••'
          ? req.body.qwenApiKey
          : serverLLMConfig.qwenApiKey;

      const url = resolveLLMEndpoint(endpoint);

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (apiKey && apiKey.trim()) headers['Authorization'] = `Bearer ${apiKey.trim()}`;

      const probePayload: any = {
        messages: [
          {
            role: 'user',
            content:
              'Hello India Post Admin. Reply in 1 short sentence confirming the LLM is operational.',
          },
        ],
        max_tokens: 50,
        temperature: 0.1,
      };

      if (model && model !== 'default') {
        probePayload.model = model;
      }

      const probeRes = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(probePayload),
      });

      const elapsed = Date.now() - startTime;
      if (!probeRes.ok) {
        const errText = await probeRes.text().catch(() => '');
        return res.status(400).json({
          success: false,
          provider: 'qwen_self_hosted',
          latencyMs: elapsed,
          error: `HTTP ${probeRes.status}: ${errText}`,
        });
      }

      const rawText = await probeRes.text();
      let reply = 'Operational';
      try {
        const data = JSON.parse(rawText);
        reply = data.choices?.[0]?.message?.content || data.response || data.text || rawText;
      } catch {
        reply = rawText || 'Operational';
      }

      return res.json({
        success: true,
        provider: 'qwen_self_hosted',
        endpoint: url,
        model: model || 'default',
        latencyMs: elapsed,
        message: 'Successfully connected to LLM endpoint.',
        sampleReply: reply.trim(),
      });
    }

    // Test Gemini
    let sampleReply = 'OK';
    let modelName = serverLLMConfig.geminiModel;
    try {
      const geminiClient = getGeminiClient();
      const probe = await geminiClient.models.generateContent({
        model: modelName,
        contents: 'Ping test for India Post mail translation portal. Reply with: "OK"',
      });
      sampleReply = probe.text?.trim() || 'OK';
    } catch (err: any) {
      console.warn(`Primary ping to ${modelName} failed, testing fallback:`, err.message);
      modelName = 'gemini-3.1-flash-lite';
      const geminiClient = getGeminiClient();
      const probe = await geminiClient.models.generateContent({
        model: modelName,
        contents: 'Ping test for India Post mail translation portal. Reply with: "OK"',
      });
      sampleReply = probe.text?.trim() || 'OK';
    }
    const elapsed = Date.now() - startTime;

    return res.json({
      success: true,
      provider: 'gemini',
      model: modelName,
      latencyMs: elapsed,
      message: 'Successfully connected to Gemini API.',
      sampleReply,
    });
  } catch (error: any) {
    const elapsed = Date.now() - startTime;
    return res.status(500).json({
      success: false,
      provider: targetProvider,
      latencyMs: elapsed,
      error: error.message || 'Connection test failed',
    });
  }
});

// Translation & Mail Analysis Endpoint
app.post('/api/translate', async (req: Request, res: Response) => {
  try {
    const { text, preferredLanguage, postalCategory, trackingNumber } = req.body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ error: 'Mail content text is required.' });
    }

    const targetLang = preferredLanguage || 'English';

    const systemPrompt = `You are the Official Translation & Grievance Analysis Officer for India Post (Department of Posts, Government of India).
Accurately inspect incoming mail written in any Indian regional language or English, and translate it into a formal, structured postal letter in the employee's working language (${targetLang}).
Keep the translation concise (120-180 words) so that the JSON output is completely generated without being truncated.

Format "translatedText" as:
To: The Postmaster / Superintendent of Post Offices, Department of Posts
From: [Sender Name/Valued Customer], [Location/PIN if mentioned]
Subject: [Formal Subject Line]
Ref: [Consignment/Article ID if applicable]

Respected Sir / Madam, (or formal salutation in ${targetLang})

[Paragraph 1: Background, booking date, origin/destination offices, and consignment ID]
[Paragraph 2: Core grievance, inquiry details, or delay issue]
[Paragraph 3: Specific relief or action sought]

Yours faithfully,
[Sender Name / Contact Info]

Return ONLY a strictly valid JSON object matching this schema:
{
  "detectedLanguage": "Full language name (e.g. 'Tamil (தமிழ்)' or 'Bengali (বাংলা)' or 'Hindi (हिन्दी)')",
  "detectedLanguageCode": "ISO code such as 'ta', 'bn', 'mr', 'hi', 'gu', 'te', 'kn', 'ml', 'pa', 'or', 'ur', 'en'",
  "confidence": 0.95,
  "subjectLine": "Concise professional subject line",
  "translatedText": "Properly formatted formal letter in ${targetLang} with salutation, structured paragraphs, and sign-off",
  "summary": "1-2 sentence executive briefing for the postal assistant",
  "postalIntent": "Specific reason for the mail",
  "urgency": "Routine" | "High Priority" | "Urgent / Grievance",
  "detectedCategory": "Speed Post" | "Registered Post" | "Money Order (e-MO)" | "Postal Life Insurance (PLI)" | "Post Office Savings Bank (POSB)" | "Sukanya Samriddhi Yojana (SSY)" | "Parcels & Logistics" | "General Dak / Grievance",
  "extractedEntities": {
    "senderName": "Name if found or null",
    "senderEmail": "Email if found or null",
    "trackingNumber": "Article/Consignment ID or null",
    "pinCode": "6-digit PIN or null",
    "dateMentioned": "Date or null",
    "contactNumber": "Phone or null",
    "sourceOffice": "Booking office or null",
    "destinationOffice": "Delivery office or null"
  },
  "suggestedActionPoints": [
    "Step 1 for postal staff",
    "Step 2 for postal staff"
  ]
}

DO NOT output conversational text, explanations, or markdown code fences around the JSON. In JSON string values, any newlines MUST be escaped as \\n.`;

    const userPrompt = `Postal Category: ${postalCategory || 'Auto-detect'}\nProvided Tracking: ${
      trackingNumber || 'Auto-detect'
    }\n\nIncoming Customer Dak Text:\n"""\n${text}\n"""`;

    const { text: rawOutput, modelUsed } = await generateWithConfiguredLLM(
      systemPrompt,
      userPrompt,
      { jsonMode: true }
    );

    const parsed = cleanAndParseJSON(rawOutput);
    return res.json({
      ...parsed,
      modelUsed,
    });
  } catch (error: any) {
    console.error('Error in /api/translate:', error);
    return res.status(500).json({
      error: error.message || 'Failed to translate postal mail',
    });
  }
});

// Bi-directional Postal Reply Generator Endpoint
app.post('/api/generate-reply', async (req: Request, res: Response) => {
  try {
    const {
      staffReply,
      originalText,
      sourceLanguage,
      staffLanguage,
      tone,
      docketNumber,
      trackingNumber,
      customerName,
      customerEmail,
    } = req.body;

    if (!staffReply || typeof staffReply !== 'string' || staffReply.trim().length === 0) {
      return res.status(400).json({ error: 'Staff reply text is required.' });
    }

    const targetCustomerLang = sourceLanguage || 'Hindi';
    const currentStaffLang = staffLanguage || 'English';

    const systemPrompt = `You are the Official Correspondence & Dispatch Desk Officer for India Post (Department of Posts, Government of India).
Your task is to take the postal staff's drafted reply (written in ${currentStaffLang}) and generate an official, ready-to-send postal reply email in the customer's native language (${targetCustomerLang}), and a matching verification email in ${currentStaffLang}.
Keep each email concise (100-150 words) so that the JSON output is completely generated without being truncated.

CRITICAL EMAIL FORMATTING SPECIFICATIONS:
1. "subjectLine": Official subject line in ${targetCustomerLang}.
2. "reverseSubjectLine": Matching subject line in ${currentStaffLang}.
3. "senderLanguageReply": Complete email in ${targetCustomerLang}:
   - Respectful salutation using customer name
   - Reference line: "संदर्भ / Reference: डाक शिकायत सं. ${docketNumber || 'N/A'} | आर्टिकल सं. ${trackingNumber || 'N/A'}"
   - Paragraph 1 (Acknowledgment): Formal receipt of customer's correspondence.
   - Paragraph 2 (Resolution): Action taken, delivery timeline, or instructions as communicated in staff draft.
   - Official sign-off block:
     "भवदीय / Yours faithfully,
     डाक सहायक / डाकपाल (Postal Assistant / Postmaster)
     भारतीय डाक विभाग / Department of Posts (India Post)
     राष्ट्रीय हेल्पलाइन: 1800-266-6868"
4. "reverseTranslation": Matching formatted email in ${currentStaffLang} for staff verification.

Return ONLY a strictly valid JSON object matching this schema:
{
  "subjectLine": "Email subject in ${targetCustomerLang}",
  "reverseSubjectLine": "Email subject in ${currentStaffLang}",
  "senderLanguageReply": "Formatted email body in ${targetCustomerLang}",
  "reverseTranslation": "Matching formatted email body in ${currentStaffLang}",
  "officialSalutation": "Opening salutation in ${targetCustomerLang}",
  "officialSignOff": "Departmental sign-off in ${targetCustomerLang}",
  "senderLanguage": "${targetCustomerLang}",
  "staffLanguage": "${currentStaffLang}",
  "senderEmail": "${customerEmail || ''}"
}

DO NOT output conversational text, explanations, or markdown code fences around the JSON. In JSON string values, any newlines MUST be escaped as \\n.`;

    const userPrompt = `Docket Reference: ${docketNumber || 'N/A'}
Customer Name: ${customerName || 'Customer'}
Customer Email: ${customerEmail || 'N/A'}
Tracking Number: ${trackingNumber || 'N/A'}
Customer's Original Language: ${targetCustomerLang}
Staff's Working Language: ${currentStaffLang}
Tone: ${tone || 'formal and courteous'}

Original Customer Dak Context:
"""
${originalText ? originalText.slice(0, 1000) : 'General customer inquiry'}
"""

Postal Staff's Drafted Reply (in ${currentStaffLang}):
"""
${staffReply}
"""`;

    const { text: rawOutput, modelUsed } = await generateWithConfiguredLLM(
      systemPrompt,
      userPrompt,
      { jsonMode: true }
    );

    const parsed = cleanAndParseJSON(rawOutput);
    return res.json({
      ...parsed,
      modelUsed,
    });
  } catch (error: any) {
    console.error('Error in /api/generate-reply:', error);
    return res.status(500).json({
      error: error.message || 'Failed to generate multilingual postal reply',
    });
  }
});

// Vite Development or Production Static Serving
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`India Post Multilingual Mail Desk server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
