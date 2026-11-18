import { useEffect, useRef, useState } from 'react';
import { api } from '../api';

const POLL_MS = 5000;

const timeFormatter = new Intl.DateTimeFormat('es-AR', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

export default function TripChat({ tripId, currentUserId }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);
  const lastCreatedAt = useRef(null);
  const listRef = useRef(null);

  function merge(incoming) {
    setMessages((prev) => {
      const seen = new Set(prev.map((m) => m.id));
      const fresh = incoming.filter((m) => !seen.has(m.id));
      return fresh.length ? [...prev, ...fresh] : prev;
    });
  }

  async function poll() {
    try {
      const data = await api.getMessages(tripId, lastCreatedAt.current);
      if (data.length > 0) {
        merge(data);
        lastCreatedAt.current = data[data.length - 1].created_at;
      }
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    poll();
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') poll();
    }, POLL_MS);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId]);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages.length]);

  async function handleSend(e) {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    setSending(true);
    try {
      const message = await api.sendMessage(tripId, body);
      merge([message]);
      setText('');
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="chat">
      <div className="chat__list" ref={listRef}>
        {messages.length === 0 && (
          <p className="chat__empty">Todavía no hay mensajes. ¡Escribí el primero!</p>
        )}

        {messages.map((m) => {
          const mine = m.sender_id === currentUserId;
          return (
            <div key={m.id} className={`chat__msg ${mine ? 'chat__msg--mine' : ''}`}>
              {!mine && <span className="chat__author">{m.profiles?.name || 'Usuario'}</span>}
              <span className="chat__text">{m.body}</span>
              <span className="chat__time">{timeFormatter.format(new Date(m.created_at))}</span>
            </div>
          );
        })}
      </div>

      {error && <div className="error-banner">{error}</div>}

      <form className="chat__form" onSubmit={handleSend}>
        <input
          placeholder="Escribí un mensaje…"
          value={text}
          maxLength={1000}
          onChange={(e) => setText(e.target.value)}
        />
        <button type="submit" className="btn btn--primary" disabled={sending || !text.trim()}>
          Enviar
        </button>
      </form>
    </div>
  );
}