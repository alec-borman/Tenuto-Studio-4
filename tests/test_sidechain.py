import pytest
from fractions import Fraction
from src.compiler.sidechain import SidechainEngine, CCEvent

def test_parse_meta():
    engine = SidechainEngine()
    engine.parse_meta({'sidechain_source': 'drm.k', 'sidechain_target': 'sub'})
    assert len(engine.routes) == 1
    assert engine.routes[0]['source'] == 'drm.k'
    assert engine.routes[0]['target'] == 'sub'

def test_process_spacer():
    engine = SidechainEngine(ppq=1920)
    # Process spacer for 1 quarter note
    events = engine.process_spacer(Fraction(0), Fraction(1, 4), curve_type="exp")
    
    assert len(events) > 0
    assert all(isinstance(e, CCEvent) for e in events)
    assert all(e.cc_number == 11 for e in events)
    
    # Check ducking curve starts at 0 and ends at 127
    assert events[0].value == 0
    assert events[-1].value == 127
    
    # Check physical ticks
    assert events[0].physical_tick == 0
    assert events[-1].physical_tick == 1920

def test_no_visual_ink():
    # The engine should only return CC events, no NoteOn events
    engine = SidechainEngine()
    events = engine.process_spacer(Fraction(0), Fraction(1, 4))
    for e in events:
        assert not hasattr(e, 'pitch') # No pitch, so no visual ink
