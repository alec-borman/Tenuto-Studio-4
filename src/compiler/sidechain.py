from fractions import Fraction
from dataclasses import dataclass
from typing import List, Dict

@dataclass
class CCEvent:
    cc_number: int
    value: int
    logical_time: Fraction
    physical_tick: int

class SidechainEngine:
    def __init__(self, ppq: int = 1920):
        self.ppq = ppq
        self.routes = []

    def parse_meta(self, meta_block: Dict[str, str]):
        if 'sidechain_source' in meta_block and 'sidechain_target' in meta_block:
            self.routes.append({
                'source': meta_block['sidechain_source'],
                'target': meta_block['sidechain_target']
            })

    def process_spacer(self, logical_start: Fraction, logical_duration: Fraction, curve_type: str = "exp") -> List[CCEvent]:
        # Translate spacer `s` into high-resolution array of MIDI CC 11 (Expression)
        # Ducking curve: starts at 0 (ducked), ramps up to 127
        events = []
        
        # Subdivide logical duration into high-resolution ticks (e.g., every 48 ticks)
        start_tick = int(logical_start * 4 * self.ppq)
        duration_ticks = int(logical_duration * 4 * self.ppq)
        
        resolution_ticks = 48
        num_steps = duration_ticks // resolution_ticks
        
        if num_steps == 0:
            num_steps = 1
            
        for i in range(num_steps + 1):
            current_tick = start_tick + int((i / num_steps) * duration_ticks)
            current_logical = logical_start + logical_duration * Fraction(i, num_steps)
            
            # Calculate value based on curve
            progress = i / num_steps
            if curve_type == "exp":
                # Exponential curve: x^2
                val = int((progress ** 2) * 127)
            elif curve_type == "linear":
                val = int(progress * 127)
            else:
                val = int(progress * 127)
                
            val = max(0, min(127, val))
            
            events.append(CCEvent(
                cc_number=11,
                value=val,
                logical_time=current_logical,
                physical_tick=current_tick
            ))
            
        return events
