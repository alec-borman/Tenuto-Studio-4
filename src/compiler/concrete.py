from fractions import Fraction
from dataclasses import dataclass
from typing import List, Dict, Tuple

@dataclass
class ConcreteEvent:
    key: str
    logical_start: Fraction
    logical_duration: Fraction
    audio_start_ms: float
    audio_duration_ms: float
    stretch: bool = False
    reverse: bool = False

class ConcreteEngine:
    def __init__(self, audio_map: Dict[str, Tuple[float, float]]):
        # audio_map maps a key to (start_ms, end_ms)
        self.audio_map = audio_map

    def process_event(self, key: str, logical_start: Fraction, logical_duration: Fraction, modifiers: List[str]) -> List[ConcreteEvent]:
        if key not in self.audio_map:
            raise ValueError(f"Key {key} not found in audio map.")
            
        audio_start_ms, audio_end_ms = self.audio_map[key]
        audio_duration_ms = audio_end_ms - audio_start_ms
        
        stretch = '.stretch' in modifiers
        reverse = '.reverse' in modifiers
        
        slice_n = 1
        for mod in modifiers:
            if mod.startswith('.slice(') and mod.endswith(')'):
                try:
                    slice_n = int(mod[7:-1])
                except ValueError:
                    pass
                
        events = []
        chunk_logical_duration = logical_duration / slice_n
        chunk_audio_duration = audio_duration_ms / slice_n
        
        for i in range(slice_n):
            chunk_logical_start = logical_start + i * chunk_logical_duration
            chunk_audio_start = audio_start_ms + i * chunk_audio_duration
            
            events.append(ConcreteEvent(
                key=key,
                logical_start=chunk_logical_start,
                logical_duration=chunk_logical_duration,
                audio_start_ms=chunk_audio_start,
                audio_duration_ms=chunk_audio_duration,
                stretch=stretch,
                reverse=reverse
            ))
            
        return events
