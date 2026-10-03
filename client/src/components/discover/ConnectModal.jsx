import React, { useState } from 'react';
import Modal from '../common/Modal';
import { useAuth } from '../../context/AuthContext';
import { useSync } from '../../context/SyncContext';
import { Send, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

export default function ConnectModal({ isOpen, onClose, targetUser, onSent }) {
  const { currentUser } = useAuth();
  const { sendConnectionRequest } = useSync();

  const [skillRequested, setSkillRequested] = useState(targetUser?.skillsToTeach?.[0] || 'Python');
  const [skillOffered, setSkillOffered] = useState(currentUser?.skillsToTeach?.[0] || 'UI/UX');
  const [message, setMessage] = useState(
    `Hey ${targetUser?.name?.split(' ')[0] || 'there'}! I'd love to connect to learn ${targetUser?.skillsToTeach?.[0] || 'skills'}, and I'm happy to help you with ${currentUser?.skillsToTeach?.[0] || 'design/coding'} in return!`
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await sendConnectionRequest({
        receiverId: targetUser.uid,
        message: message.trim(),
        skillOffered,
        skillRequested
      });

      setSent(true);
      if (onSent) onSent();
    } catch (err) {
      setError(err.message || 'Failed to send request');
    } finally {
      setLoading(false);
    }
  };

  const handleDone = () => {
    setSent(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleDone}
      title={sent ? "Request Sent! 🚀" : `Connect with ${targetUser?.name}`}
      subtitle={sent ? "Your peer will receive an instant notification" : "Propose a mutual skill exchange"}
      maxWidth="max-w-md"
    >
      {sent ? (
        <div className="text-center py-4 space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <div>
            <h4 className="text-base font-bold text-slate-900">Learning request sent!</h4>
            <p className="text-xs text-slate-600 mt-1">
              Once {targetUser?.name} accepts, you can immediately chat and schedule a Google Meet session.
            </p>
          </div>
          <button
            onClick={handleDone}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors"
          >
            Back to Discovery
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Peer Card */}
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200">
            <img src={targetUser?.photoURL} alt="" className="w-11 h-11 rounded-full object-cover" />
            <div>
              <p className="text-xs font-bold text-slate-900">{targetUser?.name}</p>
              <p className="text-[11px] text-slate-500">{targetUser?.college} • ⭐ {targetUser?.rating?.toFixed(1) || '4.8'}</p>
            </div>
          </div>

          {/* Skill You Want To Learn */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              What skill do you want to learn from {targetUser?.name?.split(' ')[0]}?
            </label>
            <select
              value={skillRequested}
              onChange={(e) => setSkillRequested(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            >
              {(targetUser?.skillsToTeach || ['Python', 'Web Dev']).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Skill You Offer to Teach */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              What can you help them with in exchange?
            </label>
            <select
              value={skillOffered}
              onChange={(e) => setSkillOffered(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            >
              {(currentUser?.skillsToTeach || ['UI/UX', 'Figma']).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Personalized Message */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Introduction Message
            </label>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              className="w-full p-3 text-xs bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-brand-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {loading ? 'Sending Request...' : 'Send Learning Request'}
          </button>
        </form>
      )}
    </Modal>
  );
}
