import xml.etree.ElementTree as ET

class NoteEvent:
    def __init__(self, pitch_step: str, octave: int, duration: int):
        self.pitch_step = pitch_step
        self.octave = octave
        self.duration = duration

class MeasureIR:
    def __init__(self, number: int):
        self.number = number
        self.voices = {}
