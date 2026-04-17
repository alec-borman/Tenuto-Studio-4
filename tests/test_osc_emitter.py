import pytest
import time
import ast
from src.runtime.osc_emitter import OSCEmitter, NTP_OFFSET

def test_osc_routing_and_timetag():
    emitter = OSCEmitter(lookahead_ms=200)
    
    now_ntp = time.time() + NTP_OFFSET
    bundle = emitter.schedule_event(
        style="concrete",
        sample_name="bd",
        physical_start_ms=0.0,
        logical_duration=0.25,
        audio_duration_ms=500.0,
        modifiers=[]
    )
    
    assert len(bundle.messages) == 1
    assert bundle.messages[0].address == "/dirt/play"
    assert bundle.messages[0].args["s"] == "bd"
    
    # Timetag should be at least 200ms ahead of now_ntp
    assert bundle.timetag >= now_ntp + 0.2

def test_slice_and_stretch_translation():
    emitter = OSCEmitter()
    bundle = emitter.schedule_event(
        style="concrete",
        sample_name="break",
        physical_start_ms=100.0,
        logical_duration=1.0,
        audio_duration_ms=2000.0,
        modifiers=[".slice(4)", ".stretch"]
    )
    
    args = bundle.messages[0].args
    assert "begin" in args
    assert "end" in args
    assert args["begin"] == 0.0
    assert args["end"] == 0.25
    assert "speed" in args
    assert args["speed"] == 2.0  # 2000ms / (1.0 * 1000ms)

def test_no_sleep_used():
    with open("src/runtime/osc_emitter.py", "r") as f:
        tree = ast.parse(f.read())
        
    for node in ast.walk(tree):
        if isinstance(node, ast.Call):
            if isinstance(node.func, ast.Attribute):
                assert node.func.attr != "sleep", "FATAL: sleep() is strictly forbidden."
            elif isinstance(node.func, ast.Name):
                assert node.func.id != "sleep", "FATAL: sleep() is strictly forbidden."
