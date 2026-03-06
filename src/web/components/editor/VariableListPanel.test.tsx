import type { VariableDefinition } from '@domain/variable';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { VariableListPanel } from './VariableListPanel';

function makeVariables(): VariableDefinition[] {
  return [
    { id: 'v1', name: 'userName', type: 'string', boxId: 'box-1' },
    { id: 'v2', name: 'age', type: 'number', boxId: 'box-2' },
  ];
}

describe('VariableListPanel', () => {
  it('renders variable list', () => {
    render(<VariableListPanel variables={makeVariables()} onRemove={vi.fn()} />);

    expect(screen.getByText(/userName/)).toBeInTheDocument();
    expect(screen.getByText(/age/)).toBeInTheDocument();
    expect(screen.getByText(/box-1/)).toBeInTheDocument();
    expect(screen.getByText(/box-2/)).toBeInTheDocument();
  });

  it('shows empty state message when no variables', () => {
    render(<VariableListPanel variables={[]} onRemove={vi.fn()} />);

    expect(screen.getByText('変数が定義されていません')).toBeInTheDocument();
  });

  it('calls onRemove when delete button is clicked', () => {
    const onRemove = vi.fn();
    render(<VariableListPanel variables={makeVariables()} onRemove={onRemove} />);

    const deleteButtons = screen.getAllByText('削除');
    fireEvent.click(deleteButtons[0]!);

    expect(onRemove).toHaveBeenCalledWith('v1');
  });
});
