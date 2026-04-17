from typing import List, Dict
from fractions import Fraction

class ErgonomicsEngine:
    def auto_scaffold(self, raw_input: str) -> str:
        # Wrap raw event strings into a compliant tenuto 4.0 AST matrix
        # Pre-compilation interceptor
        scaffold = f"""tenuto "4.0" {{
  meta @{{ 
    title: "Tenuto Sketch", 
    tempo: 120, 
    time: "4/4",
    auto_pad_voices: true
  }}
  def sketch "Sketch" style=standard patch="gm_piano"
  measure 1 {{
    sketch: {raw_input} |
  }}
}}"""
        return scaffold

    def relative_pitch_heuristic(self, previous_pitch_class: str, previous_octave: int, new_pitch_class: str) -> int:
        # Evaluate omitted octaves via the 'Closest Interval Rule' (leaps of a Tritone or less)
        pitch_classes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
        
        # Normalize to uppercase and handle flats (simplified for test)
        def normalize(pc):
            pc = pc.upper()
            if pc == 'DB': return 'C#'
            if pc == 'EB': return 'D#'
            if pc == 'GB': return 'F#'
            if pc == 'AB': return 'G#'
            if pc == 'BB': return 'A#'
            return pc
            
        prev_idx = pitch_classes.index(normalize(previous_pitch_class))
        new_idx = pitch_classes.index(normalize(new_pitch_class))
        
        # Calculate distance if we stay in the same octave
        diff = new_idx - prev_idx
        
        if diff > 6:
            # Leap is greater than a tritone up, so it should be in the octave below
            return previous_octave - 1
        elif diff < -6:
            # Leap is greater than a tritone down, so it should be in the octave above
            return previous_octave + 1
        elif diff == 6 or diff == -6:
            # Exactly a tritone: default to ascending interval
            if diff == 6:
                return previous_octave
            else:
                return previous_octave + 1
        else:
            return previous_octave

    def auto_pad_voices(self, voices: Dict[str, Fraction]) -> Dict[str, Fraction]:
        # Dynamically inject terminal rests (r) preventing E3002 failures
        if not voices:
            return voices
            
        max_duration = max(voices.values())
        padded_voices = {}
        
        for voice_id, duration in voices.items():
            if duration < max_duration:
                # In a real AST we would inject a rest node, here we just return the padded duration
                padded_voices[voice_id] = max_duration
            else:
                padded_voices[voice_id] = duration
                
        return padded_voices
