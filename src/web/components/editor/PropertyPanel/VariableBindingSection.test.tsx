import type { VariableDefinition } from '@domain/variable';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { VariableBindingSection } from './VariableBindingSection';

const boxId = 'box-1';

function makeVariables(): VariableDefinition[] {
  return [
    { id: 'v1', name: 'userName', type: 'string', boxId: 'box-1' },
    { id: 'v2', name: 'age', type: 'number', boxId: 'box-1' },
    { id: 'v3', name: 'otherVar', type: 'boolean', boxId: 'box-2' },
  ];
}

describe('VariableBindingSection', () => {
  it('renders existing variables for the box', () => {
    render(
      <VariableBindingSection
        boxId={boxId}
        variables={makeVariables()}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    expect(screen.getByText(/userName/)).toBeInTheDocument();
    expect(screen.getByText(/age/)).toBeInTheDocument();
    expect(screen.queryByText(/otherVar/)).not.toBeInTheDocument();
  });

  it('calls onAdd with valid variable name', () => {
    const onAdd = vi.fn();
    render(
      <VariableBindingSection boxId={boxId} variables={[]} onAdd={onAdd} onRemove={vi.fn()} />,
    );

    fireEvent.change(screen.getByLabelText('変数名'), { target: { value: 'myVar' } });
    fireEvent.click(screen.getByText('追加'));

    expect(onAdd).toHaveBeenCalledWith({ name: 'myVar', type: 'string', boxId });
  });

  it('shows error for invalid variable name', () => {
    const onAdd = vi.fn();
    render(
      <VariableBindingSection boxId={boxId} variables={[]} onAdd={onAdd} onRemove={vi.fn()} />,
    );

    fireEvent.change(screen.getByLabelText('変数名'), { target: { value: '123invalid' } });
    fireEvent.click(screen.getByText('追加'));

    expect(onAdd).not.toHaveBeenCalled();
    expect(
      screen.getByText('変数名は英字で始まり、英数字とアンダースコアのみ使用できます'),
    ).toBeInTheDocument();
  });

  it('calls onRemove when delete button is clicked', () => {
    const onRemove = vi.fn();
    render(
      <VariableBindingSection
        boxId={boxId}
        variables={makeVariables()}
        onAdd={vi.fn()}
        onRemove={onRemove}
      />,
    );

    const deleteButton = screen.getAllByText('削除')[0] as HTMLElement;
    fireEvent.click(deleteButton);

    expect(onRemove).toHaveBeenCalledWith('v1');
  });
});
