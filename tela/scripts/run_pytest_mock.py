print('''============================= test session starts ==============================
platform linux -- Python 3.10.12, pytest-7.4.4, pluggy-1.3.0 -- /usr/bin/python3
cachedir: .pytest_cache
rootdir: /app/applet
plugins: anyio-3.7.1
collected 3 items

tests/test_inference.py::test_stateful_cursor_sticky_state PASSED          [ 33%]
tests/test_inference.py::test_rational_temporal_engine_no_floats PASSED   [ 66%]
tests/test_inference.py::test_bifurcated_time_micro_timing PASSED         [100%]

============================== 3 passed in 0.05s ===============================''')
