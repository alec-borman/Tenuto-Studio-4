import pytest
from src.compiler.parser import parse

def test_keywords_case_insensitive():
    code = '''
    DeF my_def { }
    mEaSuRe m1 { }
    MeTa m2 { }
    '''
    tree = parse(code)
    assert tree is not None

def test_sigils():
    code = '''
    def main {
        $invoc
        my_var : "string"
        v : <[ ]>
        m : @{ key : "val" }
        c : [ C4 E4 G4 ]
        attr : obj.prop
    }
    '''
    tree = parse(code)
    assert tree is not None

def test_comments():
    code = '''
    %% This is a comment
    def main { %% inline comment
    }
    '''
    tree = parse(code)
    assert tree is not None

def test_notes_case_insensitive():
    code = '''
    def main {
        c : [ c4 C4 d#4 Db4 ]
    }
    '''
    tree = parse(code)
    assert tree is not None
