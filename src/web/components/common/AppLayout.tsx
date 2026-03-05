import type { ReactNode } from 'react';
import styles from './AppLayout.module.css';

type AppLayoutProps = {
  readonly header: ReactNode;
  readonly sidebar: ReactNode;
  readonly main: ReactNode;
};

export function AppLayout({ header, sidebar, main }: AppLayoutProps) {
  return (
    <div className={styles.layout}>
      <div className={styles.header}>{header}</div>
      <div className={styles.sidebar}>{sidebar}</div>
      <main className={styles.main}>{main}</main>
    </div>
  );
}
