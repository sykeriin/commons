import React, { useState } from 'react';
import { ArrowLeft, Calendar, GraduationCap, Save, User } from 'lucide-react';
import { Button } from '@/src/components/Button';
import { Card } from '@/src/components/Card';
import { User as FirebaseUser } from 'firebase/auth';

interface EditProfileViewProps {
  user: FirebaseUser | null;
  onBack: () => void;
  onSave: (data: any) => void;
}

export const EditProfileView: React.FC<EditProfileViewProps> = ({ user, onBack, onSave }) => {
  const [formData, setFormData] = useState({
    displayName: user?.displayName || '',
    major: '',
    year: 'JUNIOR',
    bio: '',
  });

  return (
    <div className="screen-shell mx-auto max-w-3xl">
      <button onClick={onBack} className="mb-6 flex items-center gap-2 font-headline text-sm font-black uppercase tracking-[0.18em]">
        <ArrowLeft size={18} /> BACK
      </button>

      <section className="editorial-frame bg-primary-container p-6 md:p-8">
        <span className="sticker-badge bg-ink text-white">IDENTITY LAB</span>
        <h1 className="mt-5 font-headline text-5xl font-black uppercase leading-[0.84] tracking-tighter md:text-7xl">
          EDIT <span className="italic text-primary">PROFILE</span>
        </h1>
        <p className="mt-4 max-w-xl text-base font-medium leading-relaxed text-on-primary-container">Give your campus identity more personality with brighter, more expressive profile details.</p>
      </section>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSave(formData);
        }}
        className="mt-8 space-y-6"
      >
        <div className="grid gap-5 md:grid-cols-2">
          <Card variant="secondary" className="p-5">
            <label className="mb-3 flex items-center gap-2 font-headline text-xs font-black uppercase tracking-[0.18em]">
              <User size={14} /> DISPLAY NAME
            </label>
            <input className="editorial-input" value={formData.displayName} onChange={(e) => setFormData({ ...formData, displayName: e.target.value })} placeholder="Your name" />
          </Card>
          <Card variant="tertiary" className="p-5">
            <label className="mb-3 flex items-center gap-2 font-headline text-xs font-black uppercase tracking-[0.18em]">
              <GraduationCap size={14} /> MAJOR
            </label>
            <input className="editorial-input" value={formData.major} onChange={(e) => setFormData({ ...formData, major: e.target.value })} placeholder="Computer science" />
          </Card>
        </div>

        <Card variant="lowest" className="p-5">
          <label className="mb-3 flex items-center gap-2 font-headline text-xs font-black uppercase tracking-[0.18em]">
            <Calendar size={14} /> YEAR
          </label>
          <select className="editorial-input" value={formData.year} onChange={(e) => setFormData({ ...formData, year: e.target.value })}>
            {['FRESHMAN', 'SOPHOMORE', 'JUNIOR', 'SENIOR', 'GRADUATE'].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </Card>

        <Card variant="primary" className="p-5">
          <label className="mb-3 flex items-center gap-2 font-headline text-xs font-black uppercase tracking-[0.18em]">BIO</label>
          <textarea
            className="editorial-input min-h-[140px] resize-none"
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            placeholder="Tell us what you're building, joining, or obsessed with."
          />
        </Card>

        <div className="flex gap-4">
          <Button variant="outline" size="lg" className="flex-1" onClick={onBack}>CANCEL</Button>
          <Button size="lg" className="flex-1" type="submit">
            <Save size={18} className="mr-2" /> SAVE CHANGES
          </Button>
        </div>
      </form>
    </div>
  );
};
