#!/usr/bin/env python3
"""
Startup script for Dune Weaver.
This script checks if all required dependencies are installed before starting the application.
Dependencies should have been installed during the Docker build process.
"""
import sys
import importlib
import os

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
    
    if missing_packages:
        print("\nMissing packages:")
        for package in missing_packages:
            print(f"  - {package}")
        print("\nERROR: Required dependencies are missing. Please rebuild the Docker image.")
        return False
    
    return True

def main():
    """Main function."""
    print("Checking dependencies...")
    if not check_dependencies():
        print("Cannot start application due to missing dependencies.")
        sys.exit(1)
    
    print("All dependencies are installed! Starting the application...")
    
    # Start the application
    try:
        # Import the app module
        import app
        # If the app module has an entrypoint function, call it
        if hasattr(app, 'entrypoint'):
            app.entrypoint()
        else:
            # Otherwise, try to run the app directly
            os.system("python3 app.py")
    except Exception as e:
        print(f"Error starting the application: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main() 