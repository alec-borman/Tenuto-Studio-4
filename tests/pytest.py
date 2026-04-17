class RaisesContext:
    def __init__(self, expected_exception, match=None):
        self.expected_exception = expected_exception
        self.match = match
    def __enter__(self):
        pass
    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is None:
            raise AssertionError(f"Expected exception {self.expected_exception} not raised")
        if not issubclass(exc_type, self.expected_exception):
            raise AssertionError(f"Expected {self.expected_exception}, got {exc_type}")
        if self.match and self.match not in str(exc_val):
            raise AssertionError(f"Exception message '{exc_val}' does not match '{self.match}'")
        return True

def raises(expected_exception, match=None):
    return RaisesContext(expected_exception, match)
