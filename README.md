# Catalyst App

A modern Next.js application with shadcn/ui components, API routes, and full-stack capabilities.

## Features

- ✨ **Next.js 15** with App Router
- 🎨 **shadcn/ui** components with Tailwind CSS
- 🔧 **TypeScript** for type safety
- 🚀 **API Routes** for backend functionality
- 💾 **Prisma ORM** with SQLite database
- 🎯 **User Management** CRUD operations
- 📊 **Dashboard** with real-time metrics
- 🔥 **Turbopack** for fast development

## Quick Start

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/users` - Get all users
- `POST /api/users` - Create user
- `GET /api/users/[id]` - Get user by ID
- `PUT /api/users/[id]` - Update user
- `DELETE /api/users/[id]` - Delete user

## Project Structure

```
app/
├── api/        # Backend API routes
├── dashboard/  # Dashboard page
├── users/      # User management
└── page.tsx    # Home page
```

## Technologies

- Frontend: Next.js, React, TypeScript, Tailwind CSS, shadcn/ui
- Backend: Next.js API Routes
- Database: SQLite with Prisma ORM
