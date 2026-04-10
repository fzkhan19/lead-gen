import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import WebsitePreview from './WebsitePreview';

// Mock motion/react
vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('WebsitePreview', () => {
  const mockHtml = '<html><body><h1>Test Website</h1></body></html>';
  const mockBusinessName = 'Test Business';
  const mockOnClose = vi.fn();

  it('renders the toolbar with business name', () => {
    render(<WebsitePreview html={mockHtml} businessName={mockBusinessName} onClose={mockOnClose} />);
    expect(screen.getByText(/Test Business - AI Mockup/i)).toBeInTheDocument();
  });

  it('calls onClose when the close button is clicked', () => {
    render(<WebsitePreview html={mockHtml} businessName={mockBusinessName} onClose={mockOnClose} />);
    const xButton = screen.getByRole('button', { name: /X/i });
    fireEvent.click(xButton);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('changes view mode when clicking device icons', () => {
    render(<WebsitePreview html={mockHtml} businessName={mockBusinessName} onClose={mockOnClose} />);
    const monitorButton = screen.getByRole('button', { name: /Monitor/i });
    const tabletButton = screen.getByRole('button', { name: /Tablet/i });
    const smartphoneButton = screen.getByRole('button', { name: /Smartphone/i });
    
    fireEvent.click(tabletButton);
    fireEvent.click(smartphoneButton);
    fireEvent.click(monitorButton);

    expect(screen.getByTitle(/AI Generated Website/i)).toBeInTheDocument();
  });
});
