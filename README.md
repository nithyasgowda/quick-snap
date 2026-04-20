## QuickSnap — Screenshot & Image Analyzer

QuickSnap is a React + Node.js (Express) based web application that allows you to:
- Capture full-page screenshots of any website URL using Puppeteer
- Analyze screenshots with OCR (Tesseract.js) to extract readable text
- Detect top colors from the image using ColorThief
- Generate the HTML and CSS code using Puppeteer

## Features
- Capture full-page website screenshots
- Analyze text (OCR) without any manual tessdata setup
- Extract top colors from screenshots
- Responsive React frontend
- CORS-enabled Express backend
- Works with Node.js v18–22+
- Modular architecture with clear folder structure

## Tech Stack
Frontend: React.js + Vite
Backend: Node.js (Express + Puppeteer)

- Screenshot Engine	Puppeteer
- Text Extraction (OCR)	Tesseract.js (auto model download)
- Color Extraction	ColorThief
- Language	JavaScript (ES Modules)

## Folder Structure
screenshot-tool/
│
├── backend/
│   ├── src/
│   |   ├── server.js
│   |   ├── screenshot.js
│   |   ├── colors.js
│   |   ├── ocr.js
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   ├── index.css
    │   └── main.jsx
    └── package.json

## 1. Backend Setup
Navigate to backend
- cd backend 
- npm install
- npm run dev

Installed Dependencies:
npm install express cors multer puppeteer tesseract.js node-fetch colorthief

The server will start on:
http://localhost:4000

Backend File Summary
server.js
- Handles /screenshot → captures a webpage screenshot
- Handles /analyze-image → performs OCR & color extraction
- Handles /get-code → extracts the original HTML and CSS of the webpage
- Enables CORS for frontend requests

screenshot.js
- Launches a single Puppeteer browser
- Captures full-page PNG screenshots

ocr.js
- Uses Tesseract.js to perform OCR
- Automatically downloads eng.traineddata on first run
- Works online (no manual tessdata setup required)

colors.js
- Uses ColorThief to extract the top 5 dominant colors
- Returns RGB + HEX values for UI display


## 2. Frontend Setup
Navigate to frontend
- cd frontend 
- npm install
- npm run dev

The app runs on:
http://localhost:5173


## API Endpoints
| Endpoint        | Method           | Description                                        | Body / Params                                     |
|-----------------|------------------|----------------------------------------------------|---------------------------------------------------|
| `/screenshot`   | POST             | Capture screenshot from URL                        | `{ "url": "https://example.com" }`                |
| `/analyze-image`| POST (multipart) | Analyze uploaded image for text & colors           | `file=<screenshot.png>`                           |
| `/get-code`     | POST             | Retrieve extracted HTML & CSS for a captured URL   | `{ "url": "https://example.com" }`                |

## Example Flow
Frontend → Backend → Puppeteer Opens Chrome → Goes to URL → Captures full page → Returns PNG → OCR → Colors → Response → Frontend
- Start backend (npm run dev)
- Backend running → http://localhost:4000
- Start frontend (npm run dev)
- Open your browser → http://localhost:5173
- Enter any valid URL in the input field (e.g., https://example.com)
- Click Capture → screenshot displays
- Click Download → the screenshot.png will download
- Click Analyze (OCR + Colors) → extracted text & top 5 colors appear below the image
- Click Generate Code → extracts the original HTML and CSS of the webpage
Frontend → Backend → Puppeteer Opens Chrome → Goes to URL → Captures full page → Returns PNG → OCR → Colors → Code → Response → Frontend

## Common Issues & Fixes
| Issue                       | Reason                                    | Fix                                                         |
|-----------------------------|-------------------------------------------|-------------------------------------------------------------|
| Could not find Chrome       | Puppeteer can’t locate Chrome             | Run `npx puppeteer browsers install chrome`                 |
| Network Error in frontend   | Backend not running or wrong port         | Start backend on port 4000                                  |
| OCR loading forever         | Large image or slow network               | Wait for model to download (first time only)                |
| Fetch failed (Tesseract)    | No internet for model download            | Connect to internet for first OCR run                       |
| Screenshot timeout          | Site taking too long to load              | Increase timeout in `screenshot.js`                         |


