import { useState } from 'react';

export default function BotUI() {
 const [input, setInput] = useState('');
 const [log, setLog] = useState([]);  const send = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setInput('');
    setLog(prev => [...prev, { from: 'user', text: userMsg }]);

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userMsg })
    });
    const data = await res.json();
    setLog(prev => [...prev, { from: 'bot', text: data.reply }]);
  };

 return (
  <div style={{ maxWidth: 600, margin: 'auto' }}>
   <h2>AutoDevelop.ai Bot</h2>
   <div style={{ border: '1px solid #ddd', padding: 12, minHeight: 200 }}>
    {log.map((m, i) => (
     <p key={i}><strong>{m.from}:</strong> {m.text}</p>
    ))}
   </div>
   <input
    value={input}
    onChange={e => setInput(e.target.value)}
    onKeyDown={e => e.key === 'Enter' && send()}
    placeholder="Say something…"
    style={{ width: '80%', padding: 8 }}
   />
   <button onClick={send} style={{ padding: 8, marginLeft: 4 }}>Send</button>
  </div>
 );
}