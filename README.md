# Student Success Dashboard

Build a premium, production-quality Student Management System dashboard.

DESIGN:
Create a sophisticated DARK PREMIUM SaaS interface inspired by Linear, Vercel and modern enterprise admin dashboards.

Visual specifications:

Main background: #0B0D12

Sidebar: #10131B

Cards: #151925

Borders: #252B3A

Primary accent: electric violet (#8B5CF6)

Secondary accent: blue (#3B82F6)

Primary text: #F8FAFC

Secondary text: #94A3B8

Use modern typography, preferably Inter.

Subtle gradients, soft shadows and restrained glass effects.

Smooth hover states and micro-interactions.

Avoid excessive glow, neon effects or clutter.

TECH STACK:

React

TypeScript

Tailwind CSS

Axios

React Router

Lucide icons

BACKEND — IMPORTANT:
I already have a fully working ASP.NET Core Web API backend connected to SQL Server using Entity Framework Core.
Do not create a backend.
Do not use Supabase or Firebase.
Do not create a new database.
Do not use mock student data as the actual application data source.

Configure the API base URL using:
VITE_API_BASE_URL

My API endpoints:
GET /api/Students
GET /api/Students/{id}
POST /api/Students
PUT /api/Students/{id}
DELETE /api/Students/{id}

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/de567cf4-4850-44c6-be1c-248f26f0fd25).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
