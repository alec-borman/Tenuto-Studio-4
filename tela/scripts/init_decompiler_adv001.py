import os

def main():
    os.makedirs('src/compiler', exist_ok=True)
    os.makedirs('tests', exist_ok=True)
    
    with open('src/compiler/decompile.py', 'w') as f:
        f.write("""from typing import List, Dict, Tuple
from fractions import Fraction
from dataclasses import dataclass

@dataclass
class RawEvent:
    pitch_class: str
    octave: int
    duration: Fraction
    is_rest: bool = False

class Decompiler:
    def __init__(self):
        pass

    def state_restoration(self, events: List[RawEvent]) -> str:
        # Strip redundant octave and duration data
        result = []
        last_octave = None
        last_duration = None
        
        for event in events:
            if event.is_rest:
                token = "r"
                if event.duration != last_duration:
                    token += f":{event.duration.denominator}"
                    last_duration = event.duration
                result.append(token)
                continue
                
            token = event.pitch_class
            if event.octave != last_octave:
                token += str(event.octave)
                last_octave = event.octave
                
            if event.duration != last_duration:
                token += f":{event.duration.denominator}"
                last_duration = event.duration
                
            result.append(token)
            
        return " ".join(result)

    def extract_macros(self, tokens: List[str]) -> Tuple[Dict[str, str], List[str]]:
        # Simplified LZ77-like dictionary coding to find recurring blocks
        n = len(tokens)
        best_seq = []
        best_count = 0
        
        for i in range(n):
            for j in range(i + 3, n + 1):
                seq = tokens[i:j]
                seq_len = len(seq)
                
                # Count occurrences
                count = 0
                k = 0
                while k <= n - seq_len:
                    if tokens[k:k+seq_len] == seq:
                        count += 1
                        k += seq_len
                    else:
                        k += 1
                        
                if count > 1 and count * seq_len > best_count * len(best_seq):
                    best_seq = seq
                    best_count = count
                    
        macros = {}
        result_tokens = tokens[:]
        
        if best_count > 1:
            macro_name = "Macro1"
            macros[macro_name] = " ".join(best_seq)
            
            # Replace occurrences
            i = 0
            new_tokens = []
            while i <= len(result_tokens) - len(best_seq):
                if result_tokens[i:i+len(best_seq)] == best_seq:
                    new_tokens.append(f"${macro_name}")
                    i += len(best_seq)
                else:
                    new_tokens.append(result_tokens[i])
                    i += 1
            # Add remaining
            while i < len(result_tokens):
                new_tokens.append(result_tokens[i])
                i += 1
            result_tokens = new_tokens
            
        return macros, result_tokens

    def reverse_euclidean(self, hits: List[bool]) -> str:
        N = len(hits)
        K = sum(hits)
        
        if K == 0:
            return "r"
            
        expected = []
        acc = 0
        for i in range(N):
            acc += K
            if acc >= N:
                expected.append(True)
                acc -= N
            else:
                expected.append(False)
                
        if hits == expected:
            return f"(k):{K}/{N}"
            
        return "No match"
""")

    with open('tests/test_decompile.py', 'w') as f:
        f.write("""import pytest
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
""")

if __name__ == '__main__':
    main()
