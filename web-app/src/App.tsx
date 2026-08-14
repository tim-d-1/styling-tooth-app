import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import {
  Logo,
  SocialIcon,
  Button,
  Switch,
  Checkbox,
  Rating,
  NotificationCard,
  FilterMenu,
  Input,
  AddressList,
} from './components/ui';
import type { LogoVariant, SocialPlatform } from './components/ui';

export default function App() {
  const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [switchActive, setSwitchActive] = useState(true);
  const [checkboxChecked, setCheckboxChecked] = useState(true);
  const [userRating, setUserRating] = useState(4);
  const [notificationRead, setNotificationRead] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('1');
  const [selectedAddress, setSelectedAddress] = useState('1');
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    supabase
      .from('service_categories')
      .select('count', { count: 'exact', head: true })
      .then(({ error }) => setDbStatus(error ? 'error' : 'connected'), () => setDbStatus('error'));
  }, []);

  const colorTokens = [
    { name: 'Dark Slate', hex: '#242F35', token: '--color-content-primary', role: 'Primary Text / Content' },
    { name: 'Terracotta', hex: '#EC643A', token: '--color-interactive-primary', role: 'Primary Interactive' },
    { name: 'Soft Cream', hex: '#FFFBF6', token: '--color-surface-main', role: 'Main Background Surface' },
    { name: 'White', hex: '#FFFFFF', token: '--color-surface-white', role: 'White Surface / Card' },
    { name: 'Cornflower Blue', hex: '#96B3E2', token: '--color-surface-accent', role: 'Accent Surface' },
    { name: 'Lightgray', hex: '#ECEEF1', token: '--color-interactive-lightgray', role: 'Lightgray Interactive' },
    { name: 'Status Success', hex: '#34C759', token: '--color-status-success', role: 'Success Green' },
    { name: 'Status Error', hex: '#FF383C', token: '--color-status-error', role: 'Error Red' },
  ];

  const logoVariants: { variant: LogoVariant; title: string }[] = [
    { variant: 'logo-without-fon-01', title: 'Full Logo (No Background)' },
    { variant: 'logo-without-fon-02', title: 'Icon Mark (No Background)' },
    { variant: 'logo-01', title: 'Logo Option 1' },
    { variant: 'logo-02', title: 'Logo Option 2' },
    { variant: 'logo-03', title: 'Logo Option 3' },
    { variant: 'logo-04', title: 'Icon Mark Option 1' },
    { variant: 'logo-05', title: 'Icon Mark Option 2' },
    { variant: 'logo-06', title: 'Icon Mark Option 3' },
  ];

  const socialPlatforms: SocialPlatform[] = [
    'Telegram',
    'Instagram',
    'WhatsApp',
    'Discord',
    'TikTok',
    'Apple',
    'Google',
    'Github',
    'X (Twitter)',
    'YouTube',
    'Facebook',
    'LinkedIn',
  ];

  const filterOptions = [
    { id: '1', label: 'Усі послуги грумінгу' },
    { id: '2', label: 'Стрижка та купання' },
    { id: '3', label: 'Чистка зубів' },
    { id: '4', label: 'Обробка від паразитів' },
  ];

  const addressItems = [
    {
      id: '1',
      title: 'Салон на Хрещатику',
      subtitle: 'м. Київ, вул. Хрещатик, 15',
      badge: 'Відчинено',
    },
    {
      id: '2',
      title: 'Салон на Подолі',
      subtitle: 'м. Київ, вул. Сагайдачного, 22',
      badge: 'Популярний',
    },
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 20px', display: 'flex', flexDirection: 'column', gap: '48px' }}>
      {/* Header */}
      <header
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px',
          paddingBottom: '24px',
          borderBottom: '1px solid var(--color-interactive-lightgray)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Logo variant="logo-without-fon-02" height={48} />
          <div>
            <h1 style={{ margin: 0, fontSize: '28px', fontFamily: 'var(--font-accented)', fontWeight: 700 }}>
              Стильний Зубець
            </h1>
            <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: 'var(--color-text-muted)' }}>
              Design System Tokens, Icons & Core UI Components
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Supabase Status:</span>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: 'var(--radius-full)',
              fontSize: '13px',
              fontWeight: 600,
              backgroundColor: dbStatus === 'connected' ? '#E6F9ED' : '#FEE2E2',
              color: dbStatus === 'connected' ? 'var(--color-status-success)' : 'var(--color-status-error)',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: dbStatus === 'connected' ? 'var(--color-status-success)' : 'var(--color-status-error)',
              }}
            />
            {dbStatus}
          </span>
        </div>
      </header>

      {/* 1. Design Tokens: Colors & Typography */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontFamily: 'var(--font-accented)', margin: 0 }}>
            1. Design Tokens
          </h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', marginTop: '4px' }}>
            Extracted solid palette swatches and typography hierarchy from Figma file.
          </p>
        </div>

        {/* Color Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
          {colorTokens.map((c) => (
            <div
              key={c.name}
              style={{
                backgroundColor: 'var(--color-surface-white)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                boxShadow: 'var(--shadow-card)',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: c.hex,
                  border: c.hex === '#FFFFFF' || c.hex === '#FFFBF6' ? '1px solid var(--color-interactive-lightgray)' : 'none',
                  boxShadow: '0px 2px 4px rgba(0,0,0,0.1)',
                  flexShrink: 0,
                }}
              />
              <div>
                <strong style={{ display: 'block', fontSize: '15px' }}>{c.name}</strong>
                <code style={{ fontSize: '12px', color: 'var(--color-interactive-primary)' }}>{c.hex}</code>
                <span style={{ display: 'block', fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                  {c.role}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Typography Scale */}
        <div
          style={{
            backgroundColor: 'var(--color-surface-white)',
            borderRadius: 'var(--radius-md)',
            padding: '24px',
            boxShadow: 'var(--shadow-card)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--color-text-muted)' }}>Typography Hierarchy</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div>
              <span style={{ fontSize: '2.25rem', fontFamily: 'var(--font-accented)', fontWeight: 700, display: 'block' }}>
                Comfortaa Bold 36px (2.25rem) - Heading 1
              </span>
            </div>
            <div>
              <span style={{ fontSize: '1.5rem', fontFamily: 'var(--font-accented)', fontWeight: 700, display: 'block' }}>
                Comfortaa Bold 24px (1.5rem) - Heading 2
              </span>
            </div>
            <div>
              <span style={{ fontSize: '1.25rem', fontFamily: 'var(--font-accented)', fontWeight: 600, display: 'block' }}>
                Comfortaa SemiBold 20px (1.25rem) - Section Title
              </span>
            </div>
            <div>
              <span style={{ fontSize: '1rem', fontFamily: 'var(--font-primary)', fontWeight: 600, display: 'block' }}>
                Montserrat SemiBold 16px (1rem) - Body Bold / Subtitle
              </span>
            </div>
            <div>
              <span style={{ fontSize: '0.875rem', fontFamily: 'var(--font-primary)', fontWeight: 400, display: 'block' }}>
                Montserrat Regular 14px (0.875rem) - Body Regular text description
              </span>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-primary)', fontWeight: 400, color: 'var(--color-text-muted)', display: 'block' }}>
                Montserrat Regular 12px (0.75rem) - Caption & Timestamp
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Logos & Social Icons */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontFamily: 'var(--font-accented)', margin: 0 }}>
            2. Logos & Social Icons
          </h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', marginTop: '4px' }}>
            Brand logo variations and multi-platform SVG social icons.
          </p>
        </div>

        {/* Logos Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
          {logoVariants.map(({ variant, title }) => (
            <div
              key={variant}
              style={{
                backgroundColor: 'var(--color-surface-white)',
                borderRadius: 'var(--radius-md)',
                padding: '20px',
                boxShadow: 'var(--shadow-card)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                minHeight: '140px',
              }}
            >
              <Logo variant={variant} height={64} />
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', textAlign: 'center' }}>
                {title} (<code>{variant}</code>)
              </span>
            </div>
          ))}
        </div>

        {/* Social Icons Grid */}
        <div
          style={{
            backgroundColor: 'var(--color-surface-white)',
            borderRadius: 'var(--radius-md)',
            padding: '24px',
            boxShadow: 'var(--shadow-card)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--color-text-muted)' }}>
            Social Media Platform Icons (Original on Light / Negative on Dark)
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
            {socialPlatforms.map((platform) => (
              <div
                key={platform}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-surface-main)',
                  border: '1px solid var(--color-interactive-lightgray)',
                }}
              >
                {/* Original Icon */}
                <div title={`${platform} Original`}>
                  <SocialIcon platform={platform} colorScheme="Original" size={28} />
                </div>

                {/* Negative Icon on Dark Badge */}
                <div
                  title={`${platform} Negative`}
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-content-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <SocialIcon platform={platform} colorScheme="Negative" size={20} />
                </div>

                <span style={{ fontSize: '14px', fontWeight: 500 }}>{platform}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Core UI Components */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontFamily: 'var(--font-accented)', margin: 0 }}>
            3. Core UI Components
          </h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', marginTop: '4px' }}>
            Interactive React components matching Figma auto-layout specs and states.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          {/* Buttons & Toggles */}
          <div
            style={{
              backgroundColor: 'var(--color-surface-white)',
              borderRadius: 'var(--radius-md)',
              padding: '24px',
              boxShadow: 'var(--shadow-card)',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
          >
            <h3 style={{ margin: 0, fontSize: '16px' }}>Buttons & Switches</h3>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              <Button variant="primary" size="md">
                Primary Button
              </Button>
              <Button variant="outline" size="md">
                Outline Button
              </Button>
              <Button variant="secondary" size="md">
                Light Button
              </Button>
              <Button variant="primary" size="sm">
                Small
              </Button>
              <Button variant="primary" size="lg">
                Large Button
              </Button>
              <Button variant="primary" isLoading size="md">
                Loading
              </Button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingTop: '12px', borderTop: '1px solid var(--color-interactive-lightgray)' }}>
              <Switch
                checked={switchActive}
                onChange={setSwitchActive}
                label={`Switcher State: ${switchActive ? 'Active' : 'Unactive'}`}
              />
              <Checkbox
                checked={checkboxChecked}
                onChange={setCheckboxChecked}
                label="Я погоджуюся з умовами обслуговування"
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '14px' }}>Оцінка послуги:</span>
                <Rating
                  value={userRating}
                  readOnly={false}
                  onChange={setUserRating}
                  showScore
                />
              </div>
            </div>
          </div>

          {/* Notification Card */}
          <div
            style={{
              backgroundColor: 'var(--color-surface-white)',
              borderRadius: 'var(--radius-md)',
              padding: '24px',
              boxShadow: 'var(--shadow-card)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <h3 style={{ margin: 0, fontSize: '16px' }}>Notification Card Component</h3>

            <NotificationCard
              title="Обробка від кліщів"
              message="Через 14 днів настає термін обробки препаратом Bravecto для Барона."
              timeAgo="10 хв тому"
              unread={!notificationRead}
              read={notificationRead}
              onMarkRead={() => setNotificationRead(!notificationRead)}
            />
          </div>

          {/* Inputs & Dropdowns */}
          <div
            style={{
              backgroundColor: 'var(--color-surface-white)',
              borderRadius: 'var(--radius-md)',
              padding: '24px',
              boxShadow: 'var(--shadow-card)',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
          >
            <h3 style={{ margin: 0, fontSize: '16px' }}>Input & Filter Dropdown</h3>

            <Input
              label="Ім'я улюбленця"
              placeholder="Введіть кличку тварини..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />

            <div>
              <span style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>
                Фільтр послуг:
              </span>
              <FilterMenu
                options={filterOptions}
                selectedId={selectedFilter}
                onSelect={(opt) => setSelectedFilter(opt.id)}
              />
            </div>
          </div>

          {/* Address & Method List */}
          <div
            style={{
              backgroundColor: 'var(--color-surface-white)',
              borderRadius: 'var(--radius-md)',
              padding: '24px',
              boxShadow: 'var(--shadow-card)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <h3 style={{ margin: 0, fontSize: '16px' }}>Address & Location Cards</h3>

            <AddressList
              items={addressItems}
              selectedId={selectedAddress}
              onSelect={(item) => setSelectedAddress(item.id)}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
