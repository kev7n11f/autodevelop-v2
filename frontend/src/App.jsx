import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import BotUI from './components/BotUI';
import About from './components/About';
import Contact from './components/Contact';
import Privacy from './components/Privacy';

export default function App() {
  return (
    <Router>
      <main style={{ padding: '2rem', fontFamily: 'Arial, sans-serif' }}>
        <header style={{ position: 'sticky', top: 0, background: '#fff', paddingBottom: '1rem' }}>
          <h1 style={{ textAlign: 'center', marginBottom: '0.5rem' }}>AutoDevelop.ai</h1>
          <p style={{ textAlign: 'center', fontSize: '1rem', color: '#555' }}>
            Use AI to transform your ideas into reality — step by step, powered by you.
          </p>
        </header>

        <Routes>
          <Route path="/" element={<BotUI />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy" element={<Privacy />} />
        </Routes>

        <footer style={{ marginTop: '2rem', borderTop: '1px solid #eee', paddingTop: '1rem', textAlign: 'center', fontSize: '0.9rem', color: '#888' }}>
          © 2025 AutoDevelop.ai • <a href="/privacy">Privacy</a> • <a href="/contact">Contact</a> • <a href="/about">About</a>
        </footer>
      </main>
    </Router>
  );
}