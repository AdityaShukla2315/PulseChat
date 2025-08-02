<div align="center">
  <img src="./frontend/public/pulsechat.png" alt="PULSECHAT Logo" width="200"/>
  
  # 🚀 PULSECHAT - Real-time Chat Application

  A modern, fullstack chat application featuring real-time messaging, user authentication, and a responsive UI. Built with the MERN stack (MongoDB, Express.js, React, Node.js), Socket.io, and styled with TailwindCSS and DaisyUI.
</div>

---

## 🏗️ Architecture & Tech Stack

- **Frontend:** React 18, Vite, Zustand (state management), React Router, TailwindCSS, DaisyUI, Socket.io-client
- **Backend:** Node.js, Express, MongoDB (Mongoose), JWT Auth, Socket.io, Cloudinary (media uploads)
- **Authentication:** Secure JWT-based system with HTTP-only cookies
- **Real-time:** Socket.io for instant messaging and online status
- **Deployment-ready:** Environment-based configuration, modular codebase, and scalable patterns

---

## ✨ Features

- **User Registration & Login** with hashed passwords and JWT
- **Real-time Chat** (one-to-one) with instant delivery and read receipts
- **Online Status** indicators for users
- **Media Uploads** via Cloudinary (profile pictures, images)
- **Responsive UI** with TailwindCSS & DaisyUI
- **Global State** using Zustand for seamless UX
- **Robust Error Handling** on both client and server
- **Production Deployment**-ready (see below)

---

## ⚡ Quickstart

### 1. Clone & Install

```sh
git clone https://github.com/yourusername/pulsechat.git
cd PULSECHAT
npm install --prefix backend
npm install --prefix frontend
```

### 2. Configure Environment

Create a `.env` file in `/backend` with the following variables:

```env
MONGODB_URI=your_mongodb_connection_string
PORT=5001
JWT_SECRET=your_jwt_secret_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
NODE_ENV=development
```

> ℹ️ Make sure to set up a MongoDB database and Cloudinary account for media uploads.

### 3. Run the App

**Backend:**
```sh
cd backend
npm run start
```

**Frontend:**
```sh
cd frontend
npm run dev
```

- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend API: `http://localhost:5001`
- Socket.IO: Connects automatically to the backend

---

## 🧩 Folder Structure

```
PULSECHAT/
├── backend/               # Express API server
│   ├── src/
│   │   ├── config/       # Configuration files
│   │   ├── controllers/  # Route controllers
│   │   ├── lib/          # Utility functions
│   │   ├── middleware/   # Express middleware
│   │   ├── models/       # MongoDB schemas
│   │   ├── routes/       # API routes
│   │   └── index.js      # Entry point
│   └── .env              # Environment variables
│
├── frontend/              # React application
│   ├── public/           # Static files
│   ├── src/
│   │   ├── assets/       # Images, fonts, etc.
│   │   ├── components/   # Reusable UI components
│   │   ├── contexts/     # React contexts
│   │   ├── lib/          # Utility functions
│   │   ├── pages/        # Page components
│   │   ├── store/        # Zustand stores
│   │   └── App.jsx       # Main app component
│   └── .env              # Frontend environment variables
│
├── .gitignore
└── README.md
```

---

## 🛡️ Security & Best Practices

- **Authentication**: JWT-based authentication with HTTP-only cookies
- **Password Security**: bcryptjs for password hashing
- **CORS**: Properly configured for frontend-backend communication
- **Environment Variables**: Sensitive configuration stored in `.env` files
- **Code Organization**: Modular structure with separate concerns
- **Error Handling**: Comprehensive error handling on both client and server

---

## 🚀 Deployment
- Prepare production environment variables
- Build frontend: `npm run build` in `/frontend`
- Use services like Vercel, Netlify (frontend), and Render, Railway, or Heroku (backend)

---

## 🙌 Credits & Resources
- Inspired by the [YouTube video tutorial](https://youtu.be/ntKkVrQqBYY)
- UI: [DaisyUI](https://daisyui.com/), [TailwindCSS](https://tailwindcss.com/)
- Real-time: [Socket.io](https://socket.io/)
- Auth: [JWT](https://jwt.io/)

---

## 💡 Contributing
Pull requests and suggestions are welcome! For major changes, please open an issue first.

---

