#!/usr/bin/env python3
"""
Startup script for Dune Weaver.
This script checks if all required dependencies are installed,
and installs any missing ones before starting the application.
"""
import sys
import importlib
import subprocess
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
        
        # Try to install missing packages
        print("\nAttempting to install missing packages...")
        try:
            subprocess.check_call([
                sys.executable, "-m", "pip", "install", "--no-cache-dir"
            ] + missing_packages)
            print("Installation successful!")
            return True
        except subprocess.CalledProcessError:
            print("Failed to install missing packages.")
            return False
    
    return True

def main():
    """Main function."""
    print("Checking dependencies...")
    if not check_dependencies():
        print("Failed to install all required dependencies.")
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