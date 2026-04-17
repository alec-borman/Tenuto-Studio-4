import os

def main():
    os.makedirs('src/compiler', exist_ok=True)
    os.makedirs('tests', exist_ok=True)
    
    with open('src/compiler/ir.py', 'w') as f:
        f.write("""from dataclasses import dataclass
from fractions import Fraction

@dataclass
class AtomicEvent:
    pitch: str
    logical_start: Fraction
    logical_duration: Fraction
    physical_start_tick: int
    physical_duration_ticks: int
    velocity: int
""")

    with open('src/compiler/inference.py', 'w') as f:
        f.write("""from fractions import Fraction
from src.compiler.ir import AtomicEvent

PPQ = 1920  # Pulses Per Quarter Note

class StatefulCursor:
    def __init__(self):
        self.current_time = Fraction(0)
        self.last_duration = Fraction(1, 4)  # Default quarter note
        self.last_octave = 4
        self.last_velocity = 80

class RationalEngine:
    def __init__(self):
        self.cursor = StatefulCursor()
        self.events = []

    def process_token(self, pitch_class, octave=None, duration=None, velocity=None, push_ms=0, pull_ms=0, tempo_bpm=120):
        # Update cursor state
        if octave is not None:
            self.cursor.last_octave = octave
        if duration is not None:
            if isinstance(duration, float):
                raise ValueError("FATAL: Floating-point duration is strictly forbidden.")
            self.cursor.last_duration = duration
        if velocity is not None:
            self.cursor.last_velocity = velocity

        # Calculate logical time
        logical_start = self.cursor.current_time
        logical_duration = self.cursor.last_duration
        
        # Advance cursor
        self.cursor.current_time += logical_duration

        # Calculate physical ticks
        # 1 quarter note = PPQ ticks
        # duration is in whole notes (1/4 = quarter note)
        physical_duration_ticks = int(logical_duration * 4 * PPQ)
        physical_start_tick = int(logical_start * 4 * PPQ)

        # Micro-timing modifiers (push/pull in ms)
        if push_ms or pull_ms:
            # 1 beat = 60000 / tempo_bpm ms
            # ticks_per_ms = PPQ / (60000 / tempo_bpm)
            ticks_per_ms = PPQ / (60000.0 / tempo_bpm)
            offset_ticks = int((pull_ms - push_ms) * ticks_per_ms)
            physical_start_tick += offset_ticks

        pitch_str = f"{pitch_class}{self.cursor.last_octave}"

        event = AtomicEvent(
            pitch=pitch_str,
            logical_start=logical_start,
            logical_duration=logical_duration,
            physical_start_tick=physical_start_tick,
            physical_duration_ticks=physical_duration_ticks,
            velocity=self.cursor.last_velocity
        )
        self.events.append(event)
        return event
""")

    with open('tests/test_inference.py', 'w') as f:
        f.write("""import pytest
from fractions import Fraction
from src.compiler.inference import RationalEngine, StatefulCursor
from src.compiler.ir import AtomicEvent

def test_stateful_cursor_sticky_state():
    engine = RationalEngine()
    
    # First event: explicit C4, 1/8 duration, velocity 100
    e1 = engine.process_token("C", octave=4, duration=Fraction(1, 8), velocity=100)
    assert e1.pitch == "C4"
    assert e1.logical_duration == Fraction(1, 8)
    assert e1.velocity == 100
    
    # Second event: implicit state (should inherit octave 4, duration 1/8, velocity 100)
    e2 = engine.process_token("D")
    assert e2.pitch == "D4"
    assert e2.logical_duration == Fraction(1, 8)
    assert e2.velocity == 100
    assert e2.logical_start == Fraction(1, 8)

def test_rational_temporal_engine_no_floats():
    engine = RationalEngine()
    
    # Triplet math: 1/8 * 2/3 = 1/12
    triplet_duration = Fraction(1, 8) * Fraction(2, 3)
    e1 = engine.process_token("E", duration=triplet_duration)
    assert e1.logical_duration == Fraction(1, 12)
    
    # Ensure float raises error
    with pytest.raises(ValueError, match="FATAL: Floating-point duration is strictly forbidden."):
        engine.process_token("F", duration=0.25)

def test_bifurcated_time_micro_timing():
    engine = RationalEngine()
    
    # Logical time should be perfect, physical time shifted
    e1 = engine.process_token("G", duration=Fraction(1, 4), push_ms=10, tempo_bpm=120)
    
    assert e1.logical_start == Fraction(0)
    # At 120 BPM, 1 quarter note = 500ms. PPQ = 1920.
    # 10ms push = 10 * (1920 / 500) = 10 * 3.84 = 38.4 -> 38 ticks
    assert e1.physical_start_tick < 0  # Pushed early
    
    e2 = engine.process_token("A", duration=Fraction(1, 4), pull_ms=10, tempo_bpm=120)
    assert e2.logical_start == Fraction(1, 4)
    # Should be pulled late relative to its logical start tick (1920)
    assert e2.physical_start_tick > 1920
""")

if __name__ == '__main__':
    main()
