const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 7009;

// API Key configuration
const API_KEY = "sk-4d7b36a6bf5b48bd8d4f3ac86cdeba85";
const API_URL = "https://api.deepseek.com/chat/completions";

app.use(express.json());
app.use(express.static(__dirname)); // Serve static files from current directory

// Proxy endpoint for DeepSeek API
app.post('/api/interpret', async (req, res) => {
    try {
        const { prompt } = req.body;

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: "deepseek-chat",
                messages: [
                    {"role": "system", "content": "你是一位专业的塔罗牌占卜师。"},
                    {"role": "user", "content": prompt}
                ],
                stream: false
            })
        });

        if (!response.ok) {
            const errorData = await response.text();
            throw new Error(`API Error: ${response.status} - ${errorData}`);
        }

        const data = await response.json();
        res.json(data);

    } catch (error) {
        console.error('Error calling DeepSeek API:', error);
        res.status(500).json({ error: error.message });
    }
});

// Proxy endpoint for True Random API (ANU Quantum Random Numbers)
app.get('/api/random', async (req, res) => {
    try {
        // Fetch 78 random numbers (uint16) for the 78 cards
        const response = await fetch('https://qrng.anu.edu.au/API/jsonI.php?length=78&type=uint16');
        
        if (!response.ok) {
            throw new Error(`Random API Error: ${response.status}`);
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error calling Random API:', error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log(`Open your browser and visit http://localhost:${port}`);
});