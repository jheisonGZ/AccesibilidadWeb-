const express = require('express');
const cors = require('cors');
const Groq = require('groq-sdk');
require('dotenv').config();

const app = express();

// Configuración CORS simplificada y funcional
app.use(cors({
  origin: true, // Permite todos los orígenes temporalmente
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ message: 'Backend de Taison funcionando', status: 'online' });
});

// Ruta health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Ruta principal del chat
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, system } = req.body;
    
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: system || 'Eres un asistente amigable llamado Taison' },
        ...messages,
      ],
      max_tokens: 1000,
    });
    
    const text = response.choices[0]?.message?.content || 'Lo siento, no pude responder.';
    res.json({ content: [{ text }] });
  } catch (e) {
    console.error('Error:', e);
    res.status(500).json({ error: 'Error al contactar con Groq' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Backend corriendo en puerto ${PORT}`));