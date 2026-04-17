from typing import List, Dict, Tuple
from fractions import Fraction
from dataclasses import dataclass

@dataclass
class RawEvent:
    pitch_class: str
    octave: int
    duration: Fraction
    is_rest: bool = False

