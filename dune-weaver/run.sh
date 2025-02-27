#!/usr/bin/with-contenv bashio

# Enable more verbose output
set -x

# Make our directories
mkdir -p /app/patterns
mkdir -p /app/templates
mkdir -p /app/static
mkdir -p /app/static/css
mkdir -p /app/static/js
mkdir -p /app/static/icons
mkdir -p /app/static/webfonts
mkdir -p /app/modules
mkdir -p /config/dune-weaver

# Copy static files from rootfs to app directory
if [ -d "/rootfs/app/static" ]; then
  bashio::log.info "Copying static files from rootfs to app directory"
  cp -r /rootfs/app/static/* /app/static/
fi

# Copy template files from rootfs to app directory
if [ -d "/rootfs/app/templates" ]; then
  bashio::log.info "Copying template files from rootfs to app directory"
  cp -r /rootfs/app/templates/* /app/templates/
fi

# Ensure static files have correct permissions
chmod -R 755 /app/static
chmod -R 755 /app/templates

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

# Set PYTHONPATH to include app directory
# Use parameter expansion with default value to handle unbound variable
export PYTHONPATH=/app:${PYTHONPATH:-}

# Start the application using the startup script
bashio::log.info "Starting Dune Weaver application..."
bashio::log.info "All dependencies should have been installed during the Docker build process."
python3 startup.py 