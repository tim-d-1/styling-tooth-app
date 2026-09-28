import { useState, type FC, type FormEvent } from 'react';
import Icon from '@/components/ui/Icon';

export interface BookingPaymentStepProps {
  totalAmount: number;
  onPay: (paymentData: {
    method: 'apple_pay' | 'card' | 'new_card';
    cardDetails?: {
      cardNumber: string;
      expiry: string;
      cvv: string;
      saveCard: boolean;
    };
  }) => void;
  isProcessing?: boolean;
}

export const BookingPaymentStep: FC<BookingPaymentStepProps> = ({
  totalAmount,
  onPay,
  isProcessing = false,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<'apple_pay' | 'saved_card' | 'new_card'>('apple_pay');
  const [savedCards, setSavedCards] = useState([
    { id: 'card-1', last4: '4821', expiry: '08/28' },
  ]);

  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [saveCard, setSaveCard] = useState(true);

  const formatCardNumber = (value: string) => {
    const raw = value.replace(/\D/g, '').slice(0, 16);
    return raw.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const formatExpiry = (value: string) => {
    const raw = value.replace(/\D/g, '').slice(0, 4);
    if (raw.length <= 2) return raw;
    return `${raw.slice(0, 2)}/${raw.slice(2)}`;
  };

  const handleDeleteSavedCard = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedCards((prev) => prev.filter((c) => c.id !== id));
    if (selectedMethod === 'saved_card') {
      setSelectedMethod('apple_pay');
    }
  };

  const handlePayClick = (e: FormEvent) => {
    e.preventDefault();
    if (selectedMethod === 'apple_pay') {
      onPay({ method: 'apple_pay' });
      return;
    }

    if (selectedMethod === 'saved_card') {
      onPay({ method: 'card' });
      return;
    }

    onPay({
      method: 'new_card',
      cardDetails: {
        cardNumber: cardNumber.replace(/\s/g, ''),
        expiry,
        cvv,
        saveCard,
      },
    });
  };

  const isFormValid = () => {
    if (selectedMethod === 'apple_pay') return true;
    if (selectedMethod === 'saved_card' && savedCards.length > 0) return true;
    return (
      cardNumber.replace(/\s/g, '').length >= 16 &&
      expiry.length >= 5 &&
      cvv.length >= 3
    );
  };

  return (
    <div className="flex flex-col">
      <h1 className="text-2xl sm:text-[1.625rem] font-bold text-content-dark font-accented leading-snug mb-8 sm:mb-10">
        Способи оплати
      </h1>

      <form onSubmit={handlePayClick} className="flex flex-col gap-6">
        <div className="flex flex-col gap-3.5">
          <div
            role="radio"
            aria-checked={selectedMethod === 'apple_pay'}
            tabIndex={0}
            onClick={() => setSelectedMethod('apple_pay')}
            className={[
              'flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer outline-none bg-white',
              selectedMethod === 'apple_pay'
                ? 'border-terracotta ring-1 ring-terracotta shadow-xs'
                : 'border-[#ECEEF1] hover:border-gray-300',
            ].join(' ')}
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-full bg-visit-gray flex items-center justify-center shrink-0">
                <Icon name="fi-rr-apple" size={20} color="#242F35" />
              </div>
              <div>
                <div className="font-accented font-semibold text-sm sm:text-base text-content-dark">
                  Apple Pay
                </div>
                <div className="font-primary text-xs text-status-success font-medium">
                  Основний спосіб
                </div>
              </div>
            </div>

            <div
              className={[
                'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                selectedMethod === 'apple_pay'
                  ? 'border-terracotta'
                  : 'border-gray-300',
              ].join(' ')}
            >
              {selectedMethod === 'apple_pay' && (
                <div className="w-2.5 h-2.5 rounded-full bg-terracotta" />
              )}
            </div>
          </div>

          {savedCards.map((card) => (
            <div
              key={card.id}
              role="radio"
              aria-checked={selectedMethod === 'saved_card'}
              tabIndex={0}
              onClick={() => setSelectedMethod('saved_card')}
              className={[
                'flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer outline-none bg-white',
                selectedMethod === 'saved_card'
                  ? 'border-terracotta ring-1 ring-terracotta shadow-xs'
                  : 'border-[#ECEEF1] hover:border-gray-300',
              ].join(' ')}
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-visit-gray flex items-center justify-center shrink-0">
                  <Icon name="fi-rr-credit-card" size={20} color="#242F35" />
                </div>
                <div>
                  <div className="font-accented font-semibold text-sm sm:text-base text-content-dark">
                    •••• {card.last4}
                  </div>
                  <div className="font-primary text-xs text-text-muted">
                    Термін: {card.expiry}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => handleDeleteSavedCard(card.id, e)}
                aria-label={`Видалити картку ${card.last4}`}
                className="p-2 text-terracotta hover:opacity-80 transition-opacity cursor-pointer border-0 bg-transparent outline-none"
              >
                <Icon name="fi-rr-trash" size={18} color="#EC643A" />
              </button>
            </div>
          ))}
        </div>

        <div className="pt-2">
          <h2 className="text-lg sm:text-xl font-bold font-accented text-content-dark mb-4">
            Додати банківську картку
          </h2>

          <div
            onClick={() => setSelectedMethod('new_card')}
            className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4"
          >
            <div className="sm:col-span-6 relative">
              <label
                htmlFor="booking-card-number"
                className="block text-xs font-accented font-medium text-content-dark mb-1.5"
              >
                Номер картки
              </label>
              <div className="relative">
                <input
                  id="booking-card-number"
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                  placeholder="0000 0000 0000 0000"
                  maxLength={19}
                  className="w-full h-12 px-4 pr-10 rounded-xl bg-visit-gray/50 border border-transparent focus:border-terracotta focus:bg-white text-sm font-primary text-content-dark placeholder:text-text-muted outline-none transition-all"
                />
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">
                  <Icon name="fi-rr-credit-card" size={16} />
                </div>
              </div>
            </div>

            <div className="sm:col-span-3 relative">
              <label
                htmlFor="booking-card-expiry"
                className="block text-xs font-accented font-medium text-content-dark mb-1.5"
              >
                Термін (MM/YY)
              </label>
              <div className="relative">
                <input
                  id="booking-card-expiry"
                  type="text"
                  value={expiry}
                  onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                  placeholder="12/27"
                  maxLength={5}
                  className="w-full h-12 px-4 pr-10 rounded-xl bg-visit-gray/50 border border-transparent focus:border-terracotta focus:bg-white text-sm font-primary text-content-dark placeholder:text-text-muted outline-none transition-all"
                />
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">
                  <Icon name="fi-rr-calendar" size={16} />
                </div>
              </div>
            </div>

            <div className="sm:col-span-3 relative">
              <label
                htmlFor="booking-card-cvv"
                className="block text-xs font-accented font-medium text-content-dark mb-1.5"
              >
                CVV / CVC
              </label>
              <div className="relative">
                <input
                  id="booking-card-cvv"
                  type="password"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="•••"
                  maxLength={4}
                  className="w-full h-12 px-4 pr-10 rounded-xl bg-visit-gray/50 border border-transparent focus:border-terracotta focus:bg-white text-sm font-primary text-content-dark placeholder:text-text-muted outline-none transition-all"
                />
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">
                  <Icon name="fi-rr-lock" size={16} />
                </div>
              </div>
            </div>
          </div>

          <label className="flex items-center gap-2.5 mt-4 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={saveCard}
              onChange={(e) => setSaveCard(e.target.checked)}
              className="w-4 h-4 rounded text-terracotta accent-terracotta cursor-pointer"
            />
            <span className="text-xs sm:text-sm font-primary text-content-dark">
              Зберегти картку для швидкої оплати
            </span>
          </label>
        </div>

        <div className="mt-6 sm:mt-8">
          <button
            type="submit"
            disabled={!isFormValid() || isProcessing}
            className={[
              'w-full h-12 rounded-xl text-base font-accented font-semibold transition-colors flex items-center justify-center border-0 outline-none',
              isFormValid() && !isProcessing
                ? 'bg-terracotta hover:bg-terracotta-hover text-white cursor-pointer shadow-xs'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed',
            ].join(' ')}
          >
            {isProcessing ? 'Обробка платежу...' : `Оплатити ${totalAmount.toLocaleString('uk-UA')} ₴`}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BookingPaymentStep;
