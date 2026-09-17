import { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Headphones } from 'lucide-react';
import toast from 'react-hot-toast';
import { mockSupportTickets, WHATSAPP_CONCIERGE_NUMBER } from '../../data/mockAccountData';

const STATUS_COLORS = {
  OPEN: 'bg-yellow-50 text-yellow-700',
  RESOLVED: 'bg-green-50 text-green-700',
};

/**
 * SupportPage — /account/support
 * PRD ref: "Customer Account > Live chat / WhatsApp concierge support
 * button" (premium) + implicit support-ticket flow. Mock ticket list +
 * local-only submit; WhatsApp link is a real deep link (wa.me), live chat
 * button is a stub — wire to your chat widget SDK when ready.
 */
const SupportPage = () => {
  const [tickets, setTickets] = useState(mockSupportTickets);
  const [form, setForm] = useState({ subject: '', description: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.subject.trim()) return;
    setTickets(prev => [
      { id: `tk_${Date.now()}`, subject: form.subject, status: 'OPEN', createdAt: new Date().toISOString().slice(0, 10), lastReply: 'Our team will respond shortly.' },
      ...prev,
    ]);
    setForm({ subject: '', description: '' });
    toast.success('Support ticket submitted');
  };

  const whatsappHref = `https://wa.me/${WHATSAPP_CONCIERGE_NUMBER.replace(/[^\d]/g, '')}?text=${encodeURIComponent('Hi, I need help with my Billu Bazaar order.')}`;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <h1 className="font-playfair text-xl font-semibold mb-5">Support</h1>

      {/* Concierge / live chat */}
      <div className="bg-brand-text text-white p-6 mb-5 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="font-medium mb-1">Need help right now?</p>
          <p className="text-sm text-white/70">Chat with our concierge team on WhatsApp or live chat.</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary-hero text-xs px-4 py-2.5 flex items-center gap-2 rounded-lg"
            id="support-whatsapp"
          >
            <MessageCircle size={14} /> WhatsApp
          </a>
          <button
            onClick={() => toast('Live chat widget not connected yet')}
            className="bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs px-4 py-2.5 flex items-center gap-2 transition-colors rounded-lg"
            id="support-live-chat"
          >
            <Headphones size={14} /> Live Chat
          </button>
        </div>
      </div>

      {/* New ticket form */}
      <div className="bg-white shadow-sm p-6 mb-5 rounded-lg">
        <h2 className="font-medium text-sm mb-4">Raise a Ticket</h2>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-medium mb-1.5" htmlFor="ticket-subject">Subject</label>
            <input
              id="ticket-subject"
              type="text"
              required
              placeholder="Issue with my order..."
              value={form.subject}
              onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
              className="w-full border border-brand-light px-3 py-2.5 text-sm focus:outline-none focus:border-brand-gold rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" htmlFor="ticket-description">Description</label>
            <textarea
              id="ticket-description"
              rows={4}
              placeholder="Describe your issue in detail..."
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full border border-brand-light px-3 py-2.5 text-sm focus:outline-none focus:border-brand-gold resize-none rounded-lg"
            />
          </div>
          <button type="submit" className="btn-primary" id="ticket-submit">Submit Ticket</button>
        </form>
      </div>

      {/* Ticket history */}
      <div className="bg-white shadow-sm p-6 rounded-lg">
        <h2 className="font-medium text-sm mb-4">Your Tickets</h2>
        {tickets.length === 0 ? (
          <p className="text-sm text-brand-grey">No support tickets yet.</p>
        ) : (
          <div className="space-y-3">
            {tickets.map(t => (
              <div key={t.id} className="py-3 border-b border-brand-light last:border-0">
                <div className="flex justify-between items-start gap-2 mb-1">
                  <p className="text-sm font-medium">{t.subject}</p>
                  <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full flex-shrink-0 ${STATUS_COLORS[t.status]}`}>{t.status}</span>
                </div>
                <p className="text-xs text-brand-grey mb-1">
                  {new Date(t.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
                <p className="text-xs text-brand-grey">{t.lastReply}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default SupportPage;