const mongoose = require('mongoose');

// MongoDB connection string
const MONGODB_URI = 'mongodb://localhost:27017/mines-game';

// Connect to MongoDB
mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// User Schema
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    balance: {
        type: Number,
        default: 1000
    },
    friends: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    friendRequests: [{
        from: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        status: {
            type: String,
            enum: ['pending', 'accepted', 'rejected'],
            default: 'pending'
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    transactions: [{
        type: {
            type: String,
            enum: ['win', 'loss', 'bet'],
            required: true
        },
        amount: {
            type: Number,
            required: true
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    }]
});

// Create User model
const User = mongoose.model('User', userSchema);

// Export models
module.exports = {
    User
}; 