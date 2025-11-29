# 🚀 AI-Powered IT Job Board

A modern, full-stack job board platform that leverages AI to match job seekers with perfect opportunities. Built with the PERN stack (PostgreSQL, Express, React, Node.js) and integrated with Google's Gemini AI for intelligent CV analysis and job matching.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen)
![React](https://img.shields.io/badge/react-18.3.1-blue)

## ✨ Features

### 🎯 For Job Seekers (Candidates)
- **Smart Job Search**: Browse available job postings with clean, intuitive interface
- **AI-Powered CV Analysis**: Upload your CV and get instant feedback
- **Match Score Calculation**: See how well your CV matches each job (0-100%)
- **AI Suggestions**: Get personalized recommendations to improve your CV
- **Application Tracking**: View all your applications and their status
- **One-Click Apply**: Apply to jobs with your pre-uploaded CV

### 💼 For Employers
- **Easy Job Posting**: Create and manage job listings
- **Application Management**: View and manage all applications in one place
- **Candidate Filtering**: Filter applications by status (pending, reviewed, accepted, rejected)
- **CV Viewing**: Preview and download candidate CVs
- **Real-time Dashboard**: See application statistics and metrics
- **Status Updates**: Mark applications as reviewed, accepted, or rejected

### 🤖 AI-Powered Features
- **Vector Search**: Uses embeddings to calculate semantic similarity between CVs and jobs
- **CV Tailoring**: AI analyzes your CV against job descriptions
- **Missing Keywords Detection**: Identifies important terms missing from your CV
- **Skill Gap Analysis**: Shows which skills you should highlight
- **Actionable Improvements**: Get specific suggestions to enhance your application

## 🛠️ Tech Stack

### Frontend
- **React 18.3** - UI library
- **React Router v6** - Navigation
- **Axios** - HTTP client
- **TailwindCSS** - Styling
- **Vite** - Build tool

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **PostgreSQL** - Database
- **pgvector** - Vector similarity search
- **JWT** - Authentication
- **Multer** - File uploads
- **bcryptjs** - Password hashing

### AI & ML
- **Google Gemini AI** - Text generation and embeddings
  - `gemini-2.5-flash` - For CV analysis and suggestions
  - `text-embedding-004` - For semantic matching (768 dimensions)

## 📁 Project Structure

```
ai-job-board/
├── client/                          # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── CVUpload.jsx        # CV upload component
│   │   │   ├── JobDetail.jsx       # Job details with AI features
│   │   │   ├── JobForm.jsx         # Job posting form
│   │   │   ├── JobList.jsx         # Job listings
│   │   │   ├── Navigation.jsx      # Main navigation
│   │   │   └── ProtectedRoute.jsx  # Route protection
│   │   ├── context/
│   │   │   └── AuthContext.jsx     # Authentication context
│   │   ├── pages/
│   │   │   ├── AllApplications.jsx      # All applications view
│   │   │   ├── EmployerApplications.jsx # Job-specific applications
│   │   │   ├── EmployerDashboard.jsx    # Employer dashboard
│   │   │   ├── LoginPage.jsx            # Login page
│   │   │   ├── MyApplications.jsx       # Candidate applications
│   │   │   └── RegisterPage.jsx         # Registration page
│   │   ├── services/
│   │   │   └── api.js              # API service layer
│   │   ├── styles/
│   │   │   └── index.css           # Global styles
│   │   ├── App.jsx                 # Main app component
│   │   └── main.jsx                # Entry point
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── vite.config.js
│
├── server/                          # Express backend
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js         # Database connection
│   │   ├── controllers/
│   │   │   ├── aiController.js         # AI features
│   │   │   ├── applicationController.js # Application logic
│   │   │   ├── authController.js       # Authentication
│   │   │   ├── cvController.js         # CV handling
│   │   │   ├── employerController.js   # Employer features
│   │   │   └── jobController.js        # Job CRUD
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js   # JWT verification
│   │   │   └── errorHandler.js     # Error handling
│   │   ├── routes/
│   │   │   ├── aiRoutes.js         # AI endpoints
│   │   │   ├── applicationRoutes.js # Application endpoints
│   │   │   ├── authRoutes.js       # Auth endpoints
│   │   │   ├── cvRoutes.js         # CV endpoints
│   │   │   ├── employerRoutes.js   # Employer endpoints
│   │   │   └── jobRoutes.js        # Job endpoints
│   │   ├── services/
│   │   │   ├── embeddingService.js  # Vector embeddings
│   │   │   └── tailoringService.js  # CV analysis
│   │   ├── utils/
│   │   │   ├── fileHandler.js      # File operations
│   │   │   └── vectorMath.js       # Vector similarity
│   │   └── index.js                # Server entry point
│   ├── database.sql                # Database schema
│   ├── .env.example                # Environment variables template
│   ├── package.json
│   └── test-final-config.js        # AI configuration test
│
├── .gitignore
├── package.json                    # Root package.json
└── README.md                       # This file
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 16.0.0
- **PostgreSQL** >= 13
- **npm** or **yarn**
- **Google Gemini API Key** (free from [Google AI Studio](https://makersuite.google.com/app/apikey))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/ai-job-board.git
   cd ai-job-board
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install

   # Install client dependencies
   cd client
   npm install

   # Install server dependencies
   cd ../server
   npm install
   ```

3. **Set up PostgreSQL database**
   ```bash
   # Create database
   createdb ai_job_board

   # Run database schema
   psql -d ai_job_board -f server/database.sql
   ```

4. **Configure environment variables**
   ```bash
   # Copy example env file
   cd server
   cp .env.example .env
   ```

   Edit `server/.env`:
   ```env
   # Database
   DATABASE_URL=postgresql://username:password@localhost:5432/ai_job_board?sslmode=prefer

   # Google Gemini AI
   GEMINI_API_KEY=your_gemini_api_key_here

   # JWT
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRES_IN=7d

   # Server
   PORT=5000
   CORS_ORIGIN=http://localhost:3000
   ```

5. **Test AI configuration** (Optional but recommended)
   ```bash
   cd server
   node test-final-config.js
   ```

   You should see:
   ```
   ✅ gemini-2.5-flash works!
   ✅ text-embedding-004 works!
   ✅ Correct dimension: 768
   ✅ Full workflow test PASSED!
   ```

### Running the Application

#### Development Mode

```bash
# From root directory - runs both client and server concurrently
npm run dev
```

This will start:
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000

#### Production Mode

```bash
# Build frontend
cd client
npm run build

# Start server (serves static files from client/dist)
cd ../server
npm start
```

## 📖 Usage Guide

### For Job Seekers

1. **Register** as a Candidate
2. **Browse Jobs** on the home page
3. **Click on a job** to view details
4. **Upload your CV** (PDF, DOCX, DOC, or TXT)
5. **Choose an action**:
   - Calculate Match Score (see compatibility %)
   - Get AI Suggestions (receive personalized tips)
   - Apply Now (submit application)
6. **Track applications** in "My Applications"

### For Employers

1. **Register** as an Employer
2. **Complete company profile** (name, description, website, contact)
3. **Post a job** from the dashboard
4. **View applications** for each job
5. **Review CVs** (view online or download)
6. **Update status** (pending → reviewed → accepted/rejected)
7. **Contact candidates** directly via email

## 🔧 API Endpoints

### Authentication
```
POST   /api/auth/register    - Register new user
POST   /api/auth/login       - Login user
GET    /api/auth/profile     - Get user profile (protected)
```

### Jobs
```
GET    /api/jobs             - List all jobs
GET    /api/jobs/:id         - Get job by ID
POST   /api/jobs             - Create job (employer only)
GET    /api/jobs/my-jobs     - Get employer's jobs (protected)
GET    /api/jobs/:id/applications - Get job applications (employer only)
```

### Applications
```
POST   /api/applications/apply              - Apply to job (candidate only)
GET    /api/applications/my-applications    - Get candidate's applications
PATCH  /api/applications/:id/status         - Update application status (employer only)
POST   /api/applications/:id/analyze        - Analyze application (candidate only)
```

### CV
```
POST   /api/cv/upload        - Upload CV
POST   /api/cv/extract-text  - Extract text from CV
```

### AI
```
POST   /api/ai/match         - Calculate match score
POST   /api/ai/tailor-cv     - Get CV suggestions
```

### Employer
```
GET    /api/employer/stats              - Get employer statistics
GET    /api/employer/all-applications   - Get all applications across jobs
```

## 🔐 Authentication

The app uses **JWT** (JSON Web Tokens) for authentication:
- Tokens are stored in `localStorage`
- Protected routes require valid token
- Token expires in 7 days (configurable)
- Separate roles: `candidate` and `employer`

## 🤖 AI Models Used

### Text Generation: `gemini-2.5-flash`
- Fast response time
- High quality text generation
- Used for CV analysis and suggestions

### Embeddings: `text-embedding-004`
- 768-dimensional vectors
- Semantic understanding
- Used for job-CV matching

### How It Works

1. **Job Posting**: Job description → embedding → stored in database
2. **CV Upload**: CV text → embedding → stored with application
3. **Matching**: Calculate cosine similarity between vectors
4. **Score**: Similarity × 100 = Match percentage (0-100%)
5. **Analysis**: LLM analyzes CV against job description
6. **Suggestions**: AI generates actionable improvements

## 🎨 UI/UX Features

- **Responsive Design**: Works on desktop, tablet, and mobile
- **Loading States**: Spinners and progress indicators
- **Error Handling**: User-friendly error messages
- **Success Feedback**: Confirmation messages
- **Drag & Drop**: CV upload with drag-and-drop
- **Color Coding**: Status badges and match scores
- **Icons**: SVG icons throughout the app
- **Smooth Transitions**: CSS animations
- **Accessibility**: Semantic HTML and ARIA labels

## 🧪 Testing

```bash
# Test AI configuration
cd server
node test-final-config.js

# Test available models
node test-available-models.js

# Check API key
node check-ai.js
```

## 🐛 Common Issues & Solutions

### Issue: "API key not valid"
**Solution**: Verify your Gemini API key in `.env` file

### Issue: "Database connection failed"
**Solution**: Check PostgreSQL is running and DATABASE_URL is correct

### Issue: "Model not found"
**Solution**: Run `node test-final-config.js` to verify model access

### Issue: "CORS error"
**Solution**: Ensure CORS_ORIGIN in `.env` matches your frontend URL

### Issue: "Cannot upload CV"
**Solution**: Check file size (<5MB) and format (PDF, DOCX, DOC, TXT)

## 📦 Deployment

### Deploy Backend (Heroku example)

```bash
cd server
heroku create your-app-name
heroku addons:create heroku-postgresql:hobby-dev

# Set environment variables
heroku config:set GEMINI_API_KEY=your_key
heroku config:set JWT_SECRET=your_secret

git push heroku main
```

### Deploy Frontend (Vercel example)

```bash
cd client
vercel --prod
```

Update `CORS_ORIGIN` in server `.env` to match your frontend URL.

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Your Name** - *Initial work* - [YourGitHub](https://github.com/yourusername)

## 🙏 Acknowledgments

- Google Gemini AI for powerful AI capabilities
- PostgreSQL pgvector extension for vector similarity search
- React and Express communities for excellent documentation
- TailwindCSS for beautiful, responsive design

## 📞 Support

If you have any questions or need help, please:
- Open an issue on GitHub
- Email: your.email@example.com
- Join our Discord: [link]

## 🗺️ Roadmap

- [ ] Add more file formats (e.g., RTF)
- [ ] Implement real-time notifications
- [ ] Add video interview scheduling
- [ ] Create mobile apps (React Native)
- [ ] Add multi-language support
- [ ] Implement advanced search filters
- [ ] Add company reviews and ratings
- [ ] Create employer analytics dashboard
- [ ] Add salary negotiation assistant
- [ ] Implement skill assessments

---

**Made with ❤️ by [Your Name]**