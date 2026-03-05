import styles from './Header.module.css';

type HeaderProps = {
  readonly title?: string;
};

export function Header({ title = 'Excel Form Editor' }: HeaderProps) {
  return (
    <header className={styles.header}>
      <h1 className={styles.title}>{title}</h1>
    </header>
  );
}
