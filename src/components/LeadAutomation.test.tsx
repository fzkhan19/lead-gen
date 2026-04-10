import { render, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import LeadAutomation from './LeadAutomation';
import { onSnapshot, updateDoc } from 'firebase/firestore';

describe('LeadAutomation', () => {
  it('triggers automation when a mockup is ready', async () => {
    const mockLead = {
      id: 'lead-123',
      businessName: 'Test Business',
      niche: 'Plumbing',
      status: 'mockup_ready',
      uid: 'test-uid'
    };

    // Mock onSnapshot to return our test lead
    (onSnapshot as any).mockImplementationOnce((query: any, callback: any) => {
      callback({
        docs: [{
          id: mockLead.id,
          data: () => mockLead
        }],
        forEach: (cb: any) => cb({ id: mockLead.id, data: () => mockLead })
      });
      return () => {};
    });

    render(<LeadAutomation />);

    await waitFor(() => {
      expect(updateDoc).toHaveBeenCalled();
    });
  });
});
