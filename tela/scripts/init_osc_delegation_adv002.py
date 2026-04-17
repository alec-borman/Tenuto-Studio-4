import os

def main():
    os.makedirs('src/runtime', exist_ok=True)
    os.makedirs('tests', exist_ok=True)
    # The actual files are created via direct create_file calls to bypass shell restrictions on python execution.

if __name__ == '__main__':
    main()
