import type { FC } from 'react';
import { useState, useMemo } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Icon from '@/components/ui/Icon';
import type { FaqCategory, FaqItem } from './faq_types';
import { FAQ_CATEGORIES, FAQ_ITEMS } from './faq_data';

export interface FaqPageProps {
  isLoggedIn?: boolean;
  onHomeClick?: () => void;
  onLoginClick?: () => void;
  onRegisterClick?: () => void;
  onProfileClick?: () => void;
  onContactSupport?: () => void;
  items?: FaqItem[];
  defaultExpandedIds?: string[];
}

export const FaqPage: FC<FaqPageProps> = ({
  isLoggedIn = false,
  onHomeClick,
  onLoginClick,
  onRegisterClick,
  onProfileClick,
  onContactSupport,
  items = FAQ_ITEMS,
  defaultExpandedIds = ['prep-first-visit'],
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FaqCategory>('all');
  const [expandedIds, setExpandedIds] = useState<string[]>(defaultExpandedIds);

  const toggleItem = (id: string) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return items.filter((item) => {
      const matchesCategory =
        selectedCategory === 'all' || item.category === selectedCategory;
      const matchesQuery =
        !query ||
        item.question.toLowerCase().includes(query) ||
        item.answer.toLowerCase().includes(query);
      return matchesCategory && matchesQuery;
    });
  }, [items, searchQuery, selectedCategory]);

  return (
    <div className="min-h-screen bg-surface-cream text-content-dark font-primary flex flex-col justify-between">
      <div className="flex-1 pb-16">
        <Header
          isLoggedIn={isLoggedIn}
          activeNav="faq"
          onNavClick={(nav) => {
            if (nav === 'home') {
              onHomeClick?.();
            }
          }}
          onLoginClick={onLoginClick}
          onRegisterClick={onRegisterClick}
          onProfileClick={onProfileClick}
        />

        <main className="max-w-[75rem] mx-auto px-6 pt-10 flex flex-col gap-8">
          <nav
            aria-label="Навігація хлібними крихтами"
            className="flex items-center gap-2 text-xs md:text-sm font-primary text-text-muted flex-wrap"
          >
            <button
              type="button"
              onClick={onHomeClick}
              className="hover:text-content-dark transition-colors cursor-pointer bg-transparent border-0 p-0 outline-none"
            >
              Головна
            </button>
            <Icon name="fi-rr-angle-small-right" size={12} className="text-text-muted" />
            <span className="text-terracotta font-medium">Часті запитання (FAQ)</span>
          </nav>

          <header className="flex flex-col gap-6">
            <h1 className="font-accented font-bold text-3xl md:text-4xl text-content-dark">
              Часті запитання (FAQ)
            </h1>

            <div className="relative w-full max-w-[49.5625rem]">
              <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-content-dark/60">
                <Icon name="fi-rr-search" size={20} />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Пошук запитання або послуги..."
                aria-label="Пошук запитання або послуги"
                className="w-full h-[3.0625rem] pl-13 pr-10 rounded-full bg-white border border-black/5 shadow-card text-sm md:text-base font-primary text-content-dark placeholder:text-text-muted outline-none focus:border-terracotta transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Очистити пошук"
                  className="absolute inset-y-0 right-4 flex items-center text-text-muted hover:text-content-dark cursor-pointer bg-transparent border-0 p-0"
                >
                  <Icon name="fi-rr-cross-small" size={20} />
                </button>
              )}
            </div>

            <div
              role="tablist"
              aria-label="Категорії часті запитання"
              className="flex items-center gap-2.5 flex-wrap"
            >
              {FAQ_CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={[
                      'px-5 py-2.5 rounded-full font-primary text-sm transition-all duration-150 cursor-pointer outline-none',
                      isSelected
                        ? 'bg-soft-blue text-white shadow-xs font-semibold'
                        : 'bg-white text-content-dark border border-visit-gray hover:bg-visit-gray/40 hover:border-soft-blue',
                    ].join(' ')}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </header>

          <div className="flex flex-col lg:flex-row items-start gap-8 w-full">
            <aside className="w-full lg:w-[24.1875rem] shrink-0">
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-card border border-black/5 flex flex-col items-start gap-5">
                <div className="w-12 h-12 rounded-full bg-visit-gray flex items-center justify-center text-terracotta">
                  <Icon name="fi-rr-interrogation" size={24} />
                </div>
                <div className="flex flex-col gap-2">
                  <h2 className="font-accented font-bold text-xl text-content-dark">
                    Не знайшли відповіді?
                  </h2>
                  <p className="font-primary text-sm text-content-dark/70 leading-relaxed">
                    Наш адміністратор відповість на будь-які ваші питання в чаті
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onContactSupport}
                  className="w-full py-3.5 px-6 rounded-full bg-terracotta text-white font-primary font-medium text-sm sm:text-base hover:bg-terracotta-hover transition-colors cursor-pointer text-center outline-none border-0 shadow-xs"
                >
                  Написати в підтримку
                </button>
              </div>
            </aside>

            <section
              aria-label="Список запитань та відповідей"
              className="w-full lg:w-[49.5625rem] flex flex-col gap-4"
            >
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => {
                  const isExpanded = expandedIds.includes(item.id);
                  const headerId = `faq-header-${item.id}`;
                  const panelId = `faq-panel-${item.id}`;

                  return (
                    <article
                      key={item.id}
                      className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-card border border-black/5 flex flex-col transition-all duration-200"
                    >
                      <button
                        id={headerId}
                        type="button"
                        aria-expanded={isExpanded}
                        aria-controls={panelId}
                        onClick={() => toggleItem(item.id)}
                        className="w-full flex items-center justify-between gap-4 cursor-pointer bg-transparent border-0 p-0 text-left outline-none"
                      >
                        <span className="font-primary font-medium text-base sm:text-lg text-content-dark leading-snug">
                          {item.question}
                        </span>
                        <span
                          className={`w-8 h-8 rounded-full bg-visit-gray flex items-center justify-center shrink-0 transition-transform duration-200 ${
                            isExpanded ? 'rotate-90' : 'rotate-0'
                          }`}
                        >
                          <Icon
                            name="fi-rr-angle-small-right"
                            size={16}
                            className="text-content-dark"
                          />
                        </span>
                      </button>

                      {isExpanded && (
                        <div
                          id={panelId}
                          role="region"
                          aria-labelledby={headerId}
                          className="flex flex-col gap-3 pt-4"
                        >
                          <div className="h-px bg-visit-gray" />
                          <div className="font-primary text-sm sm:text-base text-content-dark/80 leading-relaxed pt-1">
                            {item.answer}
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })
              ) : (
                <div
                  data-testid="faq-empty-state"
                  className="bg-white rounded-3xl p-10 shadow-card border border-black/5 flex flex-col items-center justify-center text-center gap-3 w-full"
                >
                  <div className="w-12 h-12 rounded-full bg-visit-gray flex items-center justify-center text-text-muted">
                    <Icon name="fi-rr-search" size={24} />
                  </div>
                  <h3 className="font-accented font-bold text-lg text-content-dark">
                    Нічого не знайдено
                  </h3>
                  <p className="font-primary text-sm text-text-muted max-w-sm">
                    За вашим запитом не знайдено жодного запитання. Спробуйте змінити пошуковий
                    запит або обрати іншу категорію.
                  </p>
                </div>
              )}
            </section>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default FaqPage;
