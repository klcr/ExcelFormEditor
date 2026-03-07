import { fireEvent, render, screen } from '@testing-library/react';
// removed user-event import
import { describe, expect, it, vi } from 'vitest';
import { BottomNav, type NavItem } from './BottomNav';

const items: readonly NavItem[] = [
  { id: 'home', label: 'Home' },
  { id: 'edit', label: 'Edit' },
  { id: 'settings', label: 'Settings', disabled: true },
];

describe('BottomNav', () => {
  it('renders all nav items', () => {
    render(<BottomNav items={items} activeId="home" onSelect={() => {}} />);

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('active item has active styling', () => {
    render(<BottomNav items={items} activeId="edit" onSelect={() => {}} />);

    const editButton = screen.getByTestId('bottom-nav-edit');
    expect(editButton.className).toMatch(/itemActive/);

    const homeButton = screen.getByTestId('bottom-nav-home');
    expect(homeButton.className).not.toMatch(/itemActive/);
  });

  it('clicking item calls onSelect with the id', () => {
    const onSelect = vi.fn();
    render(<BottomNav items={items} activeId="home" onSelect={onSelect} />);

    fireEvent.click(screen.getByTestId('bottom-nav-edit'));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith('edit');
  });

  it('disabled item does not trigger onSelect', () => {
    const onSelect = vi.fn();
    render(<BottomNav items={items} activeId="home" onSelect={onSelect} />);

    fireEvent.click(screen.getByTestId('bottom-nav-settings'));

    expect(onSelect).not.toHaveBeenCalled();
  });

  it('renders with data-testid attributes', () => {
    render(<BottomNav items={items} activeId="home" onSelect={() => {}} />);

    expect(screen.getByTestId('bottom-nav')).toBeInTheDocument();
    expect(screen.getByTestId('bottom-nav-home')).toBeInTheDocument();
    expect(screen.getByTestId('bottom-nav-edit')).toBeInTheDocument();
    expect(screen.getByTestId('bottom-nav-settings')).toBeInTheDocument();
  });
});
