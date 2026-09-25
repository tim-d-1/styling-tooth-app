import type { FC } from 'react';
import Icon from '@/components/ui/Icon';
import type { PetProcedureHistory } from './pet_types';

export interface PetProcedureHistoryCardProps {
  history?: PetProcedureHistory | null;
  onDetailsClick?: () => void;
}

export const PetProcedureHistoryCard: FC<PetProcedureHistoryCardProps> = ({
  history,
  onDetailsClick,
}) => {
  return (
    <section
      data-testid="pet-procedure-history-card"
      aria-labelledby="procedure-history-heading"
      className="w-full bg-white rounded-3xl p-6 shadow-sm border border-black/5 flex flex-col gap-5"
    >
      <div className="flex items-center justify-between">
        <h3
          id="procedure-history-heading"
          onClick={onDetailsClick}
          className="font-accented font-bold text-xl text-content-dark cursor-pointer hover:text-terracotta transition-colors"
        >
          Історія процедур
        </h3>
        <button
          type="button"
          onClick={onDetailsClick}
          aria-label="Вся історія процедур"
          className="text-soft-blue hover:text-soft-blue/80 transition-colors p-1 cursor-pointer outline-none"
        >
          <Icon name="fi-rr-angle-small-right" size={24} />
        </button>
      </div>

      {history ? (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-interactive-lightgray text-terracotta flex items-center justify-center shrink-0">
                <Icon name="fi-rr-calendar" size={18} />
              </div>
              <div className="flex flex-col">
                <span className="font-primary font-semibold text-sm text-content-dark">
                  Останній візит
                </span>
                <span className="font-primary text-xs text-text-muted">
                  {history.dateFormatted} • Майстер {history.masterName}
                </span>
              </div>
            </div>

            <div className="flex flex-col md:items-end">
              <span className="font-accented font-bold text-base text-content-dark">
                {history.serviceTitle}
              </span>
              <span className="font-primary text-sm text-text-muted">
                {history.price} грн
              </span>
            </div>
          </div>

          {history.tags && history.tags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              {history.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="bg-soft-blue/60 text-white font-primary text-xs px-3 py-1 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            <div className="relative w-full h-[18rem] md:h-[22rem] rounded-2xl overflow-hidden bg-interactive-lightgray flex items-center justify-center border border-black/5">
              {history.beforePhotoUrl ? (
                <img
                  src={history.beforePhotoUrl}
                  alt="Фото до процедури"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  data-testid="empty-before-photo"
                  className="flex flex-col items-center gap-2 text-text-muted"
                >
                  <Icon name="fi-rr-camera" size={32} />
                  <span className="text-xs font-primary">Фото до процедури</span>
                </div>
              )}
              <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white font-primary font-medium text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                <span>До 📸</span>
              </div>
            </div>

            <div className="relative w-full h-[18rem] md:h-[22rem] rounded-2xl overflow-hidden bg-interactive-lightgray flex items-center justify-center border border-black/5">
              {history.afterPhotoUrl ? (
                <img
                  src={history.afterPhotoUrl}
                  alt="Фото після процедури"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  data-testid="empty-after-photo"
                  className="flex flex-col items-center gap-2 text-text-muted"
                >
                  <Icon name="fi-rr-camera" size={32} />
                  <span className="text-xs font-primary">Фото після процедури</span>
                </div>
              )}
              <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white font-primary font-medium text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                <span>Після ✨</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="font-primary text-sm text-text-muted">
            Немає завершених візитів для цього улюбленця
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative w-full h-[14rem] rounded-2xl overflow-hidden bg-interactive-lightgray flex items-center justify-center border border-black/5">
              <div className="flex flex-col items-center gap-2 text-text-muted">
                <Icon name="fi-rr-camera" size={32} />
                <span className="text-xs font-primary">Фото до процедури</span>
              </div>
              <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white font-primary font-medium text-xs px-3 py-1.5 rounded-xl">
                <span>До 📸</span>
              </div>
            </div>
            <div className="relative w-full h-[14rem] rounded-2xl overflow-hidden bg-interactive-lightgray flex items-center justify-center border border-black/5">
              <div className="flex flex-col items-center gap-2 text-text-muted">
                <Icon name="fi-rr-camera" size={32} />
                <span className="text-xs font-primary">Фото після процедури</span>
              </div>
              <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white font-primary font-medium text-xs px-3 py-1.5 rounded-xl">
                <span>Після ✨</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default PetProcedureHistoryCard;
