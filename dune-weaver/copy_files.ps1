# Create necessary directories
New-Item -Path "rootfs/app/modules" -ItemType Directory -Force
New-Item -Path "rootfs/app/templates" -ItemType Directory -Force
New-Item -Path "rootfs/app/static" -ItemType Directory -Force
New-Item -Path "rootfs/app/patterns" -ItemType Directory -Force
New-Item -Path "rootfs/app/steps_calibration" -ItemType Directory -Force
New-Item -Path "rootfs/app/firmware" -ItemType Directory -Force

# Copy modules directory (critical for functionality)
Copy-Item -Path "temp-dune-weaver/modules/*" -Destination "rootfs/app/modules/" -Recurse -Force

# Copy templates directory (for web interface)
Copy-Item -Path "temp-dune-weaver/templates/*" -Destination "rootfs/app/templates/" -Recurse -Force

# Copy static directory (CSS, JS, images)
Copy-Item -Path "temp-dune-weaver/static/*" -Destination "rootfs/app/static/" -Recurse -Force

# Copy patterns directory (sample patterns)
Copy-Item -Path "temp-dune-weaver/patterns/*" -Destination "rootfs/app/patterns/" -Recurse -Force

# Copy steps_calibration directory if it exists
if (Test-Path "temp-dune-weaver/steps_calibration") {
    Copy-Item -Path "temp-dune-weaver/steps_calibration/*" -Destination "rootfs/app/steps_calibration/" -Recurse -Force
}

# Copy firmware directory if it exists
if (Test-Path "temp-dune-weaver/firmware") {
    Copy-Item -Path "temp-dune-weaver/firmware/*" -Destination "rootfs/app/firmware/" -Recurse -Force
}

# Copy requirements.txt (ensure all dependencies are included)
Copy-Item -Path "temp-dune-weaver/requirements.txt" -Destination "rootfs/app/" -Force

# Create empty files for state and playlists
"{}" | Out-File -FilePath "rootfs/app/playlists.json" -Encoding utf8
"{}" | Out-File -FilePath "rootfs/app/state.json" -Encoding utf8

Write-Host "All necessary files have been copied to the add-on directory." 