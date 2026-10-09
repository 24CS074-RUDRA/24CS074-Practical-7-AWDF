# Practical 7 — Authentication and Middleware Pipeline

This folder contains a self-contained Practical 7 implementation: a Node.js/Express/Mongoose API and a React/Vite client. The API protects every task endpoint with JWT authentication and validates/sanitizes input before it reaches the controllers.

## 1. Configure and start the backend

Open a terminal in `backend` and install dependencies:

```powershell
cd backend
npm install
```

Copy `.env.example` to `.env`, then set `MONGO_URI` to your MongoDB connection string and `JWT_SECRET` to a long, private random value. For example, generate a secret with:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Start the API:

```powershell
npm start
```

It listens at `http://localhost:5000` by default. Never commit `.env`.

## 2. Start the frontend

In a second terminal, open `frontend`:

```powershell
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite (usually `http://localhost:5173`). Register an account, log in, and create tasks. The client stores the JWT for this lab demo, adds it as a Bearer token to protected requests, and clears it if a request returns `401`. Select **Log out** to clear the token manually.

## 3. Verify the flow with Postman

You can import `backend/Practical7.postman_collection.json` into Postman. Send requests in order: Register, Login, Get current user, List tasks, Create task, Update task, then Delete task. The collection creates a unique email for registration and stores the JWT after login. To test validation and authentication failures, run the final two example requests; expected results are `400` and `401`.

The API supports the handout routes and the `/auth` aliases:

- `POST http://localhost:5000/register` or `POST http://localhost:5000/auth/register`
- `POST http://localhost:5000/login` or `POST http://localhost:5000/auth/login`
- `GET http://localhost:5000/me` or `GET http://localhost:5000/auth/me`

For each JSON request in Postman, select **Body → raw → JSON**. Do not choose `form-data`. The request body for registration is:

   ```json
   { "name": "Rudra", "email": "rudra@example.com", "password": "example-pass-123" }
   ```

After registration, log in using the same email and password. Copy the returned `token`, then set the request header to `Authorization: Bearer <token>` for `/me` and all `/tasks` routes.

To create a task, send `POST http://localhost:5000/tasks` with the token and JSON:

   ```json
   { "title": "Complete Practical 7", "description": "Test the protected task route" }
   ```

All task routes (`GET`, `POST`, `PUT`, and `DELETE` under `/tasks`) require a valid JWT. Task records are scoped to the authenticated user.

## Middleware flow

```text
Request -> JWT authentication -> input validation/sanitization -> task controller -> MongoDB
```

Authentication endpoints are `POST /auth/register`, `POST /auth/login`, and protected `GET /auth/me`. Access tokens expire after one hour. Errors use a consistent JSON shape: `{ "error": { "message": "..." } }`.

## Key files

- `backend/models/User.js`: stores normalized email and bcrypt-hashed password.
- `backend/controllers/authController.js`: registration, login, and `/me`.
- `backend/middleware/authMiddleware.js`: checks the Bearer token and sets `req.user`.
- `backend/middleware/validationMiddleware.js`: validates and sanitizes registration, login, and task input.
- `backend/routes/taskRoutes.js`: puts authentication before validation on task routes.
- `frontend/src/App.jsx`: provides register/login, authenticated task operations, automatic token clearing on `401`, and logout.

## Viva notes

- bcrypt hashes are salted and deliberately costly to compute; plain text or reversible encryption exposes passwords if the database leaks.
- The server verifies JWT signature and expiry. A missing, malformed, expired, or invalid token returns `401` before a task controller runs.
- Server-side validation is required because clients can be bypassed or modified; only trusted, validated fields should reach persistence.
