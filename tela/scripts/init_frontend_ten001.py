import os

def main():
    os.makedirs('src/compiler', exist_ok=True)
    os.makedirs('tests', exist_ok=True)
    
    with open('src/compiler/lexer.py', 'w') as f:
        f.write("# Lexer definitions for Tenuto 4.0\n")
        
    with open('src/compiler/parser.py', 'w') as f:
        f.write("# Parser definitions for Tenuto 4.0\n")
        
    with open('tests/test_frontend.py', 'w') as f:
        f.write("# Tests for Tenuto 4.0 frontend\n")

if __name__ == '__main__':
    main()
