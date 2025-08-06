# Catalyst Studio - AI Chat Application

A streamlined AI chat application built with Next.js and the Vercel AI SDK, powered by OpenRouter.

## Features

- 🤖 AI-powered chat interface
- 💬 Real-time streaming responses
- 🎨 Beautiful UI with shadcn/ui components
- ⚡ Built with Next.js 15 and React 19
- 🔄 OpenRouter integration for multiple AI models

## Getting Started

### Prerequisites

- Node.js 18+ 
- An OpenRouter API key

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env.local`:
     ```bash
     cp .env.example .env.local
     ```
   - Update the following required variables in `.env.local`:
     ```env
     # OpenRouter Configuration (Required)
     OPENROUTER_API_KEY=sk-or-v1-your-actual-api-key-here
     
     # Optional: Specify a different AI model (defaults to Claude 3.5 Sonnet)
     OPENROUTER_MODEL=anthropic/claude-3.5-sonnet
     ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENROUTER_API_KEY` | ✅ Yes | - | Your OpenRouter API key. Get one at [OpenRouter](https://openrouter.ai/keys) |
| `OPENROUTER_MODEL` | No | `anthropic/claude-3.5-sonnet` | AI model to use. See [available models](https://openrouter.ai/models) |

### Available Models

You can use any model available on OpenRouter. Popular options include:
- `anthropic/claude-3.5-sonnet` - Claude 3.5 Sonnet (default)
- `openai/gpt-4-turbo` - GPT-4 Turbo
- `google/gemini-pro` - Google Gemini Pro
- `meta-llama/llama-3-70b-instruct` - Llama 3 70B

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **UI**: shadcn/ui components
- **Styling**: Tailwind CSS
- **AI**: Vercel AI SDK with OpenRouter
- **Language**: TypeScript

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## License

This project is licensed under the **Creative Commons Attribution-NonCommercial 4.0 International License (CC BY-NC 4.0)**.

### You are free to:
- **Share** — copy and redistribute the material in any medium or format
- **Adapt** — remix, transform, and build upon the material

### Under the following terms:
- **Attribution** — You must give appropriate credit
- **NonCommercial** — You may not use the material for commercial purposes

For commercial licensing options, please contact the maintainers.

See the [LICENSE](LICENSE) file for the full license text.