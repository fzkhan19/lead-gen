import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ImageAnalyzer from './ImageAnalyzer';
import { mockGenerateContent } from '../test/setup';
import { addDoc } from 'firebase/firestore';

// Mock motion/react
vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock Firebase
vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual('firebase/firestore');
  return {
    ...actual,
    addDoc: vi.fn(),
    collection: vi.fn(),
    serverTimestamp: vi.fn(),
  };
});

describe('ImageAnalyzer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders upload area initially', () => {
    render(<ImageAnalyzer />);
    expect(screen.getByText(/Visual Lead Extractor/i)).toBeInTheDocument();
    expect(screen.getByText(/Click to upload or drag and drop/i)).toBeInTheDocument();
  });

  it('shows analysis results after successful extraction', async () => {
    const mockResult = {
      BusinessName: 'Test Business',
      Niche: 'Plumbing',
      Address: '123 Test St, Tampa, FL',
      PhoneNumber: '123-456-7890',
      Email: 'test@test.com',
      Website: 'test.com'
    };

    mockGenerateContent.mockResolvedValue({
      text: JSON.stringify(mockResult)
    });

    render(<ImageAnalyzer />);
    
    // Simulate image upload
    const file = new File(['(⌐□_□)'], 'test.png', { type: 'image/png' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    fireEvent.change(input, { target: { files: [file] } });

    // Wait for image preview to appear (FileReader is async)
    await waitFor(() => {
      expect(screen.getByAltText('Upload')).toBeInTheDocument();
    });

    // Trigger analysis
    const analyzeButton = screen.getByRole('button', { name: /Extract Lead Data/i });
    fireEvent.click(analyzeButton);

    await waitFor(() => {
      expect(mockGenerateContent).toHaveBeenCalled();
    }, { timeout: 3000 });
  });
});
