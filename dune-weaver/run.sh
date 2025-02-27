#!/usr/bin/with-contenv bashio

# Enable more verbose output
set -x

# Make our directories
mkdir -p /app/patterns
mkdir -p /app/templates
mkdir -p /app/static
mkdir -p /app/modules
mkdir -p /config/dune-weaver

# Copy data from persistent storage if it exists
if [ -d "/config/dune-weaver/patterns" ]; then
  cp -r /config/dune-weaver/patterns/* /app/patterns/ || true
fi

# Copy playlists and state files if they exist
if [ -f "/config/dune-weaver/playlists.json" ]; then
  cp /config/dune-weaver/playlists.json /app/playlists.json
else
  echo "{}" > /app/playlists.json
  cp /app/playlists.json /config/dune-weaver/playlists.json
fi

if [ -f "/config/dune-weaver/state.json" ]; then
  cp /config/dune-weaver/state.json /app/state.json
else
  echo "{}" > /app/state.json
  cp /app/state.json /config/dune-weaver/state.json
fi

# Get WLED IP from options if set
WLED_IP=$(bashio::config 'wled_ip')
if [ ! -z "$WLED_IP" ]; then
  bashio::log.info "Setting WLED IP to $WLED_IP"
  # Update state.json with WLED IP
  python3 -c "import json; s=json.load(open('/app/state.json')); s['wled_ip']='$WLED_IP'; json.dump(s, open('/app/state.json', 'w'))"
fi

# Change to app directory
cd /app

# Make test_app.py executable
chmod +x test_app.py

# Install essential dependencies only
bashio::log.info "Installing essential Python dependencies..."
pip3 install --no-cache-dir fastapi uvicorn pydantic jinja2 websockets python-multipart aiofiles || true

# Check if FastAPI is installed
if ! python3 -c "import fastapi" 2>/dev/null; then
  bashio::log.error "FastAPI installation failed. Trying alternative approach..."
  # Try installing with --user flag
  pip3 install --no-cache-dir --user fastapi uvicorn pydantic jinja2 websockets python-multipart aiofiles || true
  
  # Add user site-packages to PYTHONPATH
  export PYTHONPATH="$HOME/.local/lib/python$(python3 -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')/site-packages:/app:$PYTHONPATH"
fi

# Debug: List installed Python packages
bashio::log.info "Python packages after installation:"
pip3 list

# Run the test app to verify dependencies
bashio::log.info "Testing dependencies..."
if python3 test_app.py; then
  bashio::log.info "Dependency test passed! Starting the main application..."
  # Start the application
  PYTHONPATH=/app:$PYTHONPATH python3 app.py
else
  bashio::log.error "Dependency test failed! Cannot start the application."
  exit 1
fi 