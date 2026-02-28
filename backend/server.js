const express = require('express');
const { ElevenLabsClient } = require('elevenlabs');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const app = express();
const port = 5000;

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

const client = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY,
});

app.post('/api/narrate', async (req, res) => {
  const { text } = req.body;
  try {
    const audio = await client.generate({
      voice: "Rachel", 
      model_id: "eleven_multilingual_v2",
      text: text,
    });
    res.set({
      'Content-Type': 'audio/mpeg',
      'Transfer-Encoding': 'chunked'
    });
    audio.pipe(res);
  } catch (error) {
    console.error('ElevenLabs Error:', error);
    res.status(500).json({ error: 'Failed to generate voice' });
  }
});

app.listen(port, () => {
  console.log(`🚀 Disaster Sim Server running at http://localhost:${port}`);
});