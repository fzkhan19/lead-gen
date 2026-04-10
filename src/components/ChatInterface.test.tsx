import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ChatInterface from './ChatInterface';
import { mockGenerateContent } from '../test/setup';

// Mock motion/react
vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('ChatInterface', () => {
  it('renders initial model message', () => {
    render(<ChatInterface />);
    expect(screen.getByText(/Lead-Generator is online/i)).toBeInTheDocument();
  });

  it('updates input value on change', () => {
    render(<ChatInterface />);
    const input = screen.getByPlaceholderText(/Give me a city and a niche, Boss.../i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Tampa Plumbing' } });
    expect(input.value).toBe('Tampa Plumbing');
  });

  it('sends a message and displays the response', async () => {
    render(<ChatInterface />);
    const input = screen.getByPlaceholderText(/Give me a city and a niche, Boss.../i);
    const sendButton = screen.getByRole('button');

    fireEvent.change(input, { target: { value: 'Tampa Plumbing' } });
    fireEvent.click(sendButton);

    expect(screen.getByText('Tampa Plumbing')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('mock response')).toBeInTheDocument();
    });
  });
});
