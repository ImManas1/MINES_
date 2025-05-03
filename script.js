// Game state
let currentUser = null;
let gameState = {
    balance: 1000,
    currentBet: 0,
    multiplier: 1.00,
    revealedCells: 0,
    gameActive: false,
    mines: [],
    mineCount: 1
};

// API Configuration
const API_BASE_URL = 'http://localhost:3000/api';
let authToken = null;

// Initialize the game
document.addEventListener('DOMContentLoaded', () => {
    setupAuthTabs();
    checkLoginStatus();
    updatePreGameStats();
});

// Authentication functions
function setupAuthTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            const loginForm = document.getElementById('login-form');
            const registerForm = document.getElementById('register-form');
            
            if (tab.dataset.tab === 'login') {
                loginForm.classList.remove('hidden');
                registerForm.classList.add('hidden');
            } else {
                loginForm.classList.add('hidden');
                registerForm.classList.remove('hidden');
            }
        });
    });
}

function checkLoginStatus() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (user) {
        currentUser = user;
        showGameSection();
    }
}

// Authentication Functions
async function register(username, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        return data;
    } catch (error) {
        throw error;
    }
}

async function login(username, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        authToken = data.token;
        return data;
    } catch (error) {
        throw error;
    }
}

// Game State Management
async function updateGameState(type, amount) {
    try {
        const response = await fetch(`${API_BASE_URL}/game/update`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ type, amount })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        return data;
    } catch (error) {
        throw error;
    }
}

// Friend System
async function searchUsers(query) {
    try {
        const response = await fetch(`${API_BASE_URL}/users/search?query=${query}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        return data;
    } catch (error) {
        throw error;
    }
}

async function sendFriendRequest(userId) {
    try {
        const response = await fetch(`${API_BASE_URL}/friends/request`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ userId })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        return data;
    } catch (error) {
        throw error;
    }
}

async function handleFriendRequest(requestId, action) {
    try {
        const response = await fetch(`${API_BASE_URL}/friends/request/${requestId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ action })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        return data;
    } catch (error) {
        throw error;
    }
}

// Leaderboard
async function getLeaderboard() {
    try {
        const response = await fetch(`${API_BASE_URL}/leaderboard`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        return data;
    } catch (error) {
        throw error;
    }
}

function showGameSection() {
    document.getElementById('auth-section').classList.add('hidden');
    document.getElementById('game-section').classList.remove('hidden');
    document.getElementById('username-display').textContent = currentUser.username;
    updateBalance();
    updateLeaderboard();
    updateTransactionHistory();
    initializeGameBoard();
}

function showAuthSection() {
    document.getElementById('auth-section').classList.remove('hidden');
    document.getElementById('game-section').classList.add('hidden');
}

// Game functions
function updateMineCount() {
    const count = parseInt(document.getElementById('mine-count').value);
    gameState.mineCount = count;
    if (!gameState.gameActive) {
        updatePreGameStats();
    }
}

function calculatePreGameProbability() {
    const totalCells = 25; // Fixed 5x5 grid
    const probability = (gameState.mineCount / totalCells) * 100;
    return probability.toFixed(2);
}

function calculatePreGameMultiplier() {
    // Base multiplier calculation based on mine count
    const totalCells = 25; // Fixed 5x5 grid
    const safeCells = totalCells - gameState.mineCount;
    
    // New multiplier formula: higher multiplier for more mines
    // Base multiplier increases exponentially with mine count
    const baseMultiplier = 1 + (gameState.mineCount * 0.2) + (Math.pow(gameState.mineCount, 1.5) * 0.05);
    return baseMultiplier.toFixed(2);
}

function updatePreGameStats() {
    document.getElementById('probability').textContent = `Probability: ${calculatePreGameProbability()}%`;
    document.getElementById('multiplier').textContent = `Base Multiplier: ${calculatePreGameMultiplier()}x`;
    document.getElementById('current-bet').textContent = `Current Bet: $0`;
    document.getElementById('potential-win').textContent = `Potential Win: $0`;
}

function calculateProbability() {
    const totalCells = 25; // Fixed 5x5 grid
    const remainingCells = totalCells - gameState.revealedCells;
    const remainingMines = gameState.mineCount;
    const probability = (remainingMines / remainingCells) * 100;
    return probability.toFixed(2);
}

function calculatePotentialWin() {
    return (gameState.currentBet * gameState.multiplier).toFixed(2);
}

function updateGameStats() {
    document.getElementById('current-bet').textContent = `Current Bet: $${gameState.currentBet}`;
    document.getElementById('multiplier').textContent = `Multiplier: ${gameState.multiplier}x`;
    document.getElementById('probability').textContent = `Probability: ${calculateProbability()}%`;
    document.getElementById('potential-win').textContent = `Potential Win: $${calculatePotentialWin()}`;
    
    // Enable/disable cashout button
    const cashoutBtn = document.getElementById('cashout-btn');
    cashoutBtn.disabled = !gameState.gameActive || gameState.revealedCells === 0;
}

function initializeGameBoard() {
    const gameBoard = document.getElementById('game-board');
    gameBoard.innerHTML = '';
    gameBoard.style.gridTemplateColumns = 'repeat(5, 1fr)'; // Fixed 5x5 grid
    
    for (let i = 0; i < 25; i++) {
        const cell = document.createElement('div');
        cell.className = 'mine-cell';
        cell.dataset.index = i;
        cell.addEventListener('click', () => handleCellClick(i));
        gameBoard.appendChild(cell);
    }
}

async function handleBet() {
    const betAmount = parseFloat(document.getElementById('bet-amount').value);
    if (isNaN(betAmount) || betAmount <= 0) {
        alert('Please enter a valid bet amount');
        return;
    }

    try {
        await updateGameState('bet', -betAmount);
        startGame(betAmount);
    } catch (error) {
        alert(error.message);
    }
}

function handleCellClick(index) {
    if (!gameState.gameActive) {
        alert('Please place a bet first');
        return;
    }
    
    const cell = document.querySelector(`.mine-cell[data-index="${index}"]`);
    
    if (cell.classList.contains('revealed')) {
        return;
    }
    
    if (gameState.mines.includes(index)) {
        // Hit a mine
        cell.classList.add('mine');
        gameState.gameActive = false;
        currentUser.balance -= gameState.currentBet;
        addTransaction('Loss', -gameState.currentBet);
        updateBalance();
        updateGameStats();
        
        // Show loss popup
        showLossPopup();
    } else {
        // Safe cell
        cell.classList.add('revealed');
        gameState.revealedCells++;
        
        // New multiplier calculation that increases more with each revealed cell
        const baseMultiplier = 1 + (gameState.mineCount * 0.2) + (Math.pow(gameState.mineCount, 1.5) * 0.05);
        const cellMultiplier = gameState.revealedCells * (0.1 + (gameState.mineCount * 0.02));
        gameState.multiplier = (baseMultiplier + cellMultiplier).toFixed(2);
        
        updateGameStats();
    }
}

function showLossPopup() {
    // Reveal all mines
    gameState.mines.forEach(mineIndex => {
        const cell = document.querySelector(`.mine-cell[data-index="${mineIndex}"]`);
        if (cell) {
            cell.classList.add('mine');
        }
    });

    // Create popup container
    const popup = document.createElement('div');
    popup.className = 'popup-container';
    popup.innerHTML = `
        <div class="popup-content">
            <h2>Game Over!</h2>
            <p>You hit a mine and lost $${gameState.currentBet}</p>
            <button onclick="resetGame()">Play Again</button>
        </div>
    `;
    
    // Add popup to the body
    document.body.appendChild(popup);
    
    // Add styles for the popup
    const style = document.createElement('style');
    style.textContent = `
        .popup-container {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        }
        .popup-content {
            background: #1a1a2e;
            padding: 2rem;
            border-radius: 10px;
            text-align: center;
            max-width: 400px;
            width: 90%;
        }
        .popup-content h2 {
            color: #e74c3c;
            margin-bottom: 1rem;
        }
        .popup-content p {
            color: #fff;
            margin-bottom: 1.5rem;
        }
        .popup-content button {
            background: #4CAF50;
            color: #fff;
            border: none;
            padding: 0.8rem 1.5rem;
            border-radius: 5px;
            cursor: pointer;
            font-size: 1rem;
            transition: all 0.3s ease;
        }
        .popup-content button:hover {
            background: #45a049;
        }
    `;
    document.head.appendChild(style);
}

function resetGame() {
    // Remove popup
    const popup = document.querySelector('.popup-container');
    if (popup) {
        popup.remove();
    }
    
    // Reset game state
    gameState.currentBet = 0;
    gameState.multiplier = 1.00;
    gameState.revealedCells = 0;
    gameState.gameActive = false;
    gameState.mines = [];
    
    // Reset board
    const cells = document.querySelectorAll('.mine-cell');
    cells.forEach(cell => {
        cell.classList.remove('revealed', 'mine');
    });
    
    // Update stats
    updateGameStats();
    updatePreGameStats();
}

async function handleCashout() {
    try {
        const winnings = calculateWinnings();
        await updateGameState('win', winnings);
        showWinPopup(winnings);
        animateBalanceIncrease(winnings);
        resetBoard();
    } catch (error) {
        alert(error.message);
    }
}

function showWinPopup(winnings) {
    // Create popup container
    const popup = document.createElement('div');
    popup.className = 'popup-container';
    popup.innerHTML = `
        <div class="popup-content">
            <h2>Congratulations!</h2>
            <p>You won</p>
            <div class="win-animation">
                <div class="bloom-effect"></div>
                <div class="win-amount">$${winnings.toFixed(2)}</div>
            </div>
            <button onclick="closePopup()">Continue</button>
        </div>
    `;
    
    // Add popup to the body
    document.body.appendChild(popup);
    
    // Add styles for the popup
    const style = document.createElement('style');
    style.textContent = `
        .popup-container {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        }
        .popup-content {
            background: #1a1a2e;
            padding: 2rem;
            border-radius: 20px;
            text-align: center;
            max-width: 400px;
            width: 90%;
            position: relative;
            overflow: hidden;
        }
        .popup-content h2 {
            color: #2ecc71;
            margin-bottom: 1rem;
            font-size: 2rem;
            text-shadow: 0 0 10px rgba(46, 204, 113, 0.5);
        }
        .popup-content p {
            color: #fff;
            margin-bottom: 1.5rem;
            font-size: 1.2rem;
        }
        .win-animation {
            position: relative;
            margin: 2rem 0;
        }
        .win-amount {
            font-size: 3rem;
            color: #2ecc71;
            font-weight: bold;
            position: relative;
            z-index: 2;
            text-shadow: 0 0 20px rgba(46, 204, 113, 0.8);
            animation: amountPulse 2s infinite;
        }
        .bloom-effect {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 200px;
            height: 200px;
            background: radial-gradient(circle, rgba(46, 204, 113, 0.8) 0%, rgba(46, 204, 113, 0) 70%);
            border-radius: 50%;
            animation: bloomPulse 2s infinite;
            z-index: 1;
        }
        @keyframes bloomPulse {
            0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.5; }
            50% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.8; }
            100% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.5; }
        }
        @keyframes amountPulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
        }
        .popup-content button {
            background: linear-gradient(45deg, #4CAF50, #45a049);
            color: #fff;
            border: none;
            padding: 0.8rem 1.5rem;
            border-radius: 10px;
            cursor: pointer;
            font-size: 1rem;
            transition: all 0.3s ease;
            font-weight: 500;
            box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
        }
        .popup-content button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(76, 175, 80, 0.4);
        }
    `;
    document.head.appendChild(style);
}

function animateBalanceIncrease(amount) {
    const balanceDisplay = document.getElementById('balance-display');
    const currentBalance = currentUser.balance;
    const targetBalance = currentBalance + amount;
    const duration = 2000; // 2 seconds
    const startTime = performance.now();
    
    // Add bloom effect to balance display
    balanceDisplay.classList.add('balance-bloom');
    
    function updateBalance(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Ease-out animation
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        
        const currentAmount = currentBalance + (amount * easedProgress);
        balanceDisplay.textContent = `Balance: $${currentAmount.toFixed(2)}`;
        
        if (progress < 1) {
            requestAnimationFrame(updateBalance);
        } else {
            // Remove bloom effect after animation
            setTimeout(() => {
                balanceDisplay.classList.remove('balance-bloom');
            }, 500);
        }
    }
    
    requestAnimationFrame(updateBalance);
}

function closePopup() {
    const popup = document.querySelector('.popup-container');
    if (popup) {
        popup.remove();
    }
}

function updateBalance() {
    document.getElementById('balance-display').textContent = `Balance: $${currentUser.balance.toFixed(2)}`;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    // Update users in localStorage
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const userIndex = users.findIndex(u => u.username === currentUser.username);
    if (userIndex !== -1) {
        users[userIndex] = currentUser;
        localStorage.setItem('users', JSON.stringify(users));
    }
    
    // Update leaderboard
    updateLeaderboard();
}

function addTransaction(type, amount) {
    const transaction = {
        type,
        amount,
        timestamp: new Date().toLocaleString()
    };
    
    currentUser.transactions = currentUser.transactions || [];
    currentUser.transactions.push(transaction);
    
    // Update users in localStorage
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const userIndex = users.findIndex(u => u.username === currentUser.username);
    if (userIndex !== -1) {
        users[userIndex] = currentUser;
        localStorage.setItem('users', JSON.stringify(users));
    }
    
    // Update transaction history and leaderboard
    updateTransactionHistory();
    updateLeaderboard();
}

function updateTransactionHistory() {
    const transactionList = document.getElementById('transaction-list');
    transactionList.innerHTML = '';
    
    if (!currentUser.transactions) return;
    
    currentUser.transactions.slice().reverse().forEach(transaction => {
        const entry = document.createElement('div');
        entry.className = 'transaction-entry';
        entry.innerHTML = `
            <span>${transaction.type}</span>
            <span>$${Math.abs(transaction.amount)}</span>
            <span>${transaction.timestamp}</span>
        `;
        transactionList.appendChild(entry);
    });
}

// Update leaderboard display
async function updateLeaderboard() {
    try {
        const leaderboard = await getLeaderboard();
        const leaderboardElement = document.getElementById('leaderboard');
        leaderboardElement.innerHTML = `
            <div class="leaderboard-header">
                <span>Rank</span>
                <span>Username</span>
                <span>Balance</span>
            </div>
        `;

        leaderboard.forEach((user, index) => {
            const rankEmoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
            const entry = document.createElement('div');
            entry.className = 'leaderboard-entry';
            entry.innerHTML = `
                <span>${rankEmoji}</span>
                <span>${user.username}</span>
                <span>${user.balance.toFixed(2)}</span>
            `;
            leaderboardElement.appendChild(entry);
        });
    } catch (error) {
        console.error('Failed to update leaderboard:', error);
    }
}

// Update the leaderboard styles
const style = document.createElement('style');
style.textContent = `
    .leaderboard-header {
        display: grid;
        grid-template-columns: auto 1fr auto auto;
        gap: 1rem;
        padding: 1rem;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 10px;
        margin-bottom: 0.5rem;
        font-weight: bold;
        color: rgba(255, 255, 255, 0.8);
    }
    
    .leaderboard-entry {
        display: grid;
        grid-template-columns: auto 1fr auto auto;
        gap: 1rem;
        padding: 1rem;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 10px;
        transition: all 0.3s ease;
        align-items: center;
        margin-bottom: 0.5rem;
    }
    
    .leaderboard-entry.current-user {
        background: rgba(76, 175, 80, 0.2);
        border: 1px solid rgba(76, 175, 80, 0.3);
    }
    
    .leaderboard-entry .rank {
        font-weight: bold;
        min-width: 3rem;
    }
    
    .leaderboard-entry .username {
        font-weight: 500;
    }
    
    .leaderboard-entry .status {
        font-size: 0.9rem;
        color: rgba(255, 255, 255, 0.7);
        min-width: 6rem;
        text-align: center;
    }
    
    .leaderboard-entry .balance {
        font-weight: bold;
        color: #4CAF50;
        min-width: 8rem;
        text-align: right;
    }
    
    .leaderboard-entry:hover {
        transform: translateX(5px);
        background: rgba(255, 255, 255, 0.1);
    }
    
    #leaderboard-list {
        max-height: 400px;
        overflow-y: auto;
        padding-right: 0.5rem;
    }
    
    #leaderboard-list::-webkit-scrollbar {
        width: 6px;
    }
    
    #leaderboard-list::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 3px;
    }
    
    #leaderboard-list::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.2);
        border-radius: 3px;
    }
    
    #leaderboard-list::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.3);
    }
`;
document.head.appendChild(style);

// Add bloom effect styles for balance display
const balanceStyle = document.createElement('style');
balanceStyle.textContent = `
    .balance-bloom {
        position: relative;
        animation: balancePulse 0.5s ease-in-out;
    }
    
    .balance-bloom::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 100%;
        height: 100%;
        background: radial-gradient(circle, rgba(46, 204, 113, 0.5) 0%, rgba(46, 204, 113, 0) 70%);
        border-radius: 50%;
        animation: balanceBloom 0.5s ease-in-out;
    }
    
    @keyframes balancePulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); }
    }
    
    @keyframes balanceBloom {
        0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.5; }
        50% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.8; }
        100% { transform: translate(-50%, -50%) scale(0.8); opacity: 0; }
    }
`;
document.head.appendChild(balanceStyle);

// Friends System
async function searchFriends() {
    const searchInput = document.getElementById('friend-search');
    const query = searchInput.value.trim();
    
    if (!query) {
        const existingResults = document.querySelector('.search-results');
        if (existingResults) {
            existingResults.remove();
        }
        return;
    }

    try {
        const users = await searchUsers(query);
        const existingResults = document.querySelector('.search-results');
        if (existingResults) {
            existingResults.remove();
        }

        const searchResults = document.createElement('div');
        searchResults.className = 'search-results';

        if (users.length === 0) {
            searchResults.innerHTML = '<div class="search-result-item">No users found</div>';
        } else {
            users.forEach(user => {
                const resultItem = document.createElement('div');
                resultItem.className = 'search-result-item';
                resultItem.innerHTML = `
                    <div>${user.username}</div>
                    <button class="add-friend-btn" onclick="sendFriendRequest('${user._id}')">Add Friend</button>
                `;
                searchResults.appendChild(resultItem);
            });
        }

        searchInput.parentNode.appendChild(searchResults);
    } catch (error) {
        console.error('Failed to search users:', error);
        alert('Failed to search users. Please try again.');
    }
}

async function updateFriendRequests() {
    try {
        const response = await fetch(`${API_BASE_URL}/profile`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const user = await response.json();
        
        const requestsList = document.getElementById('friend-requests-list');
        requestsList.innerHTML = '';

        if (user.friendRequests.length === 0) {
            requestsList.innerHTML = '<div class="no-requests">No friend requests</div>';
            return;
        }

        user.friendRequests.forEach(request => {
            if (request.status === 'pending') {
                const requestItem = document.createElement('div');
                requestItem.className = 'friend-request-item';
                requestItem.innerHTML = `
                    <div>${request.from.username}</div>
                    <div class="friend-request-actions">
                        <button class="accept-request" onclick="handleFriendRequest('${request._id}', 'accept')">Accept</button>
                        <button class="reject-request" onclick="handleFriendRequest('${request._id}', 'reject')">Reject</button>
                    </div>
                `;
                requestsList.appendChild(requestItem);
            }
        });
    } catch (error) {
        console.error('Failed to update friend requests:', error);
    }
}

async function updateFriendsList() {
    try {
        const response = await fetch(`${API_BASE_URL}/profile`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const user = await response.json();
        
        const friendsList = document.getElementById('friends-list');
        friendsList.innerHTML = '';

        if (user.friends.length === 0) {
            friendsList.innerHTML = '<div class="no-friends">No friends yet</div>';
            return;
        }

        user.friends.forEach(friend => {
            const friendItem = document.createElement('div');
            friendItem.className = 'friend-item';
            friendItem.innerHTML = `
                <div>${friend.username}</div>
                <div class="friend-status ${friend.online ? 'online' : 'offline'}">
                    ${friend.online ? 'Online' : 'Offline'}
                </div>
            `;
            friendsList.appendChild(friendItem);
        });
    } catch (error) {
        console.error('Failed to update friends list:', error);
    }
}

// Update initializeGame function
async function initializeGame() {
    updatePreGameStats();
    updateTransactionHistory();
    initializeGameBoard();
    await updateFriendRequests();
    await updateFriendsList();
    
    const searchInput = document.getElementById('friend-search');
    if (searchInput) {
        searchInput.addEventListener('input', searchFriends);
    }
}

// Update handleLogin function
async function handleLogin(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        await login(username, password);
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('game-container').style.display = 'block';
        await initializeGame();
    } catch (error) {
        alert(error.message);
    }
} 
