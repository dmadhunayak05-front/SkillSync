import React, { useState } from 'react';
import Modal from './Modal';
import { useAuth } from '../../context/AuthContext';
import { 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
  AlertCircle,
  CheckCircle2,
  KeyRound,
  ArrowLeft
} from 'lucide-react';

function formatFirebaseError(err) {
  const code = err?.code || '';
  if (code === 'auth/configuration-not-found') {
    return "Firebase Authentication is not activated yet. In Firebase Console, go to Build > Authentication, click 'Get Started', and enable Google & Email/Password under Sign-in method.";
  }
  if (code === 'auth/operation-not-allowed') {
    return "Google Sign-In is not enabled yet in your Firebase Console. Please go to Authentication > Sign-in method, click Google, and toggle Enable.";
  }
  if (code === 'auth/popup-blocked') {
    return "Google popup was blocked by your browser. If you use Brave or an ad-blocker, please allow popups or turn off Shields for localhost.";
  }
  if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
    return 'Invalid email or password. Please verify your credentials and try again.';
  }
  if (code === 'auth/user-not-found') {
    return 'No student account found with this email. Please check spelling or create an account.';
  }
  if (code === 'auth/email-already-in-use') {
    return 'An account already exists with this email address. Please sign in instead.';
  }
  if (code === 'auth/weak-password') {
    return 'Password is too weak. Please use at least 6 characters.';
  }
  if (code === 'auth/invalid-email') {
    return 'Please enter a valid student email address.';
  }
  if (code === 'auth/too-many-requests') {
    return 'Too many failed login attempts. Please wait a few moments and try again.';
  }
  if (code === 'auth/popup-closed-by-user') {
    return 'Google Sign-In popup was closed. (If it closed instantly, ensure Google Sign-In is enabled in Firebase Console, and disable Brave Shields for localhost).';
  }
  if (code === 'auth/network-request-failed') {
    return 'Network connection failed. Please check your internet connection.';
  }
  if (code === 'auth/invalid-api-key') {
    return 'Firebase credentials not configured. Please add your Firebase API key to client/.env.';
  }
  return err?.message || 'Authentication failed. Please verify credentials.';
}

export default function AuthModal({ isOpen, onClose, defaultMode = 'login', onAuthSuccess }) {
  const { loginWithGoogle, loginWithEmail, registerWithEmail, sendPasswordReset } = useAuth();

  const [mode, setMode] = useState(defaultMode); // 'login', 'signup', 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const resetForm = () => {
    setError('');
    setResetSent(false);
    setEmail('');
    setPassword('');
    setName('');
  };

  const handleGoogleAuth = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
      if (onAuthSuccess) onAuthSuccess();
      onClose();
    } catch (err) {
      console.error('[SkillSync Auth] Google login error:', err);
      setError(formatFirebaseError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please provide your student email address.');
      return;
    }

    if (mode === 'forgot') {
      setLoading(true);
      try {
        await sendPasswordReset(email.trim());
        setResetSent(true);
      } catch (err) {
        setError(formatFirebaseError(err));
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!password) {
      setError('Please provide your password.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signup') {
        if (!name.trim()) {
          setError('Please provide your name.');
          setLoading(false);
          return;
        }
        await registerWithEmail(email.trim(), password, name.trim());
      } else {
        await loginWithEmail(email.trim(), password);
      }
      if (onAuthSuccess) onAuthSuccess();
      onClose();
    } catch (err) {
      setError(formatFirebaseError(err));
    } finally {
      setLoading(false);
    }
  };

  const modalTitle = mode === 'login' 
    ? "Welcome Back to SkillSync" 
    : mode === 'signup' 
    ? "Join SkillSync Student Network" 
    : "Reset Your Password";

  const modalSubtitle = mode === 'forgot'
    ? "We'll send a secure password reset link to your email"
    : "Peer-to-peer college skill exchange platform";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      subtitle={modalSubtitle}
      maxWidth="max-w-md"
    >
      <div className="space-y-5">
        
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {resetSent ? (
          <div className="text-center py-4 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-base font-extrabold text-slate-900">Check Your Inbox</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                A password reset link has been sent to <strong>{email}</strong>. Follow the instructions in the email to set a new password.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setResetSent(false);
                setMode('login');
              }}
              className="py-2.5 px-5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors"
            >
              Back to Sign In
            </button>
          </div>
        ) : (
          <>
            {/* Primary Google Sign-In Button (Only on Login/Signup) */}
            {mode !== 'forgot' && (
              <>
                <button
                  type="button"
                  onClick={handleGoogleAuth}
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs sm:text-sm border border-slate-300 shadow-xs flex items-center justify-center gap-3 transition-all hover:shadow-sm disabled:opacity-60"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </button>

                <div className="relative flex items-center justify-center">
                  <div className="border-t border-slate-200 w-full" />
                  <span className="bg-white px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider absolute">
                    Or with student email
                  </span>
                </div>
              </>
            )}

            {/* Email Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="e.g. Rahul Sharma"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Student Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    placeholder="student@university.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
              </div>

              {mode !== 'forgot' && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">Password</label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        onClick={() => {
                          setError('');
                          setMode('forgot');
                        }}
                        className="text-[11px] font-semibold text-brand-600 hover:text-brand-700"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>
                      {mode === 'login' 
                        ? 'Sign In to SkillSync' 
                        : mode === 'signup' 
                        ? 'Create Student Account' 
                        : 'Send Password Reset Link'}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>

            {/* Toggle Modes */}
            <div className="text-center text-xs text-slate-500 pt-1">
              {mode === 'login' ? (
                <p>
                  New to SkillSync?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      resetForm();
                      setMode('signup');
                    }}
                    className="font-bold text-brand-600 hover:text-brand-700"
                  >
                    Create an account
                  </button>
                </p>
              ) : mode === 'signup' ? (
                <p>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      resetForm();
                      setMode('login');
                    }}
                    className="font-bold text-brand-600 hover:text-brand-700"
                  >
                    Sign in
                  </button>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setMode('login');
                  }}
                  className="font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1.5 mx-auto"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </button>
              )}
            </div>
          </>
        )}

      </div>
    </Modal>
  );
}
