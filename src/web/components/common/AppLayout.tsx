import type { LayoutMode } from '@web/hooks/useLayoutMode';
import type { ReactNode } from 'react';
import styles from './AppLayout.module.css';

type AppLayoutProps = {
  readonly header: ReactNode;
  readonly sidebar: ReactNode;
  readonly main: ReactNode;
  readonly layoutMode: LayoutMode;
  readonly bottomNav?: ReactNode;
};

export function AppLayout({ header, sidebar, main, layoutMode, bottomNav }: AppLayoutProps) {
  const layoutClass = layoutMode === 'mobile' ? styles.layoutMobile : styles.layout;

  return (
    <div className={layoutClass}>
      <div className={styles.header}>{header}</div>
      {layoutMode === 'desktop' && <div className={styles.sidebar}>{sidebar}</div>}
      <main className={layoutMode === 'mobile' ? styles.mainMobile : styles.main}>{main}</main>
      {layoutMode === 'mobile' && bottomNav}
    </div>
  );
}
