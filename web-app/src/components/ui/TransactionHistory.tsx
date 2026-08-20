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
  filter?: TransactionFilter;
  onFilterChange?: (filter: TransactionFilter) => void;
}

export const TransactionHistory: FC<TransactionHistoryProps> = ({
  items = [],
  className,
  filter: controlledFilter,
  onFilterChange,
}) => {
  const [internalFilter, setInternalFilter] = useState<TransactionFilter>('all');

  const activeFilter = controlledFilter !== undefined ? controlledFilter : internalFilter;

  const handleFilterChange = (nextFilter: TransactionFilter) => {
    if (controlledFilter === undefined) {
      setInternalFilter(nextFilter);
    }
    onFilterChange?.(nextFilter);
  };

  const filteredItems = items.filter((item) => {
    if (activeFilter === 'earned') return item.type === 'earned';
    if (activeFilter === 'spent') return item.type === 'spent';
    return true;
  });

  return (
    <div className={['ui-transaction-history flex flex-col gap-3 w-full max-w-[353px]', className].filter(Boolean).join(' ')}>
      <div className="flex gap-1.5 overflow-x-auto pb-1" role="tablist" aria-label="Фільтр транзакцій">
        <button
          type="button"
          role="tab"
          aria-selected={activeFilter === 'all'}
          onClick={() => handleFilterChange('all')}
          className={[
            'px-4 min-h-[2.25rem] h-auto py-2 rounded-full text-sm font-primary cursor-pointer transition-colors outline-none',
            activeFilter === 'all'
              ? 'bg-soft-blue text-white border-transparent'
              : 'bg-transparent border border-content-dark text-content-dark hover:bg-visit-gray',
          ].join(' ')}
        >
          Всі
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeFilter === 'earned'}
          onClick={() => handleFilterChange('earned')}
          className={[
            'px-4 min-h-[2.25rem] h-auto py-2 rounded-full text-sm font-primary cursor-pointer transition-colors outline-none',
            activeFilter === 'earned'
              ? 'bg-soft-blue text-white border-transparent'
              : 'bg-transparent border border-content-dark text-content-dark hover:bg-visit-gray',
          ].join(' ')}
        >
          Нараховано
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeFilter === 'spent'}
          onClick={() => handleFilterChange('spent')}
          className={[
            'px-4 min-h-[2.25rem] h-auto py-2 rounded-full text-sm font-primary cursor-pointer transition-colors outline-none',
            activeFilter === 'spent'
              ? 'bg-soft-blue text-white border-transparent'
              : 'bg-transparent border border-content-dark text-content-dark hover:bg-visit-gray',
          ].join(' ')}
        >
          Витрачено
        </button>
      </div>

      {filteredItems.length === 0 ? (
        <div className="p-6 bg-visit-gray/50 rounded-2xl text-center text-sm font-primary text-gray-500">
          Історія операцій порожня
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filteredItems.map((item) => {
            const itemId = item.id || `transaction-${item.title.trim().toLowerCase().replace(/\s+/g, '-')}-${item.date.replace(/\./g, '-')}`;

            return (
              <div
                key={itemId}
                className="flex items-center justify-between p-4 bg-white rounded-3xl shadow-card min-h-[4.5rem] h-auto"
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
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TransactionHistory;
