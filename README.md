<p align="center">
  <img src="https://img.icons8.com/fluency/96/graduation-cap.png" alt="EduForge Logo" width="80" />
</p>

<h1 align="center">EduForge</h1>

<p align="center">
  <strong>Transform any PDF into a structured, AI-powered e-learning course — in seconds.</strong>
</p>

<p align="center">
  <a href="#-features"><img src="https://img.shields.io/badge/Features-8-6366f1?style=for-the-badge" alt="Features" /></a>
  <a href="#-tech-stack"><img src="https://img.shields.io/badge/Stack-Next.js%20%2B%20FastAPI-8b5cf6?style=for-the-badge" alt="Tech Stack" /></a>
  <a href="#-getting-started"><img src="https://img.shields.io/badge/Setup-5%20min-10b981?style=for-the-badge" alt="Setup" /></a>
  <a href="#-license"><img src="https://img.shields.io/badge/License-MIT-f59e0b?style=for-the-badge" alt="License" /></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/Supabase-Auth%20%2B%20DB-3fcf8e?logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/Ollama-Llama%203.2-ff6f00?logo=meta&logoColor=white" alt="Ollama" />
  <img src="https://img.shields.io/badge/LangGraph-Agent-1a73e8?logo=langchain&logoColor=white" alt="LangGraph" />
  <img src="https://img.shields.io/badge/ChromaDB-Vector%20Search-ff6b6b?logo=google-chrome&logoColor=white" alt="ChromaDB" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white" alt="TypeScript" />
</p>

---

## 📖 What is EduForge?

**EduForge** is a full-stack AI learning platform that transforms raw PDF documents into complete, interactive e-learning courses. Upload any study material — textbook chapters, research papers, lecture notes — and EduForge's multi-step AI pipeline will analyze, structure, and generate a full course with chapters, lessons, quizzes, and an AI tutor chatbot.

> **The problem:** Students and educators spend hours manually organizing study materials into structured learning paths.  
> **The solution:** EduForge automates the entire process using a LangGraph-powered AI agent that chunks, extracts topics, generates hierarchical course structures, self-validates, and refines — all in one pipeline.

---

## ✨ Features

### 🧠 AI-Powered Course Generation
Upload a PDF and watch as a **5-node LangGraph agent** transforms it into a structured course:
1. **Chunking** — Intelligently splits document text into digestible segments
2. **Topic Extraction** — Identifies key concepts and themes
3. **Structure Generation** — Builds a hierarchical course (Chapters → Topics → Lessons)
4. **Self-Validation** — Evaluates the quality of the generated outline
5. **Refinement** — Produces a polished final course based on validation feedback

### 📚 Interactive Course Viewer
- **Hierarchical navigation** — Collapsible sidebar with Chapters, Topics, and Lessons
- **Rich lesson content** — Explanations, real-world examples, key takeaways, and summaries
- **Progress tracking** — Mark lessons complete with visual progress bars per chapter and overall

### 💬 AI Course Tutor (RAG-Powered)
- Context-aware Q&A chatbot trained on your specific course content
- **RAG pipeline** using ChromaDB vector search with `all-MiniLM-L6-v2` embeddings
- Suggested prompt chips: *"Summarize this chapter"*, *"Explain the core concept"*, *"Generate a practice question"*

### 📝 AI-Generated Quizzes
- Auto-generated multiple-choice quizzes per chapter
- Instant scoring with detailed explanations
- Question-by-question review with correct/incorrect highlighting

### 🔍 Course Search & Discovery
- Search across all your courses with real-time results
- Debounced search with result cards

### 👤 User Profiles & Auth
- **Supabase Auth** — Email/password + Google OAuth
- Personal dashboard with learning statistics
- Session persistence and secure token-based API access

### 📊 Learning Dashboard
- At-a-glance stats: Total Courses, Hours Learned, Average Quiz Score, Current Streak
- Course cards with status indicators (Ready, Generating, Uploaded, Error)
- Quick access to upload and continue learning

### 🎨 Glassmorphism UI
- Dark-first design with frosted glass components
- Smooth animations powered by Framer Motion
- Custom glass cards, buttons, inputs, and chips
- Glowing gradient accents and shimmer effects

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js 16)                        │
│                                                                     │
│  Landing ─── Auth ─── Dashboard ─── Upload ─── Course ─── Quiz     │
│                          │            │          │   │               │
│                          │            │          │   └── Chat (RAG)  │
│                     Supabase Auth  apiClient  apiClient              │
└────────────────────────────┬────────────┬───────────────────────────┘
                             │            │
                    Auth Tokens    REST API (JSON)
                             │            │
┌────────────────────────────┴────────────┴───────────────────────────┐
│                       BACKEND (FastAPI)                              │
│                                                                     │
│  Routers:  /upload  /course  /chat  /quiz  /progress  /search       │
│                │        │       │      │        │         │          │
│  Services:  PDF     LangGraph  RAG   LLM    Supabase   Supabase    │
│            Service   Agent    Service Service  Client    Client     │
│               │        │       │      │                             │
│            pdfplumber  │    ChromaDB  Ollama                        │
│                        │   (Vectors) (llama3.2)                     │
│                     5-Node                                          │
│                     Pipeline                                        │
└─────────────────────────────────────────────────────────────────────┘
                             │
                    ┌────────┴────────┐
                    │    Supabase     │
                    │   (PostgreSQL)  │
                    │                 │
                    │  • courses      │
                    │  • chat_history │
                    │  • quizzes      │
                    │  • progress     │
                    └─────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **Next.js 16** | React framework with App Router |
| **React 19** | UI library |
| **TypeScript 5** | Type safety |
| **Tailwind CSS 4** | Utility-first styling |
| **Framer Motion** | Animations & transitions |
| **shadcn/ui** | UI component primitives |
| **Lucide React** | Icon system |
| **next-themes** | Dark/light mode |
| **Supabase JS** | Auth & session management |

### Backend
| Technology | Purpose |
|---|---|
| **FastAPI** | Async Python web framework |
| **Uvicorn** | ASGI server |
| **LangGraph** | Multi-step AI agent orchestration |
| **Ollama** | Local LLM inference (Llama 3.2 3B) |
| **ChromaDB** | Vector database for RAG |
| **sentence-transformers** | Text embeddings (`all-MiniLM-L6-v2`) |
| **pdfplumber** | PDF text extraction |
| **Supabase Python** | Database & auth verification |
| **Pydantic** | Data validation & schemas |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **Python** ≥ 3.10
- **Ollama** installed and running ([ollama.com](https://ollama.com))
- **Supabase** project ([supabase.com](https://supabase.com))

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/EduForge.git
cd EduForge
```

### 2. Set Up the Backend

```bash
cd backend

# Create and activate a virtual environment
python -m venv venv
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Configure Environment Variables

Create `backend/.env`:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
OLLAMA_URL=http://localhost:11434/api/generate
```

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 4. Set Up the Database

Create the following tables in your Supabase project:

<details>
<summary>📋 SQL Schema (click to expand)</summary>

```sql
-- Courses table
CREATE TABLE courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  title TEXT,
  raw_text TEXT,
  status TEXT DEFAULT 'uploaded',
  course_structure JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Chat history table
CREATE TABLE chat_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES courses(id),
  user_id UUID REFERENCES auth.users(id),
  query TEXT,
  answer TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Quizzes table
CREATE TABLE quizzes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES courses(id),
  chapter_index INTEGER,
  questions JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Progress table
CREATE TABLE progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES courses(id),
  user_id UUID REFERENCES auth.users(id),
  lesson_id TEXT,
  completed_at TEXT,
  UNIQUE(course_id, user_id, lesson_id)
);

-- Enable Row Level Security
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress ENABLE ROW LEVEL SECURITY;
```

</details>

### 5. Pull the LLM Model

```bash
ollama pull llama3.2:3b
```

### 6. Start the Backend

```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 7. Install Frontend Dependencies & Run

```bash
# From the project root
npm install
npm run dev
```

### 8. Open the App

Navigate to **[http://localhost:3000](http://localhost:3000)** and start transforming PDFs into courses! 🎉

---

## 📡 API Reference

All authenticated endpoints require an `Authorization: Bearer <token>` header.

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/` | ❌ | API welcome message & version |
| `GET` | `/health` | ❌ | Health check |
| `POST` | `/upload/` | ✅ | Upload PDF document (multipart/form-data) |
| `POST` | `/course/{id}/generate` | ✅ | Trigger AI course generation |
| `GET` | `/course/{id}` | ✅ | Get course details & structure |
| `POST` | `/chat/{id}` | ✅ | Send message to AI tutor (RAG) |
| `POST` | `/quiz/generate/{id}/{chapter}` | ✅ | Generate chapter quiz |
| `PUT` | `/progress/{id}/{lesson_id}` | ✅ | Mark lesson as complete |
| `GET` | `/progress/{id}` | ✅ | Get course progress & completion % |
| `GET` | `/search/?q={query}` | ✅ | Search courses by title |

---

## 📁 Project Structure

```
EduForge/
├── app/                          # Next.js App Router pages
│   ├── page.tsx                  # Landing page
│   ├── layout.tsx                # Root layout (theme, header, fonts)
│   ├── globals.css               # Global styles & design tokens
│   ├── login/                    # Login page (email + Google OAuth)
│   ├── signup/                   # Registration page
│   ├── dashboard/                # Learning dashboard
│   ├── upload/                   # PDF upload (drag & drop)
│   ├── course/[id]/              # Course viewer + AI chat
│   │   ├── page.tsx              # Interactive lesson viewer
│   │   ├── generate/page.tsx     # Generation progress screen
│   │   └── chat/page.tsx         # AI tutor chatbot
│   ├── quiz/[id]/                # Chapter quiz module
│   ├── search/                   # Course search
│   └── profile/                  # User profile & settings
├── components/                   # Reusable React components
│   ├── header.tsx                # Navigation bar
│   ├── theme-provider.tsx        # Dark/light theme wrapper
│   └── ui/                       # Glass design system
│       ├── glass-button.tsx      # Glassmorphism button
│       ├── glass-card.tsx        # Frosted glass card
│       ├── glass-chip.tsx        # Status pill / tag
│       ├── glass-input.tsx       # Frosted input field
│       └── button.tsx            # Base button primitive
├── lib/                          # Utilities & clients
│   ├── utils.ts                  # cn() class merge helper
│   ├── supabase.ts               # Supabase client init
│   └── apiClient.ts              # Authenticated API wrapper
├── backend/                      # FastAPI backend
│   ├── app/
│   │   ├── main.py               # App entry point & router mounts
│   │   ├── models/schemas.py     # Pydantic request/response models
│   │   ├── routers/              # API route handlers
│   │   │   ├── upload.py         # PDF upload endpoint
│   │   │   ├── course.py         # Course CRUD & generation
│   │   │   ├── chat.py           # RAG chatbot endpoint
│   │   │   ├── quiz.py           # Quiz generation endpoint
│   │   │   ├── progress.py       # Progress tracking
│   │   │   └── search.py         # Course search
│   │   ├── services/             # Business logic
│   │   │   ├── langgraph_agent.py # 5-node course generation agent
│   │   │   ├── llm_service.py    # Ollama LLM integration
│   │   │   ├── pdf_service.py    # PDF text extraction
│   │   │   ├── rag_service.py    # Vector search & embeddings
│   │   │   └── supabase_client.py # Database client
│   │   └── utils/auth.py         # JWT auth middleware
│   └── test_endpoints.py         # API integration tests
├── package.json
├── requirements.txt
└── README.md
```

---

## 🧪 Running Tests

### Backend Integration Tests

```bash
cd backend
python test_endpoints.py
```

This runs a sequential test suite covering all 8 endpoint groups with timing and detailed reporting.

### Frontend Lint

```bash
npm run lint
```

---

## 🗺️ Roadmap

- [ ] **Export courses** to PDF / EPUB
- [ ] **Collaborative learning** — share courses with others
- [ ] **Spaced repetition** — intelligent review scheduling
- [ ] **Multiple file upload** — combine multiple PDFs into one course
- [ ] **Custom LLM support** — plug in OpenAI, Anthropic, or other providers
- [ ] **Mobile app** — React Native companion
- [ ] **Gamification** — XP, badges, and leaderboards
- [ ] **Analytics dashboard** — learning insights and heatmaps

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

Please make sure to update tests as appropriate and follow the existing code style.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  <strong>Built with ❤️ by the EduForge team</strong>
</p>

<p align="center">
  <sub>If you found this project useful, consider giving it a ⭐ on GitHub!</sub>
</p>
