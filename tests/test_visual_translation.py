import pytest
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
