import { useState, type FC } from 'react';
import DetailCardLayout from '@/components/layout/DetailCardLayout';
import Rating from '@/components/ui/Rating';
import {
  ARTICLES_REGISTRY,
  DEFAULT_ARTICLE_ID,
  type ArticleData,
} from './article_types';

export interface ArticleDetailPageProps {
  articleId?: string;
  article?: ArticleData;
  isLoggedIn?: boolean;
  userName?: string;
  userAvatarUrl?: string;
  onBackClick?: () => void;
  onLoginClick?: () => void;
  onRegisterClick?: () => void;
  onProfileClick?: () => void;
  onRate?: (rating: number) => void;
  onToast?: (message: string) => void;
}

export const ArticleDetailPage: FC<ArticleDetailPageProps> = ({
  articleId,
  article,
  isLoggedIn = false,
  userName,
  userAvatarUrl,
  onBackClick,
  onLoginClick,
  onRegisterClick,
  onProfileClick,
  onRate,
  onToast,
}) => {
  const [rating, setRating] = useState(0);

  const activeArticle =
    article ||
    (articleId && ARTICLES_REGISTRY[articleId]) ||
    ARTICLES_REGISTRY[DEFAULT_ARTICLE_ID];

  const handleRatingChange = (newRating: number) => {
    setRating(newRating);
    onRate?.(newRating);
    if (onToast) {
      onToast(`Дякуємо за вашу оцінку: ${newRating} з 5!`);
    }
  };

  return (
    <DetailCardLayout
      isLoggedIn={isLoggedIn}
      userName={userName}
      userAvatarUrl={userAvatarUrl}
      onBackClick={onBackClick}
      onLoginClick={onLoginClick}
      onRegisterClick={onRegisterClick}
      onProfileClick={onProfileClick}
    >
      <div className="flex flex-col">
        <h1 className="text-3xl sm:text-[2.25rem] leading-tight font-bold font-accented text-content-dark mb-6">
          {activeArticle.title}
        </h1>

        <p className="text-base font-semibold font-accented text-content-dark leading-relaxed mb-10">
          {activeArticle.intro}
        </p>

        {activeArticle.sections.map((section, idx) => (
          <div key={section.title || idx} className="mb-10 last:mb-6">
            <h2 className="text-2xl font-bold font-accented text-content-dark mb-4">
              {section.title}
            </h2>
            <ul className="space-y-2 list-none p-0 m-0">
              {section.items.map((item, itemIdx) => (
                <li
                  key={itemIdx}
                  className="text-base font-semibold font-accented text-content-dark leading-relaxed"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}

        <p className="text-base font-semibold font-accented text-content-dark leading-relaxed mb-16 sm:mb-20">
          {activeArticle.summary}
        </p>

        <div className="flex flex-col items-start gap-4">
          <Rating
            variant="paw"
            value={rating}
            onChange={handleRatingChange}
            readOnly={false}
            ariaLabel="Оцініть, наскільки корисною була ця інформація"
          />
          <span className="text-sm font-primary text-[#B2B2B2]">
            Оцініть, наскільки корисною була ця інформація
          </span>
        </div>
      </div>
    </DetailCardLayout>
  );
};

export default ArticleDetailPage;
