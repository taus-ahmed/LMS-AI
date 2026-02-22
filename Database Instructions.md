## Local Database Storage

This app uses **IndexedDB** (via Dexie.js) to store all data locally on your device:

- **No server costs**: Everything runs in your browser
- **Persistent data**: Student progress, chat history, and projects are saved locally
- **Privacy**: Your data stays on your device
- **Fast**: IndexedDB provides quick data access

### What gets stored locally:
- Student profile and progress
- Course module completion status
- Skills assessment data
- Chat history with AI mentor
- Generated project briefs and milestones

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure AI (optional):**
   - Get a Groq API key from [Groq Console](https://console.groq.com/)
   - Create a `.env` file:
     ```
     VITE_GROQ_API_KEY=your_api_key_here
     ```
   - Without an API key, the AI mentor will show connection error messages

3. **Run development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **State Management**: Zustand
- **Local Database**: IndexedDB with Dexie.js
- **AI Integration**: Groq API (Llama 3.3 70B)
- **Build Tool**: Vite
- **Animations**: Framer Motion

## Data Architecture

The app uses a local IndexedDB database with the following structure:

```typescript
interface StudentProfile {
  name: string;
  studentId: string;
  course: string;
  skills: SkillArea[];
  weekModules: WeekModule[];
  project?: ProjectBrief;
  chatHistory: ChatMessage[];
}
```

All data is automatically saved to the local database when changes occur.