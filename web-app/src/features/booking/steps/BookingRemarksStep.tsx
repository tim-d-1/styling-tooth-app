import { useState, type FC } from 'react';
import Switch from '@/components/ui/Switch';
import BookingProgressBar from '../components/BookingProgressBar';

export interface BookingRemarksStepProps {
  initialComment?: string;
  initialTransferEnabled?: boolean;
  initialTransferAddress?: string;
  initialBehaviorNotes?: string;
  onSubmitRemarks: (data: {
    clientNote: string;
    transferEnabled: boolean;
    transferAddress: string;
    behaviorNotes: string;
  }) => void;
  onNext: () => void;
}

export const BookingRemarksStep: FC<BookingRemarksStepProps> = ({
  initialComment = '',
  initialTransferEnabled = false,
  initialTransferAddress = '',
  initialBehaviorNotes = '',
  onSubmitRemarks,
  onNext,
}) => {
  const [comment, setComment] = useState(initialComment);
  const [transferEnabled, setTransferEnabled] = useState(initialTransferEnabled);
  const [address, setAddress] = useState(initialTransferAddress);
  const [behavior, setBehavior] = useState(initialBehaviorNotes);

  const handleSubmit = () => {
    onSubmitRemarks({
      clientNote: comment.trim(),
      transferEnabled,
      transferAddress: address.trim(),
      behaviorNotes: behavior.trim(),
    });
    onNext();
  };

  return (
    <div className="flex flex-col">
      <h1 className="text-2xl sm:text-[1.625rem] font-bold text-content-dark font-accented leading-snug mb-8 sm:mb-10">
        Додаткові побажання
      </h1>

      <div className="flex flex-col gap-6 sm:gap-8">
        <div>
          <label
            htmlFor="remarks-comment"
            className="block text-sm sm:text-base font-accented font-medium text-content-dark mb-2"
          >
            Коментар для майстра
          </label>
          <input
            id="remarks-comment"
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Ваші побажання або деталі"
            className="w-full pb-3 border-0 border-b border-[#ECEEF1] focus:border-terracotta bg-transparent font-primary text-sm sm:text-base text-content-dark placeholder:text-text-muted outline-none transition-colors"
          />
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between py-2">
            <span className="text-sm sm:text-base font-accented font-medium text-content-dark">
              Трансфер улюбленця
            </span>
            <Switch
              checked={transferEnabled}
              onChange={setTransferEnabled}
              ariaLabel="Трансфер улюбленця"
            />
          </div>

          {transferEnabled && (
            <div className="animate-fade-in">
              <label
                htmlFor="remarks-address"
                className="block text-sm sm:text-base font-accented font-medium text-content-dark mb-2"
              >
                Адреса
              </label>
              <input
                id="remarks-address"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Введіть адресу подачі"
                className="w-full pb-3 border-0 border-b border-[#ECEEF1] focus:border-terracotta bg-transparent font-primary text-sm sm:text-base text-content-dark placeholder:text-text-muted outline-none transition-colors"
              />
            </div>
          )}
        </div>

        <div>
          <label
            htmlFor="remarks-behavior"
            className="block text-sm sm:text-base font-accented font-medium text-content-dark mb-2"
          >
            Особливості поведінки
          </label>
          <input
            id="remarks-behavior"
            type="text"
            value={behavior}
            onChange={(e) => setBehavior(e.target.value)}
            placeholder="Боязкість, агресія, реакція на фен тощо"
            className="w-full pb-3 border-0 border-b border-[#ECEEF1] focus:border-terracotta bg-transparent font-primary text-sm sm:text-base text-content-dark placeholder:text-text-muted outline-none transition-colors"
          />
        </div>
      </div>

      <div className="mt-10 sm:mt-14">
        <button
          type="button"
          onClick={handleSubmit}
          className="w-full h-12 rounded-xl bg-terracotta hover:bg-terracotta-hover text-white text-base font-accented font-semibold transition-colors flex items-center justify-center cursor-pointer border-0 outline-none"
        >
          Далі
        </button>
      </div>

      <BookingProgressBar currentStep={5} />
    </div>
  );
};

export default BookingRemarksStep;
