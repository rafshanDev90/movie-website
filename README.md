<div align="center">

# 🎬 MOVIEFLIX

**A simple and modern movie website where admins upload movies and users browse, watch, and download them.**

![MERN Stack](https://img.shields.io/badge/MERN_Stack-141414?style=for-the-badge&logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)

---

</div>

## 📖 Overview

MovieFlix is a lightweight movie streaming platform built with the MERN stack. It provides a clean admin panel for managing content and a sleek client interface for users to discover and watch movies — no user authentication required.

<div align="center">

| | |
|:---:|:---:|
| **Admin Panel** | **Client App** |
| Upload movies, manage content, organize lists | Browse movies, search, watch, download |
| Simple login with env credentials | No login required |

</div>

---

## 🚀 Tech Stack

| Layer | Technology |
|:------|:-----------|
| **Backend** | Express.js, Mongoose, Multer, JWT |
| **Admin Panel** | React 18, Vite, Tailwind CSS, Zustand |
| **Client** | React 18, Vite, Tailwind CSS |
| **Database** | MongoDB |
| **File Storage** | Local filesystem (development) |

---

## 📁 Project Structure

```
movie-website/
├── backend/
│   ├── config/          # Database & environment config
│   ├── middleware/       # Admin auth middleware
│   ├── models/          # Movie & List schemas
│   ├── routes/          # API endpoints
│   ├── services/        # File upload service
│   ├── uploads/         # Uploaded files (images/videos)
│   └── server.js        # Express entry point
│
├── admin/               # Admin panel (React + Vite)
│   └── src/
│       ├── pages/       # Login, Dashboard, CRUD pages
│       ├── components/  # Layout, FileUpload
│       └── store/       # Zustand state management
│
└── client/              # User client (React + Vite)
    └── src/
        ├── pages/       # Home, Watch, Search
        └── components/  # Navbar, MovieCard, MovieSlider
```

---

## ⚡ Getting Started

### 1. Prerequisites

- **Node.js** v18 or higher
- **MongoDB** running locally

### 2. Install Dependencies

```bash
# Backend
npm install

# Admin panel
cd admin && npm install

# Client
cd client && npm install
```

### 3. Configure Environment

```bash
cp .env.sample .env
```

Edit `.env` with your settings:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/movie-website
JWT_SECRET=your-secret-key
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your-password
NODE_ENV=development
```

### 4. Run Development Servers

```bash
# Terminal 1 — Backend (port 5000)
npm run dev

# Terminal 2 — Admin panel (port 3000)
cd admin && npm run dev

# Terminal 3 — Client (port 3001)
cd client && npm run dev
```

### 5. Build for Production

```bash
npm run build
```

---

## 📡 API Reference

### Authentication

| Method | Endpoint | Description |
|:------:|:---------|:------------|
| `POST` | `/api/v1/auth/login` | Admin login |

### Movies

| Method | Endpoint | Auth | Description |
|:------:|:---------|:----:|:------------|
| `GET` | `/api/v1/movies` | Public | List all movies |
| `GET` | `/api/v1/movies?type=series` | Public | List TV shows only |
| `GET` | `/api/v1/movies/:id` | Public | Get single movie |
| `GET` | `/api/v1/movies/random` | Public | Get random featured movie |
| `GET` | `/api/v1/movies/search/:query` | Public | Search by title |
| `POST` | `/api/v1/movies` | Admin | Create movie |
| `PUT` | `/api/v1/movies/:id` | Admin | Update movie |
| `DELETE` | `/api/v1/movies/:id` | Admin | Delete movie |

### Lists

| Method | Endpoint | Auth | Description |
|:------:|:---------|:----:|:------------|
| `GET` | `/api/v1/lists` | Public | Get curated lists |
| `GET` | `/api/v1/lists/all` | Admin | Get all lists |
| `POST` | `/api/v1/lists` | Admin | Create list |
| `PUT` | `/api/v1/lists/:id` | Admin | Update list |
| `DELETE` | `/api/v1/lists/:id` | Admin | Delete list |

### Files

| Method | Endpoint | Auth | Description |
|:------:|:---------|:----:|:------------|
| `POST` | `/api/v1/upload` | Admin | Upload file (image/video) |
| `GET` | `/api/v1/stream/:filename` | Public | Stream video (Range support) |
| `GET` | `/api/v1/download/:filename` | Public | Download video file |

---

## 🗃️ Database Models

### Movie

```javascript
{
  title:       String,   // required, unique
  description: String,
  image:       String,   // poster URL
  imageTitle:  String,
  imageSmall:  String,   // thumbnail
  trailer:     String,   // trailer video URL
  video:       String,   // full video URL
  year:        String,
  limit:       Number,   // age rating
  genre:       String,
  duration:    String,
  isSeries:    Boolean,  // default: false
  timestamps:  true
}
```

### List

```javascript
{
  title:   String,  // required, unique
  type:    String,  // "movie" or "series"
  genre:   String,
  content: [Movie._id refs],
  timestamps: true
}
```

---

## ✨ Features

<details>
<summary><strong>Admin Panel</strong></summary>

- Secure login with environment-based credentials
- Dashboard with movie and list counts
- Create, edit, and delete movies
- Upload poster images, trailers, and full videos
- TV Series support with `isSeries` flag
- Curated list management (group movies by genre/type)

</details>

<details>
<summary><strong>Client App</strong></summary>

- Featured hero banner with random movie
- Horizontal sliders for movies and TV shows
- Search movies by title
- Built-in HTML5 video player
- Direct file download with one click
- No login or registration required
- Netflix-style dark theme UI

</details>

---

## 📜 License

MIT License. Use freely for personal and commercial projects.
