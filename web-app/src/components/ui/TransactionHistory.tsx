import { useState, type FC } from 'react';
import Icon, { type IconName } from './Icon';

export type TransactionFilter = 'all' | 'earned' | 'spent';

export interface TransactionItem {
  id: string;
  title: string;
  date: string;
  amount: number;
  icon: IconName;
  type: 'earned' | 'spent';
}

export interface TransactionHistoryProps {
  items?: TransactionItem[];
  className?: string;
}

export const TransactionHistory: FC<TransactionHistoryProps> = ({
  items = [],
  className,
}) => {
  const [activeFilter, setActiveFilter] = useState<TransactionFilter>('all');

  const filteredItems = items.filter((item) => {
    if (activeFilter === 'earned') return item.type === 'earned';
    if (activeFilter === 'spent') return item.type === 'spent';
    return true;
  });

  return (
    <div className={['ui-transaction-history flex flex-col gap-3 w-full max-w-[353px]', className].filter(Boolean).join(' ')}>
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setActiveFilter('all')}
          className={`px-4 py-2 rounded-full text-sm font-primary cursor-pointer transition-colors ${
            activeFilter === 'all'
              ? 'bg-soft-blue text-white border-0'
              : 'bg-transparent border border-content-dark text-content-dark hover:bg-visit-gray'
          }`}
        >
          Всі
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter('earned')}
          className={`px-4 py-2 rounded-full text-sm font-primary cursor-pointer transition-colors ${
            activeFilter === 'earned'
              ? 'bg-soft-blue text-white border-0'
              : 'bg-transparent border border-content-dark text-content-dark hover:bg-visit-gray'
          }`}
        >
          Нараховано
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter('spent')}
          className={`px-4 py-2 rounded-full text-sm font-primary cursor-pointer transition-colors ${
            activeFilter === 'spent'
              ? 'bg-soft-blue text-white border-0'
              : 'bg-transparent border border-content-dark text-content-dark hover:bg-visit-gray'
          }`}
        >
          Витрачено
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-4 bg-white rounded-3xl shadow-card"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-visit-gray flex items-center justify-center shrink-0">
                <Icon name={item.icon} size={20} color="var(--color-content-primary)" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-base font-medium text-content-dark">
                  {item.title}
                </span>
                <span className="text-sm text-gray-500">
                  {item.date}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <span
                className={`font-accented text-2xl font-bold ${
                  item.amount > 0 ? 'text-terracotta' : 'text-content-dark'
                }`}
              >
                {item.amount > 0 ? `+${item.amount}` : item.amount}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TransactionHistory;
