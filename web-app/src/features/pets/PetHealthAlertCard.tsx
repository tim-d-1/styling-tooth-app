import type { FC } from 'react';
import Icon from '@/components/ui/Icon';

export interface PetHealthAlertCardProps {
  medicalNotes?: string | null;
  behaviorNotes?: string | null;
}

export const PetHealthAlertCard: FC<PetHealthAlertCardProps> = ({
  medicalNotes,
  behaviorNotes,
}) => {
  const rawNotes: string[] = [];

  if (medicalNotes && medicalNotes.trim()) {
    rawNotes.push(...medicalNotes.split('\n'));
  }
  if (behaviorNotes && behaviorNotes.trim()) {
    rawNotes.push(...behaviorNotes.split('\n'));
  }

  const items = rawNotes
    .map((line) => line.replace(/^[•\-*]\s*/, '').trim())
    .filter((line) => line.length > 0);

  return (
    <div
      data-testid="pet-health-alert-card"
      className="w-full bg-white rounded-3xl p-5 shadow-sm border border-black/5 flex flex-col gap-3"
    >
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-full border border-terracotta text-terracotta flex items-center justify-center shrink-0">
          <Icon name="fi-rr-exclamation" size={12} />
        </div>
        <h3 className="font-accented font-bold text-base md:text-lg text-content-dark">
          Алергії та особливості
        </h3>
      </div>

      {items.length > 0 ? (
        <ul className="flex flex-col gap-1.5 list-none font-primary text-sm text-content-dark/80">
          {items.map((item, index) => (
            <li key={index} className="flex items-start gap-2">
              <span className="text-terracotta shrink-0">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="font-primary text-sm text-text-muted">
          Особливості та алергії не вказані
        </p>
      )}
    </div>
  );
};

export default PetHealthAlertCard;
