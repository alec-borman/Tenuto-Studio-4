from dataclasses import dataclass
from fractions import Fraction

@dataclass
class AtomicEvent:
    pitch: str
    logical_start: Fraction
    logical_duration: Fraction
    physical_start_tick: int
    physical_duration_ticks: int
    velocity: int
