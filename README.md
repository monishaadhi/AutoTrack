# AutoTrack - Automotive Production Monitoring Dashboard

AutoTrack is a real-time production monitoring and analytics dashboard tailored for automotive manufacturing plants. It tracks overall equipment effectiveness (OEE), throughput, assembly line health, defect rates, and quality incidents across production lines.

## Project Structure

```text
autotrack/
├── frontend/             # React + TypeScript frontend
│   ├── public/           # Static assets
│   ├── src/
│   │   ├── api/          # API client and endpoints
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Dashboard, Production, Lines, Quality views
│   │   ├── types/        # TypeScript interfaces & types
│   │   ├── App.tsx       # Root application layout and routing
│   │   └── main.tsx      # App entry point
│   └── package.json
├── backend/              # Node.js + Express + TypeScript backend
│   ├── src/
│   │   ├── config/       # DB and environment configuration
│   │   ├── routes/       # API route definitions
│   │   ├── controllers/  # Request handlers
│   │   ├── services/     # Business logic layer
│   │   ├── repositories/ # Data access layer
│   │   ├── middleware/   # Auth, logging, error handling
│   │   ├── app.ts        # Express application setup
│   │   └── server.ts     # HTTP server runner
│   ├── tests/            # Automated test suite
│   └── package.json
├── database/             # Relational database scripts
│   ├── schema.sql        # Table definitions and indexes
│   └── seed.sql          # Sample production line & telemetry seed data
└── docs/
    └── api.md            # API documentation and endpoints
```

## Getting Started

### 1. Database
Set up PostgreSQL / MySQL or run the SQL scripts in `database/`:
```bash
# Example for PostgreSQL
psql -U postgres -d autotrack -f database/schema.sql
psql -U postgres -d autotrack -f database/seed.sql
```

### 2. Backend
```bash
cd backend
npm install
npm run dev
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```
