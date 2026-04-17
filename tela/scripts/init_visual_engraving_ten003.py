import os

def main():
    os.makedirs('src/compiler', exist_ok=True)
    os.makedirs('tests', exist_ok=True)
    
    with open('src/compiler/rebar.py', 'w') as f:
        f.write("""from fractions import Fraction
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
""")

    with open('src/compiler/spelling.py', 'w') as f:
        f.write("""class AccidentalStateMachine:
    def __init__(self, key_signature: str = 'C'):
        self.key_signature = key_signature
        # Track accidentals per octave
        self.memory = {}

    def reset_at_barline(self):
        self.memory.clear()

    def spell_pitch(self, midi_note: int, octave: int) -> str:
        # Simplified Line of Fifths mapping for C Major
        # 60 = C4, 61 = C#4 / Db4
        pitch_classes = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B']
        pitch_class = pitch_classes[midi_note % 12]
        
        # Check memory for this octave
        if octave not in self.memory:
            self.memory[octave] = {}
            
        base_note = pitch_class[0]
        
        if pitch_class in self.memory[octave]:
            # Already encountered this exact accidental in this octave
            return f"{pitch_class}{octave}"
            
        # If it's an accidental, store it in memory
        if len(pitch_class) > 1:
            self.memory[octave][pitch_class] = True
            
        return f"{pitch_class}{octave}"
""")

    with open('tests/test_visual_translation.py', 'w') as f:
        f.write("""import pytest
from fractions import Fraction
from src.compiler.rebar import RebarringEngine, VisualEvent
from src.compiler.spelling import AccidentalStateMachine

def test_guillotine_slicing():
    engine = RebarringEngine(time_signature=Fraction(4, 4))
    
    # Event starts at beat 3 (3/4), lasts for 3 beats (3/4)
    # It should be sliced at the barline (4/4)
    event = VisualEvent("C4", Fraction(3, 4), Fraction(3, 4))
    slices = engine.slice_event(event)
    
    assert len(slices) == 2
    assert slices[0].logical_duration == Fraction(1, 4)
    assert slices[0].tie_start is True
    assert slices[0].tie_stop is False
    
    assert slices[1].logical_duration == Fraction(2, 4)
    assert slices[1].logical_start == Fraction(4, 4)
    assert slices[1].tie_start is False
    assert slices[1].tie_stop is True

def test_unprintable_physics_pruning():
    engine = RebarringEngine(time_signature=Fraction(4, 4))
    
    # Event with unprintable physics
    event = VisualEvent("C4", Fraction(0), Fraction(1, 4), attributes=['.stretch', '.pan', '.stacc'])
    slices = engine.slice_event(event)
    
    assert '.stretch' not in slices[0].attributes
    assert '.pan' not in slices[0].attributes
    assert '.stacc' in slices[0].attributes
    
    # Event with @print override
    event_print = VisualEvent("C4", Fraction(0), Fraction(1, 4), attributes=['.stretch', '@print("Stretch")'])
    slices_print = engine.slice_event(event_print)
    
    assert '.stretch' in slices_print[0].attributes

def test_accidental_state_machine():
    machine = AccidentalStateMachine()
    
    # Spell C#4
    p1 = machine.spell_pitch(61, 4)
    assert p1 == "C#4"
    assert "C#" in machine.memory[4]
    
    # Spell C#5 (different octave, should not inherit)
    p2 = machine.spell_pitch(73, 5)
    assert p2 == "C#5"
    assert "C#" in machine.memory[5]
    
    # Reset at barline
    machine.reset_at_barline()
    assert len(machine.memory) == 0
""")

if __name__ == '__main__':
    main()
