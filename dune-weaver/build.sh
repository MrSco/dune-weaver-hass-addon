#!/bin/bash

# Create necessary directories
mkdir -p rootfs/app/patterns
mkdir -p rootfs/app/templates
mkdir -p rootfs/app/static
mkdir -p rootfs/app/modules
mkdir -p rootfs/app/steps_calibration
mkdir -p rootfs/app/firmware

# Copy application files
cp ../../app.py rootfs/app/
cp ../../requirements.txt rootfs/app/
cp -r ../../modules/* rootfs/app/modules/
cp -r ../../templates/* rootfs/app/templates/
cp -r ../../static/* rootfs/app/static/
cp -r ../../patterns/* rootfs/app/patterns/
cp -r ../../steps_calibration/* rootfs/app/steps_calibration/
cp -r ../../firmware/* rootfs/app/firmware/

# Create empty files for state and playlists
echo "{}" > rootfs/app/playlists.json
echo "{}" > rootfs/app/state.json

# Install requirements in the rootfs
cd rootfs/app
pip3 install -r requirements.txt --target ./lib
cd ../..

echo "Build completed successfully!" 