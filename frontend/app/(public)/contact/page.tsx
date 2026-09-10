'use client';

import { useState } from 'react';

const INPUT = {
  width: '100%',
  padding: '12px 16px',
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--text-primary)',
  fontSize: '14px',
  outline: 'none',
  WebkitTextFillColor: 'var(--text-primary)',
  caretColor: 'var(--gold)',
  transition: 'border-color var(--transition)',
} as React.CSSProperties;

const LBL = {
  display: 'block',
  fontSize: '12px',
  fontWeight: '600',
  color: 'var(--text-muted)',
  marginBottom: '8px',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
} as React.CSSProperties;

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: 'General', message: '' });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    // In a real app this would POST to an API or email service
    await new Promise(r => setTimeout(r, 800));
    setSent(true);
    setSending(false);
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '120px 24px 80px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '60px' }}>
        <p style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--blue-bright)', marginBottom: '12px' }}>Get In Touch</p>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '14px' }}>Contact Us</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px', maxWidth: '440px', margin: '0 auto' }}>
          Questions about a timepiece? We're here. Reach out and we'll respond within 24 hours.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '40px', alignItems: 'start' }}>
        {/* Form */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '40px' }}>
          {sent ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ fontSize: '56px', marginBottom: '16px' }}>✓</div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '22px', color: 'var(--text-primary)', marginBottom: '8px' }}>Message Sent!</h3>
              <p style={{ color: 'var(--text-secondary)' }}>We'll get back to you shortly.</p>
              <button onClick={() => { setSent(false); setForm({ name: '', email: '', phone: '', subject: 'General', message: '' }); }}
                style={{ marginTop: '20px', padding: '10px 24px', background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '14px' }}>
                Send Another
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={LBL}>Name *</label>
                  <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Your name" style={INPUT}
                    onFocus={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--border-active)'; }}
                    onBlur={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--border)'; }}
                  />
                </div>
                <div>
                  <label style={LBL}>Email *</label>
                  <input required type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="you@example.com" style={INPUT}
                    onFocus={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--border-active)'; }}
                    onBlur={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--border)'; }}
                  />
                </div>
              </div>
              <div>
                <label style={LBL}>Phone</label>
                <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 98765 43210" style={INPUT}
                  onFocus={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--border-active)'; }}
                  onBlur={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--border)'; }}
                />
              </div>
              <div>
                <label style={LBL}>Subject</label>
                <select value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                  style={{ ...INPUT, cursor: 'pointer' }}>
                  <option value="General">General Inquiry</option>
                  <option value="Product">Product Inquiry</option>
                  <option value="Support">Support</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label style={LBL}>Message *</label>
                <textarea required rows={5} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="Tell us how we can help…"
                  style={{ ...INPUT, resize: 'vertical' }}
                  onFocus={e => { (e.target as HTMLTextAreaElement).style.borderColor = 'var(--border-active)'; }}
                  onBlur={e => { (e.target as HTMLTextAreaElement).style.borderColor = 'var(--border)'; }}
                />
              </div>
              <button type="submit" disabled={sending}
                style={{ padding: '13px', background: 'var(--gold-gradient)', color: '#000', fontWeight: '700', fontSize: '14px', borderRadius: 'var(--radius-md)', border: 'none', cursor: sending ? 'not-allowed' : 'pointer', opacity: sending ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                {sending && <div style={{ width: 14, height: 14, border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />}
                {sending ? 'Sending…' : 'Send Message'}
              </button>
            </form>
          )}
        </div>

        {/* Contact info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {[
            { icon: '📧', title: 'Email', value: 'contact@soulxtime.com' },
            { icon: '📱', title: 'WhatsApp', value: 'Available on request' },
            { icon: '🕐', title: 'Hours', value: 'Mon–Sat · 10am–7pm IST' },
            { icon: '📍', title: 'Location', value: 'India' },
          ].map(({ icon, title, value }) => (
            <div key={title} style={{ display: 'flex', gap: '16px', padding: '20px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '24px', flexShrink: 0, marginTop: '2px' }}>{icon}</span>
              <div>
                <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>{title}</div>
                <div style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          div[style*="grid-template-columns: 3fr 2fr"] {
            grid-template-columns: 1fr !important;
          }
          div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
