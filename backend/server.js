const express = require('express'); //handles requests and responses
const cors = require('cors'); //allows frontend call backend
const path = require('path'); //handles file paths
require('dotenv').config({ path: path.join(__dirname, '.env') }); //loads environment variables from .env file

const app = express(); //create express app

const PORT = process.env.PORT || 3001; //start server on port 3001

// Serve index.html at root - must be before other middleware
app.get('/', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../public/index.html'));
});

app.use(cors()); //allow frontend call backend
app.use(express.json()); //parse JSON bodies

// API route
app.get('/api', (req, res) => {
    res.json({ ok: true, message: 'Situation Sim API' });
});
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
}); //start server