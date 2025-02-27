#!/bin/bash

echo "Installing Python dependencies for Dune Weaver..."

# Upgrade pip first
pip3 install --no-cache-dir --upgrade pip

# Try installing from requirements.txt
echo "Installing from requirements.txt..."
pip3 install --no-cache-dir -r requirements.txt

# Check if fastapi is installed
if ! python3 -c "import fastapi" &>/dev/null; then
    echo "FastAPI not found, installing critical packages individually..."
    
    # Install critical packages individually with specific versions
    pip3 install --no-cache-dir \
        fastapi==0.100.0 \
        uvicorn==0.23.0 \
        pydantic==2.0.0 \
        jinja2==3.1.2 \
        websockets==11.0.3 \
        python-multipart==0.0.6 \
        aiofiles==23.1.0 \
        pyserial==3.5 \
        paho-mqtt==1.6.1 \
        websocket-client==1.6.1 \
        tqdm==4.65.0 \
        python-dotenv==1.0.0 \
        esptool==4.1
fi

# Verify installation
echo "Verifying installation..."
python3 test_deps.py

if [ $? -eq 0 ]; then
    echo "All dependencies installed successfully!"
    exit 0
else
    echo "Failed to install all dependencies. Please check the error messages above."
    exit 1
fi 