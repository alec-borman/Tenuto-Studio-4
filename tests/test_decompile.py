import pytest
from fractions import Fraction
from src.compiler.decompile import Decompiler, RawEvent

def test_state_restoration():
    decompiler = Decompiler()
    events = [
        RawEvent("c", 4, Fraction(1, 4)),
        RawEvent("d", 4, Fraction(1, 4)),
        RawEvent("e", 4, Fraction(1, 4)),
        RawEvent("f", 4, Fraction(1, 4))
    ]
    
    result = decompiler.state_restoration(events)
    assert result == "c4:4 d e f"

def test_macro_extraction():
    decompiler = Decompiler()
    tokens = ["c4:16", "e", "g", "c5", "c4:16", "e", "g", "c5"]
    
    macros, result_tokens = decompiler.extract_macros(tokens)
    assert "Macro1" in macros
    assert macros["Macro1"] == "c4:16 e g c5"
    assert result_tokens == ["$Macro1", "$Macro1"]

def test_reverse_euclidean():
    decompiler = Decompiler()
    
    # E(3, 8) = [True, False, False, True, False, False, True, False]
    hits = [True, False, False, True, False, False, True, False]
    result = decompiler.reverse_euclidean(hits)
    
    assert result == "(k):3/8"
