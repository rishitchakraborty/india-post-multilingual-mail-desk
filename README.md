# India Post Multilingual Mail Desk (भारतीय डाक भाषांतर केंद्र)

Official postal mail translation and regional correspondence reply portal for **India Post (Department of Posts, Ministry of Communications, Government of India)**.

Supports **22+ scheduled Indian regional languages** (Tamil, Bengali, Marathi, Gujarati, Telugu, Kannada, Malayalam, Odia, Punjabi, Urdu, Hindi, Assamese, etc.) with configurable LLM engines:
- **Custom / Self-Hosted LLMs**: OpenAI-compatible streaming endpoints (e.g. vLLM, FastLLM, Ollama, Qwen) with zero-authentication or Bearer token support.
- **Google Gemini**: Dual-engine with automatic resilience fallback (`gemini-3.8-flash` / `gemini-3.1-flash-lite`).

---

## Key Features

- **Unicode Script Auto-Detection**: Instant heuristic client-side detection across 10+ major Indian scripts.
- **Postal Metadata Extraction**: Automatic parsing of Speed Post tracking IDs (`EM...IN`), e-MO numbers, PLI policy numbers, SSY account IDs, PIN codes, phone numbers, and dates.
- **Formal Postal Letter Formatting**: Structures translations into formal departmental letter format with salutation, reference line, structured paragraphs, and sign-offs.
- **Bi-Directional Regional Reply Desk**: Translates staff drafts from English/Hindi back into the customer's native regional language with matching verification copies.
- **Postal Register & Local Archive**: Saves dockets and past correspondence with search, reload, and status tracking.
- **In-App LLM Diagnostics**: Admin modal with live latency testing, temperature tuning, and instant provider switching.

---

## Getting Started

### Prerequisites
- **Node.js**: v18+ (tested on Node v20/v26)
- **npm**: v9+

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Configure your LLM provider in `.env`:
```env
# Custom LLM / FastLLM / vLLM Endpoint
LLM_PROVIDER="qwen_self_hosted"
QWEN_ENDPOINT="https://fastllm.quarkgen.ai/vllm/chat/stream"
QWEN_MODEL="default"
# QWEN_API_KEY="" # Leave empty if no authentication is required

# (Optional) Google Gemini API Key
GEMINI_API_KEY="your_gemini_api_key_here"
```

### 3. Run Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Runs backend server with `tsx watch` and Vite development middleware on `http://localhost:3000`. |
| `npm test` | Runs the unit test suite (16 tests covering script detection, docket generation, entity extraction). |
| `npm run lint` | Runs TypeScript type checking (`tsc --noEmit`). |
| `npm run build` | Builds the client bundle for production into `dist/`. |
| `npm start` | Runs the production Node server. |

---

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Motion.
- **Backend**: Express 4, Node.js, `tsx`.
- **Bundler**: Vite 8.
- **AI Integrations**: OpenAI-compatible REST streaming client + `@google/genai` SDK.

