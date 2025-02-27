#!/usr/bin/env python3
"""
Simple test app to verify that FastAPI and other dependencies are installed correctly.
"""
import sys
import importlib

def check_dependencies():
    """Check if all required dependencies are installed."""
    required_packages = [
        "fastapi",
        "uvicorn",
        "pydantic",
        "jinja2",
        "aiofiles",
        "python_multipart",
        "websockets"
    ]
    
    missing_packages = []
    for package in required_packages:
        try:
            importlib.import_module(package)
            print(f"✓ {package} is installed")
        except ImportError as e:
            missing_packages.append(package)
            print(f"✗ {package} is NOT installed: {str(e)}")
    
    return len(missing_packages) == 0

def main():
    """Main function."""
    print("Testing dependencies...")
    if not check_dependencies():
        print("Some dependencies are missing!")
        sys.exit(1)
    
    print("All dependencies are installed!")
    
    # Try to create a simple FastAPI app
    try:
        from fastapi import FastAPI
        app = FastAPI()
        
        @app.get("/")
        def read_root():
            return {"Hello": "World"}
        
        print("Successfully created a FastAPI app!")
        
        # Try to import uvicorn
        import uvicorn
        print("Successfully imported uvicorn!")
        
        # Don't actually run the app, just verify that we can import everything
        print("All tests passed!")
    except Exception as e:
        print(f"Error: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main() 