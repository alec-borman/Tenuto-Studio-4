import unittest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.compiler.security import E5001, ProvenanceGenerator, ZeroTrustSandbox

class DummyNode:
    def __init__(self, style, target_ip=None):
        self.style = style
        self.target_ip = target_ip
        self.disabled = False

class TestZeroTrustProvenance(unittest.TestCase):
    def test_c2pa_watermark_generation(self):
        generator = ProvenanceGenerator()
        provenance_data = {
            "author": "Alec Borman",
            "license": "CC-BY-4.0",
            "model": "tenuto-v4"
        }
        
        watermark = generator.generate_c2pa_watermark(provenance_data)
        
        self.assertIn("c2pa_manifest", watermark)
        self.assertEqual(watermark["c2pa_manifest"]["claim_generator"], "tenuto-4-core")
        self.assertEqual(watermark["c2pa_manifest"]["assertions"]["author"], "Alec Borman")
        self.assertEqual(len(watermark["c2pa_manifest"]["signature"]), 64)

    def test_path_traversal_throws_e5001(self):
        sandbox = ZeroTrustSandbox(is_trusted=False)
        
        with self.assertRaises(E5001):
            sandbox.validate_uri("../secrets/passwords.txt")
            
        with self.assertRaises(E5001):
            sandbox.validate_uri("/etc/passwd")

    def test_hardware_profiles_disabled_in_sandbox(self):
        sandbox = ZeroTrustSandbox(is_trusted=False)
        
        sacn_node = DummyNode(style="sacn")
        fb4_node = DummyNode(style="fb4")
        
        processed_sacn = sandbox.evaluate_node(sacn_node)
        processed_fb4 = sandbox.evaluate_node(fb4_node)
        
        self.assertTrue(processed_sacn.disabled)
        self.assertTrue(processed_fb4.disabled)

    def test_osc_confined_to_localhost_in_sandbox(self):
        sandbox = ZeroTrustSandbox(is_trusted=False)
        
        osc_node = DummyNode(style="osc", target_ip="192.168.1.100")
        processed_osc = sandbox.evaluate_node(osc_node)
        
        self.assertEqual(processed_osc.target_ip, "127.0.0.1")
        self.assertFalse(processed_osc.disabled)

if __name__ == '__main__':
    unittest.main()
