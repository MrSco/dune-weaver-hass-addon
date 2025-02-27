#!/usr/bin/with-contenv bashio

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

# Start the application
cd /app
python3 app.py 