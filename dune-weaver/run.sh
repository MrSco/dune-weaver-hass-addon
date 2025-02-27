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

# Make sure start.py is executable
chmod +x start.py

# Debug: List installed Python packages
bashio::log.info "Currently installed Python packages:"
pip3 list

# Install dependencies directly (emergency approach)
bashio::log.info "Installing Python dependencies directly..."
pip3 install --no-cache-dir --upgrade pip
pip3 install --no-cache-dir fastapi==0.100.0 uvicorn==0.23.0 pydantic==2.0.0 jinja2==3.1.2 websockets==11.0.3 python-multipart==0.0.6 aiofiles==23.1.0 pyserial==3.5 paho-mqtt==1.6.1 websocket-client==1.6.1 tqdm==4.65.0 python-dotenv==1.0.0 esptool==4.1

# Try user-level installation as well
pip3 install --no-cache-dir --user fastapi==0.100.0 uvicorn==0.23.0 pydantic==2.0.0 jinja2==3.1.2 websockets==11.0.3 python-multipart==0.0.6 aiofiles==23.1.0

# Set PYTHONPATH to include user site-packages
export PYTHONPATH="$HOME/.local/lib/python$(python3 -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')/site-packages:/app:$PYTHONPATH"

# Debug: List installed Python packages again
bashio::log.info "Python packages after installation:"
pip3 list

# Debug: Show Python path
bashio::log.info "Python path:"
python3 -c "import sys; print('\n'.join(sys.path))"

# Start the application using the wrapper script
bashio::log.info "Starting Dune Weaver application using wrapper script..."
PYTHONPATH=/app:$PYTHONPATH python3 start.py 