import { describe, it, expect } from 'vitest';
import { getBestArchetype, DESIGN_ARCHETYPES } from './designEngine';

describe('designEngine', () => {
  it('should return tech-forward for tech-related keywords', () => {
    const archetype = getBestArchetype('Build a software platform', 'Future of tech');
    expect(archetype.id).toBe('tech-forward');
  });

  it('should return luxury for premium-related keywords', () => {
    const archetype = getBestArchetype('Exclusive jewelry brand', 'Premium luxury experience');
    expect(archetype.id).toBe('luxury');
  });

  it('should return organic for nature-related keywords', () => {
    const archetype = getBestArchetype('Organic farm products', 'Natural and green living');
    expect(archetype.id).toBe('organic');
  });

  it('should return playful for fun-related keywords', () => {
    const archetype = getBestArchetype('Fun toys for kids', 'Happy and energetic brand');
    expect(archetype.id).toBe('playful');
  });

  it('should return minimalist for simple-related keywords', () => {
    const archetype = getBestArchetype('Simple minimalist portfolio', 'Clean and simple design');
    expect(archetype.id).toBe('minimalist');
  });

  it('should return editorial for magazine-related keywords', () => {
    const archetype = getBestArchetype('Online news magazine', 'Read the latest stories');
    expect(archetype.id).toBe('editorial');
  });

  it('should return bold for impact-related keywords', () => {
    const archetype = getBestArchetype('Bold and high-impact campaign', 'Loud and proud brand');
    expect(archetype.id).toBe('bold');
  });

  it('should return a valid archetype for unknown keywords', () => {
    const archetype = getBestArchetype('Something completely different', 'No keywords here');
    expect(DESIGN_ARCHETYPES).toContainEqual(archetype);
  });
});
