#  PrepSnippet - AI-Powered Interview Preparation Platform

**Transform your code snippets into interview-ready knowledge with AI.**

PrepSnippet is an intelligent code snippet manager that not only stores your code but automatically generates explanations, tags, complexity analysis, and interview Q&A - helping you ace coding interviews.

---

##  Features

###  Core Features
- **Smart Code Storage** - Save snippets from 15+ programming languages
- **AI Auto-Detection** - Automatically detects programming language
- **AI Auto-Tagging** - Generates relevant tags for easy organization
- **AI Explanations** - Get plain-English explanations of your code
- **Complexity Analysis** - Automatic Big O time/space complexity detection

###  Interview Preparation (Unique Feature)
- **Interview Q&A Generation** - Converts code into interview questions and answers
- **Show/Hide Answers** - Practice answering before revealing solutions
- **Regenerate Q&A** - Get different questions for the same code
- **Instant Results** - AI generates everything in seconds

###  Organization & Management
- **Favorites** - Mark important snippets
- **Search & Filter** - Find snippets by code, tags, or language
- **Dashboard** - Clean interface to manage all snippets
- **Quick Delete** - Remove snippets from dashboard or detail view

---

##  Tech Stack

### **Frontend**
- **React 18** - Modern UI framework
- **React Router v6** - Client-side routing
- **Vite** - Fast build tool
- **Tailwind CSS** - Utility-first styling
- **Axios** - HTTP client
- **Lucide React** - Beautiful icons

### **Backend**
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - Object modeling

### **AI & Services**
- **Google Gemini API** - AI for code analysis
- **Groq LLaMA 3.1** - Interview Q&A generation
- **JWT** - Secure authentication
- **Bcrypt** - Password hashing

---

##  Prerequisites

Before you begin, ensure you have:

- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **MongoDB** - Choose one:
  - [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (Cloud, Free)
  - [MongoDB Community](https://www.mongodb.com/try/download/community) (Local)
- **Google Gemini API Key** - [Get Free Key](https://makersuite.google.com/app/apikey)
- **Groq API Key** - [Get Free Key](https://console.groq.com/)

---

##  Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/addiiiti/PrepSnippet.git
cd PrepSnippet
```

### 2. Backend Setup

```bash
# Navigate to server folder
cd server

# Install dependencies
npm install

# Create .env file
cp .env.example .env
```

**Edit `server/.env` with your credentials:**

```env
# MongoDB Connection
MONGODB_URI=your_mongodb_connection_string

# JWT Secret (use any random string)
JWT_SECRET=your_super_secret_jwt_key_change_this

# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key

# Groq API
GROQ_API_KEY=your_groq_api_key

# Server Configuration
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

**Start the backend server:**

```bash
npm run dev
```

You should see:
```
 MongoDB Connected
 Server running on port 5000
```

### 3. Frontend Setup

Open a new terminal:

```bash
# Navigate to client folder
cd client

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will run on: `http://localhost:5173`

---

##  Usage

### Creating Your First Snippet

1. **Sign Up** - Create an account
2. **Login** - Access your dashboard
3. **Click "Add Snippet"**
4. **Enter Details:**
   - Title (e.g., "Binary Search")
   - Code (paste your code)
   - Optional: Custom tags and notes
5. **Click "Submit"**
6. **AI Generates:**
   - Language detection
   - Relevant tags
   - Code explanation
   - Complexity analysis
   - Interview Q&A

### Using Interview Mode

1. View the AI-generated questions
2. Click **"Show"** to reveal answers one by one
3. Click **"Regenerate Q&A"** for different questions
4. Practice answering before checking solutions

---

##  Project Structure

```
PrepSnippet/
├── client/                    # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   │   ├── common/        # Navbar, Button, SearchBar
│   │   │   ├── snippet/       # SnippetCard, SnippetList, CodeEditor
│   │   │   └── auth/          # LoginForm, SignupForm
│   │   ├── pages/             # Main pages
│   │   │   ├── LandingPage.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── AddSnippet.jsx
│   │   │   ├── SnippetView.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   └── SignupPage.jsx
│   │   ├── services/          # API services
│   │   └── styles/            # CSS files
│   └── package.json
│
├── server/                    # Backend (Node.js + Express)
│   ├── src/
│   │   ├── config/            # Database and AI configuration
│   │   ├── controllers/       # Request handlers
│   │   ├── middleware/        # Auth and error handling
│   │   ├── models/            # MongoDB schemas
│   │   ├── routes/            # API endpoints
│   │   └── services/          # Business logic
│   ├── server.js              # Entry point
│   └── package.json
```

---

##  Design Methodology

### Architecture
- **MVC Pattern** - Model-View-Controller separation
- **RESTful API** - Standard HTTP methods and endpoints
- **Component-Based UI** - Reusable React components
- **State Management** - React hooks (useState, useEffect)

### Security
- **JWT Authentication** - Secure token-based auth
- **Password Hashing** - Bcrypt with salt rounds
- **Protected Routes** - Middleware for auth verification
- **CORS Configuration** - Cross-origin resource sharing

### User Experience
- **Optimistic UI Updates** - Instant feedback
- **Loading States** - Clear visual indicators
- **Error Handling** - User-friendly error messages
- **Responsive Design** - Mobile and desktop friendly

---

##  Deployment

### Backend
```bash
# Build command
npm install

# Start command
npm start

# Environment variables
Set all variables from .env in platform dashboard
```

### Frontend
```bash
# Build command
npm run build

# Output directory
dist

# Environment variables
VITE_API_URL=your_backend_url
```

---

##  Author

**Aditi**
- GitHub: [@addiiiti](https://github.com/addiiiti)

---

**⭐ If you find this project useful, please give it a star on GitHub!**

Aditi Kumari - BTech CSE, 6th Semester  
MUJ

---

