import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'Система трекинга курьеров — Системный дизайн',
  description:
    'Учебный проект по системному дизайну: real-time система трекинга курьеров на карте.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <header className="site-header">
          <div className="site-header-inner">
            <Link href="/" className="site-logo" aria-label="На главную">
              SD
            </Link>
            <div>
              <Link href="/" className="site-title">
                Система трекинга курьеров
              </Link>
              <div className="site-sub">Системный дизайн · учебный проект</div>
            </div>
          </div>
        </header>
        {children}
        <footer className="site-footer">
          Учебный проект по системному дизайну · 7 артефактов
        </footer>
      </body>
    </html>
  );
}
