import { useState } from 'react';

export default function BotUI() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (input.trim() === '') return;
    const userText = input;
    setMessages(prev => [...prev, { type: 'user', text: userText }]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3001/api/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userText })
      });
      const data = await response.json();
      setMessages(prev => [...prev, { type: 'bot', text: data.reply || 'AI response placeholder.' }]);
    } catch (err) {
      setMessages(prev => [...prev, { type: 'bot', text: 'Error talking to the server.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <section style={{
      margin: '2rem auto',
      maxWidth: '600px',
      padding: '1rem',
      border: '1px solid #ddd',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      backgroundColor: '#f9f9f9'
    }}>
      <h2 style={{ marginBottom: '1rem', textAlign: 'center', color: '#333' }}>Your Assistant</h2>

      <div style={{ minHeight: '150px', marginBottom: '1rem' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ margin: '0.5rem 0', textAlign: msg.type === 'user' ? 'right' : 'left' }}>
            <span style={{
              background: msg.type === 'user' ? '#007acc' : '#e5e5e5',
              color: msg.type === 'user' ? '#fff' : '#333',
              padding: '0.5rem 1rem',
              borderRadius: '20px',
              display: 'inline-block',
              maxWidth: '80%'
            }}>{msg.text}</span>
          </div>
        ))}
        {loading && <div style={{ textAlign: 'center', color: '#aaa' }}>Thinking...</div>}
      </div>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder="Type your message and press Enter..."
          style={{
            flex: 1,
            padding: '0.6rem 1rem',
            borderRadius: '16px',
            border: '1px solid '#ccc',
            fontSize: '1rem',
            resize: 'vertical'
          }}
        />
        <button
          onClick={handleSend}
          disabled={loading}
          style={{
            padding: '0.6rem 1rem',
            borderRadius: '16px',
            border: 'none',
            backgroundColor: loading ? '#ccc' : '#007acc',
            color: '#fff',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >Send</button>
      </div>
    </section>
  );
}
