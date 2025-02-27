#!/usr/bin/env python3
"""
Simple script to check if all required dependencies are installed correctly.
This script will be run before starting the application.
"""
import sys
import importlib.util

def check_module(module_name):
    """Check if a module can be imported."""
    try:
        importlib.import_module(module_name)
        print(f"✓ {module_name} is installed")
        return True
    except ImportError as e:
        print(f"✗ {module_name} is NOT installed: {str(e)}")
        return False

# List of critical modules
modules = [
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

# Check each module
all_installed = True
for module in modules:
    if not check_module(module):
        all_installed = False

# Print Python path
print("\nPython path:")
for path in sys.path:
    print(f"  {path}")

# Print Python version
print(f"\nPython version: {sys.version}")

# Exit with appropriate status code
if all_installed:
    print("\nAll required dependencies are installed!")
    sys.exit(0)
else:
    print("\nSome dependencies are missing!")
    sys.exit(1) 