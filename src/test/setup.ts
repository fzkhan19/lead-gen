import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock scrollIntoView for JSDOM
window.HTMLElement.prototype.scrollIntoView = vi.fn();

// Mock Firebase Firestore
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  collection: vi.fn(),
  doc: vi.fn(),
  getDocs: vi.fn().mockResolvedValue({ docs: [] }),
  getDoc: vi.fn().mockResolvedValue({ exists: () => false }),
  setDoc: vi.fn().mockResolvedValue({}),
  updateDoc: vi.fn().mockResolvedValue({}),
  deleteDoc: vi.fn().mockResolvedValue({}),
  onSnapshot: vi.fn().mockImplementation((ref, onNext) => {
    // Call onNext with some mock data immediately to clear loading states and show content
    if (typeof onNext === 'function') {
      const mockDocs = [
        { id: '1', data: () => ({ name: 'TechFlow Solutions', status: 'qualified', businessName: 'TechFlow Solutions', url: 'https://techflow.ai', timestamp: new Date().toISOString(), type: 'info', message: 'New lead identified: TechFlow Solutions' }) },
        { id: '2', data: () => ({ name: 'GreenLeaf Organic', status: 'contacted', businessName: 'GreenLeaf Organic', url: 'https://greenleaf.com' }) }
      ];
      onNext({
        docs: mockDocs,
        forEach: (cb: any) => mockDocs.forEach(cb),
        empty: false
      });
    }
    return () => {};
  }),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  addDoc: vi.fn().mockResolvedValue({ id: 'test-id' }),
  serverTimestamp: vi.fn(),
}));

// Mock Firebase Auth
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn().mockReturnValue({
    currentUser: { uid: 'test-uid' }
  }),
  signInWithPopup: vi.fn(),
  GoogleAuthProvider: class {},
  onAuthStateChanged: vi.fn().mockImplementation((auth, callback) => {
    callback({ uid: 'test-uid' });
    return () => {};
  }),
}));

// Mock Firebase App
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(),
}));

// Mock local Firebase config
vi.mock('../firebase', () => ({
  db: { type: 'firestore' },
  auth: {
    currentUser: { uid: 'test-uid' }
  },
  handleFirestoreError: vi.fn(),
  OperationType: {
    CREATE: 'create',
    UPDATE: 'update',
    DELETE: 'delete',
    LIST: 'list',
    GET: 'get',
    WRITE: 'write',
  }
}));

// Shared mock for AI
export const mockGenerateContent = vi.fn().mockResolvedValue({
  candidates: [{
    content: {
      parts: [{ text: '{"mock": "response"}' }]
    }
  }]
});

// Mock Google GenAI
vi.mock('@google/genai', () => {
  class MockGoogleGenAI {
    models = {
      generateContent: mockGenerateContent
    };
    chats = {
      create: vi.fn().mockReturnValue({
        sendMessage: vi.fn().mockResolvedValue({
          candidates: [{
            content: {
              parts: [{ text: 'mock response' }]
            }
          }]
        }),
        sendMessageStream: vi.fn().mockResolvedValue([{ text: 'mock chunk' }])
      })
    };
  }
  return {
    GoogleGenAI: MockGoogleGenAI,
    Type: {
      OBJECT: 'OBJECT',
      ARRAY: 'ARRAY',
      STRING: 'STRING',
      NUMBER: 'NUMBER'
    },
    Modality: {
      AUDIO: 'AUDIO',
      TEXT: 'TEXT',
      IMAGE: 'IMAGE'
    },
    ThinkingLevel: {
      HIGH: 'HIGH',
      LOW: 'LOW',
      MINIMAL: 'MINIMAL'
    }
  };
});

// Mock Lucide Icons
vi.mock('lucide-react', () => ({
  Search: () => 'Search',
  MapPin: () => 'MapPin',
  Loader2: () => 'Loader2',
  CheckCircle2: () => 'CheckCircle2',
  AlertCircle: () => 'AlertCircle',
  Globe: () => 'Globe',
  Phone: () => 'Phone',
  Mail: () => 'Mail',
  ExternalLink: () => 'ExternalLink',
  Zap: () => 'Zap',
  Users: () => 'Users',
  Terminal: () => 'Terminal',
  ShieldCheck: () => 'ShieldCheck',
  Activity: () => 'Activity',
  Rocket: () => 'Rocket',
  X: () => 'X',
  Filter: () => 'Filter',
  Download: () => 'Download',
  Trash2: () => 'Trash2',
  Eye: () => 'Eye',
  Send: () => 'Send',
  Sparkles: () => 'Sparkles',
  DollarSign: () => 'DollarSign',
  Facebook: () => 'Facebook',
  Instagram: () => 'Instagram',
  Linkedin: () => 'Linkedin',
  Twitter: () => 'Twitter',
  Youtube: () => 'Youtube',
  Star: () => 'Star',
  Calendar: () => 'Calendar',
  Building2: () => 'Building2',
  MoreVertical: () => 'MoreVertical',
  TrendingUp: () => 'TrendingUp',
  CheckCircle: () => 'CheckCircle',
  Clock: () => 'Clock',
  ArrowUpRight: () => 'ArrowUpRight',
  Target: () => 'Target',
  Bot: () => 'Bot',
  User: () => 'User',
  Upload: () => 'Upload',
  Image: () => 'Image',
  Monitor: () => 'Monitor',
  Smartphone: () => 'Smartphone',
  Tablet: () => 'Tablet',
  MessageSquare: () => 'MessageSquare',
  BarChart3: () => 'BarChart3',
  Settings: () => 'Settings',
  LogOut: () => 'LogOut',
  Menu: () => 'Menu',
  ChevronRight: () => 'ChevronRight',
  ChevronLeft: () => 'ChevronLeft',
  Copy: () => 'Copy',
  Check: () => 'Check',
  Share2: () => 'Share2',
  Bell: () => 'Bell',
  Wand2: () => 'Wand2',
}));
