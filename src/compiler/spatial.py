from dataclasses import dataclass
from typing import List, Dict, Any

@dataclass
class SpatialEvent:
    pan_start: float = 0.0
    pan_end: float = 0.0
    pan_curve: str = "linear"
    orbit_radius: float = 0.0
    orbit_velocity: float = 0.0
    has_pan: bool = False
    has_orbit: bool = False

class SpatialEngine:
    def __init__(self):
        self.buses: Dict[str, str] = {}

    def register_bus(self, staff_id: str, uri: str) -> None:
        if uri.startswith("bus://"):
            target_bus = uri[6:]
            self.buses[staff_id] = target_bus

    def evaluate_bus_routing(self, ast_node: Dict[str, Any]) -> None:
        style = ast_node.get("style", "")
        staff_id = ast_node.get("staff_id", "")
        output_uri = ast_node.get("output_uri", "")
        
        if style == "concrete" and output_uri.startswith("bus://"):
            target_bus = output_uri.split("bus://")[1]
            self.buses[staff_id] = target_bus

    def evaluate_spatial_primitives(self, attributes: List[str]) -> SpatialEvent:
        event = SpatialEvent()
        for attr in attributes:
            if attr.startswith(".pan(") and attr.endswith(")"):
                inner = attr[5:-1]
                parts = [p.strip() for p in inner.split(",")]
                if len(parts) >= 3:
                    try:
                        start_str = parts[0].strip("[]")
                        end_str = parts[1].strip("[]")
                        event.pan_start = float(start_str)
                        event.pan_end = float(end_str)
                        event.pan_curve = parts[2].strip("\"'")
                        event.has_pan = True
                    except (ValueError, TypeError) as e:
                        print(f"Skipping malformed pan primitive: {e}")
            elif attr.startswith(".orbit(") and attr.endswith(")"):
                inner = attr[7:-1]
                parts = [p.strip() for p in inner.split(",")]
                if len(parts) >= 2:
                    try:
                        event.orbit_radius = float(parts[0])
                        event.orbit_velocity = float(parts[1])
                        event.has_orbit = True
                    except (ValueError, TypeError) as e:
                        print(f"Skipping malformed orbit primitive: {e}")
        return event

    def demarcation_pass(self, attributes: List[str]) -> List[str]:
        # Aggressively prune .pan, .orbit, and .fx attributes from AST so they don't leak into DOM
        pruned = []
        for attr in attributes:
            if attr.startswith(".pan(") or attr.startswith(".orbit(") or attr.startswith(".fx("):
                continue
            pruned.append(attr)
        return pruned

    def process_track_ast(self, ast_node: Dict[str, Any]) -> Dict[str, Any]:
        self.evaluate_bus_routing(ast_node)
        
        attributes = ast_node.get("attributes", [])
        if attributes:
            spatial_event = self.evaluate_spatial_primitives(attributes)
            ast_node["spatial_event"] = spatial_event
            ast_node["attributes"] = self.demarcation_pass(attributes)
            
        return ast_node
