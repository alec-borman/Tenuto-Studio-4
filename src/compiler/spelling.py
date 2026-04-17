class AccidentalStateMachine:
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
