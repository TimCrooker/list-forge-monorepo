import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import { useChatContext, ChatContextData } from '../hooks/useChatContext';
import {
  useCreateGeneralChatSessionMutation,
  useGetChatSessionsQuery,
} from '@listforge/api-rtk';

interface ChatContextType {
  isOpen: boolean;
  toggleChat: () => void;
  openChat: () => void;
  closeChat: () => void;

  // Session state
  sessionId: string | null;
  sessionType: 'item_scoped' | 'general' | 'dashboard' | 'review_queue' | 'custom' | null;
  sessionTitle: string | null;

  // Current page context
  currentContext: ChatContextData | null;

  // Session switching
  switchToItemSession: (itemId: string) => Promise<void>;
  switchToGeneralSession: () => Promise<void>;
  switchToDashboardSession: () => Promise<void>;
  startNewConversation: (type: string, title?: string) => Promise<void>;
  switchToSession: (sessionId: string) => void;

  // Transition state
  isTransitioning: boolean;
  pendingContextSwitch: { from: string; to: string } | null;
  confirmContextSwitch: () => void;
  cancelContextSwitch: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const CHAT_SIDEBAR_STORAGE_KEY = 'chat-sidebar-collapsed';
const CHAT_SESSION_STORAGE_KEY = 'chat-current-session';

interface StoredSession {
  sessionId: string;
  sessionType: string;
  sessionTitle: string;
}

// Helper to restore session from localStorage
function restoreSessionFromStorage(): StoredSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(CHAT_SESSION_STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as StoredSession;
  } catch (error) {
    console.warn('Failed to restore chat session from localStorage:', error);
    return null;
  }
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window === 'undefined') return false;
    const stored = localStorage.getItem(CHAT_SIDEBAR_STORAGE_KEY);
    return stored !== 'true'; // 'true' means collapsed
  });

  // Current page context (auto-detected from route)
  const currentContext = useChatContext();

  // Session state
  const [sessionId, setSessionId] = useState<string | null>(() => {
    const restored = restoreSessionFromStorage();
    return restored?.sessionId || null;
  });
  const [sessionType, setSessionType] = useState<string | null>(() => {
    const restored = restoreSessionFromStorage();
    return restored?.sessionType || null;
  });
  const [sessionTitle, setSessionTitle] = useState<string | null>(() => {
    const restored = restoreSessionFromStorage();
    return restored?.sessionTitle || null;
  });

  // Transition state
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [pendingContextSwitch, setPendingContextSwitch] = useState<{
    from: string;
    to: string;
  } | null>(null);

  // Track previous context to detect changes
  const prevContextRef = useRef<ChatContextData | null>(null);

  // API mutations
  const [createSession] = useCreateGeneralChatSessionMutation();
  const { data: sessionsData } = useGetChatSessionsQuery({ limit: 10 });

  // Persist sidebar state
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(CHAT_SIDEBAR_STORAGE_KEY, String(!isOpen));
    }
  }, [isOpen]);

  // Persist current session
  useEffect(() => {
    if (typeof window !== 'undefined' && sessionId && sessionType) {
      const sessionData: StoredSession = {
        sessionId,
        sessionType,
        sessionTitle: sessionTitle || '',
      };
      localStorage.setItem(CHAT_SESSION_STORAGE_KEY, JSON.stringify(sessionData));
    }
  }, [sessionId, sessionType, sessionTitle]);

  // Detect context changes and prompt user to switch
  useEffect(() => {
    // Skip if chat is closed, no session, or transitioning
    if (!isOpen || !sessionId || isTransitioning) return;

    // Skip on first render
    if (!prevContextRef.current) {
      prevContextRef.current = currentContext;
      return;
    }

    const prev = prevContextRef.current;
    const curr = currentContext;

    // Check if context changed significantly
    const itemIdChanged = curr.itemId !== prev.itemId && curr.itemId;
    const movedToDashboard = curr.pageType === 'dashboard' && prev.pageType !== 'dashboard';
    const leftItemPage = !curr.itemId && prev.itemId && sessionType === 'item_scoped';

    if (itemIdChanged || movedToDashboard || leftItemPage) {
      setPendingContextSwitch({
        from: sessionTitle || 'Current conversation',
        to: determineTargetSessionTitle(curr),
      });
    }

    prevContextRef.current = curr;
  }, [currentContext, sessionId, sessionType, sessionTitle, isOpen, isTransitioning]);

  // Determine what the target session would be called
  const determineTargetSessionTitle = (context: ChatContextData): string => {
    if (context.itemId) return 'Item conversation';
    if (context.pageType === 'dashboard') return 'Dashboard Questions';
    return 'General Conversation';
  };

  // Session switching functions
  const switchToItemSession = useCallback(async (itemId: string) => {
    setIsTransitioning(true);
    try {
      const result = await createSession({
        conversationType: 'item_scoped',
        itemId,
      }).unwrap();

      setSessionId(result.session.id);
      setSessionType(result.session.conversationType);
      setSessionTitle(result.session.title);
    } catch (error) {
      console.error('Failed to switch to item session:', error);
    } finally {
      setIsTransitioning(false);
    }
  }, [createSession]);

  const switchToGeneralSession = useCallback(async () => {
    setIsTransitioning(true);
    try {
      // Look for existing general session
      const existingGeneral = sessionsData?.sessions?.find(
        (s) => s.conversationType === 'general'
      );

      if (existingGeneral) {
        setSessionId(existingGeneral.id);
        setSessionType(existingGeneral.conversationType);
        setSessionTitle(existingGeneral.title);
      } else {
        const result = await createSession({
          conversationType: 'general',
        }).unwrap();

        setSessionId(result.session.id);
        setSessionType(result.session.conversationType);
        setSessionTitle(result.session.title);
      }
    } catch (error) {
      console.error('Failed to switch to general session:', error);
    } finally {
      setIsTransitioning(false);
    }
  }, [createSession, sessionsData]);

  const switchToDashboardSession = useCallback(async () => {
    setIsTransitioning(true);
    try {
      // Look for existing dashboard session
      const existingDashboard = sessionsData?.sessions?.find(
        (s) => s.conversationType === 'dashboard'
      );

      if (existingDashboard) {
        setSessionId(existingDashboard.id);
        setSessionType(existingDashboard.conversationType);
        setSessionTitle(existingDashboard.title);
      } else {
        const result = await createSession({
          conversationType: 'dashboard',
        }).unwrap();

        setSessionId(result.session.id);
        setSessionType(result.session.conversationType);
        setSessionTitle(result.session.title);
      }
    } catch (error) {
      console.error('Failed to switch to dashboard session:', error);
    } finally {
      setIsTransitioning(false);
    }
  }, [createSession, sessionsData]);

  const startNewConversation = useCallback(async (type: string, title?: string) => {
    setIsTransitioning(true);
    try {
      const result = await createSession({
        conversationType: type as any,
        title,
      }).unwrap();

      setSessionId(result.session.id);
      setSessionType(result.session.conversationType);
      setSessionTitle(result.session.title);
    } catch (error) {
      console.error('Failed to start new conversation:', error);
    } finally {
      setIsTransitioning(false);
    }
  }, [createSession]);

  const switchToSession = useCallback((newSessionId: string) => {
    const session = sessionsData?.sessions?.find((s) => s.id === newSessionId);
    if (session) {
      setSessionId(session.id);
      setSessionType(session.conversationType);
      setSessionTitle(session.title);
    }
  }, [sessionsData]);

  const confirmContextSwitch = useCallback(async () => {
    setIsTransitioning(true);
    try {
      if (currentContext.itemId) {
        await switchToItemSession(currentContext.itemId);
      } else if (currentContext.pageType === 'dashboard') {
        await switchToDashboardSession();
      } else {
        await switchToGeneralSession();
      }
    } finally {
      setPendingContextSwitch(null);
      setIsTransitioning(false);
    }
  }, [currentContext, switchToItemSession, switchToDashboardSession, switchToGeneralSession]);

  const cancelContextSwitch = useCallback(() => {
    setPendingContextSwitch(null);
  }, []);

  const toggleChat = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const openChat = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeChat = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <ChatContext.Provider
      value={{
        isOpen,
        toggleChat,
        openChat,
        closeChat,
        sessionId,
        sessionType: sessionType as any,
        sessionTitle,
        currentContext,
        switchToItemSession,
        switchToGeneralSession,
        switchToDashboardSession,
        startNewConversation,
        switchToSession,
        isTransitioning,
        pendingContextSwitch,
        confirmContextSwitch,
        cancelContextSwitch,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (ctx === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return ctx;
}
