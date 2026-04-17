import sys
import os
sys.path.insert(0, os.path.dirname(__file__))
import pytest
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
