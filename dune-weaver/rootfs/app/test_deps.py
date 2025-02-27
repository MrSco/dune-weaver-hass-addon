#!/usr/bin/env python3
"""
Test script to verify that all required dependencies are installed correctly.
"""
import sys
import importlib

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

print("Testing required dependencies:")
for package in required_packages:
    try:
        # Try to import the package
        importlib.import_module(package)
        print(f"✓ {package} is installed")
    except ImportError as e:
        # If import fails, add to missing packages
        missing_packages.append(package)
        print(f"✗ {package} is NOT installed: {str(e)}")

if missing_packages:
    print("\nMissing packages:")
    for package in missing_packages:
        print(f"  - {package}")
    print("\nPlease install missing packages with:")
    print(f"pip install {' '.join(missing_packages)}")
    sys.exit(1)
else:
    print("\nAll required dependencies are installed!")
    sys.exit(0) 