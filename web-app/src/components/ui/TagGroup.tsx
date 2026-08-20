import { useState, type FC } from 'react';

export interface TagItem {
  id: string;
  label: string;
  count?: number;
  disabled?: boolean;
}

export interface TagGroupProps {
  selectedIds?: string[];
  defaultSelectedIds?: string[];
  onToggle?: (id: string) => void;
  tags?: TagItem[];
  className?: string;
  ariaLabel?: string;
  variant?: 'solid' | 'outline' | 'pill';
}

export const TagGroup: FC<TagGroupProps> = ({
  selectedIds: controlledSelectedIds,
  defaultSelectedIds = [],
  onToggle,
  tags = [],
  className,
  ariaLabel = 'Група тегів',
  variant = 'solid',
}) => {
  const [internalSelectedIds, setInternalSelectedIds] = useState<string[]>(defaultSelectedIds);

  const selectedIds = controlledSelectedIds !== undefined ? controlledSelectedIds : internalSelectedIds;

  const handleToggle = (id: string) => {
    if (controlledSelectedIds === undefined) {
      setInternalSelectedIds((prev) =>
        prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
      );
    }
    onToggle?.(id);
  };

  if (tags.length === 0) {
    return (
      <div className={['ui-tag-group-empty text-xs text-gray-500 font-primary py-2', className].filter(Boolean).join(' ')}>
        Немає доступних тегів
      </div>
    );
  }

  const getVariantStyles = (isSelected: boolean) => {
    if (variant === 'pill') {
      return isSelected
        ? 'bg-soft-blue text-white border-transparent shadow-xs font-semibold'
        : 'bg-white text-content-dark border-visit-gray hover:border-soft-blue hover:bg-visit-gray/50';
    }

    if (variant === 'outline') {
      return isSelected
        ? 'bg-terracotta/10 text-terracotta border-terracotta font-semibold'
        : 'bg-transparent text-content-dark border-visit-gray hover:border-content-dark';
    }

    return isSelected
      ? 'bg-soft-blue text-white border-transparent'
      : 'bg-transparent text-content-dark border-content-dark hover:bg-visit-gray';
  };

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={['ui-tag-group flex flex-wrap items-center gap-2.5 w-full max-w-[353px]', className]
        .filter(Boolean)
        .join(' ')}
    >
      {tags.map((tag) => {
        const tagId = tag.id || `tag-${tag.label.trim().toLowerCase().replace(/\s+/g, '-')}`;
        const isSelected = selectedIds.includes(tagId);

        return (
          <button
            key={tagId}
            type="button"
            aria-pressed={isSelected}
            disabled={tag.disabled}
            onClick={() => handleToggle(tagId)}
            className={[
              'min-h-[2.5rem] h-auto px-4 py-2 rounded-xl text-sm font-primary cursor-pointer flex items-center justify-center gap-2 border transition-all duration-150 outline-none',
              getVariantStyles(isSelected),
              tag.disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <span>{tag.label}</span>
            {tag.count !== undefined && (
              <span
                className={[
                  'text-xs px-1.5 py-0.5 rounded-full font-accented',
                  isSelected ? 'bg-white/20 text-white font-bold' : 'bg-gray-200 text-content-dark',
                ].join(' ')}
              >
                {tag.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default TagGroup;
