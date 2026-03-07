import styles from './BottomNav.module.css';

type NavItem = {
  readonly id: string;
  readonly label: string;
  readonly disabled?: boolean;
};

type BottomNavProps = {
  readonly items: readonly NavItem[];
  readonly activeId: string;
  readonly onSelect: (id: string) => void;
};

export type { NavItem };

export function BottomNav({ items, activeId, onSelect }: BottomNavProps) {
  return (
    <nav className={styles.nav} data-testid="bottom-nav">
      {items.map((item) => {
        const isActive = item.id === activeId;
        const isDisabled = item.disabled ?? false;

        const className = [
          styles.item,
          isActive ? styles.itemActive : '',
          isDisabled ? styles.itemDisabled : '',
        ]
          .filter(Boolean)
          .join(' ');

        return (
          <button
            key={item.id}
            type="button"
            className={className}
            disabled={isDisabled}
            onClick={() => onSelect(item.id)}
            data-testid={`bottom-nav-${item.id}`}
          >
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}
