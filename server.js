const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const { User } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Authentication middleware
const authenticateUser = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        
        const user = await User.findById(token);
        if (!user) {
            return res.status(401).json({ error: 'Invalid token' });
        }
        
        req.user = user;
        next();
    } catch (error) {
        res.status(500).json({ error: 'Authentication failed' });
    }
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
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Check password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        res.json({ token: user._id });
    } catch (error) {
        res.status(500).json({ error: 'Login failed' });
    }
});

// Get User Profile
app.get('/api/profile', authenticateUser, async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .select('-password')
            .populate('friends', 'username balance')
            .populate('friendRequests.from', 'username');
        
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

// Search Users
app.get('/api/users/search', authenticateUser, async (req, res) => {
    try {
        const { query } = req.query;
        const users = await User.find({
            username: { $regex: query, $options: 'i' },
            _id: { $ne: req.user._id }
        }).select('username balance');
        
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Search failed' });
    }
});

// Send Friend Request
app.post('/api/friends/request', authenticateUser, async (req, res) => {
    try {
        const { userId } = req.body;
        
        // Check if already friends
        const user = await User.findById(req.user._id);
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
                    from: req.user._id,
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
app.post('/api/friends/request/:requestId', authenticateUser, async (req, res) => {
    try {
        const { requestId } = req.params;
        const { action } = req.body; // 'accept' or 'reject'
        
        const user = await User.findById(req.user._id);
        const request = user.friendRequests.id(requestId);
        
        if (!request) {
            return res.status(404).json({ error: 'Request not found' });
        }
        
        if (action === 'accept') {
            // Add to friends list
            await User.findByIdAndUpdate(req.user._id, {
                $push: { friends: request.from },
                $set: { 'friendRequests.$[elem].status': 'accepted' }
            }, {
                arrayFilters: [{ 'elem._id': requestId }]
            });
            
            await User.findByIdAndUpdate(request.from, {
                $push: { friends: req.user._id }
            });
        } else {
            // Reject request
            await User.findByIdAndUpdate(req.user._id, {
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
app.post('/api/game/update', authenticateUser, async (req, res) => {
    try {
        const { type, amount } = req.body;
        
        // Update user balance and add transaction
        await User.findByIdAndUpdate(req.user._id, {
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