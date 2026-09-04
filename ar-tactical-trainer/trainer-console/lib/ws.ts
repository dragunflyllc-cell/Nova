"use client";

import { useEffect, useRef, useState } from "react";
import type { OperatorToTrainerMessage, TrainerToOperatorMessage } from "@art/shared-types";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:4100/ws";

/** Joins the relay room for `sessionId` as the trainer, exposing incoming
 * operator messages and a `send` function for trainer -> operator commands.
 * Mirrors `Networking/TrainerLinkClient.cs` on the operator-app side. */
export function useTrainerLink(sessionId: string) {
  const [messages, setMessages] = useState<OperatorToTrainerMessage[]>([]);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const socket = new WebSocket(WS_URL);
    socketRef.current = socket;

    socket.onopen = () => {
      setConnected(true);
      socket.send(JSON.stringify({ type: "JOIN", sessionId, role: "trainer" }));
    };
    socket.onclose = () => setConnected(false);
    socket.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data) as OperatorToTrainerMessage;
        setMessages((prev) => [...prev, parsed]);
      } catch {
        // ignore malformed frames
      }
    };

    return () => socket.close();
  }, [sessionId]);

  function send(message: Omit<TrainerToOperatorMessage, "sessionId" | "ts">) {
    const envelope = { ...message, sessionId, ts: Date.now() } as TrainerToOperatorMessage;
    socketRef.current?.send(JSON.stringify(envelope));
  }

  return { messages, connected, send };
}

/** Joins the relay room for `sessionId` as the operator, exposing incoming
 * trainer commands and a `send` function for operator -> trainer messages.
 * Mirrors `Networking/TrainerLinkClient.cs` on the real operator-app side —
 * this is what lets the browser-based simulator (app/sessions/[id]/simulate)
 * stand in for a physical phone during development. */
export function useOperatorLink(sessionId: string) {
  const [messages, setMessages] = useState<TrainerToOperatorMessage[]>([]);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const socket = new WebSocket(WS_URL);
    socketRef.current = socket;

    socket.onopen = () => {
      setConnected(true);
      socket.send(JSON.stringify({ type: "JOIN", sessionId, role: "operator" }));
    };
    socket.onclose = () => setConnected(false);
    socket.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data) as TrainerToOperatorMessage;
        setMessages((prev) => [...prev, parsed]);
      } catch {
        // ignore malformed frames
      }
    };

    return () => socket.close();
  }, [sessionId]);

  function send(message: Omit<OperatorToTrainerMessage, "sessionId" | "ts">) {
    const envelope = { ...message, sessionId, ts: Date.now() } as OperatorToTrainerMessage;
    socketRef.current?.send(JSON.stringify(envelope));
  }

  return { messages, connected, send };
}
