# AI Chatbot

A general-purpose AI assistant powered by the Anthropic Claude API. Built with Next.js 16, TypeScript, and Tailwind CSS 4. Features real-time streaming responses and multi-turn conversation history.

**[Live Demo →](**[Live Demo →](https://ai-chatbot-rho-nine-71.vercel.app)**)** <!-- update after deploy -->

![AI Chatbot Screenshot](./public/screenshot.png) <!-- add after deploy -->

---

## Features

- **Streaming responses** — tokens appear in real time via Web Streams API
- **Multi-turn memory** — full conversation history sent on every request
- **Terminal aesthetic** — dark UI with monospace font and green accents
- **Keyboard shortcuts** — Enter to send, Shift+Enter for newline
- **Auto-scroll** — chat always scrolls to the latest message
- **Responsive** — works on desktop and mobile
- **Text-to-speech** — speaker button on each assistant message narrates the response via ElevenLabs' Text-to-Speech API

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS 4 |
| AI | Anthropic Claude API (claude-sonnet-4-6) |
| Voice | ElevenLabs API (Text-to-Speech) |
| Streaming | Web Streams API + ReadableStream |
| CI/CD | GitHub Actions |
| Deployment | Vercel |

## Architecture
```
app/
├── api/
│   └── chat/
│       └── route.ts        # API route — streams Claude response to client
├── components/
│   ├── ChatMessage.tsx     # Single message bubble (user + assistant)
│   └── ChatInput.tsx       # Textarea input with auto-resize
├── globals.css             # Tailwind 4 theme tokens + animations
├── layout.tsx              # Root layout + metadata
└── page.tsx                # Main page — streaming fetch + state management
.github/
└── workflows/
└── ci.yml              # Lint + type check on every push
```
## Getting Started

### Prerequisites
- Node.js 20+
- Anthropic API key → [console.anthropic.com](https://console.anthropic.com)

### Local Development

```bash
# Clone the repo
git clone https://github.com/Helenyixuanwang/ai-chatbot.git
cd ai-chatbot

# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Add your ANTHROPIC_API_KEY to .env.local

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deployment

### Vercel (recommended)

1. Push to GitHub
2. Import repo at [vercel.com/new](https://vercel.com/new)
3. Add `ANTHROPIC_API_KEY` in Vercel → Settings → Environment Variables
4. Deploy — Vercel auto-deploys on every push to `main`

## Environment Variables

| Variable | Description |
|---|---|
| `ANTHROPIC_API_KEY` | Your Anthropic API key |
| `ELEVENLABS_API_KEY` | Your ElevenLabs API key |
| `DEFAULT_VOICE_ID` | ElevenLabs voice ID used for text-to-speech |

## Author

**Helen Wang** — [LinkedIn](https://linkedin.com/in/helenyixuanwang) · [GitHub](https://github.com/Helenyixuanwang)
