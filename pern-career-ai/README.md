# README.md

# PERN Career AI

This project is a web application built using the PERN stack (PostgreSQL, Express, React, Node.js) that leverages Google Gemini AI to analyze user CVs and suggest career paths, skill gaps, and roadmaps for professional development.

## Features

- **CV Analysis**: Users can upload their CVs, and the AI will analyze the content to provide insights.
- **Career Path Suggestions**: The application suggests potential career paths based on the user's current skills and market data.
- **Skill Gap Identification**: The AI identifies missing skills and provides recommendations on how to acquire them.
- **Roadmap Creation**: Users receive a structured roadmap to guide their career development over time.

## Project Structure

```
pern-career-ai
├── client                # Frontend application
│   ├── src
│   │   ├── pages        # React components for different pages
│   │   │   ├── CareerPath.jsx
│   │   │   └── index.js
│   │   ├── services     # API service functions
│   │   │   └── api.js
│   │   ├── components    # Reusable components
│   │   │   ├── CareerRoadmap.jsx
│   │   │   ├── SkillGapCard.jsx
│   │   │   └── PathCard.jsx
│   │   ├── App.jsx      # Main application component
│   │   └── index.js     # Entry point for React
│   ├── package.json     # Frontend dependencies
│   └── tailwind.config.js # Tailwind CSS configuration
├── server                # Backend application
│   ├── controllers       # Controllers for handling requests
│   │   └── careerController.js
│   ├── routes            # API routes
│   │   └── careerRoutes.js
│   ├── config            # Configuration files
│   │   └── gemini.js
│   ├── middleware        # Middleware for error handling
│   │   └── errorHandler.js
│   ├── server.js         # Entry point for the server
│   └── package.json      # Backend dependencies
├── .env                  # Environment variables
├── .gitignore            # Files to ignore in Git
└── README.md             # Project documentation
```

## Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd pern-career-ai
   ```

2. Install dependencies for both client and server:
   ```
   cd client
   npm install
   cd ../server
   npm install
   ```

3. Set up environment variables:
   - Create a `.env` file in the `server` directory and add your Google Gemini API key:
     ```
     GEMINI_API_KEY=your_api_key_here
     ```

4. Start the server:
   ```
   cd server
   node server.js
   ```

5. Start the client:
   ```
   cd client
   npm start
   ```

## Usage

- Navigate to the application in your browser.
- Paste your CV text into the provided text area.
- Click the "Analyze Career Path" button to receive insights and recommendations.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or features you'd like to add.

## License

This project is licensed under the MIT License. See the LICENSE file for details.