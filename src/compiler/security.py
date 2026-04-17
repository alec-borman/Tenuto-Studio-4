import hashlib
import json
import urllib.parse
import re

class E5001(Exception):
    """Fatal Error: Path Traversal or Untrusted URI detected."""
    pass

class ProvenanceGenerator:
    def __init__(self):
        pass

    def generate_c2pa_watermark(self, provenance_data: dict) -> dict:
        """
        Generates a C2PA cryptographic watermark (represented as a dictionary/JSON)
        from a provenance dictionary, for embedding into exported ID3 tags.
        """
        data_str = json.dumps(provenance_data, sort_keys=True)
        signature = hashlib.sha256(data_str.encode('utf-8')).hexdigest()
        
        return {
            "c2pa_manifest": {
                "claim_generator": "tenuto-4-core",
                "assertions": provenance_data,
                "signature": signature
            }
        }

class ZeroTrustSandbox:
    def __init__(self, is_trusted: bool = False):
        self.is_trusted = is_trusted

    def validate_uri(self, uri: str):
        """
        Checks for path traversal and untrusted external requests.
        Throws E5001 if validation fails.
        """
        if not self.is_trusted:
            parsed = urllib.parse.urlparse(uri)
            if parsed.scheme and parsed.scheme not in ['http', 'https']:
                raise E5001(f"Untrusted URI scheme: {parsed.scheme}")

            # Path traversal check
            if ".." in uri or uri.startswith("/"):
                raise E5001(f"Path traversal detected in URI: {uri}")

    def evaluate_node(self, node):
        """
        Enforce profile boundaries such as disabling hardware execution 
        and confining OSC.
        """
        if not self.is_trusted:
            if getattr(node, "style", None) in ["sacn", "fb4"]:
                node.disabled = True
            
            if getattr(node, "style", None) == "osc":
                node.target_ip = "127.0.0.1"

        return node
