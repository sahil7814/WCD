<<<<<<< HEAD
# WCD Himachal Pradesh Portal

Full-stack React and Node.js application for Women and Child Development application management.

## Features
- Government-style responsive login and dashboard
- JWT authentication
- Register applications with English field labels
- Application listing and search
- PostgreSQL persistence
- Docker-based local database

## Demo login
- Email: `admin@wcd.hp.gov.in`
- Password: `WCD@123`

## Local setup
1. Install Docker Desktop and Node.js 20+.
2. From the project root, copy environment files:
   - `copy .env.example .env`
   - `copy frontend\.env.example frontend\.env`
3. Install dependencies:
   - `npm install`
   - `npm install --prefix backend`
   - `npm install --prefix frontend`
4. Start PostgreSQL:
   - `docker compose up -d postgres`
5. Start backend:
   - `npm run dev --prefix backend`
6. Start frontend:
   - `npm run dev --prefix frontend`

Open `http://localhost:5173`.

## PDF form fields
The application form currently contains a professional starter field set. Replace or extend these fields after the PDF is provided.
=======
# WCD
>>>>>>> d5f24dc14536491a67ba4d2f3f29ee03b29c6cfa
