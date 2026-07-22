import { render, screen } from '@testing-library/react';
import { onSnapshot } from 'firebase/firestore';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Dashboard from './Dashboard.tsx';

// Mock Firestore's onSnapshot
vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual('firebase/firestore');
  return {
    ...actual,
    onSnapshot: vi.fn(),
    collection: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
  };
});

// Mock motion/react
vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('Dashboard', () => {
  const mockLeads = [
    {
      id: '1',
      businessName: 'Business A',
      city: 'City A',
      niche: 'Niche A',
      status: 'qualified',
      uid: 'test-uid',
    },
    {
      id: '2',
      businessName: 'Business B',
      city: 'City B',
      niche: 'Niche B',
      status: 'outreach_sent',
      uid: 'test-uid',
    },
  ];

  beforeEach(() => {
    // auth.currentUser is already mocked in setup.ts

    vi.mocked(onSnapshot).mockImplementation((_q: any, callback: any) => {
      callback({
        docs: mockLeads.map((lead) => ({
          id: lead.id,
          data: () => lead,
        })),
      });
      return () => {};
    });
  });

  it('renders dashboard stats correctly', () => {
    render(<Dashboard />);
    expect(screen.getByText('Total Prospects')).toBeInTheDocument();
    expect(screen.getByText('Qualified Leads')).toBeInTheDocument();
  });

  it('renders recent leads in the intelligence stream', () => {
    render(<Dashboard />);
    expect(screen.getByText('Intelligence Stream')).toBeInTheDocument();
    expect(screen.getByText('Business A')).toBeInTheDocument();
    expect(screen.getByText('Business B')).toBeInTheDocument();
  });

  it('renders control elements and insights', () => {
    render(<Dashboard />);
    expect(screen.getByText('Command Center')).toBeInTheDocument();
    expect(screen.getByText('AI Strategy Insight')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Refresh Strategy/i })).toBeInTheDocument();
  });
});
