# Ghar Sathi Backend

A Node.js backend application for Ghar Sathi, built with Express.js and MongoDB. This application provides authentication and user management APIs.

## Features

- User registration and authentication (JWT)
- User profile management
- RESTful API endpoints
- Secure password hashing
- Environment variable configuration
- CORS enabled

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (with Mongoose ODM)
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs

## Prerequisites

- Node.js (v14 or later)
- npm (comes with Node.js)
- MongoDB (local or cloud instance)

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd gharsathi-backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory and add the following environment variables:
   ```env
   PORT=3000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRATION=24h
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```
   The server will start on `http://localhost:5000` by default.

## Environment Variables

- `PORT` - Port on which the server will run (default: 5000)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT token generation
- `JWT_EXPIRATION` - JWT token expiration time (e.g., '24h')

## Development

- To start the development server with auto-reload:
  ```bash
  npm run dev
  ```

- To start the production server:
  ```bash
  npm start
  ```

## Project Structure

```
gharsathi-backend/
├── src/
│   ├── configs/       # Configuration files
│   ├── controllers/   # Route controllers
│   ├── middleware/    # Custom middleware
│   ├── models/        # Database models
│   └── routes/        # Route definitions
├── .env               # Environment variables
├── index.js           # Application entry point
└── package.json       # Project dependencies and scripts
```


