#!/usr/bin/env python3
"""
Wrapper script to start the application.
This script will first check if all required dependencies are installed,
and then start the application.
"""
import sys
import os
import importlib
import subprocess

def check_dependencies():
    """Check if all required dependencies are installed."""
    required_packages = [
        "fastapi",
        "uvicorn",
        "pydantic",
        "jinja2",
        "aiofiles",
        "python_multipart",
        "websockets",
        "pyserial",
        "paho.mqtt",
        "websocket_client",
        "tqdm",
        "dotenv"
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
                sys.executable, "-m", "pip", "install", "--no-cache-dir", "--user"
            ] + missing_packages)
            print("Installation successful!")
        except subprocess.CalledProcessError:
            print("Failed to install missing packages.")
            return False
        
        # Verify installation
        for package in missing_packages:
            try:
                importlib.import_module(package)
                print(f"✓ {package} is now installed")
            except ImportError:
                print(f"✗ {package} is still not installed")
                return False
    
    return True

def main():
    """Main function."""
    # Check dependencies
    if not check_dependencies():
        print("Failed to install all required dependencies.")
        sys.exit(1)
    
    # Start the application
    print("Starting Dune Weaver application...")
    try:
        # Execute app.py directly
        with open("app.py") as f:
            exec(f.read(), {"__name__": "__main__"})
    except Exception as e:
        print(f"Failed to run app.py: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main() 