import type { VariableDefinition } from '@domain/variable';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { InterfacePreview } from './InterfacePreview';

function makeVariables(): VariableDefinition[] {
  return [
    { id: 'v1', name: 'userName', type: 'string', boxId: 'box-1' },
    { id: 'v2', name: 'age', type: 'number', boxId: 'box-1' },
  ];
}

describe('InterfacePreview', () => {
  it('renders generated interface code', () => {
    render(<InterfacePreview interfaceName="FormData" variables={makeVariables()} />);

    expect(screen.getByText(/interface FormData/)).toBeInTheDocument();
    expect(screen.getByText(/userName: string/)).toBeInTheDocument();
    expect(screen.getByText(/age: number/)).toBeInTheDocument();
  });

  it('shows empty state when no variables', () => {
    render(<InterfacePreview interfaceName="FormData" variables={[]} />);

    expect(screen.getByText('変数を追加してプレビューを表示')).toBeInTheDocument();
  });

  it('renders copy button', () => {
    render(<InterfacePreview interfaceName="FormData" variables={makeVariables()} />);

    expect(screen.getByText('コピー')).toBeInTheDocument();
  });
});
