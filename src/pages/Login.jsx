import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log("로그인 성공");
      navigate('/home');
    } catch (error) {
      console.error(error);
      setErrorMsg('이메일 또는 비밀번호가 잘못되었습니다.');
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg('');
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      console.log("로그인 성공");
      navigate('/home');
    } catch (error) {
      console.error(error);
      setErrorMsg('구글 로그인에 실패했습니다.');
    }
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundImage: 'url(/image_intro.png)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      padding: '24px'
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(12px)',
        width: '100%',
        maxWidth: '400px',
        padding: '40px',
        borderRadius: '20px',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '8px', color: '#1a1e2d' }}>
          VIVE<span style={{ color: '#6366f1' }}>.</span>
        </h1>
        <p style={{ color: '#6b7280', marginBottom: '32px' }}>수학 Q&A를 시작해보세요</p>

        {errorMsg && (
          <div style={{ color: '#f43f5e', fontSize: '0.9rem', marginBottom: '16px', background: 'rgba(244, 63, 94, 0.1)', padding: '8px 12px', borderRadius: '8px', width: '100%', textAlign: 'center' }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleEmailLogin} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#6b7280', marginBottom: '8px', fontWeight: 600 }}>이메일</label>
            <input 
              type="email" 
              placeholder="example@email.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)', outline: 'none' }}
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#6b7280', marginBottom: '8px', fontWeight: 600 }}>비밀번호</label>
            <input 
              type="password" 
              placeholder="비밀번호를 입력하세요" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)', outline: 'none' }}
              required
            />
          </div>
          <button type="submit" style={{ width: '100%', marginTop: '8px', padding: '14px', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: 'white', border: 'none', borderRadius: '9999px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 14px 0 rgba(99, 102, 241, 0.39)' }}>
            로그인
          </button>
        </form>

        <div style={{ width: '100%', display: 'flex', alignItems: 'center', margin: '24px 0' }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(0,0,0,0.1)' }}></div>
          <span style={{ padding: '0 12px', fontSize: '0.85rem', color: '#6b7280' }}>또는</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(0,0,0,0.1)' }}></div>
        </div>

        <button 
          onClick={handleGoogleLogin} 
          style={{ width: '100%', background: 'white', color: '#333', border: '1px solid #ddd', borderRadius: '9999px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', padding: '14px', fontWeight: 600, cursor: 'pointer' }}
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{ width: '20px', height: '20px' }} />
          구글 계정으로 로그인
        </button>
      </div>
    </div>
  );
}

export default Login;
