import type { FC } from 'react';
import TagGroup, { type TagGroupProps, type TagItem } from './TagGroup';

export type FilterPillItem = TagItem;
export type FilterPillsProps = Omit<TagGroupProps, 'variant'>;

export const FilterPills: FC<FilterPillsProps> = ({
  ariaLabel = 'Фільтри-пігулки',
  ...props
}) => {
  return <TagGroup {...props} variant="pill" ariaLabel={ariaLabel} />;
};

export default FilterPills;
