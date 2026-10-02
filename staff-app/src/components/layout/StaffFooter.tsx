import type { FC } from 'react';

export const StaffFooter: FC = () => {
  return (
    <footer className="mt-auto py-6 px-6 sm:px-8 border-t border-gray-100 bg-white text-center text-xs text-gray-400 font-primary">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <p className="m-0">© {new Date().getFullYear()} Стильний Зубець. Внутрішня система персоналу.</p>
        <p className="m-0 text-gray-300">Доступ лише для авторизованих співробітників</p>
      </div>
    </footer>
  );
};

export default StaffFooter;
