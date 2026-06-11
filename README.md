# Coding Assessment Platform

A full-stack AI-powered coding assessment platform with:

- Admin question and assessment management
- Student assessment runner with Monaco Editor
- Judge0-backed code execution
- OpenAI-powered AI mentor that gives hints, bug analysis, and debugging guidance without revealing full solutions
- JWT authentication, MongoDB persistence, and Docker deployment

## Tech Stack

- Frontend: React + JavaScript + Vite + Monaco Editor
- Backend: Node.js + Express + MongoDB + JWT
- Execution: Judge0 API
- AI Mentor: OpenAI API
- Deployment: Docker + Docker Compose

## Local Development

1. Copy `.env.example` to `.env` and fill in values.
2. Install dependencies:

```bash
npm install
```

3. Start MongoDB locally or use Docker Compose.
4. Seed an admin account:

```bash
npm run seed
```

5. Start the app:

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:5000

## Default Admin

If you keep the example env values, the seed script creates:

- Email: `admin@platform.local`
- Password: `Admin@12345`

## Docker

Run the entire stack with:

```bash
docker compose up --build
```

## Notes

- Code never executes on the application server. All runs and submissions go through Judge0.
- The AI mentor prompt is constrained to hints, debugging guidance, bug examples, and code review. It is configured to avoid complete solutions.
