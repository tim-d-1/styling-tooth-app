import type { FC } from 'react';

export type SocialPlatform =
  | 'Apple'
  | 'Bluesky'
  | 'Discord'
  | 'Dribbble'
  | 'Facebook'
  | 'Figma'
  | 'Github'
  | 'Google'
  | 'Instagram'
  | 'LinkedIn'
  | 'Medium'
  | 'Messenger'
  | 'Pinterest'
  | 'Reddit'
  | 'Signal'
  | 'Snapchat'
  | 'Spotify'
  | 'Telegram'
  | 'Threads'
  | 'TikTok'
  | 'Tumblr'
  | 'Twitch'
  | 'VK'
  | 'WhatsApp'
  | 'X (Twitter)'
  | 'YouTube';

export type SocialColorScheme = 'Negative' | 'Original';

export interface SocialIconProps {
  platform: SocialPlatform;
  colorScheme?: SocialColorScheme;
  size?: number;
  alt?: string;
  className?: string;
}

const platformKeyMap: Record<SocialPlatform, string> = {
  Apple: 'apple',
  Bluesky: 'bluesky',
  Discord: 'discord',
  Dribbble: 'dribbble',
  Facebook: 'facebook',
  Figma: 'figma',
  Github: 'github',
  Google: 'google',
  Instagram: 'instagram',
  LinkedIn: 'linkedin',
  Medium: 'medium',
  Messenger: 'messenger',
  Pinterest: 'pinterest',
  Reddit: 'reddit',
  Signal: 'signal',
  Snapchat: 'snapchat',
  Spotify: 'spotify',
  Telegram: 'telegram',
  Threads: 'threads',
  TikTok: 'tiktok',
  Tumblr: 'tumblr',
  Twitch: 'twitch',
  VK: 'vk',
  WhatsApp: 'whatsapp',
  'X (Twitter)': 'x-twitter',
  YouTube: 'youtube',
};

export const SocialIcon: FC<SocialIconProps> = ({
  platform,
  colorScheme = 'Original',
  size = 24,
  alt,
  className,
}) => {
  const key = platformKeyMap[platform] || 'telegram';
  const fileName = `${key}-${colorScheme.toLowerCase()}.svg`;
  const src = `/assets/social_icons/${fileName}`;

  return (
    <img
      src={src}
      alt={alt || `${platform} Icon`}
      width={size}
      height={size}
      style={{ width: `${size}px`, height: `${size}px` }}
      className={['inline-block shrink-0 object-contain', className].filter(Boolean).join(' ')}
      loading="lazy"
    />
  );
};

export default SocialIcon;
