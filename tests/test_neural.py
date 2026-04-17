import asyncio
import unittest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.compiler.neural import NeuralCognitiveEngine, SpacerNode, NoteNode

class TestNeuralSynthesis(unittest.TestCase):
    def test_semantic_injection(self):
        spacer = SpacerNode(1.0).prompt('A haunting gregorian chant')
        self.assertEqual(spacer.style, "neural")
        self.assertEqual(spacer.prompt_text, "A haunting gregorian chant")

    def test_asynchronous_synthesis_mapping(self):
        engine = NeuralCognitiveEngine()
        
        timeline = [
            SpacerNode(2.0).prompt("Epic orchestral swell"),
            NoteNode(1.0, 60),
            SpacerNode(1.0).prompt("Cyberpunk synth bass drop")
        ]
        
        processed = asyncio.run(engine.evaluate_timeline(timeline))
        
        self.assertEqual(processed[0].style, "concrete")
        self.assertTrue(processed[0].is_synthesized)
        self.assertEqual(processed[0].buffer["prompt"], "Epic orchestral swell")
        
        self.assertEqual(processed[1].style, "standard")
        self.assertFalse(hasattr(processed[1], "is_synthesized"))
        
        self.assertEqual(processed[2].style, "concrete")
        self.assertEqual(processed[2].buffer["prompt"], "Cyberpunk synth bass drop")
        self.assertTrue("buffer_" in processed[2].buffer["data_ref"])

if __name__ == '__main__':
    unittest.main()
