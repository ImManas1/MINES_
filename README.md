# Mines Game with MongoDB Integration

A modern Mines game with user authentication, friend system, and leaderboard features, built with Node.js, Express, and MongoDB.

## Features

- User authentication (register/login)
- Real-time game state management
- Friend system with friend requests
- Global leaderboard
- Modern UI with animations
- Secure password hashing
- MongoDB data persistence

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd mines-game
```

2. Install dependencies:
```bash
npm install
```

3. Start MongoDB:
```bash
mongod
```

4. Start the server:
```bash
npm start
```

5. Open the game in your browser:
```
http://localhost:3000
```

## Project Structure

- `server.js` - Express server and API endpoints
- `db.js` - MongoDB connection and models
- `public/` - Frontend files
  - `index.html` - Main HTML file
  - `styles.css` - CSS styles
  - `script.js` - Client-side JavaScript

## API Endpoints

- `POST /api/register` - Register a new user
- `POST /api/login` - User login
- `GET /api/profile` - Get user profile
- `GET /api/users/search` - Search for users
- `POST /api/friends/request` - Send friend request
- `POST /api/friends/request/:requestId` - Handle friend request
- `GET /api/leaderboard` - Get leaderboard
- `POST /api/game/update` - Update game state

## Security Features

- Password hashing with bcrypt
- JWT-based authentication
- CORS protection
- Input validation
- Error handling

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License.