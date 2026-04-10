import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LeadsTable from './LeadsTable';
import { onSnapshot } from 'firebase/firestore';
import { performOSINT } from '../services/osintService';

// Mock osintService
vi.mock('../services/osintService', () => ({
  performOSINT: vi.fn().mockResolvedValue({
    socialMedia: { facebook: 'fb.com/test' },
    contactInfo: { emails: ['test@test.com'] },
    businessDetails: { website: 'test.com' },
    summary: 'Test summary'
  })
}));

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
    doc: vi.fn(),
    updateDoc: vi.fn(),
    deleteDoc: vi.fn(),
  };
});

// Mock motion/react to avoid animation issues in tests
vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    tr: ({ children, ...props }: any) => <tr {...props}>{children}</tr>,
    td: ({ children, ...props }: any) => <td {...props}>{children}</td>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('LeadsTable', () => {
  const mockLeads = [
    {
      id: '1',
      businessName: 'Test Business 1',
      city: 'Tampa',
      niche: 'Plumbing',
      status: 'qualified',
      createdAt: { toDate: () => new Date() },
      uid: 'test-uid'
    },
    {
      id: '2',
      businessName: 'Another Business',
      city: 'Miami',
      niche: 'Roofing',
      status: 'outreach_sent',
      createdAt: { toDate: () => new Date() },
      uid: 'test-uid'
    }
  ];

  beforeEach(() => {
    vi.mocked(onSnapshot).mockImplementation((q: any, callback: any) => {
      callback({
        docs: mockLeads.map(lead => ({
          id: lead.id,
          data: () => lead
        }))
      });
      return () => {};
    });
  });

  it('renders the leads table with data', () => {
    render(<LeadsTable />);
    expect(screen.getByText('Test Business 1')).toBeInTheDocument();
    expect(screen.getByText('Another Business')).toBeInTheDocument();
  });

  it('filters leads by search query', () => {
    render(<LeadsTable />);
    const searchInput = screen.getByPlaceholderText(/Search Intelligence.../i);
    
    fireEvent.change(searchInput, { target: { value: 'Tampa' } });
    
    expect(screen.getByText('Test Business 1')).toBeInTheDocument();
    expect(screen.queryByText('Another Business')).not.toBeInTheDocument();
  });

  it('opens the lead detail modal when clicking the view button', () => {
    render(<LeadsTable />);
    const viewButton = screen.getAllByTitle(/View Entity Profile/i)[0];
    fireEvent.click(viewButton);
    
    expect(screen.getByText(/Contact Matrix/i)).toBeInTheDocument();
  });

  it('triggers OSINT enrichment when clicking the enrich button', async () => {
    render(<LeadsTable />);
    const enrichButton = screen.getAllByTitle(/Enrich Data/i)[0];
    fireEvent.click(enrichButton);
    
    await waitFor(() => {
      expect(performOSINT).toHaveBeenCalled();
    });
  });
});
