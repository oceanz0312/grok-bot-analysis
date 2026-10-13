import json
import os
import re
import struct
import threading
import time
from urllib.parse import parse_qsl, urlsplit

from mitmproxy import http


OUTPUT_PATH = os.environ.get(
    "TESTAGENT_SHAPE_LOG",
    "/Users/bytedance/Documents/testAgent-analysis/runtime-api-shapes.jsonl",
)
MAX_BODY_BYTES = 4 * 1024 * 1024
MAX_DEPTH = 5
MAX_FIELDS = 160
_LOCK = threading.Lock()


def _length_bucket(length: int) -> str:
    if length == 0:
        return "0"
    for boundary in (8, 32, 128, 512, 2048, 8192, 32768, 131072, 524288):
        if length <= boundary:
            return f"1-{boundary}"
    return ">524288"


def _safe_key(key: object) -> str:
    text = str(key)
    if len(text) > 96:
        return "<dynamic-key>"
    if re.search(r"@", text):
        return "<email-key>"
    if re.fullmatch(r"[0-9a-fA-F-]{24,}", text):
        return "<id-key>"
    if re.fullmatch(r"[A-Za-z0-9_=-]{48,}", text):
        return "<opaque-key>"
    return text


def _safe_path(path: str) -> str:
    """Keep route names while removing likely identifiers and user-controlled segments."""
    safe_segments = []
    for segment in path.split("/"):
        if not segment:
            safe_segments.append("")
            continue
        if re.fullmatch(r"\d+", segment):
            safe_segments.append("<number>")
        elif re.fullmatch(
            r"(?:[0-9a-fA-F]{16,}|[0-9a-fA-F]{8}-(?:[0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12})",
            segment,
        ):
            safe_segments.append("<id>")
        elif len(segment) > 64 or "@" in segment or "%" in segment:
            safe_segments.append("<redacted>")
        elif re.fullmatch(r"[A-Za-z0-9_.:-]+", segment):
            safe_segments.append(segment)
        else:
            safe_segments.append("<redacted>")
    return "/".join(safe_segments)


def _shape(value: object, depth: int = 0) -> object:
    if value is None:
        return "null"
    if isinstance(value, bool):
        return "boolean"
    if isinstance(value, int):
        return "integer"
    if isinstance(value, float):
        return "number"
    if isinstance(value, str):
        return {"type": "string", "length": _length_bucket(len(value))}
    if isinstance(value, bytes):
        return {"type": "bytes", "length": _length_bucket(len(value))}
    if isinstance(value, list):
        if depth >= MAX_DEPTH:
            return {"type": "array", "length": len(value)}
        samples = []
        seen = set()
        for item in value[:8]:
            shaped = _shape(item, depth + 1)
            marker = json.dumps(shaped, sort_keys=True, ensure_ascii=True)
            if marker not in seen:
                seen.add(marker)
                samples.append(shaped)
        return {"type": "array", "length": len(value), "items": samples}
    if isinstance(value, dict):
        keys = sorted((_safe_key(key), key) for key in value.keys())[:MAX_FIELDS]
        if depth >= MAX_DEPTH:
            return {"type": "object", "keys": [safe for safe, _ in keys]}
        return {
            "type": "object",
            "fields": {safe: _shape(value[raw], depth + 1) for safe, raw in keys},
        }
    return type(value).__name__


def _headers(headers: object) -> dict:
    names = sorted({str(name).lower() for name in headers.keys()})
    content_type = headers.get("content-type", "").split(";", 1)[0].strip().lower()
    return {
        "names": names,
        "content_type": content_type or None,
        "content_length": headers.get("content-length"),
        "content_encoding": headers.get("content-encoding"),
    }


def _safe_url(url: str) -> dict:
    parsed = urlsplit(url)
    query_keys = sorted({_safe_key(key) for key, _ in parse_qsl(parsed.query, keep_blank_values=True)})
    return {
        "scheme": parsed.scheme,
        "host": parsed.hostname,
        "port": parsed.port,
        "path": _safe_path(parsed.path),
        "query_keys": query_keys,
        "fragment_present": bool(parsed.fragment),
    }


def _read_varint(data: bytes, offset: int) -> tuple[int, int]:
    value = 0
    shift = 0
    while offset < len(data) and shift < 70:
        byte = data[offset]
        offset += 1
        value |= (byte & 0x7F) << shift
        if byte < 0x80:
            return value, offset
        shift += 7
    raise ValueError("invalid varint")


def _protobuf_shape(data: bytes) -> dict:
    fields = []
    offset = 0
    while offset < len(data) and len(fields) < MAX_FIELDS:
        try:
            tag, offset = _read_varint(data, offset)
            field_number = tag >> 3
            wire_type = tag & 0x07
            if field_number <= 0:
                break
            item = {"field": field_number, "wire_type": wire_type}
            if wire_type == 0:
                _, offset = _read_varint(data, offset)
            elif wire_type == 1:
                offset += 8
            elif wire_type == 2:
                length, offset = _read_varint(data, offset)
                item["length"] = _length_bucket(length)
                offset += length
            elif wire_type == 5:
                offset += 4
            else:
                item["unsupported"] = True
                fields.append(item)
                break
            if offset > len(data):
                item["truncated"] = True
                fields.append(item)
                break
            fields.append(item)
        except Exception:
            break
    return {"encoding": "protobuf", "length": len(data), "fields": fields}


def _connect_envelopes(data: bytes, inner_content_type: str) -> dict | None:
    offset = 0
    frames = []
    while offset + 5 <= len(data) and len(frames) < 64:
        flags = data[offset]
        length = struct.unpack(">I", data[offset + 1 : offset + 5])[0]
        offset += 5
        if length > len(data) - offset:
            return None
        payload = data[offset : offset + length]
        offset += length
        frame = {"flags": flags, "length": _length_bucket(length)}
        if flags & 0x02:
            frame["kind"] = "end-stream"
        elif "json" in inner_content_type:
            try:
                frame["shape"] = _shape(json.loads(payload.decode("utf-8")))
            except Exception:
                frame["shape"] = {"encoding": "json", "parse": "failed"}
        else:
            frame["shape"] = _protobuf_shape(payload)
        frames.append(frame)
    if offset != len(data) or not frames:
        return None
    return {"encoding": "connect-envelopes", "length": len(data), "frames": frames}


def _sse_shape(text: str) -> dict:
    events = []
    for block in re.split(r"\r?\n\r?\n", text)[:64]:
        if not block.strip():
            continue
        event = {"fields": []}
        data_lines = []
        for line in block.splitlines():
            if line.startswith(":"):
                event["fields"].append("comment")
                continue
            name, _, value = line.partition(":")
            event["fields"].append(_safe_key(name))
            if name == "data":
                data_lines.append(value.lstrip())
        if data_lines:
            payload = "\n".join(data_lines)
            try:
                event["data_shape"] = _shape(json.loads(payload))
            except Exception:
                event["data_shape"] = {"type": "string", "length": _length_bucket(len(payload))}
        events.append(event)
    return {"encoding": "sse", "length": len(text), "events": events}


def _body_shape(content: bytes | None, content_type: str) -> object:
    if content is None:
        return None
    if len(content) > MAX_BODY_BYTES:
        return {"encoding": "omitted-large", "length": len(content)}
    lowered = content_type.lower()
    connect = _connect_envelopes(content, lowered) if "connect+" in lowered or "grpc" in lowered else None
    if connect is not None:
        return connect
    if "json" in lowered or content.lstrip().startswith((b"{", b"[")):
        try:
            return {"encoding": "json", "length": len(content), "shape": _shape(json.loads(content))}
        except Exception:
            return {"encoding": "json", "length": len(content), "parse": "failed"}
    if "text/event-stream" in lowered:
        return _sse_shape(content.decode("utf-8", errors="replace"))
    if "application/x-www-form-urlencoded" in lowered:
        text = content.decode("utf-8", errors="replace")
        return {
            "encoding": "form",
            "length": len(content),
            "fields": sorted({_safe_key(key) for key, _ in parse_qsl(text, keep_blank_values=True)}),
        }
    if "protobuf" in lowered or "proto" in lowered or "octet-stream" in lowered:
        return _protobuf_shape(content)
    if lowered.startswith("text/") or "xml" in lowered or "html" in lowered:
        return {"encoding": "text", "length": len(content)}
    return {"encoding": "opaque", "length": len(content)}


def _write(record: dict) -> None:
    record["observed_at_ms"] = int(time.time() * 1000)
    line = json.dumps(record, ensure_ascii=True, sort_keys=True, separators=(",", ":"))
    with _LOCK:
        with open(OUTPUT_PATH, "a", encoding="utf-8") as handle:
            handle.write(line + "\n")


def request(flow: http.HTTPFlow) -> None:
    request_headers = _headers(flow.request.headers)
    _write(
        {
            "kind": "request",
            "flow_id": flow.id,
            "method": flow.request.method,
            "url": _safe_url(flow.request.pretty_url),
            "http_version": flow.request.http_version,
            "headers": request_headers,
            "body": _body_shape(flow.request.raw_content, request_headers["content_type"] or ""),
            "timestamp_start": flow.request.timestamp_start,
        }
    )


def http_connect(flow: http.HTTPFlow) -> None:
    """Record HTTPS tunnel destinations even when TLS cannot be decrypted."""
    _write(
        {
            "kind": "http-connect",
            "flow_id": flow.id,
            "method": flow.request.method,
            "url": {
                "scheme": "https",
                "host": flow.request.host,
                "port": flow.request.port,
                "path": "/",
                "query_keys": [],
                "fragment_present": False,
            },
            "http_version": flow.request.http_version,
            "headers": {"names": sorted({str(name).lower() for name in flow.request.headers.keys()})},
        }
    )


def response(flow: http.HTTPFlow) -> None:
    response_headers = _headers(flow.response.headers)
    _write(
        {
            "kind": "response",
            "flow_id": flow.id,
            "status": flow.response.status_code,
            "http_version": flow.response.http_version,
            "url": _safe_url(flow.request.pretty_url),
            "headers": response_headers,
            "body": _body_shape(flow.response.raw_content, response_headers["content_type"] or ""),
            "duration_ms": round(
                max(0.0, (flow.response.timestamp_end or time.time()) - flow.request.timestamp_start) * 1000,
                2,
            ),
        }
    )


def error(flow: http.HTTPFlow) -> None:
    _write(
        {
            "kind": "error",
            "flow_id": flow.id,
            "url": _safe_url(flow.request.pretty_url),
            "error_type": type(flow.error).__name__ if flow.error else "unknown",
        }
    )


def websocket_message(flow: http.HTTPFlow) -> None:
    if flow.websocket is None or not flow.websocket.messages:
        return
    message = flow.websocket.messages[-1]
    content = message.content
    if isinstance(content, str):
        encoded = content.encode("utf-8", errors="replace")
        content_type = "application/json" if content.lstrip().startswith(("{", "[")) else "text/plain"
    else:
        encoded = bytes(content)
        content_type = "application/octet-stream"
    _write(
        {
            "kind": "websocket-message",
            "flow_id": flow.id,
            "url": _safe_url(flow.request.pretty_url),
            "direction": "client-to-server" if message.from_client else "server-to-client",
            "body": _body_shape(encoded, content_type),
        }
    )
