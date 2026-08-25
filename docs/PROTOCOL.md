# CrossSync Wire Protocol Specification (v1.0)

This document defines the wire protocol, framing format, encryption envelope, and handshake procedures for **CrossSync** between Windows (Tauri/Rust) and Android (Flutter).

---

## 1. Transport Layer Overview

CrossSync supports two transport layers with automatic fallback:

| Transport | Priority | Port / UUID | Target Scenario |
|---|---|---|---|
| **Bluetooth RFCOMM** | 1 (Primary) | `7A91D0E0-4E38-40F4-93DC-55734A49B0E1` | Zero-network, direct peer-to-peer |
| **Local WebSocket / LAN** | 2 (Fallback) | TCP `52849` (mDNS `_crosssync._tcp.local`) | High-speed Wi-Fi network |

---

## 2. Packet Framing Format

All data frames transmitted over RFCOMM stream or WebSocket binary messages share a unified binary header followed by an encrypted payload envelope.

```
+---------------+----------------+----------------------+--------------------+--------------------+--------------------+
| Magic (1 byte)| MsgType (1 B)  | Payload Len (4 Bytes)| IV / Nonce (12 B)  | Encrypted Body (N) | Auth Tag (16 B)    |
|   0x58 ('X')  |  (enum 0x01..) |    uint32 Big-Endian |   GCM Random Nonce |  AES-256-GCM Cipher|  Poly1305 / GCM    |
+---------------+----------------+----------------------+--------------------+--------------------+--------------------+
```

### Message Type IDs (`MsgType`)

```
0x01: DISCOVERY_BEACON
0x02: PAIR_REQUEST
0x03: PAIR_CHALLENGE
0x04: PAIR_CONFIRM
0x05: PAIR_REJECT

0x10: CLIPBOARD_SYNC_EVENT
0x11: CLIPBOARD_ACK

0x20: FILE_TRANSFER_INIT
0x21: FILE_TRANSFER_ACCEPT
0x22: FILE_TRANSFER_REJECT
0x23: FILE_TRANSFER_CHUNK
0x24: FILE_TRANSFER_ACK
0x25: FILE_TRANSFER_COMPLETE
0x26: FILE_TRANSFER_CANCEL

0x30: AUTO_BT_TRIGGER
0x31: HEARTBEAT_PING
0x32: HEARTBEAT_PONG
0x33: DEVICE_DISCONNECT
```

---

## 3. Cryptographic Envelope (AES-256-GCM)

1. **Key Derivation:**
   - Pair-time: ECDH (P-256 / Curve25519) key exchange generates a 32-byte shared secret.
   - HKDF-SHA256 derives session keys with salt `crosssync-session-salt-v1`.
2. **Cipher:**
   - AES-256 in Galois/Counter Mode (`AES-256-GCM`).
   - 96-bit (12-byte) initialization vector (IV) generated uniquely per packet using cryptographically secure PRNG.
   - 128-bit (16-byte) authentication tag appended at the end of the packet for tamper protection.

---

## 4. Message Payloads (Decrypted JSON Content)

### 4.1 Pairing Handshake

#### `PAIR_REQUEST` (`0x02`)
```json
{
  "protocol_version": "1.0",
  "device_id": "win-desk-9b2f1",
  "device_name": "Gaurav's ThinkPad X1",
  "platform": "windows",
  "public_key": "04a1b2c3d4e5... (65-byte uncompressed EC public key)",
  "pin_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "timestamp": 1771891200000
}
```

#### `PAIR_CONFIRM` (`0x04`)
```json
{
  "device_id": "android-pixel-7a",
  "device_name": "Gaurav's Pixel 7",
  "platform": "android",
  "status": "PAIRED",
  "session_token": "tok_948f2bc01a",
  "capabilities": ["clipboard_sync", "file_transfer", "image_sync", "auto_bluetooth"]
}
```

---

### 4.2 Clipboard Sync Event (`0x10`)

Triggered immediately when local OS clipboard changes.

```json
{
  "event_id": "clip_84fa01e9-44bc",
  "source_device_id": "android-pixel-7a",
  "source_platform": "android",
  "timestamp": 1771891250100,
  "content_type": "text/plain",
  "payload": "https://github.com/crosssync/crosssync-project",
  "char_count": 46,
  "sha256": "81f1e948a7... (checksum to deduplicate recursive loopback)",
  "is_encrypted": true
}
```

#### Rich / Image Clipboard Event:
```json
{
  "event_id": "clip_image_77ac2b",
  "source_device_id": "win-desk-9b2f1",
  "source_platform": "windows",
  "timestamp": 1771891265000,
  "content_type": "image/png",
  "thumbnail_base64": "data:image/png;base64,iVBORw0KGgo...",
  "byte_length": 142850,
  "sha256": "4b6f12...",
  "blob_reference_id": "file_cache_tmp_992"
}
```

---

### 4.3 File Transfer Protocol

#### Step 1: `FILE_TRANSFER_INIT` (`0x20`)
```json
{
  "transfer_id": "xfer_a8310f92",
  "file_name": "Project_Presentation_Q3.pdf",
  "file_size_bytes": 14680064,
  "mime_type": "application/pdf",
  "sha256_checksum": "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
  "chunk_size_bytes": 65536,
  "total_chunks": 224,
  "thumbnail_base64": null
}
```

#### Step 2: `FILE_TRANSFER_ACCEPT` (`0x21`)
```json
{
  "transfer_id": "xfer_a8310f92",
  "accepted": true,
  "resume_chunk_index": 0,
  "bandwidth_limit_kbps": 0
}
```

#### Step 3: `FILE_TRANSFER_CHUNK` (`0x23`)
Transmitted as binary packet with chunk header + raw bytes:
```
+--------------------+----------------------+-------------------+-----------------------+
| Transfer ID (16 B) | Chunk Index (uint32) | Data Offset (u64) | Chunk Payload (<=64K) |
+--------------------+----------------------+-------------------+-----------------------+
```

#### Step 4: `FILE_TRANSFER_COMPLETE` (`0x25`)
```json
{
  "transfer_id": "xfer_a8310f92",
  "verified_sha256": true,
  "saved_path": "/storage/emulated/0/Download/CrossSync/Project_Presentation_Q3.pdf",
  "duration_ms": 1420
}
```

---

## 5. Loopback Prevention Algorithm

To avoid clipboard ping-pong (A copies → sends to B → B writes to OS clipboard → B's listener triggers and sends back to A):
1. Every device maintains a rolling LRU cache of the last 20 `sha256` hashes of clipboard payloads it received from remote peers.
2. When the OS clipboard event triggers, compute `hash = SHA256(content)`.
3. If `hash` is present in the `received_remote_hashes` cache, suppress transmission and drop the event silently.
4. Otherwise, broadcast `CLIPBOARD_SYNC_EVENT` to connected paired peers.

---

## 6. Power Budget & Background Wake-Lock Rules

1. **Idle State:** Background service operates strictly event-driven.
   - Windows: Hooks `AddClipboardFormatListener` Windows API. 0% CPU, no timer polls.
   - Android: Foreground Service with `SERVICE_TYPE_CONNECTED_DEVICE` + Notification Channel.
2. **Active Transfer:** Acquire `PARTIAL_WAKE_LOCK` (Android) and prevent Windows sleep (`SetThreadExecutionState(ES_SYSTEM_REQUIRED)`) only while `active_transfers.length > 0`.
3. **Immediate Release:** Release wake-lock within 500ms of final `FILE_TRANSFER_COMPLETE`.
