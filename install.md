# Installation Guide for Dune Weaver Home Assistant Add-on

## Prerequisites

- A running Home Assistant instance with Supervisor (Home Assistant OS, Home Assistant Supervised)
- Git (optional, for cloning the repository)

## Installation Steps

### Method 1: Using the Add-on Repository

1. Navigate to the Supervisor panel in your Home Assistant instance.
2. Click on the "Add-on Store" tab.
3. Click the menu icon in the top right corner and select "Repositories".
4. Add the URL of this repository: `https://github.com/mrsco/dune-weaver` and click "Add".
5. The Dune Weaver add-on should now be available in the add-on store.
6. Click on the Dune Weaver add-on and click "Install".

### Method 2: Manual Installation

If you prefer to manually install the add-on:

1. Clone or download this repository:
   ```bash
   git clone https://github.com/mrsco/dune-weaver
   ```

2. Copy the `homeassistant` directory to your Home Assistant add-ons directory:
   ```bash
   cp -r homeassistant/dune-weaver /path/to/your/homeassistant/addons/
   ```

3. Restart Home Assistant.

4. Navigate to the Supervisor panel in your Home Assistant instance.

5. Click on the "Add-on Store" tab.

6. The Dune Weaver add-on should now be available in the local add-ons section.

7. Click on the Dune Weaver add-on and click "Install".

## Configuration

After installation, you can configure the add-on:

1. In the add-on page, go to the "Configuration" tab.

2. Set the `wled_ip` option if you have a WLED device:
   ```yaml
   wled_ip: "192.168.1.100"
   ```

3. Click "Save" to save your configuration.

## Starting the Add-on

1. Go to the "Info" tab of the add-on.

2. Click "Start" to start the add-on.

3. Once the add-on is running, you can access the web interface by clicking "Open Web UI" or through the sidebar item.

## Troubleshooting

If you encounter any issues during installation:

1. Check the add-on logs for error messages.

2. Make sure your Home Assistant instance has access to the internet to download the required packages.

3. If you're using a custom installation method, make sure all files are in the correct locations.

4. If the add-on fails to start, try restarting your Home Assistant instance. 