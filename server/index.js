const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3001;
const ML_API_URL = 'http://127.0.0.1:5000/predict';

app.use(cors());
app.use(express.json());

app.post('/api/check-news', async (req, res) => {
    try {
        const { text } = req.body;
        
        if (!text) {
            return res.status(400).json({ error: "Text is required" });
        }

        // Forward request to Flask ML API
        const response = await axios.post(ML_API_URL, { text });
        
        // Return the prediction
        return res.json(response.data);
    } catch (error) {
        console.error("Error communicating with ML API:", error.message);
        return res.status(500).json({ error: "Failed to process prediction" });
    }
});

app.listen(PORT, () => {
    console.log(`Node backend running on port ${PORT}`);
});
