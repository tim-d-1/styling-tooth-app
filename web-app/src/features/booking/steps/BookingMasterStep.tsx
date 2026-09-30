import { useState, type FC } from 'react';
import Icon from '@/components/ui/Icon';
import BookingProgressBar from '../components/BookingProgressBar';
import type { MasterProfile } from '../booking_types';

export interface BookingMasterStepProps {
  masters?: MasterProfile[];
  selectedMasterId?: string;
  onSelectMaster: (master: MasterProfile | { id: 'any'; name: string }) => void;
  onWriteReviewClick?: () => void;
  onNext?: () => void;
}

export const BookingMasterStep: FC<BookingMasterStepProps> = ({
  masters = [],
  selectedMasterId,
  onSelectMaster,
  onWriteReviewClick,
  onNext,
}) => {
  const masterList = masters || [];
  const [currentMasterIndex, setCurrentMasterIndex] = useState(() => {
    const idx = masterList.findIndex((m) => m.id === selectedMasterId);
    return idx >= 0 ? idx : 0;
  });

  const [activeReviewFilter, setActiveReviewFilter] = useState<
    'newest' | 'highest' | 'lowest'
  >('newest');

  const currentMaster = masterList[currentMasterIndex];

  const handlePrevMaster = () => {
    setCurrentMasterIndex((prev) =>
      prev > 0 ? prev - 1 : masterList.length - 1
    );
  };

  const handleNextMaster = () => {
    setCurrentMasterIndex((prev) =>
      prev < masterList.length - 1 ? prev + 1 : 0
    );
  };

  const handleChooseSpecific = () => {
    if (currentMaster) {
      onSelectMaster(currentMaster);
      onNext?.();
    }
  };

  const handleChooseAny = () => {
    onSelectMaster({
      id: 'any',
      name: 'Будь-який вільний майстер',
    });
    onNext?.();
  };

  if (masterList.length === 0 || !currentMaster) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center bg-white rounded-3xl border border-visit-gray/60 p-8 shadow-xs">
        <div className="w-20 h-20 rounded-full bg-visit-gray flex items-center justify-center text-content-dark/40 mb-4">
          <Icon name="fi-rr-user" size={32} />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold font-accented text-content-dark mb-2">
          Вибір майстра
        </h2>
        <p className="text-sm font-primary text-content-dark/60 max-w-md mb-6 leading-relaxed">
          Наразі список конкретних майстрів оновлюється. Ви можете обрати будь-якого вільного майстра на зручний для вас час.
        </p>
        <button
          type="button"
          onClick={handleChooseAny}
          className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-terracotta text-white font-accented font-bold text-base hover:bg-terracotta/90 transition-colors shadow-xs cursor-pointer border-0 outline-none"
        >
          Будь-який вільний майстер
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-10 mb-8">
        <div className="flex flex-col items-center shrink-0">
          <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden bg-visit-gray border-2 border-visit-gray shadow-xs">
            <img
              src={currentMaster.avatarUrl || '/assets/images/default-avatar.svg'}
              alt={currentMaster.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src =
                  '/assets/images/default-avatar.svg';
              }}
            />
          </div>

          <button
            type="button"
            onClick={onWriteReviewClick}
            className="mt-4 px-4 py-1.5 rounded-lg bg-surface-cream text-terracotta hover:bg-terracotta/10 text-sm font-accented font-semibold transition-colors cursor-pointer border-0 outline-none"
          >
            Написати відгук
          </button>
        </div>

        <div className="flex-1 w-full text-center sm:text-left flex flex-col justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold font-accented text-content-dark">
              {currentMaster.name}
            </h2>
            <div className="text-sm sm:text-base font-accented font-medium text-terracotta mt-1 mb-4">
              {currentMaster.role}
            </div>
          </div>

          <div className="flex flex-col gap-2.5 w-full">
            {currentMaster.specialties.map((spec) => (
              <div
                key={spec}
                className="w-full py-2.5 px-4 bg-visit-gray text-content-dark rounded-[10px] text-center font-accented text-sm font-medium"
              >
                {spec}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 w-full mb-10">
        <button
          type="button"
          onClick={handlePrevMaster}
          aria-label="Попередній майстер"
          className="w-12 h-12 rounded-full border border-[#242F35] flex items-center justify-center text-content-dark hover:border-terracotta hover:text-terracotta transition-colors shrink-0 cursor-pointer bg-white outline-none"
        >
          <Icon name="fi-rr-angle-double-left" size={16} />
        </button>

        <button
          type="button"
          onClick={handleChooseSpecific}
          className="flex-1 h-12 rounded-xl bg-terracotta hover:bg-terracotta-hover text-white font-accented font-semibold text-sm sm:text-base transition-colors flex items-center justify-center cursor-pointer border-0 outline-none shadow-xs"
        >
          Обрати майстра
        </button>

        <button
          type="button"
          onClick={handleChooseAny}
          className="flex-1 h-12 rounded-xl bg-white border border-[#242F35] hover:border-terracotta hover:text-terracotta text-content-dark font-accented font-semibold text-sm sm:text-base transition-colors flex items-center justify-center cursor-pointer outline-none"
        >
          Будь-який вільний майстер
        </button>

        <button
          type="button"
          onClick={handleNextMaster}
          aria-label="Наступний майстер"
          className="w-12 h-12 rounded-full border border-[#242F35] flex items-center justify-center text-content-dark hover:border-terracotta hover:text-terracotta transition-colors shrink-0 cursor-pointer bg-white outline-none"
        >
          <Icon name="fi-rr-angle-double-right" size={16} />
        </button>
      </div>

      <div className="pt-4 border-t border-[#ECEEF1]">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold font-accented text-content-dark">
              Відгуки
            </h3>
            <span className="text-sm font-primary text-text-muted">
              {currentMaster.reviewsCount}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveReviewFilter('newest')}
              className={[
                'px-4 py-1.5 rounded-full text-xs font-accented font-medium transition-colors cursor-pointer outline-none',
                activeReviewFilter === 'newest'
                  ? 'bg-soft-blue text-white'
                  : 'bg-white border border-[#242F35] text-content-dark hover:border-terracotta',
              ].join(' ')}
            >
              Найновіші
            </button>
            <button
              type="button"
              onClick={() => setActiveReviewFilter('highest')}
              className={[
                'px-4 py-1.5 rounded-full text-xs font-accented font-medium transition-colors cursor-pointer outline-none',
                activeReviewFilter === 'highest'
                  ? 'bg-soft-blue text-white'
                  : 'bg-white border border-[#242F35] text-content-dark hover:border-terracotta',
              ].join(' ')}
            >
              Найвищі оцінки
            </button>
            <button
              type="button"
              onClick={() => setActiveReviewFilter('lowest')}
              className={[
                'px-4 py-1.5 rounded-full text-xs font-accented font-medium transition-colors cursor-pointer outline-none',
                activeReviewFilter === 'lowest'
                  ? 'bg-soft-blue text-white'
                  : 'bg-white border border-[#242F35] text-content-dark hover:border-terracotta',
              ].join(' ')}
            >
              Найнижчі
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentMaster.reviews.map((rev) => (
            <div
              key={rev.id}
              className="p-5 rounded-2xl bg-white border border-[#ECEEF1] shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-visit-gray">
                      <img
                        src="/assets/images/default-avatar.svg"
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="font-accented font-semibold text-sm text-content-dark">
                      {rev.authorName}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-md border border-terracotta text-terracotta text-xs font-semibold">
                    <Icon name="fi-rr-star" size={10} color="#EC643A" />
                    <span>{rev.rating}</span>
                  </div>
                </div>

                <p className="font-primary text-xs sm:text-sm text-content-dark leading-relaxed m-0">
                  {rev.text}
                </p>
              </div>

              <div className="mt-4 pt-2 font-primary text-[0.6875rem] text-text-muted">
                {rev.date}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center gap-4 mt-6">
          <button
            type="button"
            aria-label="Попередній відгук"
            className="w-10 h-10 rounded-full border border-[#242F35] flex items-center justify-center text-content-dark hover:border-terracotta hover:text-terracotta transition-colors cursor-pointer bg-white outline-none"
          >
            <Icon name="fi-rr-angle-double-left" size={14} />
          </button>
          <button
            type="button"
            aria-label="Наступний відгук"
            className="w-10 h-10 rounded-full border border-[#242F35] flex items-center justify-center text-content-dark hover:border-terracotta hover:text-terracotta transition-colors cursor-pointer bg-white outline-none"
          >
            <Icon name="fi-rr-angle-double-right" size={14} />
          </button>
        </div>
      </div>

      <BookingProgressBar currentStep={3} />
    </div>
  );
};

export default BookingMasterStep;
