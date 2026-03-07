import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AppLayout } from './AppLayout';

describe('AppLayout', () => {
  describe('desktop mode', () => {
    it('renders header, sidebar, and main slots', () => {
      render(
        <AppLayout
          header={<div>Header Content</div>}
          sidebar={<div>Sidebar Content</div>}
          main={<div>Main Content</div>}
          layoutMode="desktop"
        />,
      );

      expect(screen.getByText('Header Content')).toBeInTheDocument();
      expect(screen.getByText('Sidebar Content')).toBeInTheDocument();
      expect(screen.getByText('Main Content')).toBeInTheDocument();
    });

    it('renders a main element for the content area', () => {
      render(
        <AppLayout
          header={<div>H</div>}
          sidebar={<div>S</div>}
          main={<div>M</div>}
          layoutMode="desktop"
        />,
      );

      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('renders children within their respective slots', () => {
      render(
        <AppLayout
          header={<button type="button">Action</button>}
          sidebar={<nav>Nav</nav>}
          main={<article>Article</article>}
          layoutMode="desktop"
        />,
      );

      expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
      expect(screen.getByRole('navigation')).toBeInTheDocument();
      expect(screen.getByRole('article')).toBeInTheDocument();
    });

    it('does not render bottomNav in desktop mode', () => {
      render(
        <AppLayout
          header={<div>H</div>}
          sidebar={<div>S</div>}
          main={<div>M</div>}
          layoutMode="desktop"
          bottomNav={<div data-testid="bottom-nav">BottomNav</div>}
        />,
      );

      expect(screen.queryByTestId('bottom-nav')).not.toBeInTheDocument();
    });
  });

  describe('mobile mode', () => {
    it('renders header and main but not sidebar', () => {
      render(
        <AppLayout
          header={<div>Header Content</div>}
          sidebar={<div>Sidebar Content</div>}
          main={<div>Main Content</div>}
          layoutMode="mobile"
        />,
      );

      expect(screen.getByText('Header Content')).toBeInTheDocument();
      expect(screen.queryByText('Sidebar Content')).not.toBeInTheDocument();
      expect(screen.getByText('Main Content')).toBeInTheDocument();
    });

    it('renders bottomNav when provided', () => {
      render(
        <AppLayout
          header={<div>H</div>}
          sidebar={<div>S</div>}
          main={<div>M</div>}
          layoutMode="mobile"
          bottomNav={<div data-testid="bottom-nav">BottomNav</div>}
        />,
      );

      expect(screen.getByTestId('bottom-nav')).toBeInTheDocument();
    });

    it('renders a main element for the content area', () => {
      render(
        <AppLayout
          header={<div>H</div>}
          sidebar={<div>S</div>}
          main={<div>M</div>}
          layoutMode="mobile"
        />,
      );

      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });
});
