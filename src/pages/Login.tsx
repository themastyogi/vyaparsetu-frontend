import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Eye, EyeOff, ArrowRight, ShieldCheck,
  Building2, TrendingUp, Users, Zap,
} from 'lucide-react';
import './Login.css';

const DEMO_EMAIL = 'owner@vyaparsetu.in';
const DEMO_PASS  = 'Demo@1234';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [step, setStep]           = useState<'login'|'mfa'>('login');
  const [otp, setOtp]             = useState(['','','','','','']);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 1400));
    if (email === DEMO_EMAIL && password === DEMO_PASS) {
      setStep('mfa');
    } else {
      setError('Invalid credentials. Try owner@vyaparsetu.in / Demo@1234');
    }
    setLoading(false);
  };

  const handleOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) { setError('Enter the 6-digit OTP.'); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    // Any 6-digit code passes in demo
    navigate('/dashboard');
    setLoading(false);
  };

  const handleOtpChange = (val: string, idx: number) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[idx] = val;
    setOtp(next);
    if (val && idx < 5) {
      const el = document.getElementById(`otp-${idx + 1}`);
      el?.focus();
    }
  };

  const handleOtpKey = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      document.getElementById(`otp-${idx - 1}`)?.focus();
    }
  };

  const features = [
    { icon: <TrendingUp size={18}/>, text: 'GST-compliant accounting' },
    { icon: <Users size={18}/>,     text: 'Multi-tenant RBAC' },
    { icon: <Building2 size={18}/>, text: 'Schedule III financials' },
    { icon: <Zap size={18}/>,       text: 'Real-time trial balance' },
  ];

  return (
    <div className="login-root">
      {/* ── Left panel ── */}
      <div className="login-left">
        <div className="login-left-inner">
          {/* Logo */}
          <div className="login-logo animate-fade-in-up">
            <div className="logo-icon">
              <span>VS</span>
            </div>
            <div className="logo-text">
              <span className="logo-name">VyaparSetu</span>
              <span className="logo-tagline">Smart Accounting for India</span>
            </div>
          </div>

          {/* Hero headline */}
          <div className="login-hero animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <h1 className="hero-title">
              Your business,<br />
              <span className="gradient-text">fully in control.</span>
            </h1>
            <p className="hero-sub">
              The accounting platform built for Indian SMEs — GST-ready,
              CA-reviewed, and production-grade from day one.
            </p>
          </div>

          {/* Feature chips */}
          <div className="login-features animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            {features.map((f, i) => (
              <div className="feature-chip" key={i}>
                <span className="chip-icon">{f.icon}</span>
                <span>{f.text}</span>
              </div>
            ))}
          </div>

          {/* Floating card decoration */}
          <div className="login-card-deco animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <div className="deco-card">
              <div className="deco-row">
                <span className="deco-label">Monthly Revenue</span>
                <span className="deco-badge success">+18.4%</span>
              </div>
              <div className="deco-amount">₹ 24,80,500</div>
              <div className="deco-bar-row">
                {[60,80,45,90,70,85,95].map((h,i)=>(
                  <div key={i} className="deco-bar" style={{ height: `${h}%` }}/>
                ))}
              </div>
            </div>
            <div className="deco-card deco-card-sm">
              <ShieldCheck size={16} className="deco-icon-green"/>
              <div>
                <div className="deco-sm-title">GST Filed</div>
                <div className="deco-sm-sub">GSTR-1 · Apr 2026</div>
              </div>
            </div>
          </div>
        </div>

        {/* Gradient orbs */}
        <div className="orb orb-1"/>
        <div className="orb orb-2"/>
      </div>

      {/* ── Right panel (form) ── */}
      <div className="login-right">
        <div className="login-form-wrap animate-fade-in-up">
          {step === 'login' ? (
            <>
              <div className="form-header">
                <h2 className="form-title">Welcome back</h2>
                <p className="form-sub">Sign in to your VyaparSetu workspace</p>
              </div>

              {error && (
                <div className="form-error animate-fade-in">
                  <span>⚠</span> {error}
                </div>
              )}

              <form onSubmit={handleLogin} className="form-body" noValidate>
                <div className="field-group">
                  <label className="field-label">Email address</label>
                  <input
                    id="login-email"
                    type="email"
                    className="field-input"
                    placeholder="you@company.in"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>

                <div className="field-group">
                  <div className="field-label-row">
                    <label className="field-label">Password</label>
                    <button type="button" className="link-btn">Forgot password?</button>
                  </div>
                  <div className="field-input-wrap">
                    <input
                      id="login-password"
                      type={showPass ? 'text' : 'password'}
                      className="field-input"
                      placeholder="••••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      className="pass-toggle"
                      onClick={() => setShowPass(v => !v)}
                      aria-label="Toggle password"
                    >
                      {showPass ? <EyeOff size={16}/> : <Eye size={16}/>}
                    </button>
                  </div>
                </div>

                <button id="login-submit" type="submit" className="btn-primary" disabled={loading}>
                  {loading ? <span className="btn-spinner"/> : (
                    <><span>Sign in</span><ArrowRight size={16}/></>
                  )}
                </button>
              </form>

              <div className="form-divider"><span>Demo credentials</span></div>
              <div className="demo-creds">
                <button
                  id="demo-fill"
                  type="button"
                  className="demo-btn"
                  onClick={() => { setEmail(DEMO_EMAIL); setPassword(DEMO_PASS); }}
                >
                  Fill demo credentials
                </button>
              </div>
            </>
          ) : (
            /* ── MFA step ── */
            <>
              <div className="form-header">
                <div className="mfa-icon-wrap">
                  <ShieldCheck size={28} className="mfa-icon"/>
                </div>
                <h2 className="form-title">Two-factor auth</h2>
                <p className="form-sub">
                  Enter the 6-digit code from your authenticator app
                </p>
              </div>

              {error && (
                <div className="form-error animate-fade-in">
                  <span>⚠</span> {error}
                </div>
              )}

              <form onSubmit={handleOtp} className="form-body">
                <div className="otp-row">
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      id={`otp-${i}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      className="otp-box"
                      value={digit}
                      onChange={e => handleOtpChange(e.target.value, i)}
                      onKeyDown={e => handleOtpKey(e, i)}
                    />
                  ))}
                </div>
                <p className="otp-hint">Any 6 digits accepted in demo mode</p>
                <button id="mfa-submit" type="submit" className="btn-primary" disabled={loading}>
                  {loading ? <span className="btn-spinner"/> : (
                    <><span>Verify &amp; continue</span><ArrowRight size={16}/></>
                  )}
                </button>
                <button
                  id="mfa-back"
                  type="button"
                  className="btn-ghost"
                  onClick={() => { setStep('login'); setError(''); setOtp(['','','','','','']); }}
                >
                  ← Back to login
                </button>
              </form>
            </>
          )}

          <p className="form-footer">
            Don't have an account?&nbsp;
            <button type="button" className="link-btn">Request access</button>
          </p>
        </div>
      </div>
    </div>
  );
}
