# Teamboard

Teamboard is a modern, scalable project management tool built with Next.js, TypeScript, Tailwind CSS, and MongoDB.

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB instance (local or Atlas)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Update `MONGODB_URI` and `JWT_SECRET` in `.env`

### Development

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

### Scripts

- `npm run dev`: Start dev server
- `npm run build`: Build for production
- `npm run start`: Start production server
- `npm run lint`: Run ESLint

## Project Structure

- `src/app`: App Router pages and layouts
- `src/components`: Reusable UI components
- `src/lib`: Core libraries (database, auth)
- `src/services`: Business logic
- `src/config`: Configuration (environment variables)
- `src/utils`: Utility functions
