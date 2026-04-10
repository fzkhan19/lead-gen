export type DesignArchetype = 
  | 'minimalist' 
  | 'brutalist' 
  | 'corporate' 
  | 'playful' 
  | 'tech-forward' 
  | 'editorial' 
  | 'luxury' 
  | 'organic' 
  | 'bold' 
  | 'retro';

export interface DesignProfile {
  id: DesignArchetype;
  name: string;
  description: string;
  prompt: string;
}

export const DESIGN_ARCHETYPES: DesignProfile[] = [
  {
    id: 'minimalist',
    name: 'The Minimalist',
    description: 'Clean, spacious, and focused on essential content.',
    prompt: 'Use a minimalist design with lots of white space, thin typography (Inter), and a monochromatic color palette. Focus on high-quality imagery and clear call-to-actions.'
  },
  {
    id: 'brutalist',
    name: 'The Brutalist',
    description: 'Raw, bold, and unapologetically functional.',
    prompt: 'Use a brutalist aesthetic with high-contrast borders, bold typography (Space Grotesk), and a limited but striking color palette (e.g., black, white, and a single neon accent). Use grid-based layouts.'
  },
  {
    id: 'corporate',
    name: 'The Corporate',
    description: 'Professional, trustworthy, and structured.',
    prompt: 'Use a professional corporate design with a structured layout, blue/gray color palette, and clear hierarchy. Use rounded corners and subtle shadows.'
  },
  {
    id: 'playful',
    name: 'The Playful',
    description: 'Vibrant, energetic, and friendly.',
    prompt: 'Use a playful design with vibrant colors, rounded shapes, and friendly typography. Use micro-animations and organic shapes.'
  },
  {
    id: 'tech-forward',
    name: 'The Tech-Forward',
    description: 'Futuristic, dark, and high-tech.',
    prompt: 'Use a dark, tech-forward design with glassmorphism effects, neon accents (blue/purple), and monospaced typography for data points. Use subtle grid backgrounds.'
  },
  {
    id: 'editorial',
    name: 'The Editorial',
    description: 'Sophisticated, serif-heavy, and elegant.',
    prompt: 'Use an editorial design with elegant serif typography, a sophisticated color palette (creams, deep greens), and an asymmetrical layout that feels like a high-end magazine.'
  },
  {
    id: 'luxury',
    name: 'The Luxury',
    description: 'Premium, gold-accented, and refined.',
    prompt: 'Use a luxury design with a dark background, gold or silver accents, and refined serif typography. Use high-end photography and minimal text.'
  },
  {
    id: 'organic',
    name: 'The Organic',
    description: 'Natural, soft, and earth-toned.',
    prompt: 'Use an organic design with soft earth tones, rounded corners, and natural textures. Use flowing layouts and botanical-inspired elements.'
  },
  {
    id: 'bold',
    name: 'The Bold',
    description: 'High-impact, large type, and loud.',
    prompt: 'Use a bold design with massive typography, high-contrast colors, and full-bleed imagery. Every element should feel high-impact.'
  },
  {
    id: 'retro',
    name: 'The Retro',
    description: 'Vintage-inspired with a modern twist.',
    prompt: 'Use a retro design with vintage-inspired colors (e.g., burnt orange, mustard yellow), grainy textures, and 70s-style typography.'
  }
];

export function getBestArchetype(mission: string, goals: string): DesignProfile {
  // Simple keyword matching for now, but could be more sophisticated
  const text = (mission + ' ' + goals).toLowerCase();
  
  if (text.includes('tech') || text.includes('software') || text.includes('future')) return DESIGN_ARCHETYPES.find(a => a.id === 'tech-forward')!;
  if (text.includes('luxury') || text.includes('premium') || text.includes('exclusive')) return DESIGN_ARCHETYPES.find(a => a.id === 'luxury')!;
  if (text.includes('nature') || text.includes('organic') || text.includes('green')) return DESIGN_ARCHETYPES.find(a => a.id === 'organic')!;
  if (text.includes('fun') || text.includes('kids') || text.includes('happy')) return DESIGN_ARCHETYPES.find(a => a.id === 'playful')!;
  if (text.includes('minimal') || text.includes('simple') || text.includes('clean')) return DESIGN_ARCHETYPES.find(a => a.id === 'minimalist')!;
  if (text.includes('news') || text.includes('magazine') || text.includes('read')) return DESIGN_ARCHETYPES.find(a => a.id === 'editorial')!;
  if (text.includes('bold') || text.includes('impact') || text.includes('loud')) return DESIGN_ARCHETYPES.find(a => a.id === 'bold')!;
  
  // Default to corporate or random
  return DESIGN_ARCHETYPES[Math.floor(Math.random() * DESIGN_ARCHETYPES.length)];
}
