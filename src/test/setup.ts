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
  onSnapshot: vi.fn().mockImplementation((_ref, onNext) => {
    // Call onNext with some mock data immediately to clear loading states and show content
    if (typeof onNext === 'function') {
      const mockDocs = [
        {
          id: '1',
          data: () => ({
            name: 'TechFlow Solutions',
            status: 'qualified',
            businessName: 'TechFlow Solutions',
            url: 'https://techflow.ai',
            timestamp: new Date().toISOString(),
            type: 'info',
            message: 'New lead identified: TechFlow Solutions',
          }),
        },
        {
          id: '2',
          data: () => ({
            name: 'GreenLeaf Organic',
            status: 'contacted',
            businessName: 'GreenLeaf Organic',
            url: 'https://greenleaf.com',
          }),
        },
      ];
      onNext({
        docs: mockDocs,
        forEach: (cb: any) => mockDocs.forEach(cb),
        empty: false,
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
    currentUser: { uid: 'test-uid' },
  }),
  signInWithPopup: vi.fn(),
  GoogleAuthProvider: class {},
  onAuthStateChanged: vi.fn().mockImplementation((_auth, callback) => {
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
    currentUser: { uid: 'test-uid' },
  },
  handleFirestoreError: vi.fn(),
  OperationType: {
    CREATE: 'create',
    UPDATE: 'update',
    DELETE: 'delete',
    LIST: 'list',
    GET: 'get',
    WRITE: 'write',
  },
}));

// Shared mock for AI
export const mockGenerateContent = vi.fn().mockResolvedValue({
  candidates: [
    {
      content: {
        parts: [{ text: '{"mock": "response"}' }],
      },
    },
  ],
});

// Mock Google GenAI
vi.mock('@google/genai', () => {
  class MockGoogleGenAi {
    models = {
      generateContent: mockGenerateContent,
    };
    chats = {
      create: vi.fn().mockReturnValue({
        sendMessage: vi.fn().mockResolvedValue({
          candidates: [
            {
              content: {
                parts: [{ text: 'mock response' }],
              },
            },
          ],
        }),
        sendMessageStream: vi.fn().mockResolvedValue([{ text: 'mock chunk' }]),
      }),
    };
  }
  return {
    GoogleGenAI: MockGoogleGenAi,
    Type: {
      OBJECT: 'OBJECT',
      ARRAY: 'ARRAY',
      STRING: 'STRING',
      NUMBER: 'NUMBER',
    },
    Modality: {
      AUDIO: 'AUDIO',
      TEXT: 'TEXT',
      IMAGE: 'IMAGE',
    },
    ThinkingLevel: {
      HIGH: 'HIGH',
      LOW: 'LOW',
      MINIMAL: 'MINIMAL',
    },
  };
});

// Mock Lucide Icons
vi.mock('lucide-react', () => ({
  Activity: () => 'Activity',
  AlertCircle: () => 'AlertCircle',
  AlertTriangle: () => 'AlertTriangle',
  ArrowUpDown: () => 'ArrowUpDown',
  ArrowUpRight: () => 'ArrowUpRight',
  BarChart3: () => 'BarChart3',
  Bell: () => 'Bell',
  Bot: () => 'Bot',
  Building2: () => 'Building2',
  Calendar: () => 'Calendar',
  Check: () => 'Check',
  CheckCircle: () => 'CheckCircle',
  CheckCircle2: () => 'CheckCircle2',
  ChevronDown: () => 'ChevronDown',
  ChevronLeft: () => 'ChevronLeft',
  ChevronRight: () => 'ChevronRight',
  Clock: () => 'Clock',
  Copy: () => 'Copy',
  Cpu: () => 'Cpu',
  DollarSign: () => 'DollarSign',
  Download: () => 'Download',
  ExternalLink: () => 'ExternalLink',
  Eye: () => 'Eye',
  Facebook: () => 'Facebook',
  Filter: () => 'Filter',
  Gauge: () => 'Gauge',
  Globe: () => 'Globe',
  Image: () => 'Image',
  Info: () => 'Info',
  Instagram: () => 'Instagram',
  Lightbulb: () => 'Lightbulb',
  Linkedin: () => 'Linkedin',
  Loader2: () => 'Loader2',
  LogOut: () => 'LogOut',
  Mail: () => 'Mail',
  MapPin: () => 'MapPin',
  Menu: () => 'Menu',
  MessageSquare: () => 'MessageSquare',
  Monitor: () => 'Monitor',
  MoreVertical: () => 'MoreVertical',
  Network: () => 'Network',
  Phone: () => 'Phone',
  Presentation: () => 'Presentation',
  Rocket: () => 'Rocket',
  Search: () => 'Search',
  Send: () => 'Send',
  Settings: () => 'Settings',
  Share2: () => 'Share2',
  Shield: () => 'Shield',
  ShieldAlert: () => 'ShieldAlert',
  ShieldCheck: () => 'ShieldCheck',
  Smartphone: () => 'Smartphone',
  Sparkles: () => 'Sparkles',
  Star: () => 'Star',
  Tablet: () => 'Tablet',
  Target: () => 'Target',
  Terminal: () => 'Terminal',
  Trash2: () => 'Trash2',
  TrendingUp: () => 'TrendingUp',
  Twitter: () => 'Twitter',
  Upload: () => 'Upload',
  User: () => 'User',
  Users: () => 'Users',
  Wand2: () => 'Wand2',
  X: () => 'X',
  XCircle: () => 'XCircle',
  Youtube: () => 'Youtube',
  Zap: () => 'Zap',
}));
