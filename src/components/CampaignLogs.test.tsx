import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { onSnapshot, getDocs, deleteDoc } from 'firebase/firestore';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CampaignLogs from './CampaignLogs.tsx';

// Mock Firestore's onSnapshot & other query functions
vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual('firebase/firestore');
  return {
    ...actual,
    onSnapshot: vi.fn(),
    collection: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    deleteDoc: vi.fn().mockResolvedValue({}),
    getDocs: vi.fn(),
  };
});

// Mock motion/react
vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('CampaignLogs', () => {
  const mockLogs = [
    {
      id: 'log-1',
      uid: 'test-uid',
      leadId: 'lead-1',
      leadName: 'Alpha Corp',
      action: 'Campaign Started',
      status: 'info',
      message: 'Starting automated SDR outreach sequence.',
      timestamp: {
        toDate: () => new Date('2026-07-20T10:00:00Z'),
      },
    },
    {
      id: 'log-2',
      uid: 'test-uid',
      leadId: 'lead-1',
      leadName: 'Alpha Corp',
      action: 'Website Generated',
      status: 'success',
      message: 'Custom web landing page built successfully.',
      timestamp: {
        toDate: () => new Date('2026-07-20T10:05:00Z'),
      },
    },
    {
      id: 'log-3',
      uid: 'test-uid',
      leadId: 'lead-2',
      leadName: 'Beta Inc',
      action: 'SMTP Outreach',
      status: 'error',
      message: 'Critical pipeline error: SMTP Authentication Failed.',
      timestamp: {
        toDate: () => new Date('2026-07-20T10:10:00Z'),
      },
    },
  ];

  beforeEach(() => {
    vi.mocked(onSnapshot).mockImplementation((_q: any, callback: any) => {
      callback({
        docs: mockLogs.map((log) => ({
          id: log.id,
          data: () => log,
        })),
      });
      return () => {};
    });

    vi.mocked(getDocs).mockResolvedValue({
      docs: mockLogs.map((log) => ({
        ref: { id: log.id },
      })),
    } as any);

    // Mock window.confirm
    vi.spyOn(window, 'confirm').mockImplementation(() => true);
  });

  it('renders campaign logs successfully', async () => {
    render(<CampaignLogs />);

    expect(screen.getByText(/Campaign Event Stream/i)).toBeInTheDocument();
    expect(screen.getByText(/Real-time chronological log/i)).toBeInTheDocument();

    // Verify mock logs display
    expect(screen.getByText('Starting automated SDR outreach sequence.')).toBeInTheDocument();
    expect(screen.getByText('Custom web landing page built successfully.')).toBeInTheDocument();
    expect(screen.getByText('Critical pipeline error: SMTP Authentication Failed.')).toBeInTheDocument();

    // Verify lead names
    expect(screen.getAllByText('Alpha Corp').length).toBeGreaterThan(0);
    expect(screen.getByText('Beta Inc')).toBeInTheDocument();
  });

  it('filters logs by status', async () => {
    render(<CampaignLogs />);

    // Initial state: shows all logs
    expect(screen.getByText('Starting automated SDR outreach sequence.')).toBeInTheDocument();
    expect(screen.getByText('Critical pipeline error: SMTP Authentication Failed.')).toBeInTheDocument();

    // Filter by 'error'
    const buttons = screen.getAllByRole('button');
    const errorBtn = buttons.find((btn) => btn.textContent === 'error');
    if (!errorBtn) throw new Error('Could not find error status button');
    fireEvent.click(errorBtn);

    // Should only show error log
    expect(screen.queryByText('Starting automated SDR outreach sequence.')).not.toBeInTheDocument();
    expect(screen.getByText('Critical pipeline error: SMTP Authentication Failed.')).toBeInTheDocument();

    // Filter back to 'all'
    const allBtn = buttons.find((btn) => btn.textContent === 'all');
    if (!allBtn) throw new Error('Could not find all status button');
    fireEvent.click(allBtn);

    expect(screen.getByText('Starting automated SDR outreach sequence.')).toBeInTheDocument();
  });

  it('searches logs dynamically', async () => {
    render(<CampaignLogs />);

    const searchInput = screen.getByPlaceholderText('Search actions, messages, or leads...');
    fireEvent.change(searchInput, { target: { value: 'Beta' } });

    // Should show Beta Inc, but not Alpha Corp logs
    expect(screen.queryByText('Starting automated SDR outreach sequence.')).not.toBeInTheDocument();
    expect(screen.getByText('Critical pipeline error: SMTP Authentication Failed.')).toBeInTheDocument();
  });

  it('clears all logs after confirmation', async () => {
    render(<CampaignLogs />);

    const clearBtn = screen.getByRole('button', { name: /Clear All Logs/i });
    fireEvent.click(clearBtn);

    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to permanently clear all campaign logs?');
    await waitFor(() => {
      expect(getDocs).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(deleteDoc).toHaveBeenCalled();
    });
  });
});
