import type { FastifyInstance } from "fastify";
import type { WebSocket } from "@fastify/websocket";
import type {
  RelayMessage,
  WsJoinMessage,
  OperatorToTrainerMessage,
} from "@art/shared-types";
import { prisma } from "../lib/prisma.js";

/**
 * Trainer <-> Operator relay, scoped by sessionId. The server is a dumb
 * broadcaster plus a persister for the message types that need a durable
 * record (shots, session lifecycle). One trainer + one operator per
 * session; a second connection for the same role replaces the first
 * (covers reconnects).
 */
interface Room {
  trainer?: WebSocket;
  operator?: WebSocket;
}

const rooms = new Map<string, Room>();

function roomFor(sessionId: string): Room {
  let room = rooms.get(sessionId);
  if (!room) {
    room = {};
    rooms.set(sessionId, room);
  }
  return room;
}

function otherRole(role: "trainer" | "operator"): "trainer" | "operator" {
  return role === "trainer" ? "operator" : "trainer";
}

async function persist(message: RelayMessage): Promise<void> {
  const op = message as OperatorToTrainerMessage;
  if (op.type === "SHOT_EVENT") {
    const shot = op.payload;
    await prisma.shotEvent.create({
      data: {
        id: shot.id,
        sessionId: shot.sessionId,
        targetPlacementId: shot.targetPlacementId,
        timestampMs: BigInt(shot.timestampMs),
        hit: shot.hit,
        hitZone: shot.hitZone,
        reactionTimeMs: shot.reactionTimeMs,
        splitTimeMs: shot.splitTimeMs,
      },
    });
  } else if (op.type === "SESSION_ENDED") {
    await prisma.session.update({
      where: { id: op.sessionId },
      data: { endedAt: new Date(op.ts), outcome: op.payload.outcome },
    });
  }
}

export function registerWsRelay(app: FastifyInstance): void {
  app.get("/ws", { websocket: true }, (socket) => {
    let joinedSessionId: string | null = null;
    let joinedRole: "trainer" | "operator" | null = null;

    socket.on("message", (raw: Buffer) => {
      void (async () => {
        let parsed: WsJoinMessage | RelayMessage;
        try {
          parsed = JSON.parse(raw.toString());
        } catch {
          return;
        }

        if (parsed.type === "JOIN") {
          const join = parsed as WsJoinMessage;
          joinedSessionId = join.sessionId;
          joinedRole = join.role;
          roomFor(join.sessionId)[join.role] = socket;
          return;
        }

        if (!joinedSessionId || !joinedRole) return;
        const message = parsed as RelayMessage;

        try {
          await persist(message);
        } catch (err) {
          app.log.error({ err }, "failed to persist ws message");
        }

        const room = roomFor(joinedSessionId);
        const target = room[otherRole(joinedRole)];
        if (target && target.readyState === target.OPEN) {
          target.send(JSON.stringify(message));
        }
      })();
    });

    socket.on("close", () => {
      if (!joinedSessionId || !joinedRole) return;
      const room = rooms.get(joinedSessionId);
      if (room && room[joinedRole] === socket) {
        delete room[joinedRole];
      }
    });
  });
}
