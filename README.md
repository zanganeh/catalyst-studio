# Catalyst Studio

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

## License

This project is licensed under the **Creative Commons Attribution-NonCommercial 4.0 International License (CC BY-NC 4.0)**.

### You are free to:
- **Share** — copy and redistribute the material in any medium or format
- **Adapt** — remix, transform, and build upon the material

### Under the following terms:
- **Attribution** — You must give appropriate credit
- **NonCommercial** — You may not use the material for commercial purposes

For commercial licensing options, please contact the maintainers.

See the [LICENSE](LICENSE) file for the full license text.
