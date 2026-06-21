import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { WS_BASE_URL } from '../api/config';
import { ChatMessage } from '../api/types';
import { navigationRef } from '../navigation/navigationRef';
import { useAuth } from './AuthContext';

interface IncomingCall {
  matchId: string;
  roomName: string;
  callerName: string;
}

interface NewMessageEvent {
  matchId: string;
  message: ChatMessage;
}

interface IncomingCallState {
  incomingCall: IncomingCall | null;
  declinedMatchId: string | null;
  lastMessage: NewMessageEvent | null;
  accept: () => void;
  decline: () => void;
  acknowledgeDecline: () => void;
}

const IncomingCallContext = createContext<IncomingCallState | undefined>(undefined);

const RECONNECT_DELAY_MS = 3000;

/**
 * Keeps a persistent websocket open to /ws/calls (see backend/src/routers/calls.py)
 * — a generic per-user push channel, not just for calls anymore: it also
 * carries "new_message" chat events (see backend/src/routers/matches.py
 * send_message). One socket per user for all realtime notifications, rather
 * than a separate one per feature. The "virtual cheers" ring needs to reach
 * the other person regardless of which screen they're on — see CLAUDE.md:
 * video-before-meeting is a safety primitive, so it needs to actually notify
 * the callee, not just sit there waiting to be discovered.
 */
export function IncomingCallProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [declinedMatchId, setDeclinedMatchId] = useState<string | null>(null);
  const [lastMessage, setLastMessage] = useState<NewMessageEvent | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!token) {
      wsRef.current?.close();
      wsRef.current = null;
      return;
    }

    let cancelled = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;

    const connect = () => {
      const ws = new WebSocket(`${WS_BASE_URL}/ws/calls?token=${token}`);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'incoming_call') {
            setIncomingCall({
              matchId: data.match_id,
              roomName: data.room_name,
              callerName: data.caller_name,
            });
          } else if (data.type === 'call_declined') {
            setDeclinedMatchId(data.match_id);
          } else if (data.type === 'new_message') {
            setLastMessage({ matchId: data.match_id, message: data.message });
          }
        } catch {
          // ignore malformed messages
        }
      };

      ws.onclose = () => {
        if (!cancelled) reconnectTimer = setTimeout(connect, RECONNECT_DELAY_MS);
      };
    };

    connect();

    return () => {
      cancelled = true;
      clearTimeout(reconnectTimer);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [token]);

  const value = useMemo<IncomingCallState>(
    () => ({
      incomingCall,
      declinedMatchId,
      lastMessage,
      accept: () => {
        if (!incomingCall) return;
        const { matchId, roomName } = incomingCall;
        setIncomingCall(null);
        if (navigationRef.isReady()) {
          navigationRef.navigate('VirtualCheers', { matchId, roomName });
        }
      },
      decline: () => {
        if (incomingCall && wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'decline', match_id: incomingCall.matchId }));
        }
        setIncomingCall(null);
      },
      acknowledgeDecline: () => setDeclinedMatchId(null),
    }),
    [incomingCall, declinedMatchId, lastMessage],
  );

  return <IncomingCallContext.Provider value={value}>{children}</IncomingCallContext.Provider>;
}

export function useIncomingCall(): IncomingCallState {
  const ctx = useContext(IncomingCallContext);
  if (!ctx) throw new Error('useIncomingCall must be used within IncomingCallProvider');
  return ctx;
}
