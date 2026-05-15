const express = require('express');
const cors = require('cors');
const Groq = require('groq-sdk');
require('dotenv').config();

const app = express();

// CORS permitiendo todas las origins (cámbialo después si quieres restringir)
app.use(cors());
app.use(express.json());

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

app.post('/api/chat', async (req, res) => {
  try {
    const { messages, system } = req.body;
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: system },
        ...messages,
      ],
      max_tokens: 1000,
    });
    const text = response.choices[0]?.message?.content || 'Lo siento, no pude responder.';
    res.json({ content: [{ text }] });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al contactar Groq' });
  }
});

// Puerto dinámico para Render (y local también)
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Backend con Groq corriendo en puerto ${PORT}`));