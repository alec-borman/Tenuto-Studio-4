import time
import struct
import socket
from dataclasses import dataclass
from typing import List, Dict, Any

# NTP epoch offset from Unix epoch (seconds)
NTP_OFFSET = 2208988800

@dataclass
class OSCMessage:
    address: str
    args: Dict[str, Any]

@dataclass
class OSCBundle:
    timetag: float
    messages: List[OSCMessage]

class OSCEmitter:
    def __init__(self, target_ip: str = "127.0.0.1", port: int = 57120, lookahead_ms: int = 200):
        self.lookahead_ms = lookahead_ms
        self.target_ip = target_ip
        self.port = port
        self.sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)

    def current_ntp_time(self) -> float:
        return time.time() + NTP_OFFSET

    def schedule_event(self, style: str, sample_name: str, physical_start_ms: float, logical_duration: float, audio_duration_ms: float, modifiers: List[str]) -> OSCBundle:
        # Calculate absolute NTP timetag with lookahead
        timetag = self.current_ntp_time() + (physical_start_ms / 1000.0) + (self.lookahead_ms / 1000.0)
        
        args = {}
        if style in ("concrete", "synth"):
            args["s"] = sample_name
            args["sustain"] = logical_duration
        
        # Translate modifiers
        slice_n = 1
        slice_index = 0
        
        for mod in modifiers:
            if mod.startswith(".slice(") and mod.endswith(")"):
                try:
                    slice_n = int(mod[7:-1])
                except ValueError:
                    continue
            elif mod == ".stretch":
                args["speed"] = audio_duration_ms / (logical_duration * 1000.0) if logical_duration > 0.0 else 1.0

        if slice_n > 1:
            args["begin"] = slice_index / float(slice_n)
            args["end"] = (slice_index + 1) / float(slice_n)

        msg = OSCMessage(address="/dirt/play", args=args)
        return OSCBundle(timetag=timetag, messages=[msg])
        
    def _encode_string(self, s: str) -> bytes:
        b = s.encode('utf-8') + b'\x00'
        pad = (4 - (len(b) % 4)) % 4
        return b + (b'\x00' * pad)

    def _encode_message(self, msg: OSCMessage) -> bytes:
        parts = [self._encode_string(msg.address)]
        type_tags = ","
        args_bytes = b""
        
        for key, value in msg.args.items():
            type_tags += "s"
            args_bytes += self._encode_string(key)
            if isinstance(value, float):
                type_tags += "f"
                args_bytes += struct.pack(">f", value)
            elif isinstance(value, int):
                type_tags += "i"
                args_bytes += struct.pack(">i", value)
            elif isinstance(value, str):
                type_tags += "s"
                args_bytes += self._encode_string(value)
                
        parts.append(self._encode_string(type_tags))
        parts.append(args_bytes)
        
        msg_bytes = b"".join(parts)
        return struct.pack(">I", len(msg_bytes)) + msg_bytes

    def emit(self, bundle: OSCBundle) -> None:
        bundle_parts = [b"#bundle\x00"]
        
        # Encode timetag (64-bit NTP timestamp: 32-bit seconds, 32-bit fraction)
        seconds = int(bundle.timetag)
        fraction = int((bundle.timetag - seconds) * 4294967296)
        bundle_parts.append(struct.pack(">II", seconds, fraction))
        
        for msg in bundle.messages:
            bundle_parts.append(self._encode_message(msg))
            
        data = b"".join(bundle_parts)
        self.sock.sendto(data, (self.target_ip, self.port))

