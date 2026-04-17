from fractions import Fraction
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
