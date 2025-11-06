# Chat Application

A real-time chat application built with Flask (backend) and HTML/CSS/JavaScript (frontend).

## Features

- User registration and login
- Public chat (group messaging)
- Private chat (one-on-one messaging)
- Real-time message updates
- User authentication with password hashing

## Project Structure

```
chat/
├── app.py                 # Flask backend server
├── requirements.txt       # Python dependencies
├── chat.db               # SQLite database (auto-generated)
├── chat.html             # Main chat page
├── login-register.html    # Login/Register page
├── CSS/
│   ├── chat.css          # Chat page styles
│   └── login-register.css # Login/Register styles
└── JS/
    ├── chat.js           # Chat functionality
    └── script.js          # Login/Register functionality
```

## Setup

### Prerequisites

- Python 3.7+
- pip (Python package manager)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd chat
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Run the Flask server:
```bash
python app.py
```

4. Open your browser and navigate to:
```
http://localhost:5000
```

5. Open `login-register.html` in your browser to register/login.

## GitHub Deployment

### Option 1: Frontend Only (GitHub Pages)

**Note:** GitHub Pages only supports static websites. The Flask backend won't work on GitHub Pages.

1. **Create a new repository on GitHub:**
   - Go to GitHub.com
   - Click "New repository"
   - Name it (e.g., "chat-app")
   - Make it Public (for free GitHub Pages)
   - Click "Create repository"

2. **Initialize Git in your project:**
```bash
cd C:\Users\tarek\Desktop\chat
git init
git add .
git commit -m "Initial commit"
```

3. **Connect to GitHub:**
```bash
git remote add origin https://github.com/YOUR_USERNAME/chat-app.git
git branch -M main
git push -u origin main
```

4. **Enable GitHub Pages:**
   - Go to your repository on GitHub
   - Click "Settings"
   - Scroll to "Pages" in the left sidebar
   - Under "Source", select "main" branch and "/ (root)" folder
   - Click "Save"
   - Your site will be available at: `https://YOUR_USERNAME.github.io/chat-app/`

**⚠️ Important:** The backend won't work on GitHub Pages. You'll need to:
- Deploy the Flask backend separately (see Option 2)
- Update the API_URL in `chat.js` to point to your deployed backend

### Option 2: Full Project (GitHub Repository + Separate Backend Deployment)

1. **Push to GitHub (same as above)**

2. **Deploy Backend to a Cloud Service:**

   **Option A: Railway**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub
   - Create new project
   - Deploy from GitHub repository
   - Add environment variables if needed
   - Your backend will be available at a Railway URL

   **Option B: Render**
   - Go to [render.com](https://render.com)
   - Sign up with GitHub
   - Create new Web Service
   - Connect your GitHub repository
   - Build command: `pip install -r requirements.txt`
   - Start command: `python app.py`
   - Your backend will be available at a Render URL

   **Option C: Heroku**
   - Install Heroku CLI
   - Create `Procfile` with: `web: python app.py`
   - Deploy: `heroku create` then `git push heroku main`

3. **Update Frontend API URL:**
   - After deploying backend, update `API_URL` in `JS/chat.js`:
   ```javascript
   const API_URL = 'https://your-backend-url.com';
   ```

4. **Redeploy Frontend:**
   - Commit and push changes
   - GitHub Pages will auto-update

## Local Development

1. Start the Flask server:
```bash
python app.py
```

2. The server runs on `http://127.0.0.1:5000`

3. Open `login-register.html` in your browser

## Technologies Used

- **Backend:** Flask (Python)
- **Frontend:** HTML, CSS, JavaScript (jQuery)
- **Database:** SQLite
- **Security:** Werkzeug password hashing

## License

This project is open source and available for use.

