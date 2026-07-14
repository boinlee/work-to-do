'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Briefcase, ArrowRight, Sparkles, Mail, Eye, EyeOff, AlertCircle } from 'lucide-react';

const inputStyle = {
  width: '100%',
  padding: '12px 16px',
  borderRadius: 10,
  border: '1px solid rgba(51, 65, 85, 0.8)',
  background: 'rgba(15, 23, 42, 0.6)',
  color: '#f1f5f9',
  fontSize: 14,
  outline: 'none',
  transition: 'all 0.2s ease',
  fontFamily: "'Inter', sans-serif",
};

const handleInputFocus = (e) => {
  e.target.style.borderColor = '#6366f1';
  e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)';
};

const handleInputBlur = (e) => {
  e.target.style.borderColor = 'rgba(51, 65, 85, 0.8)';
  e.target.style.boxShadow = 'none';
};

export default function LoginPage() {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const { signInWithEmail, signUpWithEmail } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check for OAuth error from callback
  const authError = searchParams.get('error');

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!email.trim() || !password.trim()) return;
    if (mode === 'register' && !name.trim()) return;
    if (password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다');
      return;
    }

    setIsLoading(true);
    try {
      if (mode === 'register') {
        const data = await signUpWithEmail(name.trim(), email.trim().toLowerCase(), password);
        if (data.session) {
          // Auto-signed in
          router.push('/');
        } else {
          // Email confirmation required
          setSuccessMsg('확인 이메일을 발송했습니다. 이메일을 확인해주세요.');
          setMode('login');
        }
      } else {
        await signInWithEmail(email.trim().toLowerCase(), password);
        router.push('/');
      }
    } catch (err) {
      console.error('Auth error:', err);
      if (err.message?.includes('Invalid login credentials')) {
        setError('이메일 또는 비밀번호가 올바르지 않습니다');
      } else if (err.message?.includes('User already registered')) {
        setError('이미 등록된 이메일입니다. 로그인해주세요.');
        setMode('login');
      } else if (err.message?.includes('Email not confirmed')) {
        setError('이메일 인증이 완료되지 않았습니다. 이메일을 확인해주세요.');
      } else {
        setError(err.message || '인증에 실패했습니다. 다시 시도해주세요.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
        padding: 20,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background decoration */}
      <div
        style={{
          position: 'absolute',
          top: '-20%',
          right: '-10%',
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-20%',
          left: '-10%',
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          width: '100%',
          maxWidth: 440,
          animation: 'slideUp 0.6s ease',
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: 36,
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: 'var(--accent-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
              boxShadow: '0 8px 32px rgba(99,102,241,0.3)',
            }}
          >
            <Briefcase size={32} color="white" />
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: '#f1f5f9', marginBottom: 8 }}>
            Work To Do
          </h1>
          <p style={{ fontSize: 15, color: '#94a3b8', textAlign: 'center', lineHeight: 1.5 }}>
            팀과 함께 프로젝트를 관리하세요
          </p>
        </div>

        {/* Login card */}
        <div
          style={{
            background: 'rgba(30, 41, 59, 0.6)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(51, 65, 85, 0.5)',
            borderRadius: 20,
            padding: '36px 32px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
            <Sparkles size={18} color="#8b5cf6" />
            <h2 style={{ fontSize: 18, fontWeight: 600, color: '#f1f5f9' }}>
              {mode === 'login' ? '로그인' : '회원가입'}
            </h2>
          </div>

          {/* Error/Success messages */}
          {(error || authError) && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 14px',
                borderRadius: 10,
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                marginBottom: 16,
              }}
            >
              <AlertCircle size={16} color="#ef4444" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: '#fca5a5' }}>
                {error || '인증에 실패했습니다. 다시 시도해주세요.'}
              </span>
            </div>
          )}

          {successMsg && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 10,
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                marginBottom: 16,
              }}
            >
              <span style={{ fontSize: 13, color: '#86efac' }}>{successMsg}</span>
            </div>
          )}



          {/* Email form */}
          <form onSubmit={handleEmailAuth} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Name (only for register) */}
            {mode === 'register' && (
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#94a3b8', marginBottom: 6 }}>
                  이름
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="이름을 입력하세요"
                  required
                  style={inputStyle}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                />
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#94a3b8', marginBottom: 6 }}>
                이메일
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="이메일을 입력하세요"
                required
                style={inputStyle}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#94a3b8', marginBottom: 6 }}>
                비밀번호
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'register' ? '비밀번호 (6자 이상)' : '비밀번호를 입력하세요'}
                  required
                  minLength={6}
                  style={{ ...inputStyle, paddingRight: 44 }}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#64748b',
                    padding: 2,
                    display: 'flex',
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                marginTop: 6,
                padding: '14px 24px',
                borderRadius: 10,
                border: 'none',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: 'white',
                fontSize: 15,
                fontWeight: 600,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.6 : 1,
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                fontFamily: "'Inter', sans-serif",
                boxShadow: '0 4px 14px rgba(99,102,241,0.3)',
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(99,102,241,0.4)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 14px rgba(99,102,241,0.3)';
              }}
            >
              {isLoading ? (
                mode === 'login' ? '로그인 중...' : '가입 중...'
              ) : (
                <>
                  {mode === 'login' ? '로그인' : '회원가입'}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Toggle login/register */}
          <div
            style={{
              textAlign: 'center',
              marginTop: 20,
              fontSize: 13,
              color: '#94a3b8',
            }}
          >
            {mode === 'login' ? (
              <>
                계정이 없으신가요?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('register'); setError(''); setSuccessMsg(''); }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#818cf8',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: 13,
                    fontFamily: "'Inter', sans-serif",
                    textDecoration: 'underline',
                    textUnderlineOffset: 2,
                  }}
                >
                  회원가입
                </button>
              </>
            ) : (
              <>
                이미 계정이 있으신가요?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(''); setSuccessMsg(''); }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#818cf8',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: 13,
                    fontFamily: "'Inter', sans-serif",
                    textDecoration: 'underline',
                    textUnderlineOffset: 2,
                  }}
                >
                  로그인
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
