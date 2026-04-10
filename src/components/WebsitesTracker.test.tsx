import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import WebsitesTracker from './WebsitesTracker';

describe('WebsitesTracker', () => {
  it('renders websites overview', () => {
    render(<WebsitesTracker />);
    expect(screen.getByText(/Generated Ecosystem/i)).toBeInTheDocument();
    expect(screen.getByText(/Active Sites/i)).toBeInTheDocument();
  });

  it('renders website cards', () => {
    render(<WebsitesTracker />);
    expect(screen.getByText(/TechFlow Solutions/i)).toBeInTheDocument();
    expect(screen.getByText(/GreenLeaf Organic/i)).toBeInTheDocument();
  });
});
