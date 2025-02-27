#!/bin/bash

# Create necessary directories
mkdir -p rootfs/app/modules
mkdir -p rootfs/app/templates
mkdir -p rootfs/app/static
mkdir -p rootfs/app/patterns
mkdir -p rootfs/app/steps_calibration
mkdir -p rootfs/app/firmware

# Copy modules directory (critical for functionality)
cp -r temp-dune-weaver/modules/* rootfs/app/modules/

# Copy templates directory (for web interface)
cp -r temp-dune-weaver/templates/* rootfs/app/templates/

# Copy static directory (CSS, JS, images)
cp -r temp-dune-weaver/static/* rootfs/app/static/

# Copy patterns directory (sample patterns)
cp -r temp-dune-weaver/patterns/* rootfs/app/patterns/

# Copy steps_calibration directory if it exists
if [ -d "temp-dune-weaver/steps_calibration" ]; then
  cp -r temp-dune-weaver/steps_calibration/* rootfs/app/steps_calibration/
fi

# Copy firmware directory if it exists
if [ -d "temp-dune-weaver/firmware" ]; then
  cp -r temp-dune-weaver/firmware/* rootfs/app/firmware/
fi

# Copy requirements.txt (ensure all dependencies are included)
cp temp-dune-weaver/requirements.txt rootfs/app/

# Create empty files for state and playlists
echo "{}" > rootfs/app/playlists.json
echo "{}" > rootfs/app/state.json

echo "All necessary files have been copied to the add-on directory." 