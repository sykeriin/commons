import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Calendar, Clock, MapPin } from 'lucide-react';
import { Card } from '@/src/components/Card';

interface ScheduleViewProps {
  onBack: () => void;
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({ onBack }) => {
  const schedule = [
    { id: '1', time: '09:00 AM', title: 'CS101: Intro to Computer Science', location: 'Hall A', tone: 'bg-primary-container' },
    { id: '2', time: '11:30 AM', title: 'Robotics Club Meeting', location: 'Lab 2', tone: 'bg-secondary-container' },
    { id: '3', time: '02:00 PM', title: 'Campus Hackathon Prep', location: 'Student Center', tone: 'bg-tertiary-container' },
    { id: '4', time: '04:30 PM', title: 'Basketball Practice', location: 'Gym', tone: 'bg-[#ffe9df]' },
  ];

  return (
    <div className="screen-shell mx-auto max-w-4xl">
      <button onClick={onBack} className="mb-6 flex items-center gap-2 font-headline text-sm font-black uppercase tracking-[0.18em]">
        <ArrowLeft size={18} /> BACK
      </button>

      <section className="editorial-frame interactive-grid bg-tertiary-container p-6 md:p-8">
        <span className="sticker-badge bg-ink text-white">TODAY'S FLOW</span>
        <h1 className="mt-5 font-headline text-5xl font-black uppercase leading-[0.84] tracking-tighter md:text-7xl">
          MY <span className="italic text-primary">SCHEDULE</span>
        </h1>
        <p className="mt-4 max-w-xl text-base font-medium leading-relaxed text-on-tertiary-container">
          Your day at a glance should feel active and colorful, not like a static list. This turns the schedule into a visual timeline.
        </p>
      </section>

      <div className="mt-8 space-y-4">
        {schedule.map((item, i) => (
          <motion.div key={item.id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}>
            <Card className={`p-5 ${item.tone}`}>
              <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <div className="flex min-w-[110px] flex-col items-center justify-center rounded-[1.25rem] border-[3px] border-ink bg-white px-4 py-4">
                  <Clock size={18} className="mb-2" />
                  <span className="font-headline text-sm font-black uppercase tracking-[0.14em]">{item.time}</span>
                </div>
                <div className="flex-1">
                  <h2 className="font-headline text-3xl font-black uppercase tracking-tighter">{item.title}</h2>
                  <p className="mt-3 flex items-center gap-2 text-sm font-medium text-on-surface/80">
                    <MapPin size={15} /> {item.location}
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card variant="secondary" className="mt-8 p-6 text-center">
        <Calendar size={30} className="mx-auto mb-3" />
        <h2 className="font-headline text-2xl font-black uppercase tracking-tighter">STACK MORE INTO TODAY</h2>
        <p className="mt-2 text-sm font-medium text-on-secondary-container">Discover new events and club sessions to fill open slots.</p>
      </Card>
    </div>
  );
};
