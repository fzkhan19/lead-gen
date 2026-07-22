import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import OutreachTracker from './OutreachTracker.tsx';

describe('OutreachTracker', () => {
  it('renders outreach overview', () => {
    render(<OutreachTracker />);
    expect(screen.getByText(/Outreach Intelligence/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Sent Proposals/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Total Value/i)).toBeInTheDocument();
  });

  it('renders campaign cards', () => {
    render(<OutreachTracker />);
    expect(screen.getByText(/TechFlow Solutions/i)).toBeInTheDocument();
    expect(screen.getByText(/GreenLeaf Organic/i)).toBeInTheDocument();
  });
});
