import pytest
from fractions import Fraction
from src.compiler.ergonomics import ErgonomicsEngine

def test_auto_scaffold():
    engine = ErgonomicsEngine()
    raw_input = "c4:4 d e f.stacc g:2"
    scaffolded = engine.auto_scaffold(raw_input)
    
    assert 'tenuto "4.0"' in scaffolded
    assert 'auto_pad_voices: true' in scaffolded
    assert 'def sketch "Sketch"' in scaffolded
    assert raw_input in scaffolded

def test_relative_pitch_heuristic():
    engine = ErgonomicsEngine()
    
    # B4 to C (should be C5, step UP a minor 2nd)
    octave = engine.relative_pitch_heuristic("B", 4, "C")
    assert octave == 5
    
    # C4 to B (should be B3, step DOWN a minor 2nd)
    octave = engine.relative_pitch_heuristic("C", 4, "B")
    assert octave == 3
    
    # F4 to B (Tritone, defaults to ascending -> B4)
    octave = engine.relative_pitch_heuristic("F", 4, "B")
    assert octave == 4

def test_auto_pad_voices():
    engine = ErgonomicsEngine()
    
    voices = {
        "v1": Fraction(4, 4),
        "v2": Fraction(1, 4)
    }
    
    padded = engine.auto_pad_voices(voices)
    
    assert padded["v1"] == Fraction(4, 4)
    assert padded["v2"] == Fraction(4, 4) # Padded to match v1
