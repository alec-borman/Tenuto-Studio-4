import unittest
import sys
import os

if __name__ == '__main__':
    # run test_inference.py
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
    import importlib.util
    spec = importlib.util.spec_from_file_location("test_inference", "tests/test_inference.py")
    test_inference = importlib.util.module_from_spec(spec)
    sys.modules["test_inference"] = test_inference
    spec.loader.exec_module(test_inference)
    
    for name, obj in vars(test_inference).items():
        if name.startswith('test_') and callable(obj):
            try:
                obj()
                print(f"{name} PASSED")
            except Exception as e:
                print(f"{name} FAILED: {e}")
                sys.exit(1)
    print("ALL TESTS PASSED")
