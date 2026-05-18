# Inferix Playground - LLM Inference Playground UI

A modern, accessible React + TypeScript web application for testing and comparing LLM model outputs with real-time streaming, token-level diff visualization, and comprehensive error handling.

## 🎯 Features

### Part A: Inference Playground
- ✅ **Multi-Modal Input**: Text or speech-to-text audio recording using Web Speech API
- ✅ **Token Streaming**: Real-time token-by-token streaming using Fetch API + ReadableStream
- ✅ **Live Metrics**: Token counter and tokens-per-second display updating in real-time
- ✅ **Error Handling**: Graceful handling of network failures, timeouts, API errors with partial output preservation
- ✅ **Accessibility**: Full keyboard navigation, WCAG AA compliance, screen reader support

### Part B: Model Output Diff View
- ✅ **Token-Level Diffing**: Word-by-word comparison with added/removed/same highlighting
- ✅ **Custom Algorithm**: LCS (Longest Common Subsequence) implementation from scratch
- ✅ **Smart Filtering**: Stop-word filtering to reduce noise in diff visualization
- ✅ **Side-by-Side View**: Compare two model outputs side-by-side with synchronized scrolling

## 🛠️ Tech Stack

- **Framework**: React 18.2 + TypeScript
- **Build**: Vite 8.0.13
- **API**: Groq API (LLM inference)
- **Speech**: Web Speech API (browser-native)
- **Styling**: Tailwind CSS 4.3 + CSS-in-JS
- **Markdown**: react-markdown 10.1
- **Package Manager**: npm

## 📋 Prerequisites

- Node.js 18+ and npm
- Groq API key (get it from https://console.groq.com/keys)
- Modern browser with Web Speech API support

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
```bash
# Copy example env file
cp ../.env.example ../.env

# Edit ../.env and add your Groq API key
VITE_GROQ_API_KEY=your_api_key_here
```

### 3. Run Development Server
```bash
npm run dev
```

Open http://localhost:5173 in your browser.

### 4. Build for Production
```bash
npm run build
```

## 📖 Documentation

- [Architecture Documentation](./ARCHITECTURE.md) - System design and component overview
- [Diff Algorithm Explanation](./DIFF_ALGORITHM.md) - LCS algorithm details, complexity analysis
- [Accessibility Implementation](./ACCESSIBILITY.md) - WCAG AA compliance, keyboard navigation
- [Error Handling Strategy](./ERROR_HANDLING.md) - Comprehensive error handling approach

## 🎮 Usage

### Text Input
1. Enter your prompt in the text area
2. Adjust temperature and max tokens if desired
3. Press Enter or click Submit to send
4. Watch live token counter as response streams in

### Audio Input
1. Click the microphone button to start recording
2. Speak your prompt clearly
3. Speech transcribed automatically to text
4. Recording stops when you click the stop button
5. Transcribed text becomes the prompt
6. Submit as normal

### Compare Mode
1. Click the "Compare" button in the navbar
2. Same prompt sent to two models with different temperatures
3. Both streams run in parallel
4. Diff generated automatically when both complete
5. Token-level changes highlighted in diff view

## ♿ Accessibility

WCAG 2.1 Level AA compliant:
- ✅ Full keyboard navigation
- ✅ Screen reader support
- ✅ 4.5:1 minimum color contrast
- ✅ Proper ARIA labels and roles

See [ACCESSIBILITY.md](./ACCESSIBILITY.md) for details.

## 🌐 Deployment

### Deploy to Vercel
1. Push to GitHub
2. Go to https://vercel.com
3. Import repository
4. Select "Client" folder as root
5. Add `VITE_GROQ_API_KEY` environment variable
6. Deploy

### Deploy to Netlify
1. Run `npm run build`
2. Drag `dist` folder to https://app.netlify.com/drop
3. Add environment variables in dashboard

## 📚 Project Structure

- `src/pages/PlayGround.tsx` - Main component
- `src/hooks/useAudioInput.ts` - Web Speech API integration
- `src/lib/diff.ts` - LCS diff algorithm
- Documentation files: ARCHITECTURE.md, DIFF_ALGORITHM.md, ACCESSIBILITY.md, ERROR_HANDLING.md

## 🔒 Security

- API keys in environment variables (not committed)
- Input validation before API calls
- Error messages don't expose internals
- No sensitive data in logs

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
