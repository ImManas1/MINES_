require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const { User } = require('./db');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB connection setup
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mines-game', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));
  
// Middleware
app.use(cors());
app.use(express.json());

// Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) return res.status(401).json({ message: 'No token provided' });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid token' });
        req.user = user;
        next();
    });
};

// User Registration
app.post('/api/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Check if user exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create new user
        const user = new User({
            username,
            password: hashedPassword
        });
        
        await user.save();
        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Registration failed' });
    }
});

// User Login
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Find user
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        // Check password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
        user.online = true;
        await user.save();
        
        res.json({ token, user: { id: user._id, username: user.username, balance: user.balance } });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Get User Profile
app.get('/api/profile', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId)
            .select('-password')
            .populate('friends', 'username online')
            .populate('friendRequests.from', 'username');
        
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

// Search Users
app.get('/api/users/search', authenticateToken, async (req, res) => {
    try {
        const { query } = req.query;
        const users = await User.find({
            username: { $regex: query, $options: 'i' },
            _id: { $ne: req.user.userId }
        }).select('username _id');
        
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Search failed' });
    }
});

// Send Friend Request
app.post('/api/friends/request', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.body;
        
        // Check if already friends
        const user = await User.findById(req.user.userId);
        if (user.friends.includes(userId)) {
            return res.status(400).json({ error: 'Already friends' });
        }
        
        // Check if request already exists
        const existingRequest = user.friendRequests.find(
            request => request.from.toString() === userId && request.status === 'pending'
        );
        if (existingRequest) {
            return res.status(400).json({ error: 'Request already sent' });
        }
        
        // Add friend request
        await User.findByIdAndUpdate(userId, {
            $push: {
                friendRequests: {
                    from: req.user.userId,
                    status: 'pending'
                }
            }
        });
        
        res.json({ message: 'Friend request sent' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to send friend request' });
    }
});

// Handle Friend Request
app.post('/api/friends/request/:requestId', authenticateToken, async (req, res) => {
    try {
        const { requestId } = req.params;
        const { action } = req.body; // 'accept' or 'reject'
        
        const user = await User.findById(req.user.userId);
        const request = user.friendRequests.id(requestId);
        
        if (!request) {
            return res.status(404).json({ error: 'Request not found' });
        }
        
        if (action === 'accept') {
            // Add to friends list
            await User.findByIdAndUpdate(req.user.userId, {
                $push: { friends: request.from },
                $set: { 'friendRequests.$[elem].status': 'accepted' }
            }, {
                arrayFilters: [{ 'elem._id': requestId }]
            });
            
            await User.findByIdAndUpdate(request.from, {
                $push: { friends: req.user.userId }
            });
        } else {
            // Reject request
            await User.findByIdAndUpdate(req.user.userId, {
                $set: { 'friendRequests.$[elem].status': 'rejected' }
            }, {
                arrayFilters: [{ 'elem._id': requestId }]
            });
        }
        
        res.json({ message: `Friend request ${action}ed` });
    } catch (error) {
        res.status(500).json({ error: 'Failed to handle friend request' });
    }
});

// Get Leaderboard
app.get('/api/leaderboard', async (req, res) => {
    try {
        const users = await User.find()
            .sort({ balance: -1 })
            .limit(100)
            .select('username balance');
        
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
});

// Update Game State
app.post('/api/game/update', authenticateToken, async (req, res) => {
    try {
        const { type, amount } = req.body;
        
        // Update user balance and add transaction
        await User.findByIdAndUpdate(req.user.userId, {
            $inc: { balance: amount },
            $push: {
                transactions: {
                    type,
                    amount
                }
            }
        });
        
        res.json({ message: 'Game state updated' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update game state' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 
