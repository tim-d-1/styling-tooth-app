import type { FC } from 'react';
import Icon from '@/components/ui/Icon';
import type { DashboardMetrics } from '../admin_types';

export interface AdminMetricsBarProps {
  metrics: DashboardMetrics;
  className?: string;
}

function formatRevenue(amount: number): string {
  return `${amount.toLocaleString('uk-UA')} ₴`;
}

export const AdminMetricsBar: FC<AdminMetricsBarProps> = ({
  metrics,
  className = '',
}) => {
  return (
    <div
      aria-label="Показники за сьогодні"
      className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`.trim()}
    >
      <div className="bg-white rounded-2xl p-5 border border-visit-gray/60 shadow-xs flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <span className="font-primary text-xs font-medium text-content-dark/60">
            Нові заявки
          </span>
          <span className="font-accented font-bold text-2xl lg:text-3xl text-[#EB6D48]">
            {metrics.newCount}
          </span>
        </div>
        <div className="w-11 h-11 rounded-full bg-[#EB6D48]/10 text-[#EB6D48] flex items-center justify-center shrink-0">
          <Icon name="fi-rr-folder" size={20} />
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 border border-visit-gray/60 shadow-xs flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <span className="font-primary text-xs font-medium text-content-dark/60">
            В обробці
          </span>
          <span className="font-accented font-bold text-2xl lg:text-3xl text-[#96B3E2]">
            {metrics.inProgressCount}
          </span>
        </div>
        <div className="w-11 h-11 rounded-full bg-[#96B3E2]/15 text-[#96B3E2] flex items-center justify-center shrink-0">
          <Icon name="fi-rr-refresh" size={20} />
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 border border-visit-gray/60 shadow-xs flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <span className="font-primary text-xs font-medium text-content-dark/60">
            Завершені
          </span>
          <span className="font-accented font-bold text-2xl lg:text-3xl text-[#34C759]">
            {metrics.completedCount}
          </span>
        </div>
        <div className="w-11 h-11 rounded-full bg-[#34C759]/10 text-[#34C759] flex items-center justify-center shrink-0">
          <Icon name="fi-rr-check" size={20} />
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 border border-visit-gray/60 shadow-xs flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <span className="font-primary text-xs font-medium text-content-dark/60">
            Дохід за сьогодні
          </span>
          <span className="font-accented font-bold text-2xl lg:text-3xl text-content-dark">
            {formatRevenue(metrics.todayRevenue)}
          </span>
        </div>
        <div className="w-11 h-11 rounded-full bg-visit-gray text-content-dark/70 flex items-center justify-center shrink-0">
          <Icon name="fi-rr-money" size={20} />
        </div>
      </div>
    </div>
  );
};

export default AdminMetricsBar;
