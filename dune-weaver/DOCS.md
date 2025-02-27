# Dune Weaver

## Overview

Dune Weaver is a software for controlling sand table devices that create beautiful patterns in sand. This add-on packages the Dune Weaver application for easy installation and integration with Home Assistant.

## Installation

Follow these steps to install the add-on:

1. Navigate to the Supervisor panel in your Home Assistant instance.
2. Click on the "Add-on Store" tab.
3. Click the menu icon in the top right corner and select "Repositories".
4. Add the URL of this repository and click "Add".
5. Find the "Dune Weaver" add-on in the list and click on it.
6. Click "Install".

## Configuration

### Option: `wled_ip`

The IP address of your WLED device (optional). If you have a WLED device connected to your sand table for lighting effects, you can specify its IP address here.

Example configuration:

```yaml
wled_ip: "192.168.1.100"
```

## How to use

1. Start the add-on.
2. Access the web interface through the "Dune Weaver" sidebar item.
3. Connect to your sand table device by selecting the appropriate serial port.
4. Run patterns, create playlists, and control your sand table device.

## Serial Device

This add-on requires access to the serial port that your sand table device is connected to. The add-on is configured to automatically detect and use common serial ports like `/dev/ttyACM0` and `/dev/ttyUSB0`. If your device uses a different port, you may need to modify the add-on configuration.

## Data Persistence

The add-on stores all data (patterns, playlists, state) in the `/config/dune-weaver` directory, which is persistent across add-on restarts and updates.

## Troubleshooting

### Connection Issues

If you're having trouble connecting to your sand table device:

1. Make sure the device is powered on and connected to your Home Assistant host.
2. Check that the correct serial port is selected in the Dune Weaver interface.
3. Try restarting the add-on.

### Pattern Execution Issues

If patterns aren't executing correctly:

1. Check the connection to your device.
2. Make sure the device is properly calibrated.
3. Try running a simple pattern first to verify basic functionality.

## Support

If you have any issues or questions, please file an issue on the [GitHub repository](https://github.com/your-username/dune-weaver). 