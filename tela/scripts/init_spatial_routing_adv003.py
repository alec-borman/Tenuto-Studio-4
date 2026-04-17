import os

def main():
    os.makedirs('src/compiler', exist_ok=True)
    os.makedirs('tests', exist_ok=True)

if __name__ == '__main__':
    main()
