import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import WebsitesTracker from './WebsitesTracker.tsx';

describe('WebsitesTracker', () => {
  it('renders websites overview', () => {
    render(<WebsitesTracker />);
    expect(screen.getByText(/Ecosystem Dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/Active Deployed Assets/i)).toBeInTheDocument();
  });

  it('renders website cards', () => {
    render(<WebsitesTracker />);
    expect(screen.getByText(/TechFlow Solutions/i)).toBeInTheDocument();
    expect(screen.getByText(/GreenLeaf Organic/i)).toBeInTheDocument();
  });
});
