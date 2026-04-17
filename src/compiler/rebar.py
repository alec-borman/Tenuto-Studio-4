from fractions import Fraction
from dataclasses import dataclass
from typing import List, Dict, Any

@dataclass
class VisualEvent:
    pitch: str
    logical_start: Fraction
    logical_duration: Fraction
    tie_start: bool = False
    tie_stop: bool = False
    attributes: List[str] = None

    def __post_init__(self):
        if self.attributes is None:
            self.attributes = []

class RebarringEngine:
    def __init__(self, time_signature: Fraction):
        self.measure_capacity = time_signature

    def slice_event(self, event: VisualEvent) -> List[VisualEvent]:
        # Filter unprintable physics unless @print is present
        printable_attrs = []
        has_print = any('@print' in attr for attr in event.attributes)
        for attr in event.attributes:
            if attr in ['.stretch', '.pan', '.orbit'] and not has_print:
                continue
            printable_attrs.append(attr)

        start = event.logical_start
        duration = event.logical_duration
        end = start + duration
        
        # Find measure boundaries
        measure_start = (start // self.measure_capacity) * self.measure_capacity
        measure_end = measure_start + self.measure_capacity
        
        if end <= measure_end:
            return [VisualEvent(event.pitch, start, duration, event.tie_start, event.tie_stop, printable_attrs)]
        
        # The Guillotine: slice at measure_end
        first_duration = measure_end - start
        second_duration = end - measure_end
        
        first_slice = VisualEvent(event.pitch, start, first_duration, tie_start=True, tie_stop=event.tie_stop, attributes=printable_attrs)
        second_slice = VisualEvent(event.pitch, measure_end, second_duration, tie_start=event.tie_start, tie_stop=True, attributes=printable_attrs)
        
        # Recursively slice the second part if it straddles multiple measures
        return [first_slice] + self.slice_event(second_slice)
