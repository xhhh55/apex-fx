import { useState } from 'react';
import { DB } from '../storage';

const steps = [
  { title: 'مرحباً بك في APEX FX', desc: 'منصتك المتكاملة لتحليل وتداول الفوركس' },
  { title: 'اكتشف الوسطاء', desc: 'قارن بين أفضل الوسطاء واختر الأنسب لك' },
  { title: 'تابع الأسعار', desc: 'أسعار حية مع تحديث مستمر' },
  { title: 'تدرب بالمحفظة الافتراضية', desc: 'جرّب استراتيجياتك بدون مخاطرة' },
];

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const handleNext = () => {
    if (step < steps.length - 1) setStep(s => s + 1);
    else {
      DB.set('onboardingDone', true);
      onComplete();
    }
  };
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(2,4,8,0.98)', backdropFilter: 'blur(16px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ maxWidth: 400, textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 24 }}>{['👋','🔍','📈','💼'][step]}</div>
        <h2>{steps[step].title}</h2>
        <p style={{ color: 'rgba(238,232,218,0.6)', margin: '12px 0 24px' }}>{steps[step].desc}</p>
        <button onClick={handleNext} style={{ padding: '12px 30px', background: 'linear-gradient(135deg,#D4A843,#A07820)', border: 'none', borderRadius: 30, color: '#080B10', fontWeight: 700 }}>
          {step === steps.length - 1 ? 'ابدأ الآن' : 'التالي'}
        </button>
      </div>
    </div>
  );
}