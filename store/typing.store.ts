"use client";

import { useCallback, useSyncExternalStore } from "react";

export interface TypingStatus {
  isTyping: boolean;
  role: "bot" | "user";
  timestamp: number;
}

const typingMap = new Map<string, TypingStatus>();
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch {
      // Ignore listener errors
    }
  });
}

export const typingManager = {
  getTyping(conversationId?: string | null): TypingStatus | undefined {
    if (!conversationId) return undefined;
    return typingMap.get(conversationId);
  },

  setTyping(conversationId?: string | null, isTyping = false, role: "bot" | "user" = "bot"): void {
    if (!conversationId) return;

    if (!isTyping) {
      if (typingMap.has(conversationId)) {
        typingMap.delete(conversationId);
        notifyListeners();
      }
      return;
    }

    typingMap.set(conversationId, {
      isTyping: true,
      role,
      timestamp: Date.now(),
    });
    notifyListeners();
  },

  clearTyping(conversationId?: string | null): void {
    if (!conversationId) return;
    if (typingMap.has(conversationId)) {
      typingMap.delete(conversationId);
      notifyListeners();
    }
  },

  subscribe(callback: () => void): () => void {
    listeners.add(callback);
    return () => {
      listeners.delete(callback);
    };
  },
};

/**
 * React hook to safely subscribe to real-time typing indicators for a specific conversation.
 */
export function useTypingIndicator(conversationId?: string | null): TypingStatus | undefined {
  const subscribe = useCallback(
    (callback: () => void) => typingManager.subscribe(callback),
    []
  );

  const getSnapshot = useCallback(
    () => typingManager.getTyping(conversationId),
    [conversationId]
  );

  return useSyncExternalStore(subscribe, getSnapshot, () => undefined);
}
