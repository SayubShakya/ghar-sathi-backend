# Ghar Sathi Backend

A Node.js backend application for Ghar Sathi, built with Express.js and MongoDB. 

## Features

- User registration and authentication (JWT)
- User profile management
- Role-based access control (ADMIN, LANDLORD, ROOM_SEEKER, etc.)
- Property, booking, location, status, role, and user management
- Flexible property search with filtering and sorting
- Pagination on all list endpoints (roles, users, locations, property types, statuses, properties, bookings)
- Secure password hashing
- Environment variable configuration
- CORS enabled with configurable allowed origins

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
   cd ghar-sathi-backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory and add the following environment variables:
   ```env
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRATION=24h
   # Optional: comma-separated list of allowed browser origins.
   # If omitted or empty, all origins are allowed (useful in development).
   # Example: CORS_ORIGINS=http://localhost:3000,https://app.gharsathi.com
   CORS_ORIGINS=
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Environment Variables

- `PORT` - Port on which the server will run (default: 5000)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT token generation
- `JWT_EXPIRATION` - JWT token expiration time (e.g., `24h`)
- `CORS_ORIGINS` - (Optional) Comma-separated list of allowed browser origins.
  - When empty or not set, all origins are allowed (development friendly).
  - When set, only listed origins are allowed in browsers. Requests without an `Origin` header (mobile apps, Postman, curl) are always allowed.

## Pagination

- All list endpoints support pagination via query parameters:
  - `page` (default: `1`)
  - `limit` (default: `10`)
- The response shape is:

  ```json
  {
    "data": [ /* items for this page */ ],
    "page": 1,
    "limit": 10,
    "total": 123,
    "totalPages": 13
  }
  ```

Use `page` and `limit` from your mobile app or frontend to fetch slices of large datasets safely and efficiently.


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


