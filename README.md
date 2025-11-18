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
   The server will start on `http://localhost:3000` by default.

## API Endpoints

### Authentication

#### Register a new user
- **URL**: `/api/auth/v1/register`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }
  ```
- **Success Response**:
  ```json
  {
    "message": "User registered successfully",
    "token": "jwt_token_here",
    "user": {
      "_id": "user_id",
      "username": "testuser",
      "email": "test@example.com"
    }
  }
  ```

#### User Login
- **URL**: `/api/auth/v1/login`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "email": "test@example.com",
    "password": "password123"
  }
  ```
- **Success Response**:
  ```json
  {
    "token": "jwt_token_here",
    "user": {
      "_id": "user_id",
      "username": "testuser",
      "email": "test@example.com"
    }
  }
  ```

### Users

#### Get all users
- **URL**: `/api/auth/v1/users`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer <token>`
- **Success Response**: Array of user objects

#### Get user by ID
- **URL**: `/api/auth/v1/users/:id`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer <token>`
- **Success Response**: User object

#### Update user
- **URL**: `/api/auth/v1/users/:id`
- **Method**: `PUT`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**: User fields to update
- **Success Response**: Updated user object

#### Delete user
- **URL**: `/api/auth/v1/users/:id`
- **Method**: `DELETE`
- **Headers**: `Authorization: Bearer <token>`
- **Success Response**: Confirmation message

## Environment Variables

- `PORT` - Port on which the server will run (default: 3000)
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

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.