import { describe, it, expect, vi } from 'vitest';
import { performOSINT } from './osintService';
import { mockGenerateContent } from '../test/setup';

describe('osintService', () => {
  it('should perform OSINT and return structured data', async () => {
    const mockResult = {
      socialMedia: { facebook: 'fb.com/test' },
      contactInfo: { emails: ['test@test.com'], phones: ['1234567890'] },
      businessDetails: { website: 'test.com' },
      summary: 'Test summary'
    };

    mockGenerateContent.mockResolvedValue({
      candidates: [{
        content: {
          parts: [{ text: JSON.stringify(mockResult) }]
        }
      }]
    });

    const result = await performOSINT('Test Business', 'Test City', 'Test Niche');

    expect(result).toEqual(mockResult);
  });

  it('should throw an error if AI response is invalid JSON', async () => {
    mockGenerateContent.mockResolvedValue({
      candidates: [{
        content: {
          parts: [{ text: 'invalid json' }]
        }
      }]
    });

    await expect(performOSINT('Test Business', 'Test City', 'Test Niche'))
      .rejects.toThrow('OSINT data extraction failed.');
  });
});
