const express = require('express'); //handles requests and responses
const cors = require('cors'); //allows frontend call backend
const path = require('path'); //handles file paths
require('dotenv').config({ path: path.join(__dirname, '.env') }); //loads environment variables from .env file

const app = express(); //create express app
app.use(cors()); //allow frontend call backend
app.use(express.json()); //parse JSON bodies

const PORT = process.env.PORT || 3001; //start server on port 3001

// Serve static files (index.html) from public folder
app.use(express.static(path.join(__dirname, '../public')));

// API route
app.get('/api', (req, res) => {
    res.json({ ok: true, message: 'Situation Sim API' });
});
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
}); //start server