import pytest
from src.compiler.spatial import SpatialEngine

def test_bus_routing():
    engine = SpatialEngine()
    engine.register_bus("glitch", "bus://pno")
    assert "glitch" in engine.buses
    assert engine.buses["glitch"] == "pno"

def test_evaluate_spatial_primitives():
    engine = SpatialEngine()
    attrs = [".pan([-1.0, 1.0], \\"linear\\")", ".orbit(5.0, 0.5)", ".stacc"]
    event = engine.evaluate_spatial_primitives(attrs)
    
    assert event.has_pan is True
    assert event.pan_start == -1.0
    assert event.pan_end == 1.0
    assert event.pan_curve == "linear"
    
    assert event.has_orbit is True
    assert event.orbit_radius == 5.0
    assert event.orbit_velocity == 0.5

def test_demarcation_pass():
    engine = SpatialEngine()
    attrs = [".stacc", ".pan([-1.0, 1.0], \\"linear\\")", ".orbit(5.0, 0.5)", ".fx(reverb, @{ mix: 0.90 })", ".ten"]
    
    pruned = engine.demarcation_pass(attrs)
    
    assert ".stacc" in pruned
    assert ".ten" in pruned
    assert len(pruned) == 2
    
    # FATAL CONSTRAINT: Do not allow unprintable spatial physics to leak
    for p in pruned:
        assert not p.startswith(".pan")
        assert not p.startswith(".orbit")
        assert not p.startswith(".fx")
