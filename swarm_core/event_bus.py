"""
Swarm EventBus — Redis Streams backend (replaces fakeredis).

Connects to the same Redis instance used by Node.js layer.
Stream keys match the EventBus in src/lib/redis.ts.
"""
import json
import os
import time
import uuid
from typing import Any

# ─── Redis connection ────────────────────────────────────────────
# Uses the same Redis as the Node.js layer (127.0.0.1:6379 default)

REDIS_HOST = os.environ.get("REDIS_HOST", "127.0.0.1")
REDIS_PORT = int(os.environ.get("REDIS_PORT", "6379"))

try:
    import redis as redis_lib

    r = redis_lib.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)
    r.ping()
    REDIS_AVAILABLE = True
    print(f"[swarm-eventbus] Redis connected {REDIS_HOST}:{REDIS_PORT}")
except Exception as e:
    REDIS_AVAILABLE = False
    print(f"[swarm-eventbus] Redis unavailable: {e}. Using fakeredis fallback.")


# ─── Stream names ─────────────────────────────────────────────────

STREAMS = {
    "swarm:events": "swarm:events",       # global event stream
    "swarm:global": "swarm:global",       # all messages
    "swarm:heartbeat": "swarm:heartbeat", # agent heartbeats
    "swarm:insights": "swarm:insights",   # knowledge mesh insights
}


def _fake_publish(stream: str, data: dict) -> dict:
    """Fallback when Redis is unavailable — in-memory only."""
    msg = {**data, "timestamp": time.strftime("%H:%M:%S"), "_fake": True}
    # Store in module-level dict for testability
    if not hasattr(_fake_publish, "store"):
        _fake_publish.store = {}
    if stream not in _fake_publish.store:
        _fake_publish.store[stream] = []
    _fake_publish.store[stream].append(msg)
    if len(_fake_publish.store[stream]) > 100:
        _fake_publish.store[stream] = _fake_publish.store[stream][-100:]
    return msg


# ─── Public API ───────────────────────────────────────────────────

def publish(stream: str, data: dict) -> dict:
    """Publish a message to a Redis stream."""
    payload = json.dumps({**data, "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ")})

    if REDIS_AVAILABLE:
        msg_id = r.xadd(stream, {"data": payload}, maxlen=10000, approximate=True)
        r.xadd(STREAMS["swarm:global"], {"channel": stream, "data": payload},
               maxlen=10000, approximate=True)
    else:
        msg_id = str(uuid.uuid4())

    return {"stream": stream, "id": msg_id, "data": data}


def read_messages(
    stream: str, count: int = 20, block_ms: int = 1000
) -> list[dict]:
    """Read recent messages from a stream."""
    if REDIS_AVAILABLE:
        msgs = r.xrevrange(stream, "+", "-", count=count)
        results = []
        for msg_id, fields in msgs:
            entry = {"id": msg_id, "stream": stream}
            if "data" in fields:
                try:
                    entry["parsed"] = json.loads(fields["data"])
                except json.JSONDecodeError:
                    entry["raw"] = fields["data"]
            results.append(entry)
        return results
    else:
        store = getattr(_fake_publish, "store", {}).get(stream, [])
        return [{"id": str(uuid.uuid4()), "stream": stream, "parsed": m}
                for m in store[-count:]]


def create_consumer_group(stream: str, group: str) -> bool:
    """Create a consumer group for load-balanced consumption."""
    if not REDIS_AVAILABLE:
        return True
    try:
        r.xgroup_create(stream, group, id="0", mkstream=True)
        return True
    except redis_lib.exceptions.ResponseError as e:
        if "BUSYGROUP" in str(e):
            return True  # group already exists
        return False


def read_group(
    group: str, consumer: str, streams: list[str], count: int = 10, block: int = 2000
) -> list[dict]:
    """Read messages as part of a consumer group."""
    if not REDIS_AVAILABLE:
        return []

    results = r.xreadgroup(group, consumer, {s: ">" for s in streams},
                           count=count, block=block)

    if not results:
        return []

    parsed = []
    for stream, messages in results:
        for msg_id, fields in messages:
            entry = {"id": msg_id, "stream": stream}
            if "data" in fields:
                try:
                    entry["parsed"] = json.loads(fields["data"])
                except json.JSONDecodeError:
                    entry["raw"] = fields["data"]
            parsed.append(entry)
    return parsed


def ack(stream: str, group: str, msg_id: str) -> bool:
    """Acknowledge a message after processing."""
    if not REDIS_AVAILABLE:
        return True
    return r.xack(stream, group, msg_id) > 0


def get_stream_length(stream: str) -> int:
    """Get the number of messages in a stream."""
    if not REDIS_AVAILABLE:
        return len(getattr(_fake_publish, "store", {}).get(stream, []))
    return r.xlen(stream)


def health_check() -> dict:
    """Return the health status of the event bus."""
    if REDIS_AVAILABLE:
        try:
            r.ping()
            return {
                "status": "connected",
                "redis": f"{REDIS_HOST}:{REDIS_PORT}",
                "streams": {k: get_stream_length(v) for k, v in STREAMS.items()},
            }
        except Exception as e:
            return {"status": "error", "error": str(e)}
    return {"status": "fakeredis", "warning": "Redis unavailable — using in-memory store"}
