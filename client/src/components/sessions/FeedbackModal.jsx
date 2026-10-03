import React, { useState } from 'react';
import Modal from '../common/Modal';
import { useAuth } from '../../context/AuthContext';
import { useSync } from '../../context/SyncContext';
import { Star, ThumbsUp, Sparkles, CheckCircle2 } from 'lucide-react';

export default function FeedbackModal({ isOpen, onClose, session, peerUser, onSubmitted }) {
  const { currentUser } = useAuth();
  const { submitFeedback } = useSync();

  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [whatLearned, setWhatLearned] = useState('');
  const [usefulness, setUsefulness] = useState('Extremely useful');
  const [comment, setComment] = useState('');
  const [wouldLearnAgain, setWouldLearnAgain] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await submitFeedback({
        sessionId: session.id,
        reviewerId: currentUser.uid,
        revieweeId: peerUser?.uid || (session.teacherId === currentUser.uid ? session.learnerId : session.teacherId),
        rating,
        comment: comment.trim() || 'Great session! Very helpful explanations and clear guidance.',
        whatLearned: whatLearned.trim() || `${session.skill} core patterns and best practices.`,
        usefulness,
        wouldLearnAgain
      });

      setSubmitted(true);
      if (onSubmitted) onSubmitted();
    } catch (err) {
      console.error('Feedback submission error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDone = () => {
    setSubmitted(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleDone}
      title={submitted ? "Feedback Received! 🌟" : "How was your learning session?"}
      subtitle={submitted ? "Credits and reputation updated successfully" : `Rate your 1-on-1 session with ${peerUser?.name || 'your peer'}`}
      maxWidth="max-w-md"
    >
      {submitted ? (
        <div className="text-center py-4 space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div>
            <h4 className="text-lg font-black text-slate-900">Thank you for rating!</h4>
            <p className="text-xs text-slate-600 mt-1">
              Your feedback helped {peerUser?.name} earn reputation credits. The community grows stronger through peer feedback.
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-brand-50 border border-brand-200 text-xs text-brand-900 font-semibold">
            {rating === 5 ? "+5 Bonus Credits Awarded to " + peerUser?.name : "Reputation updated"}
          </div>
          <button
            onClick={handleDone}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900 text-white font-bold text-xs"
          >
            Done
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Peer Info */}
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200">
            <img src={peerUser?.photoURL} alt="" className="w-10 h-10 rounded-full object-cover" />
            <div>
              <p className="text-xs font-bold text-slate-900">{peerUser?.name}</p>
              <p className="text-[11px] text-slate-500">Skill Taught: {session?.skill || 'General'}</p>
            </div>
          </div>

          {/* 5-Star Interactive Rating */}
          <div className="text-center py-2">
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Overall Session Rating
            </label>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 text-2xl transition-transform hover:scale-125 focus:outline-none"
                >
                  <Star 
                    className={`w-7 h-7 ${
                      (hoverRating || rating) >= star 
                        ? 'fill-amber-400 text-amber-400' 
                        : 'text-slate-300'
                    }`} 
                  />
                </button>
              ))}
            </div>
            <p className="text-xs font-bold text-amber-600 mt-1">
              {rating === 5 ? 'Exceptional Mentor! (5.0)' : `${rating}.0 / 5.0`}
            </p>
          </div>

          {/* Question: What did you learn? */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              What key concepts did you learn today?
            </label>
            <input
              type="text"
              placeholder={`e.g. Mastered ${session?.skill || 'tool'} basics and live debugging`}
              value={whatLearned}
              onChange={(e) => setWhatLearned(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          {/* Question: How useful was the session? */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              How useful was this session?
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['Extremely useful', 'Very useful', 'Moderately useful'].map((opt) => (
                <button
                  type="button"
                  key={opt}
                  onClick={() => setUsefulness(opt)}
                  className={`py-2 px-2 text-center text-[11px] font-bold rounded-xl border transition-all cursor-pointer ${
                    usefulness === opt
                      ? 'bg-brand-50 border-brand-500 text-brand-700 shadow-sm'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Written Feedback */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Written feedback for {peerUser?.name}
            </label>
            <textarea
              rows={3}
              placeholder="Share what went well and what you appreciated..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full p-3 text-xs bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          {/* Would you learn again toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-xs font-semibold text-slate-700">Would you learn with this peer again?</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setWouldLearnAgain(true)}
                className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all ${
                  wouldLearnAgain ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-200'
                }`}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setWouldLearnAgain(false)}
                className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all ${
                  !wouldLearnAgain ? 'bg-rose-600 text-white border-rose-600' : 'bg-white text-slate-600 border-slate-200'
                }`}
              >
                No
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-brand-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit Feedback & Award Credits'}
          </button>
        </form>
      )}
    </Modal>
  );
}
