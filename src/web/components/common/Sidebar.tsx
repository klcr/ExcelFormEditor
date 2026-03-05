import type { ReactNode } from 'react';
import styles from './Sidebar.module.css';

type SidebarProps = {
  readonly children: ReactNode;
};

export function Sidebar({ children }: SidebarProps) {
  return <aside className={styles.sidebar}>{children}</aside>;
}
