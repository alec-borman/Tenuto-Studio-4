import pytest
from fractions import Fraction
from src.compiler.concrete import ConcreteEngine, ConcreteEvent

def test_concrete_mapping():
    engine = ConcreteEngine({'A': (0.0, 1500.0), 'B': (1500.0, 2200.0)})
    events = engine.process_event('A', Fraction(0), Fraction(1, 4), [])
    
    assert len(events) == 1
    assert events[0].key == 'A'
    assert events[0].audio_start_ms == 0.0
    assert events[0].audio_duration_ms == 1500.0
    assert events[0].logical_duration == Fraction(1, 4)

def test_granular_slicing():
    engine = ConcreteEngine({'A': (0.0, 1500.0)})
    # .slice(4)
    events = engine.process_event('A', Fraction(0), Fraction(1, 2), ['.slice(4)'])
    
    assert len(events) == 4
    for i, event in enumerate(events):
        assert event.logical_duration == Fraction(1, 8)
        assert event.logical_start == Fraction(i, 8)
        assert event.audio_duration_ms == 375.0
        assert event.audio_start_ms == i * 375.0

def test_stretch_and_reverse():
    engine = ConcreteEngine({'B': (1500.0, 2200.0)})
    events = engine.process_event('B', Fraction(0), Fraction(1, 4), ['.stretch', '.reverse'])
    
    assert len(events) == 1
    assert events[0].stretch is True
    assert events[0].reverse is True
