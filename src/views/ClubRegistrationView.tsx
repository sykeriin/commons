import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Camera, CheckCircle, Info, Upload } from 'lucide-react';
import { createClub } from '@/src/services/firebaseService';
import { User as FirebaseUser } from 'firebase/auth';
import { Button } from '@/src/components/Button';
import { Card } from '@/src/components/Card';
import { cn } from '@/src/lib/utils';

interface ClubRegistrationViewProps {
  user: FirebaseUser | null;
  onComplete: () => void;
  onCancel?: () => void;
}

export const ClubRegistrationView: React.FC<ClubRegistrationViewProps> = ({ user, onComplete, onCancel }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'TECH',
    logoURL: '',
  });

  const handleSubmit = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await createClub({ ...formData, ownerUid: user.uid });
      setStep(3);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="screen-shell mx-auto max-w-3xl">
      <section className="editorial-frame interactive-grid bg-primary-container p-6 md:p-8">
        <span className="sticker-badge bg-ink text-white">CLUB DOSSIER</span>
        <h1 className="mt-5 font-headline text-5xl font-black uppercase leading-[0.84] tracking-tighter md:text-7xl">
          BUILD YOUR <span className="italic text-primary">CLUB</span>
        </h1>
        <p className="mt-4 max-w-xl text-base font-medium leading-relaxed text-on-primary-container">
          This flow should feel like launching something exciting, not filling out a plain form.
        </p>
        <div className="mt-6 flex gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className={cn('h-3 flex-1 rounded-full border-[2px] border-ink', step >= i ? 'bg-tertiary-container' : 'bg-white')} />
          ))}
        </div>
      </section>

      <Card variant={step === 2 ? 'secondary' : 'lowest'} className="mt-8 p-6 md:p-8">
        {step === 1 && (
          <motion.div initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
            <h2 className="flex items-center gap-2 font-headline text-3xl font-black uppercase tracking-tighter"><Info size={22} /> BASIC INFO</h2>
            <input className="editorial-input" placeholder="Club name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            <select className="editorial-input" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
              {['TECH', 'CREATIVE', 'ACADEMIC', 'ARTS', 'SPORTS'].map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
            <textarea className="editorial-input min-h-[120px] resize-none" placeholder="What is your club all about?" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={onCancel}>CANCEL</Button>
              <Button className="flex-1" onClick={() => setStep(2)} disabled={!formData.name || !formData.description}>NEXT STEP</Button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
            <h2 className="flex items-center gap-2 font-headline text-3xl font-black uppercase tracking-tighter"><Camera size={22} /> VISUAL IDENTITY</h2>
            <input className="editorial-input" placeholder="Logo image URL" value={formData.logoURL} onChange={(e) => setFormData({ ...formData, logoURL: e.target.value })} />
            <div className="rounded-[1.5rem] border-[3px] border-dashed border-ink bg-white/60 p-8 text-center">
              <Upload size={30} className="mx-auto mb-3" />
              <p className="font-headline text-xl font-black uppercase tracking-tighter">PREVIEW LOGO</p>
              {formData.logoURL && <img src={formData.logoURL} alt="Preview" className="mx-auto mt-4 h-20 w-20 rounded-2xl border-[3px] border-ink object-cover" referrerPolicy="no-referrer" />}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>BACK</Button>
              <Button className="flex-1" onClick={handleSubmit} disabled={loading}>{loading ? 'CREATING...' : 'LAUNCH CLUB'}</Button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} className="py-6 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border-[3px] border-ink bg-tertiary-container shadow-[6px_6px_0px_0px_var(--color-ink)]">
              <CheckCircle size={36} />
            </div>
            <h2 className="font-headline text-4xl font-black uppercase tracking-tighter">YOU'RE ALL SET</h2>
            <p className="mx-auto mt-3 max-w-sm text-base font-medium text-on-surface-variant">
              Your club registration is in motion. Time to step into the dashboard and make noise.
            </p>
            <Button size="lg" className="mt-8" onClick={onComplete}>GO TO DASHBOARD</Button>
          </motion.div>
        )}
      </Card>
    </div>
  );
};
