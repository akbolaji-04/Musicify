# 🎵 Musicify

A modern music streaming and discovery platform powered by the Spotify Web API, featuring real-time collaborative listening rooms, smart recommendations, and beautiful visualizations.

![React](https://img.shields.io/badge/React-18+-61DAFB?logo=react)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js)
![TypeScript](https://img.shields.io/badge/TypeScript-Optional-3178C6?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?logo=tailwind-css)

## ✨ Features

- 🎸 **Spotify Integration** - Full authentication with PKCE flow
- 🔍 **Smart Search** - Search tracks, artists, albums, and playlists
- 🎧 **Music Playback** - Preview tracks with visualizer
- 🎲 **Smart Mix Generator** - AI-powered recommendations based on mood
- 👥 **Collaborative Rooms** - Real-time listening rooms with Socket.io
- 📝 **Lyrics Integration** - View synchronized lyrics
- 💾 **Offline Caching** - Cache previews for offline playback
- 📊 **User Dashboard** - View your listening stats and top tracks
- 🎨 **Beautiful UI** - Dark/light themes with smooth animations

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Spotify Developer Account ([Create one here](https://developer.spotify.com/dashboard))
- Spotify App credentials (Client ID and Client Secret)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd musicify
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Set up environment variables**

   **Backend** (`backend/.env`):
   ```env
   SPOTIFY_CLIENT_ID=your_spotify_client_id
   SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
   SPOTIFY_REDIRECT_URI=http://localhost:5173/auth/callback
   PORT=5000
   ```

   **Frontend** (`frontend/.env`):
   ```env
   VITE_API_BASE_URL=http://localhost:5000
   VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id
   VITE_REDIRECT_URI=http://localhost:5173/auth/callback
   ```

4. **Run the development servers**
   ```bash
   npm run dev
   ```

   - Frontend: http://localhost:5173
   - Backend: http://localhost:5000

## 📁 Project Structure

```
musicify/
├── backend/          # Express server with Spotify API
├── frontend/         # React + Vite application
├── .github/          # CI/CD workflows
└── README.md
```

## 🛠️ Tech Stack

### Frontend
- **React 18+** - UI library
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Socket.io-client** - Real-time features
- **IndexedDB** - Offline caching
- **WebAudio API** - Audio visualizer

### Backend
- **Express 5** - Web framework
- **Socket.io** - WebSocket server
- **Spotify Web API** - Music data
- **PKCE** - Secure authentication

## 🎮 Usage

### Keyboard Shortcuts
- `Space` - Play/Pause
- `←` / `→` - Previous/Next track
- `L` - Like current track
- `S` - Share

## 🚀 Deployment

### Frontend (Vercel)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push

### Backend (Render)
1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set environment variables
4. Deploy

See `DEMO_GUIDE.md` for detailed deployment instructions.

## 📝 License

MIT License - see LICENSE file for details

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines first.

## 📸 Demo

![Demo GIF Placeholder](https://via.placeholder.com/800x400?text=Musicify+Demo)

---

Built with ❤️ using React, Node.js, and Spotify Web API



