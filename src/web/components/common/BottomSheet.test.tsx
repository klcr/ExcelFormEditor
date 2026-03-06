import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BottomSheet } from './BottomSheet';

describe('BottomSheet', () => {
  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <BottomSheet isOpen={false} onClose={() => {}} title="Test">
        <p>Content</p>
      </BottomSheet>,
    );

    expect(container.innerHTML).toBe('');
  });

  it('renders sheet when isOpen is true', () => {
    render(
      <BottomSheet isOpen={true} onClose={() => {}} title="Test">
        <p>Content</p>
      </BottomSheet>,
    );

    expect(screen.getByTestId('bottom-sheet')).toBeInTheDocument();
  });

  it('clicking overlay calls onClose', () => {
    const onClose = vi.fn();

    render(
      <BottomSheet isOpen={true} onClose={onClose} title="Test">
        <p>Content</p>
      </BottomSheet>,
    );

    fireEvent.click(screen.getByTestId('bottom-sheet-overlay'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('clicking sheet content does not call onClose', () => {
    const onClose = vi.fn();

    render(
      <BottomSheet isOpen={true} onClose={onClose} title="Test">
        <p>Content</p>
      </BottomSheet>,
    );

    fireEvent.click(screen.getByTestId('bottom-sheet'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('close button calls onClose', () => {
    const onClose = vi.fn();

    render(
      <BottomSheet isOpen={true} onClose={onClose} title="Test">
        <p>Content</p>
      </BottomSheet>,
    );

    fireEvent.click(screen.getByTestId('bottom-sheet-close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders title and children', () => {
    render(
      <BottomSheet isOpen={true} onClose={() => {}} title="My Title">
        <p>Hello World</p>
      </BottomSheet>,
    );

    expect(screen.getByText('My Title')).toBeInTheDocument();
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });
});
