import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface CalendarWidgetProps {
  events: any[];
  onDateSelect?: (date: Date) => void;
  className?: string;
}

const MONTHS = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export const CalendarWidget: React.FC<CalendarWidgetProps> = ({ events, onDateSelect, className }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const today = new Date();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const hasEvent = (day: number) =>
    events.some((event) => {
      const eventDate = new Date(event.date);
      return eventDate.getDate() === day && eventDate.getMonth() === month && eventDate.getFullYear() === year;
    });

  return (
    <div className={cn('editorial-panel bg-surface-container-lowest p-4', className)}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-headline text-2xl font-black uppercase tracking-tighter">
          {MONTHS[month]} <span className="text-primary">{year}</span>
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
            className="flex h-8 w-8 items-center justify-center rounded-lg border-[2px] border-ink bg-surface-container-lowest"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
            className="flex h-8 w-8 items-center justify-center rounded-lg border-[2px] border-ink bg-surface-container-lowest"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {DAYS.map((day) => (
          <div key={day} className="py-1 text-center font-headline text-[10px] font-black uppercase tracking-[0.14em] text-on-surface-variant">
            {day}
          </div>
        ))}

        {Array.from({ length: firstDay }).map((_, index) => (
          <div key={`empty-${index}`} className="aspect-square" />
        ))}

        {Array.from({ length: daysInMonth }).map((_, index) => {
          const day = index + 1;
          const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
          const eventOnThisDay = hasEvent(day);

          return (
            <button
              key={day}
              onClick={() => onDateSelect?.(new Date(year, month, day))}
              className={cn(
                'relative aspect-square rounded-lg border-[2px] border-ink text-center font-headline text-sm font-black transition-all',
                isToday ? 'bg-primary text-on-primary shadow-[3px_3px_0px_0px_var(--color-ink)]' : 'bg-white',
                eventOnThisDay && !isToday && 'bg-tertiary-container'
              )}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
};
