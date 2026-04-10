import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Prospector from './Prospector';

// Mock motion/react
vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    form: ({ children, ...props }: any) => <form {...props}>{children}</form>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('Prospector', () => {
  it('renders the prospector form', () => {
    render(<Prospector />);
    expect(screen.getByText('Lead Prospector')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e.g. Tampa, FL/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e.g. Custom Cabinets/i)).toBeInTheDocument();
  });

  it('updates input values on change', () => {
    render(<Prospector />);
    const cityInput = screen.getByPlaceholderText(/e.g. Tampa, FL/i) as HTMLInputElement;
    const nicheInput = screen.getByPlaceholderText(/e.g. Custom Cabinets/i) as HTMLInputElement;

    fireEvent.change(cityInput, { target: { value: 'Tampa' } });
    fireEvent.change(nicheInput, { target: { value: 'Plumbing' } });

    expect(cityInput.value).toBe('Tampa');
    expect(nicheInput.value).toBe('Plumbing');
  });

  it('starts prospecting when form is submitted', async () => {
    render(<Prospector />);
    const cityInput = screen.getByPlaceholderText(/e.g. Tampa, FL/i);
    const nicheInput = screen.getByPlaceholderText(/e.g. Custom Cabinets/i);
    const submitButton = screen.getByRole('button', { name: /Start Hunt/i });

    fireEvent.change(cityInput, { target: { value: 'Tampa' } });
    fireEvent.change(nicheInput, { target: { value: 'Plumbing' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Hunting.../i)).toBeInTheDocument();
    });
  });
});
