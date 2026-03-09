import React, { useState } from "react";
import { SignupScreen } from './components/onboarding/Signup.jsx';
import { SignInScreen } from './components/onboarding/SignInScreen.jsx';
import { OTPScreen } from './components/onboarding/OTPScreen.jsx';
import { ProfileSetup } from './components/profile/ProfileSetup.jsx';
import * as userApi from './api/userApi.js';

const FontStyles = () => (
  <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
      body { font-family: 'Poppins', sans-serif; }
      .phone-shadow { box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25), 0 0 0 12px #1a1a1a; }
    `}</style>
);

export default function App() {
  const [view, setView] = useState('signin');

  return (
    <div className="w-full font-sans selection:bg-blue-200">
      <FontStyles />
      {view === 'signup' && (
        <SignupScreen
          onNext={async (email) => {
            try {
              const res = await userApi.register(email);
              if (res.user?._id) {
                localStorage.setItem('rumi_user_id', res.user._id);
                setView('profile');
              } else setView('otp');
            } catch {
              setView('otp');
            }
          }}
          onLogin={() => setView('signin')}
        />
      )}
      {view === 'signin' && (
        <SignInScreen
          onLoginSuccess={() => setView('profile')}
          onForgotPassword={() => setView('otp')}
          onSignup={() => setView('signup')}
        />
      )}
      {view === 'otp' && (
        <OTPScreen onVerify={() => setView('profile')} onBack={() => setView('signin')} />
      )}
      {view === 'profile' && (
        <ProfileSetup
          onComplete={() => setView('signin')}
          onBack={() => setView('signin')}
        />
      )}
    </div>
  );
}
