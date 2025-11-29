# 🚀 Quick Start Guide

## 1. Setup Database

```bash
# Create PostgreSQL database
createdb ai_job_board

# Run schema
psql -d ai_job_board -f server/database.sql
```

## 2. Configure Environment

```bash
# Copy environment template
cd server
cp .env.example .env

# Edit .env with your values
# Required: DATABASE_URL, GEMINI_API_KEY
```

## 3. Install Dependencies

```bash
# From root directory
npm install

# Install client deps
cd client && npm install

# Install server deps
cd ../server && npm install
```

## 4. Test AI Configuration

```bash
cd server
node test-final-config.js
```

Expected output:
```
✅ gemini-2.5-flash works!
✅ text-embedding-004 works!
✅ Correct dimension: 768
✅ Full workflow test PASSED!
```

## 5. Start Development

```bash
# From root directory
npm run dev
```

Visit:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## 6. Create Test Accounts

### Candidate Account
- Email: candidate@test.com
- Password: password123
- Role: Candidate

### Employer Account
- Email: employer@test.com
- Password: password123
- Role: Employer
- Company: Test Company

## 7. Test Features

### As Candidate:
1. Browse jobs at http://localhost:3000
2. Click on a job
3. Upload CV (use sample CV from `test-data/sample-cv.pdf`)
4. Try "Calculate Match Score"
5. Try "Get AI Suggestions"
6. Apply to job
7. View applications at "My Applications"

### As Employer:
1. Login at http://localhost:3000/login
2. Go to Dashboard
3. Click "Post New Job"
4. Fill job details and submit
5. View applications for your job
6. Review CVs and update application status

## Troubleshooting

**Database connection failed:**
```bash
# Check PostgreSQL is running
pg_isready

# Test connection
psql -d ai_job_board
```

**AI features not working:**
```bash
# Verify API key
node server/check-ai.js

# Test models
node server/test-final-config.js
```

**Port already in use:**
```bash
# Change PORT in server/.env
PORT=5001

# Update proxy in client/vite.config.js
```