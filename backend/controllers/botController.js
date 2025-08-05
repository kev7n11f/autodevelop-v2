const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

exports.chat = async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful AI assistant for AutoDevelop.ai. Help users transform their ideas into reality with practical, step-by-step guidance. Be concise but thorough."
        },
        {
          role: "user",
          content: message
        }
      ],
      max_tokens: 500,
      temperature: 0.7
    });

    const reply = completion.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response.";
    res.json({ reply });
  } catch (err) {
    console.error('OpenAI API Error:', err);
    res.status(500).json({ error: 'Sorry, I encountered an error. Please try again.' });
  }
};
