import { useState, useEffect, type FC, type MouseEvent } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Icon from '@/components/ui/Icon';
import {
  DEFAULT_PRIVACY_POLICY,
  type PrivacyPolicyPageProps,
} from './legal_types';

export const PrivacyPolicyPage: FC<PrivacyPolicyPageProps> = ({
  data,
  isLoggedIn = false,
  userName,
  userAvatarUrl,
  onHomeClick,
  onLoginClick,
  onRegisterClick,
  onProfileClick,
}) => {
  const pageData = data || DEFAULT_PRIVACY_POLICY;
  const [activeSectionId, setActiveSectionId] = useState<string>(
    pageData.toc[0]?.id || ''
  );

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const hashId = window.location.hash.replace('#', '');
      if (pageData.sections.some((s) => s.id === hashId)) {
        setActiveSectionId(hashId);
      }
    }
  }, [pageData.sections]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSectionId(entry.target.id);
          }
        }
      },
      { rootMargin: '-20% 0px -70% 0px' }
    );

    pageData.sections.forEach((sec) => {
      const el = document.getElementById(sec.id);
      if (el) observer.observe(el);
    });

    return () => {
      observer.disconnect();
    };
  }, [pageData.sections]);

  const handleTocClick = (e: MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    setActiveSectionId(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (typeof window !== 'undefined' && window.history?.pushState) {
        window.history.pushState(null, '', `#${id}`);
      }
    }
  };

  return (
    <div className="min-h-screen bg-surface-cream text-content-dark font-primary flex flex-col justify-between">
      <div className="flex-1 pb-16">
        <Header
          isLoggedIn={isLoggedIn}
          userName={userName}
          userAvatarUrl={userAvatarUrl}
          onLoginClick={onLoginClick}
          onRegisterClick={onRegisterClick}
          onProfileClick={onProfileClick}
          onNavClick={(nav) => {
            if (nav === 'home') onHomeClick?.();
          }}
        />

        <main className="max-w-[75rem] mx-auto px-6 sm:px-8 pt-8 flex flex-col gap-8">
          <nav
            aria-label="Навігація хлібними крихтами"
            className="flex items-center gap-2 text-xs md:text-sm font-primary text-text-muted flex-wrap"
          >
            {pageData.breadcrumbs.map((crumb, idx) => {
              const isLast = idx === pageData.breadcrumbs.length - 1;
              if (isLast) {
                return (
                  <span key={idx} className="text-terracotta font-medium">
                    {crumb.label}
                  </span>
                );
              }
              return (
                <span key={idx} className="inline-flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (crumb.href === '/' || crumb.label === 'Головна') {
                        onHomeClick?.();
                      }
                    }}
                    className="hover:text-content-dark transition-colors cursor-pointer bg-transparent border-0 p-0 text-text-muted"
                  >
                    {crumb.label}
                  </button>
                  <Icon
                    name="fi-rr-angle-small-right"
                    size={12}
                    className="text-text-muted"
                  />
                </span>
              );
            })}
          </nav>

          <header className="flex flex-col gap-4">
            <h1 className="font-accented font-bold text-3xl md:text-4xl text-content-dark">
              {pageData.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-xs md:text-sm text-content-dark/70">
              <span>Останнє оновлення: {pageData.lastUpdated}</span>
              <span className="inline-flex items-center gap-1.5 bg-soft-ice text-content-dark px-3 py-1 rounded-full font-medium">
                <Icon name="fi-rr-clock" size={14} className="text-content-dark" />
                <span>{pageData.readingTime}</span>
              </span>
            </div>
          </header>

          <section
            aria-label="Коротко про головне"
            className="w-full bg-white rounded-2xl p-6 sm:p-8 shadow-card border border-black/5"
          >
            <h2 className="font-accented font-bold text-xl md:text-2xl text-content-dark mb-4 flex items-center gap-2">
              {pageData.summary.title}
            </h2>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 list-none p-0 m-0">
              {pageData.summary.items.map((item, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-3 bg-surface-cream/60 rounded-xl p-4 border border-black/5"
                >
                  <span className="shrink-0 w-6 h-6 rounded-full bg-terracotta/10 text-terracotta flex items-center justify-center mt-0.5">
                    <Icon name="fi-rr-check" size={14} className="text-terracotta" />
                  </span>
                  <span className="text-sm md:text-base leading-relaxed text-content-dark font-medium">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <div className="flex flex-col lg:flex-row gap-8 items-start">
            <aside
              aria-label="Зміст документа"
              className="w-full lg:w-[24.1875rem] shrink-0 lg:sticky lg:top-24 self-start bg-white rounded-2xl p-6 shadow-card border border-black/5"
            >
              <h2 className="font-accented font-bold text-lg md:text-xl text-content-dark mb-4">
                Зміст документа
              </h2>
              <nav aria-label="Розділи документа" className="flex flex-col gap-2">
                {pageData.toc.map((item) => {
                  const isActive = activeSectionId === item.id;
                  return (
                    <a
                      key={item.id}
                      href={item.href}
                      onClick={(e) => handleTocClick(e, item.id)}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-soft-ice text-terracotta font-semibold'
                          : 'text-content-dark hover:bg-surface-cream hover:text-terracotta'
                      }`}
                    >
                      <span>{item.title}</span>
                      <Icon name="fi-rr-angle-small-right" size={14} className="opacity-60" />
                    </a>
                  );
                })}
              </nav>
            </aside>

            <article className="w-full lg:w-[49.5625rem] flex flex-col gap-8">
              {pageData.sections.map((section) => (
                <section
                  key={section.id}
                  id={section.id}
                  className="bg-white rounded-2xl p-6 sm:p-10 shadow-card border border-black/5 scroll-mt-24"
                >
                  <h2 className="font-accented font-bold text-xl md:text-2xl text-content-dark mb-4">
                    {section.title}
                  </h2>
                  {section.intro && (
                    <p className="text-sm md:text-base leading-relaxed text-content-dark mb-4">
                      {section.intro}
                    </p>
                  )}
                  {section.paragraphs?.map((p, idx) => (
                    <p
                      key={idx}
                      className="text-sm md:text-base leading-relaxed text-content-dark/90 mb-4"
                    >
                      {p}
                    </p>
                  ))}
                  {section.subSections?.map((sub, sIdx) => (
                    <div key={sIdx} className="mt-6">
                      {sub.title && (
                        <h3 className="font-accented font-semibold text-base md:text-lg text-content-dark mb-3">
                          {sub.title}
                        </h3>
                      )}
                      {sub.paragraphs?.map((p, pIdx) => (
                        <p
                          key={pIdx}
                          className="text-sm md:text-base leading-relaxed text-content-dark/90 mb-3"
                        >
                          {p}
                        </p>
                      ))}
                      {sub.listItems && sub.listItems.length > 0 && (
                        <ul className="space-y-2 list-none p-0 my-3">
                          {sub.listItems.map((li, lIdx) => (
                            <li
                              key={lIdx}
                              className="flex items-start gap-2.5 text-sm md:text-base text-content-dark/90 leading-relaxed"
                            >
                              <span className="select-none text-terracotta font-bold text-base leading-none mt-1">
                                •
                              </span>
                              <span>{li}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </section>
              ))}
            </article>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default PrivacyPolicyPage;
