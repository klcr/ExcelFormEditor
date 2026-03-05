import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AppLayout } from './AppLayout';

describe('AppLayout', () => {
  it('renders header, sidebar, and main slots', () => {
    render(
      <AppLayout
        header={<div>Header Content</div>}
        sidebar={<div>Sidebar Content</div>}
        main={<div>Main Content</div>}
      />,
    );

    expect(screen.getByText('Header Content')).toBeInTheDocument();
    expect(screen.getByText('Sidebar Content')).toBeInTheDocument();
    expect(screen.getByText('Main Content')).toBeInTheDocument();
  });

  it('renders a main element for the content area', () => {
    render(<AppLayout header={<div>H</div>} sidebar={<div>S</div>} main={<div>M</div>} />);

    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('renders children within their respective slots', () => {
    render(
      <AppLayout
        header={<button type="button">Action</button>}
        sidebar={<nav>Nav</nav>}
        main={<article>Article</article>}
      />,
    );

    expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
    expect(screen.getByRole('navigation')).toBeInTheDocument();
    expect(screen.getByRole('article')).toBeInTheDocument();
  });
});
