// Global variables
let selectedFile = null;
let playlist = [];
let selectedPlaylistIndex = null;
let allFiles = [];

// Determine the base URL for API requests
// This handles both direct access and Home Assistant ingress
const getBaseUrl = () => {
    // Check if we're in Home Assistant
    const isHomeAssistant = window.location.pathname.includes('/api/hassio_ingress/');
    
    if (isHomeAssistant) {
        // We're in Home Assistant, use the current path as the base URL
        return window.location.pathname;
    } else {
        // We're accessing the app directly, use the root path
        return '';
    }
};

// Helper function to build API URLs
const baseUrl = getBaseUrl();
console.log('Base URL detected:', baseUrl);

const apiUrl = (endpoint) => {
    // Remove leading slash if present to prevent double slashes
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
    
    // For debugging
    console.log(`Building API URL for endpoint "${endpoint}"`);
    
    let result;
    // If we're in Home Assistant, use the ingress path
    if (baseUrl) {
        // If baseUrl ends with a slash, don't add another one
        if (baseUrl.endsWith('/')) {
            result = baseUrl + cleanEndpoint;
        } else {
            // Otherwise, add a slash between baseUrl and endpoint
            result = baseUrl + '/' + cleanEndpoint;
        }
    } else {
        // Direct access - use the original endpoint with leading slash
        result = '/' + cleanEndpoint;
    }
    
    // Log the final URL for debugging
    console.log(`Final API URL: ${result}`);
    return result;
};

// Define constants for log message types
const LOG_TYPE = {
    SUCCESS: 'success',
    WARNING: 'warning',
    ERROR: 'error',
    INFO: 'info',
    DEBUG: 'debug'
};

// Enhanced logMessage with notification system
function logMessage(message, type = LOG_TYPE.DEBUG, clickTargetId = null) {
    const log = document.getElementById('status_log');
    const header = document.querySelector('header');

    if (!header) {
        console.error('Error: <header> element not found');
        return;
    }

    // Debug messages only go to the status log
    if (type === LOG_TYPE.DEBUG) {
        if (!log) {
            console.error('Error: #status_log element not found');
            return;
        }
        const entry = document.createElement('p');
        entry.textContent = message;
        log.appendChild(entry);
        log.scrollTop = log.scrollHeight; // Scroll to the bottom of the log
        return;
    }

    // Clear any existing notifications
    const existingNotification = header.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    // Create a notification for other message types
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    // Add a close button
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '<i class="fa-solid fa-xmark"></i>';
    closeButton.className = 'close-button no-bg';
    closeButton.onclick = (e) => {
        e.stopPropagation(); // Prevent triggering the clickTarget when the close button is clicked
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 250); // Match transition duration
    };
    notification.appendChild(closeButton);

    // Attach click event to the notification if a clickTargetId is provided
    if (clickTargetId) {
        notification.onclick = () => {
            const target = document.getElementById(clickTargetId);
            if (target) {
                // Find the closest <main> parent
                const parentMain = target.closest('main');
                if (parentMain) {
                    // Remove 'active' class from all <main> elements
                    document.querySelectorAll('main').forEach((main) => {
                        main.classList.remove('active');
                    });
                    // Add 'active' class to the parent <main>
                    parentMain.classList.add('active');
                    target.click();

                    // Update tab buttons based on the parent <main> ID
                    const parentId = parentMain.id; // e.g., "patterns-tab"
                    const tabId = `nav-${parentId.replace('-tab', '')}`; // e.g., "nav-patterns"
                    document.querySelectorAll('.tab-button').forEach((button) => {
                        button.classList.remove('active');
                    });
                    const tabButton = document.getElementById(tabId);
                    if (tabButton) {
                        tabButton.classList.add('active');
                    }
                }
            }
        };
    }

    // Append the notification to the header
    header.appendChild(notification);

    // Trigger the transition
    requestAnimationFrame(() => {
        notification.classList.add('show');
    });

    // Auto-remove the notification after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 250); // Match transition duration
        }
    }, 5000);

    // Also log the message to the status log if available
    if (log) {
        const entry = document.createElement('p');
        entry.textContent = message;
        log.appendChild(entry);
        log.scrollTop = log.scrollHeight; // Scroll to the bottom of the log
    }
}

function toggleDebugLog() {
    const statusLog = document.getElementById('status_log');
    const debugButton = document.getElementById('debug_button');

    if (statusLog.style.display === 'block') {
        statusLog.style.display = 'none';
        debugButton.classList.remove('active');
    } else {
        statusLog.style.display = 'block';
        debugButton.classList.add( 'active');
        statusLog.scrollIntoView({ behavior: 'smooth', block: 'start' }); // Smooth scrolling to the log
    }
}

// File selection logic
async function selectFile(file, listItem) {
    selectedFile = file;

    // Highlight the selected file
    document.querySelectorAll('#theta_rho_files li').forEach(li => li.classList.remove('selected'));
    listItem.classList.add('selected');

    // Update the Remove button visibility
    const removeButton = document.querySelector('#pattern-preview-container .remove-button');
    if (file.startsWith('custom_patterns/')) {
        removeButton.classList.remove('hidden');
    } else {
        removeButton.classList.add('hidden');
    }

    logMessage(`Selected file: ${file}`);
    await previewPattern(file);

    // Populate the playlist dropdown after selecting a pattern
    await populatePlaylistDropdown();
}

// Fetch and display Theta-Rho files
async function loadThetaRhoFiles() {
    try {
        const response = await fetch(apiUrl('/list_theta_rho_files'));
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const files = await response.json();
        allFiles = files;
        displayFiles(files);
    } catch (error) {
        console.error('Error loading theta-rho files:', error);
        logMessage(`Error loading files: ${error.message}`, LOG_TYPE.ERROR);
    }
}

// Display files in the UI
function displayFiles(files) {
    const ul = document.getElementById('theta_rho_files');
    if (!ul) {
        logMessage('Error: File list container not found');
        return;
    }
    ul.innerHTML = ''; // Clear existing list

    files.forEach(file => {
        const li = document.createElement('li');
        li.textContent = file;
        li.classList.add('file-item');

        // Attach file selection handler
        li.onclick = () => selectFile(file, li);

        ul.appendChild(li);
    });
}

// Filter files by search input
function searchPatternFiles() {
    const searchInput = document.getElementById('search_pattern').value.toLowerCase();
    const filteredFiles = allFiles.filter(file => file.toLowerCase().includes(searchInput));
    displayFiles(filteredFiles);
}

// Upload a new Theta-Rho file
async function uploadThetaRho() {
    const fileInput = document.getElementById('upload_file');
    const file = fileInput.files[0];
    
    if (!file) {
        logMessage('Please select a file to upload', LOG_TYPE.WARNING);
        return;
    }
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
        logMessage(`Uploading ${file.name}...`, LOG_TYPE.INFO);
        const response = await fetch(apiUrl('/upload_theta_rho'), {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        if (result.success) {
            logMessage(`File ${file.name} uploaded successfully`, LOG_TYPE.SUCCESS);
            loadThetaRhoFiles(); // Refresh the file list
            fileInput.value = ''; // Clear the file input
            toggleSecondaryButtons('add-pattern-container'); // Hide the upload form
        } else {
            logMessage(`Failed to upload file: ${result.message || 'Unknown error'}`, LOG_TYPE.ERROR);
        }
    } catch (error) {
        console.error('Error uploading file:', error);
        logMessage(`Error uploading file: ${error.message}`, LOG_TYPE.ERROR);
    }
}

async function runThetaRho() {
    try {
        const selectedFile = document.querySelector('#theta_rho_files li.selected');
        if (!selectedFile) {
            logMessage('No pattern selected', LOG_TYPE.WARNING);
            return;
        }

        const fileName = selectedFile.getAttribute('data-file');
        const preExecution = document.getElementById('pre_execution').value;

        logMessage(`Running pattern: ${fileName}`, LOG_TYPE.INFO);

        const response = await fetch(apiUrl('/run_theta_rho'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                file_name: fileName,
                pre_execution: preExecution
            })
        });

        // Check if the response is OK before trying to parse JSON
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to run pattern: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();

        if (data.success) {
            logMessage(`Pattern ${fileName} started successfully`, LOG_TYPE.SUCCESS);
            document.body.classList.add('playing');
        } else {
            logMessage(`Failed to run pattern: ${data.detail || 'Unknown error'}`, LOG_TYPE.ERROR);
        }
    } catch (error) {
        console.error('Error running pattern:', error);
        logMessage(`Error running pattern: ${error.message}`, LOG_TYPE.ERROR);
    }
}

async function stopExecution() {
    try {
        const response = await fetch(apiUrl('/stop_execution'), { method: 'POST' });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        if (result.success) {
            logMessage('Execution stopped', LOG_TYPE.SUCCESS);
            document.body.classList.remove('playing');
            hideCurrentlyPlaying();
        } else {
            logMessage(`Failed to stop execution: ${result.detail || 'Unknown error'}`, LOG_TYPE.ERROR);
        }
    } catch (error) {
        console.error('Error stopping execution:', error);
        logMessage(`Error stopping execution: ${error.message}`, LOG_TYPE.ERROR);
    }
}

let isPaused = false;

function togglePausePlay() {
    const button = document.getElementById('pausePlayCurrent');
    const isPaused = button.querySelector('i').classList.contains('fa-play');
    
    if (isPaused) {
        // Resume execution
        fetch(apiUrl('/resume_execution'), { method: 'POST' })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    button.querySelector('i').classList.remove('fa-play');
                    button.querySelector('i').classList.add('fa-pause');
                    logMessage('Execution resumed', LOG_TYPE.SUCCESS);
                }
            })
            .catch(error => {
                logMessage(`Error resuming execution: ${error.message}`, LOG_TYPE.ERROR);
            });
    } else {
        // Pause execution
        fetch(apiUrl('/pause_execution'), { method: 'POST' })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    button.querySelector('i').classList.remove('fa-pause');
                    button.querySelector('i').classList.add('fa-play');
                    logMessage('Execution paused', LOG_TYPE.SUCCESS);
                }
            })
            .catch(error => {
                logMessage(`Error pausing execution: ${error.message}`, LOG_TYPE.ERROR);
            });
    }
}

function removeCurrentPattern() {
    if (!selectedFile) {
        logMessage('No file selected to remove.', LOG_TYPE.ERROR);
        return;
    }

    if (!selectedFile.startsWith('custom_patterns/')) {
        logMessage('Only custom patterns can be removed.', LOG_TYPE.WARNING);
        return;
    }

    removeCustomPattern(selectedFile);
}

// Delete the selected file
async function removeCustomPattern(fileName) {
    const userConfirmed = confirm(`Are you sure you want to delete the pattern "${fileName}"?`);
    if (!userConfirmed) return;

    try {
        logMessage(`Deleting pattern: ${fileName}...`);
        const response = await fetch(apiUrl('/delete_theta_rho_file'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ file_name: fileName })
        });

        const result = await response.json();
        if (result.success) {
            logMessage(`File deleted successfully: ${selectedFile}`, LOG_TYPE.SUCCESS);

            // Close the preview container
            const previewContainer = document.getElementById('pattern-preview-container');
            if (previewContainer) {
                previewContainer.classList.add('hidden');
                previewContainer.classList.remove('visible');
            }

            // Clear the selected file and refresh the file list
            selectedFile = null;
            await loadThetaRhoFiles(); // Refresh the file list
        } else {
            logMessage(`Failed to delete pattern "${fileName}": ${result.error}`, LOG_TYPE.ERROR);
        }
    } catch (error) {
        logMessage(`Error deleting pattern: ${error.message}`);
    }
}

// Preview a Theta-Rho file
async function previewPattern(fileName, containerId = 'pattern-preview-container') {
    try {
        logMessage(`Fetching data to preview file: ${fileName}...`);
        const response = await fetch(apiUrl('/preview_thr'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ file_name: fileName })
        });

        const result = await response.json();
        if (result.success) {
            // Mirror the theta values in the coordinates
            const coordinates = result.coordinates.map(coord => [
                (coord[0] < Math.PI) ? 
                    Math.PI - coord[0] : // For first half
                    3 * Math.PI - coord[0], // For second half
                coord[1]
            ]);

            // Render the pattern in the specified container
            const canvasId = containerId === 'currently-playing-container'
                ? 'currentlyPlayingCanvas'
                : 'patternPreviewCanvas';
            renderPattern(coordinates, canvasId);

            // Update coordinate display
            const firstCoordElement = document.getElementById('first_coordinate');
            const lastCoordElement = document.getElementById('last_coordinate');

            if (firstCoordElement) {
                const firstCoord = coordinates[0];
                firstCoordElement.textContent = `First Coordinate: θ=${firstCoord[0].toFixed(2)}, ρ=${firstCoord[1].toFixed(2)}`;
            } else {
                logMessage('First coordinate element not found.', LOG_TYPE.WARNING);
            }

            if (lastCoordElement) {
                const lastCoord = coordinates[coordinates.length - 1];
                lastCoordElement.textContent = `Last Coordinate: θ=${lastCoord[0].toFixed(2)}, ρ=${lastCoord[1].toFixed(2)}`;
            } else {
                logMessage('Last coordinate element not found.', LOG_TYPE.WARNING);
            }

            // Show the preview container
            const previewContainer = document.getElementById(containerId);
            if (previewContainer) {
                previewContainer.classList.remove('hidden');
                previewContainer.classList.add('visible');
            } else {
                logMessage(`Preview container not found: ${containerId}`, LOG_TYPE.ERROR);
            }
        } else {
            logMessage(`Failed to fetch preview for file: ${fileName}`, LOG_TYPE.WARNING);
        }
    } catch (error) {
        logMessage(`Error previewing pattern: ${error.message}`, LOG_TYPE.ERROR);
    }
}

// Render the pattern on a canvas
function renderPattern(coordinates, canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
        logMessage(`Canvas element not found: ${canvasId}`, LOG_TYPE.ERROR);
        return;
    }

    if (!(canvas instanceof HTMLCanvasElement)) {
        logMessage(`Element with ID "${canvasId}" is not a canvas.`, LOG_TYPE.ERROR);
        return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
        logMessage(`Could not get 2D context for canvas: ${canvasId}`, LOG_TYPE.ERROR);
        return;
    }

    // Account for device pixel ratio
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;  // Scale canvas width for high DPI
    canvas.height = rect.height * dpr;  // Scale canvas height for high DPI

    ctx.scale(dpr, dpr);  // Scale drawing context

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const centerX = rect.width / 2;  // Use bounding client rect dimensions
    const centerY = rect.height / 2;
    const maxRho = Math.max(...coordinates.map(coord => coord[1]));
    const scale = Math.min(rect.width, rect.height) / (2 * maxRho); // Scale to fit

    ctx.beginPath();
    ctx.strokeStyle = 'white';
    coordinates.forEach(([theta, rho], index) => {
        const x = centerX + rho * Math.cos(theta) * scale;
        const y = centerY - rho * Math.sin(theta) * scale;
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.stroke();
}


async function moveToCenter() {
    logMessage('Moving to center...', LOG_TYPE.INFO);
    const response = await fetch(apiUrl('/move_to_center'), { method: 'POST' });
    const result = await response.json();
    if (result.success) {
        logMessage('Moved to center successfully.', LOG_TYPE.SUCCESS);
    } else {
        logMessage(`Failed to move to center: ${result.error}`, LOG_TYPE.ERROR);
    }
}

async function moveToPerimeter() {
    logMessage('Moving to perimeter...', LOG_TYPE.INFO);
    const response = await fetch(apiUrl('/move_to_perimeter'), { method: 'POST' });
    const result = await response.json();
    if (result.success) {
        logMessage('Moved to perimeter successfully.', LOG_TYPE.SUCCESS);
    } else {
        logMessage(`Failed to move to perimeter: ${result.error}`, LOG_TYPE.ERROR);
    }
}

async function sendCoordinate() {
    const theta = parseFloat(document.getElementById('theta_input').value);
    const rho = parseFloat(document.getElementById('rho_input').value);

    if (isNaN(theta) || isNaN(rho)) {
        logMessage('Invalid input: θ and ρ must be numbers.', LOG_TYPE.ERROR);
        return;
    }

    logMessage(`Sending coordinate: θ=${theta}, ρ=${rho}...`);
    const response = await fetch(apiUrl('/send_coordinate'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theta, rho })
    });

    const result = await response.json();
    if (result.success) {
        logMessage(`Coordinate executed successfully: θ=${theta}, ρ=${rho}`, LOG_TYPE.SUCCESS);
    } else {
        logMessage(`Failed to execute coordinate: ${result.error}`, LOG_TYPE.ERROR);
    }
}

async function sendHomeCommand() {
    const response = await fetch(apiUrl('/send_home'), { method: 'POST' });
    const result = await response.json();
    if (result.success) {
        logMessage('HOME command sent successfully.', LOG_TYPE.SUCCESS);
    } else {
        logMessage('Failed to send HOME command.', LOG_TYPE.ERROR);
    }
}

async function runClearIn() {
    logMessage('Running clear from center pattern...', LOG_TYPE.INFO);
    try {
        const response = await fetch(apiUrl('/run_theta_rho'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                file_name: 'clear_from_in.thr',
                pre_execution: 'none'
            })
        });
        
        if (!response.ok) {
            if (response.status === 409) {
                logMessage('Cannot start pattern: Another pattern is already running', LOG_TYPE.WARNING);
                return;
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        if (result.success) {
            logMessage('Clear from center pattern started', LOG_TYPE.SUCCESS);
        } else {
            logMessage('Failed to run clear pattern', LOG_TYPE.ERROR);
        }
    } catch (error) {
        logMessage(`Error running clear pattern: ${error}`, LOG_TYPE.ERROR);
    }
}

async function runClearOut() {
    logMessage('Running clear from perimeter pattern...', LOG_TYPE.INFO);
    try {
        const response = await fetch(apiUrl('/run_theta_rho'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                file_name: 'clear_from_out.thr',
                pre_execution: 'none'
            })
        });
        
        if (!response.ok) {
            if (response.status === 409) {
                logMessage('Cannot start pattern: Another pattern is already running', LOG_TYPE.WARNING);
                return;
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        if (result.success) {
            logMessage('Clear from perimeter pattern started', LOG_TYPE.SUCCESS);
        } else {
            logMessage('Failed to run clear pattern', LOG_TYPE.ERROR);
        }
    } catch (error) {
        logMessage(`Error running clear pattern: ${error}`, LOG_TYPE.ERROR);
    }
}

async function runClearSide() {
    logMessage('Running clear sideways pattern...', LOG_TYPE.INFO);
    try {
        const response = await fetch(apiUrl('/run_theta_rho'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                file_name: 'clear_sideway.thr',
                pre_execution: 'none'
            })
        });
        
        if (!response.ok) {
            if (response.status === 409) {
                logMessage('Cannot start pattern: Another pattern is already running', LOG_TYPE.WARNING);
                return;
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        if (result.success) {
            logMessage('Clear sideways pattern started', LOG_TYPE.SUCCESS);
        } else {
            logMessage('Failed to run clear pattern', LOG_TYPE.ERROR);
        }
    } catch (error) {
        logMessage(`Error running clear pattern: ${error}`, LOG_TYPE.ERROR);
    }
}

let scrollPosition = 0;

function scrollSelection(direction) {
    const container = document.getElementById('clear_selection');
    const itemHeight = 50; // Adjust based on CSS height
    const maxScroll = container.children.length - 1;

    // Update scroll position
    scrollPosition += direction;
    scrollPosition = Math.max(0, Math.min(scrollPosition, maxScroll));

    // Update the transform to scroll items
    container.style.transform = `translateY(-${scrollPosition * itemHeight}px)`;
    setCookie('clear_action_index', scrollPosition, 365);
}

function executeClearAction(actionFunction) {
    // Save the new action to a cookie (optional)
    setCookie('clear_action', actionFunction, 365);

    if (actionFunction && typeof window[actionFunction] === 'function') {
        window[actionFunction](); // Execute the selected clear action
    } else {
        logMessage('No clear action selected or function not found.', LOG_TYPE.ERROR);
    }
}

async function runFile(fileName) {
    const response = await fetch(apiUrl(`/run_theta_rho_file/${fileName}`), { method: 'POST' });
    const result = await response.json();
    if (result.success) {
        logMessage(`Running file: ${fileName}`, LOG_TYPE.SUCCESS);
    } else {
        logMessage(`Failed to run file: ${fileName}`, LOG_TYPE.ERROR);
    }
}

// Connection Status
async function checkSerialStatus() {
    try {
        const response = await fetch(apiUrl('/serial_status'));
        
        // Check if the response is OK before trying to parse JSON
        if (!response.ok) {
            console.log(`Failed to check serial status (status: ${response.status})`);
            updateSerialUIDisconnected();
            return; // Exit early if the request failed
        }
        
        const status = await response.json();
        const statusElement = document.getElementById('serial_status');
        const statusHeaderElement = document.getElementById('connection_status_header');
        const serialPortsContainer = document.getElementById('serial_ports_container');
        const selectElement = document.getElementById('serial_ports');

        const connectButton = document.querySelector('button[onclick="connectSerial()"]');
        const disconnectButton = document.querySelector('button[onclick="disconnectSerial()"]');
        const restartButton = document.querySelector('button[onclick="restartSerial()"]');

        if (status.connected) {
            const port = status.port || 'Unknown'; // Fallback if port is undefined
            if (statusElement) {
                statusElement.textContent = `Connected to ${port}`;
                statusElement.classList.add('connected');
                statusElement.classList.remove('not-connected');
            }
            logMessage(`Connected to serial port: ${port}`);

            // Update header status
            if (statusHeaderElement) {
                statusHeaderElement.classList.add('connected');
                statusHeaderElement.classList.remove('not-connected');
            }
            
            // Update button states
            if (connectButton) connectButton.disabled = true;
            if (disconnectButton) disconnectButton.disabled = false;
            if (restartButton) restartButton.disabled = false;
            
            // Hide serial ports dropdown when connected
            if (serialPortsContainer) serialPortsContainer.style.display = 'none';
        } else {
            updateSerialUIDisconnected();
        }
    } catch (error) {
        console.log(`Error checking serial status: ${error.message}`);
        updateSerialUIDisconnected();
    }
}

// Helper function to update UI for disconnected state
function updateSerialUIDisconnected() {
    const statusElement = document.getElementById('serial_status');
    const statusHeaderElement = document.getElementById('connection_status_header');
    const serialPortsContainer = document.getElementById('serial_ports_container');
    const connectButton = document.querySelector('button[onclick="connectSerial()"]');
    const disconnectButton = document.querySelector('button[onclick="disconnectSerial()"]');
    const restartButton = document.querySelector('button[onclick="restartSerial()"]');
    
    if (statusElement) {
        statusElement.textContent = 'Not connected';
        statusElement.classList.remove('connected');
        statusElement.classList.add('not-connected');
    }
    
    if (statusHeaderElement) {
        statusHeaderElement.classList.remove('connected');
        statusHeaderElement.classList.add('not-connected');
    }
    
    // Update button states
    if (connectButton) connectButton.disabled = false;
    if (disconnectButton) disconnectButton.disabled = true;
    if (restartButton) restartButton.disabled = true;
    
    // Show serial ports dropdown when disconnected
    if (serialPortsContainer) serialPortsContainer.style.display = 'block';
    
    // Load serial ports
    loadSerialPorts();
}

async function loadSerialPorts() {
    try {
        const response = await fetch(apiUrl('/list_serial_ports'));
        
        // Check if the response is OK before trying to parse JSON
        if (!response.ok) {
            console.log(`Failed to load serial ports (status: ${response.status})`);
            return; // Exit early if the request failed
        }
        
        const ports = await response.json();
        const select = document.getElementById('serial_ports');
        
        if (!select) {
            console.log('Serial ports select element not found');
            return;
        }
        
        select.innerHTML = '';
        
        if (ports && Array.isArray(ports) && ports.length > 0) {
            ports.forEach(port => {
                const option = document.createElement('option');
                option.value = port;
                option.textContent = port;
                select.appendChild(option);
            });
            logMessage('Serial ports loaded.');
        } else {
            // Add a placeholder option if no ports are available
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'No serial ports available';
            option.disabled = true;
            option.selected = true;
            select.appendChild(option);
            logMessage('No serial ports available.', LOG_TYPE.WARNING);
        }
    } catch (error) {
        console.log(`Error loading serial ports: ${error.message}`);
        // Don't show error message to user as this is expected behavior in some environments
    }
}

async function connectSerial() {
    try {
        const serialPortSelect = document.getElementById('serial_ports');
        
        if (!serialPortSelect) {
            logMessage('Serial port select element not found', LOG_TYPE.ERROR);
            return;
        }
        
        const selectedPort = serialPortSelect.value;
        
        if (!selectedPort) {
            logMessage('No port selected', LOG_TYPE.WARNING);
            return;
        }
        
        logMessage(`Connecting to port: ${selectedPort}`, LOG_TYPE.INFO);
        
        const response = await fetch(apiUrl('/connect'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ port: selectedPort })
        });
        
        // Check if the response is OK before trying to parse JSON
        if (!response.ok) {
            const errorText = await response.text();
            logMessage(`Failed to connect: ${response.status} ${response.statusText} - ${errorText}`, LOG_TYPE.ERROR);
            return;
        }
        
        const data = await response.json();
        
        if (data.success) {
            logMessage(`Connected to port ${selectedPort} successfully`, LOG_TYPE.SUCCESS);
            checkSerialStatus();
        } else {
            logMessage(`Failed to connect: ${data.detail || 'Unknown error'}`, LOG_TYPE.ERROR);
        }
    } catch (error) {
        console.error('Error connecting to serial port:', error);
        logMessage(`Error connecting to serial port: ${error.message}`, LOG_TYPE.ERROR);
    }
}

async function disconnectSerial() {
    try {
        logMessage('Disconnecting serial port...', LOG_TYPE.INFO);
        
        const response = await fetch(apiUrl('/disconnect'), { method: 'POST' });
        
        // Check if the response is OK before trying to parse JSON
        if (!response.ok) {
            const errorText = await response.text();
            logMessage(`Failed to disconnect: ${errorText || response.statusText}`, LOG_TYPE.ERROR);
            return; // Exit early if the request failed
        }
        
        const result = await response.json();
        
        if (result.success) {
            logMessage('Serial port disconnected.', LOG_TYPE.SUCCESS);
            // Refresh the status
            checkSerialStatus();
        } else {
            logMessage(`Error disconnecting: ${result.detail || 'Unknown error'}`, LOG_TYPE.ERROR);
        }
    } catch (error) {
        logMessage(`Error disconnecting serial port: ${error.message}`, LOG_TYPE.ERROR);
    }
}

async function restartSerial() {
    try {
        const portSelect = document.getElementById('serial_ports');
        
        if (!portSelect) {
            logMessage('Serial port select element not found', LOG_TYPE.ERROR);
            return;
        }
        
        const port = portSelect.value;
        
        if (!port) {
            logMessage('Please select a serial port', LOG_TYPE.WARNING);
            return;
        }
        
        logMessage(`Restarting connection to ${port}...`, LOG_TYPE.INFO);
        
        const response = await fetch(apiUrl('/restart_connection'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ port })
        });
        
        // Check if the response is OK before trying to parse JSON
        if (!response.ok) {
            const errorText = await response.text();
            logMessage(`Failed to restart connection: ${errorText || response.statusText}`, LOG_TYPE.ERROR);
            return; // Exit early if the request failed
        }
        
        const result = await response.json();
        
        if (result.success) {
            logMessage(`Successfully restarted connection to ${port}`, LOG_TYPE.SUCCESS);
            checkSerialStatus(); // Refresh the UI
        } else {
            logMessage(`Failed to restart connection to ${port}: ${result.detail || 'Unknown error'}`, LOG_TYPE.ERROR);
        }
    } catch (error) {
        logMessage(`Error restarting serial connection: ${error.message}`, LOG_TYPE.ERROR);
    }
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//  Firmware / Software Updater
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
async function checkForUpdates() {
    try {
        const response = await fetch(apiUrl('/check_software_update'));
        
        // Check if the response is OK before trying to parse JSON
        if (!response.ok) {
            console.log(`Failed to check for updates (status: ${response.status})`);
            return; // Exit early if the request failed
        }
        
        const data = await response.json();

        // Handle updates available logic
        if (data.updates_available) {
            const updateButton = document.getElementById('update-software-btn');
            const updateLinkElement = document.getElementById('update_link');
            const tagLink = `https://github.com/tuanchris/dune-weaver/releases/tag/${data.latest_remote_tag}`;

            if (updateButton) {
                updateButton.classList.remove('hidden'); // Show the button
            }
            
            logMessage("Software Update Available", LOG_TYPE.INFO, 'open-settings-button');

            if (updateLinkElement) {
                updateLinkElement.innerHTML = `<a href="${tagLink}" target="_blank">View Release Notes </a>`;
                updateLinkElement.classList.remove('hidden'); // Show the link
            }
        }

        // Update current and latest version in the UI
        const currentVersionElem = document.getElementById('current_git_version');
        const latestVersionElem = document.getElementById('latest_git_version');
        
        if (currentVersionElem) {
            currentVersionElem.textContent = data.current_version || 'Unknown';
        }
        
        if (latestVersionElem) {
            latestVersionElem.textContent = data.latest_remote_tag || 'Unknown';
        }
    } catch (error) {
        console.log(`Error checking for updates: ${error.message}`);
        // Don't show error message to user as this is not critical functionality
    }
}

async function updateSoftware() {
    const updateButton = document.getElementById('update-software-btn');
    
    if (!updateButton) {
        logMessage('Update button not found', LOG_TYPE.ERROR);
        return;
    }

    try {
        // Disable the button and update the text
        updateButton.disabled = true;
        const buttonSpan = updateButton.querySelector('span');
        if (buttonSpan) {
            buttonSpan.textContent = 'Updating...';
        }

        logMessage('Starting software update...', LOG_TYPE.INFO);
        
        const response = await fetch(apiUrl('/update_software'), { method: 'POST' });
        
        // Check if the response is OK before trying to parse JSON
        if (!response.ok) {
            const errorText = await response.text();
            logMessage(`Failed to update software: ${errorText || response.statusText}`, LOG_TYPE.ERROR);
            
            // Re-enable the button and restore text
            updateButton.disabled = false;
            if (buttonSpan) {
                buttonSpan.textContent = 'Update Software';
            }
            return;
        }
        
        const data = await response.json();

        if (data.success) {
            logMessage('Software updated successfully! Reloading page...', LOG_TYPE.SUCCESS);
            setTimeout(() => window.location.reload(), 3000); // Reload after 3 seconds
        } else {
            logMessage(`Failed to update software: ${data.error || 'Unknown error'}`, LOG_TYPE.ERROR);
            
            // Re-enable the button and restore text
            updateButton.disabled = false;
            if (buttonSpan) {
                buttonSpan.textContent = 'Update Software';
            }
        }
    } catch (error) {
        logMessage(`Error updating software: ${error.message}`, LOG_TYPE.ERROR);
        console.error('Error updating software:', error);
        
        // Re-enable the button and restore text
        if (updateButton) {
            updateButton.disabled = false;
            const buttonSpan = updateButton.querySelector('span');
            if (buttonSpan) {
                buttonSpan.textContent = 'Update Software';
            }
        }
    }
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//  PART A: Loading / listing playlists from the server
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

async function loadAllPlaylists() {
    try {
        const response = await fetch(apiUrl('/list_all_playlists')); // GET
        const allPlaylists = await response.json();          // e.g. ["My Playlist", "Summer", ...]
        displayAllPlaylists(allPlaylists);
    } catch (err) {
        logMessage(`Error loading playlists: ${err}`, LOG_TYPE.ERROR);
    }
}

// Function to display all playlists with Load, Run, and Delete buttons
function displayAllPlaylists(playlists) {
    const ul = document.getElementById('all_playlists');
    ul.innerHTML = ''; // Clear current list

    if (playlists.length === 0) {
        // Add a placeholder if the list is empty
        const emptyLi = document.createElement('li');
        emptyLi.textContent = "You don't have any playlists yet.";
        emptyLi.classList.add('empty-placeholder'); // Optional: Add a class for styling
        ul.appendChild(emptyLi);
        return;
    }

    playlists.forEach(playlistName => {
        const li = document.createElement('li');
        li.textContent = playlistName;
        li.classList.add('playlist-item'); // Add a class for styling

        // Attach click event to handle selection
        li.onclick = () => {
            // Remove 'selected' class from all items
            document.querySelectorAll('#all_playlists li').forEach(item => {
                item.classList.remove('selected');
            });

            // Add 'selected' class to the clicked item
            li.classList.add('selected');

            // Open the playlist editor for the selected playlist
            openPlaylistEditor(playlistName);
        };

        ul.appendChild(li);
    });
}

// Cancel changes and close the editor
function cancelPlaylistChanges() {
    playlist = [...originalPlaylist]; // Revert to the original playlist
    isPlaylistChanged = false;
    toggleSaveCancelButtons(false); // Hide the save and cancel buttons
    refreshPlaylistUI(); // Refresh the UI with the original state
    closeStickySection('playlist-editor'); // Close the editor
}

// Open the playlist editor
function openPlaylistEditor(playlistName) {
    logMessage(`Opening editor for playlist: ${playlistName}`);
    const editorSection = document.getElementById('playlist-editor');

    // Update the displayed playlist name
    document.getElementById('playlist_name_display').textContent = playlistName;

    // Store the current playlist name for renaming
    document.getElementById('playlist_name_input').value = playlistName;

    editorSection.classList.remove('hidden');
    editorSection.classList.add('visible');

    loadPlaylist(playlistName);
}

function clearSchedule() {
    document.getElementById("start_time").value = "";
    document.getElementById("end_time").value = "";
    document.getElementById('clear_time').style.display = 'none';
    setCookie('start_time', '', 365);
    setCookie('end_time', '', 365);
}

// Function to run the selected playlist with specified parameters
async function runPlaylist() {
    const playlistName = document.getElementById('playlist_name_display').textContent;
    if (!playlistName) {
        logMessage('No playlist selected', 'error');
        return;
    }

    const pauseTime = parseFloat(document.getElementById('pause_time').value) || 0;
    const clearPattern = document.getElementById('clear_pattern').value;
    const runMode = document.querySelector('input[name="run_mode"]:checked').value;
    const shuffle = document.getElementById('shuffle_playlist').checked;

    try {
        const response = await fetch(apiUrl('/run_playlist'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                playlist_name: playlistName,
                pause_time: pauseTime,
                clear_pattern: clearPattern,
                run_mode: runMode,
                shuffle: shuffle
            })
        });

        if (!response.ok) {
            if (response.status === 409) {
                logMessage('Another pattern is already running', 'warning');
            } else {
                const errorData = await response.json();
                logMessage(errorData.detail || 'Failed to run playlist', 'error');
            }
            return;
        }

        // Connect WebSocket when starting a playlist
        connectStatusWebSocket();
        
        logMessage(`Started playlist: ${playlistName}`, 'success');
        // Close the playlist editor container after successfully starting the playlist
        closeStickySection('playlist-editor');
    } catch (error) {
        logMessage('Error running playlist: ' + error, 'error');
    }
}

// Track changes in the playlist
let originalPlaylist = [];
let isPlaylistChanged = false;

// Load playlist and set the original state
async function loadPlaylist(playlistName) {
    try {
        logMessage(`Loading playlist: ${playlistName}`);
        const response = await fetch(apiUrl(`/get_playlist?name=${encodeURIComponent(playlistName)}`));

        const data = await response.json();

        if (!data.name) {
            throw new Error('Playlist name is missing in the response.');
        }

        // Populate playlist items and set original state
        playlist = data.files || [];
        originalPlaylist = [...playlist]; // Clone the playlist as the original
        isPlaylistChanged = false; // Reset change tracking
        toggleSaveCancelButtons(false); // Hide the save and cancel buttons initially
        refreshPlaylistUI();
        logMessage(`Loaded playlist: "${playlistName}" with ${playlist.length} file(s).`);
    } catch (err) {
        logMessage(`Error loading playlist: ${err.message}`, LOG_TYPE.ERROR);
        console.error('Error details:', err);
    }
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//  PART B: Creating or Saving (Overwriting) a Playlist
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// Instead of separate create/modify functions, we'll unify them:
async function savePlaylist() {
    const name =  document.getElementById('playlist_name_display').textContent
    if (!name) {
        logMessage("Please enter a playlist name.");
        return;
    }
    if (playlist.length === 0) {
        logMessage("No files in this playlist. Add files first.");
        return;
    }

    logMessage(`Saving playlist "${name}" with ${playlist.length} file(s)...`);

    try {
        // We can use /create_playlist or /modify_playlist. They do roughly the same in our single-file approach.
        // Let's use /create_playlist to always overwrite or create anew.
        const response = await fetch(apiUrl('/create_playlist'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                playlist_name: name,
                files: playlist
            })
        });
        const result = await response.json();
        if (result.success) {
            logMessage(`Playlist "${name}" with ${playlist.length} patterns saved`, LOG_TYPE.SUCCESS);
            // Reload the entire list of playlists to reflect changes
            // Check for changes and refresh the UI
            detectPlaylistChanges();
            refreshPlaylistUI();

            // Restore default action buttons
            toggleSaveCancelButtons(false);
        } else {
            logMessage(`Failed to save playlist: ${result.error}`, LOG_TYPE.ERROR);
        }
    } catch (err) {
        logMessage(`Error saving playlist: ${err}`);
    }
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//  PART C: Renaming and Deleting a playlist
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Toggle the rename playlist input
function populatePlaylistDropdown() {
    return fetch(apiUrl('/list_all_playlists'))
        .then(response => response.json())
        .then(playlists => {
            const select = document.getElementById('select-playlist');
            select.innerHTML = ''; // Clear existing options

            // Retrieve the saved playlist from the cookie
            const savedPlaylist = getCookie('selected_playlist');

            // Check if there are playlists available
            if (playlists.length === 0) {
                // Add a placeholder option if no playlists are available
                const placeholderOption = document.createElement('option');
                placeholderOption.value = '';
                placeholderOption.textContent = 'No playlists available';
                placeholderOption.disabled = true; // Prevent selection
                placeholderOption.selected = true; // Set as default
                select.appendChild(placeholderOption);
                return;
            }

            playlists.forEach(playlist => {
                const option = document.createElement('option');
                option.value = playlist;
                option.textContent = playlist;

                // Mark the saved playlist as selected
                if (playlist === savedPlaylist) {
                    option.selected = true;
                }

                select.appendChild(option);
            });

            // Attach the onchange event listener after populating the dropdown
            select.addEventListener('change', function () {
                const selectedPlaylist = this.value;
                setCookie('selected_playlist', selectedPlaylist, 365); // Save to cookie
                logMessage(`Selected playlist saved: ${selectedPlaylist}`);
            });

            logMessage('Playlist dropdown populated, event listener attached, and saved playlist restored.');
        })
        .catch(error => logMessage(`Error fetching playlists: ${error.message}`));
}
populatePlaylistDropdown().then(() => {
    loadSettingsFromCookies(); // Restore selected playlist after populating the dropdown
});

// Confirm and save the renamed playlist
async function confirmAddPlaylist() {
    const playlistNameInput = document.getElementById('new_playlist_name');
    const playlistName = playlistNameInput.value.trim();

    if (!playlistName) {
        logMessage('Playlist name cannot be empty.', LOG_TYPE.ERROR);
        return;
    }

    try {
        logMessage(`Adding new playlist: "${playlistName}"...`);
        const response = await fetch(apiUrl('/create_playlist'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                playlist_name: playlistName,
                files: [] // New playlist starts empty
            })
        });

        const result = await response.json();
        if (result.success) {
            logMessage(`Playlist "${playlistName}" created successfully.`,  LOG_TYPE.SUCCESS);

            // Clear the input field
            playlistNameInput.value = '';

            // Refresh the playlist list
            loadAllPlaylists();
            populatePlaylistDropdown();

            // Hide the add playlist container
            toggleSecondaryButtons('add-playlist-container');
        } else {
            logMessage(`Failed to create playlist: ${result.error}`, LOG_TYPE.ERROR);
        }
    } catch (error) {
        logMessage(`Error creating playlist: ${error.message}`);
    }
}


async function confirmRenamePlaylist() {
    const newName = document.getElementById('playlist_name_input').value.trim();
    const currentName = document.getElementById('playlist_name_display').textContent;

    if (!newName) {
        logMessage("New playlist name cannot be empty.", LOG_TYPE.ERROR);
        return;
    }

    if (newName === currentName) {
        logMessage("New playlist name is the same as the current name. No changes made.",  LOG_TYPE.WARNING);
        toggleSecondaryButtons('rename-playlist-container'); // Close the rename container
        return;
    }

    try {
        // Step 1: Create/Modify the playlist with the new name
        const createResponse = await fetch(apiUrl('/modify_playlist'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                playlist_name: newName,
                files: playlist // Ensure `playlist` contains the current list of files
            })
        });

        const createResult = await createResponse.json();
        if (createResult.success) {
            logMessage(createResult.message, LOG_TYPE.SUCCESS);

            // Step 2: Delete the old playlist
            const deleteResponse = await fetch(apiUrl('/delete_playlist'), {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ playlist_name: currentName })
            });

            const deleteResult = await deleteResponse.json();
            if (deleteResult.success) {
                logMessage(deleteResult.message);

                // Update the UI with the new name
                document.getElementById('playlist_name_display').textContent = newName;

                // Refresh playlists list
                loadAllPlaylists();

                // Close the rename container and restore original action buttons
                toggleSecondaryButtons('rename-playlist-container');
            } else {
                logMessage(`Failed to delete old playlist: ${deleteResult.error}`, LOG_TYPE.ERROR);
            }
        } else {
            logMessage(`Failed to rename playlist: ${createResult.error}`, LOG_TYPE.ERROR);
        }
    } catch (error) {
        logMessage(`Error renaming playlist: ${error.message}`);
    }
}

// Delete the currently opened playlist
async function deleteCurrentPlaylist() {
    const playlistName = document.getElementById('playlist_name_display').textContent;

    if (!confirm(`Are you sure you want to delete the playlist "${playlistName}"? This action cannot be undone.`)) {
        return;
    }

    try {
        const response = await fetch(apiUrl('/delete_playlist'), {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ playlist_name: playlistName })
        });

        const result = await response.json();
        if (result.success) {
            logMessage(`Playlist "${playlistName}" deleted.`, LOG_TYPE.INFO);
            closeStickySection('playlist-editor');
            loadAllPlaylists();
            populatePlaylistDropdown();
        } else {
            logMessage(`Failed to delete playlist: ${result.error}`,  LOG_TYPE.ERROR);
        }
    } catch (error) {
        logMessage(`Error deleting playlist: ${error.message}`);
    }
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//  PART D: Local playlist array UI
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// Refresh the playlist UI and detect changes
function refreshPlaylistUI() {
    const ul = document.getElementById('playlist_items');
    if (!ul) {
        logMessage('Error: Playlist container not found');
        return;
    }
    ul.innerHTML = ''; // Clear existing items

    if (playlist.length === 0) {
        // Add a placeholder if the playlist is empty
        const emptyLi = document.createElement('li');
        emptyLi.textContent = 'No items in the playlist.';
        emptyLi.classList.add('empty-placeholder'); // Optional: Add a class for styling
        ul.appendChild(emptyLi);
        return;
    }

    playlist.forEach((file, index) => {
        const li = document.createElement('li');

        // Add filename in a span
        const filenameSpan = document.createElement('span');
        filenameSpan.textContent = file;
        filenameSpan.classList.add('filename'); // Add a class for styling
        li.appendChild(filenameSpan);

        // Move Up button
        const moveUpBtn = document.createElement('button');
        moveUpBtn.innerHTML = '<i class="fa-solid fa-turn-up"></i>'; // Up arrow symbol
        moveUpBtn.classList.add('move-button');
        moveUpBtn.onclick = () => {
            if (index > 0) {
                const temp = playlist[index - 1];
                playlist[index - 1] = playlist[index];
                playlist[index] = temp;
                detectPlaylistChanges(); // Check for changes
                refreshPlaylistUI();
            }
        };
        li.appendChild(moveUpBtn);

        // Move Down button
        const moveDownBtn = document.createElement('button');
        moveDownBtn.innerHTML = '<i class="fa-solid fa-turn-down"></i>'; // Down arrow symbol
        moveDownBtn.classList.add('move-button');
        moveDownBtn.onclick = () => {
            if (index < playlist.length - 1) {
                const temp = playlist[index + 1];
                playlist[index + 1] = playlist[index];
                playlist[index] = temp;
                detectPlaylistChanges(); // Check for changes
                refreshPlaylistUI();
            }
        };
        li.appendChild(moveDownBtn);

        // Remove button
        const removeBtn = document.createElement('button');
        removeBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
        removeBtn.classList.add('remove-button');
        removeBtn.onclick = () => {
            playlist.splice(index, 1);
            detectPlaylistChanges(); // Check for changes
            refreshPlaylistUI();
        };
        li.appendChild(removeBtn);

        ul.appendChild(li);
    });
}

// Toggle the visibility of the save and cancel buttons
function toggleSaveCancelButtons(show) {
    const actionButtons = document.querySelector('#playlist-editor .action-buttons');
    if (actionButtons) {
        // Show/hide all buttons except Save and Cancel
        actionButtons.querySelectorAll('button:not(.save-cancel)').forEach(button => {
            button.style.display = show ? 'none' : 'flex';
        });

        // Show/hide Save and Cancel buttons
        actionButtons.querySelectorAll('.save-cancel').forEach(button => {
            button.style.display = show ? 'flex' : 'none';
        });
    } else {
        logMessage('Error: Action buttons container not found.', LOG_TYPE.ERROR);
    }
}

// Detect changes in the playlist
function detectPlaylistChanges() {
    isPlaylistChanged = JSON.stringify(originalPlaylist) !== JSON.stringify(playlist);
    toggleSaveCancelButtons(isPlaylistChanged);
}


// Toggle the "Add to Playlist" section
function toggleSecondaryButtons(containerId, onShowCallback = null) {
    const container = document.getElementById(containerId);
    if (!container) {
        logMessage(`Error: Element with ID "${containerId}" not found`);
        return;
    }

    // Find the .action-buttons element preceding the container
    const previousActionButtons = container.previousElementSibling?.classList.contains('action-buttons')
        ? container.previousElementSibling
        : null;

    if (container.classList.contains('hidden')) {
        // Show the container
        container.classList.remove('hidden');

        // Hide the previous .action-buttons element
        if (previousActionButtons) {
            previousActionButtons.style.display = 'none';
        }

        // Optional callback for custom logic when showing the container
        if (onShowCallback) {
            onShowCallback();
        }
    } else {
        // Hide the container
        container.classList.add('hidden');

        // Restore the previous .action-buttons element
        if (previousActionButtons) {
            previousActionButtons.style.display = 'flex';
        }
    }
}

// Add the selected pattern to the selected playlist
async function saveToPlaylist() {
    const playlist = document.getElementById('select-playlist').value;
    if (!playlist) {
        logMessage('No playlist selected.', LOG_TYPE.ERROR);
        return;
    }
    if (!selectedFile) {
        logMessage('No pattern selected to add.', LOG_TYPE.ERROR);
        return;
    }

    try {
        logMessage(`Adding pattern "${selectedFile}" to playlist "${playlist}"...`);
        const response = await fetch(apiUrl('/add_to_playlist'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ playlist_name: playlist, pattern: selectedFile })
        });

        const result = await response.json();
        if (result.success) {
            logMessage(`Pattern "${selectedFile}" successfully added to playlist "${playlist}".`, LOG_TYPE.SUCCESS);

            // Reset the UI state via toggleSecondaryButtons
            toggleSecondaryButtons('add-to-playlist-container', () => {
                const selectPlaylist = document.getElementById('select-playlist');
                selectPlaylist.value = ''; // Clear the selection
            });
        } else {
            logMessage(`Failed to add pattern to playlist: ${result.error}`, LOG_TYPE.ERROR);
        }
    } catch (error) {
        logMessage(`Error adding pattern to playlist: ${error.message}`);
    }
}

async function changeSpeed() {
    const speedInput = document.getElementById('speed_input');
    const speed = parseFloat(speedInput.value);

    if (isNaN(speed) || speed <= 0) {
        logMessage('Invalid speed. Please enter a positive number.');
        return;
    }

    logMessage(`Setting speed to: ${speed}...`);
    const response = await fetch(apiUrl('/set_speed'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ speed })
    });

    const result = await response.json();
    if (result.success) {
        document.getElementById('speed_status').textContent = `Current Speed: ${speed}`;
        logMessage(`Speed set to: ${speed}`, LOG_TYPE.SUCCESS);
    } else {
        logMessage(`Failed to set speed: ${result.error}`, LOG_TYPE.ERROR);
    }
}

// Function to close any sticky section
function closeStickySection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.classList.remove('visible');
        section.classList.remove('fullscreen');
        section.classList.add('hidden');
        // Reset the fullscreen button text if it exists
        const fullscreenButton = section.querySelector('.fullscreen-button');
        if (fullscreenButton) {
            fullscreenButton.innerHtml = '<i class="fa-solid fa-compress"></i>'; // Reset to enter fullscreen icon/text
        }

        logMessage(`Closed section: ${sectionId}`);

        if(sectionId === 'playlist-editor') {
            document.querySelectorAll('#all_playlists .playlist-item').forEach(item => {
                item.classList.remove('selected');
            });
        }

        if(sectionId === 'pattern-preview-container') {
            document.querySelectorAll('#theta_rho_files .file-item').forEach(item => {
                item.classList.remove('selected');
            });
        }

    } else {
        logMessage(`Error: Section with ID "${sectionId}" not found`);
    }
}

// Function to open any sticky section
function openStickySection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        // Toggle the 'open' class
        section.classList.toggle('open');
    } else {
        logMessage(`Error: Section with ID "${sectionId}" not found`);
    }
}

function attachFullScreenListeners() {
    // Add event listener to all fullscreen buttons
    document.querySelectorAll('.fullscreen-button').forEach(button => {
        button.addEventListener('click', function () {
            const stickySection = this.closest('.sticky'); // Find the closest sticky section
            if (stickySection) {
                // Close all other sections
                document.querySelectorAll('.sticky:not(#currently-playing-container)').forEach(section => {
                    if (section !== stickySection) {
                        section.classList.remove('fullscreen');
                        section.classList.remove('visible');
                        section.classList.add('hidden');

                        // Reset the fullscreen button text for other sections
                        const otherFullscreenButton = section.querySelector('.fullscreen-button');
                        if (otherFullscreenButton) {
                            otherFullscreenButton.innerHTML = '<i class="fa-solid fa-expand"></i>'; // Enter fullscreen icon/text
                        }
                    }
                });

                stickySection.classList.toggle('fullscreen'); // Toggle fullscreen class

                // Update button icon or text
                if (stickySection.classList.contains('fullscreen')) {
                    this.innerHTML = '<i class="fa-solid fa-compress"></i>'; // Exit fullscreen icon/text
                } else {
                    this.innerHTML = '<i class="fa-solid fa-expand"></i>'; // Enter fullscreen icon/text
                }
            } else {
                console.error('Error: Fullscreen button is not inside a sticky section.');
            }
        });
    });
}

let lastPreviewedFile = null; // Track the last previewed file



function formatSecondsToHMS(seconds) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// Function to start or stop updates based on visibility
function toggleSettings() {
    const settingsContainer = document.getElementById('settings-container');
    if (settingsContainer) {
        settingsContainer.classList.toggle('open');
    }
}

// Utility function to manage cookies
function setCookie(name, value, days) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${date.toUTCString()};path=/`;
}

function getCookie(name) {
    const nameEQ = `${name}=`;
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
        let cookie = cookies[i].trim();
        if (cookie.startsWith(nameEQ)) {
            return cookie.substring(nameEQ.length);
        }
    }
    return null;
}

// Save settings to cookies
function saveSettingsToCookies() {
    const pauseTime = document.getElementById('pause_time').value;
    const clearPattern = document.getElementById('clear_pattern').value;
    const runMode = document.querySelector('input[name="run_mode"]:checked').value;
    const shuffle = document.getElementById('shuffle_playlist').checked;

    setCookie('pause_time', pauseTime, 365);
    setCookie('clear_pattern', clearPattern, 365);
    setCookie('run_mode', runMode, 365);
    setCookie('shuffle', shuffle, 365);
}

// Load settings from cookies
function loadSettingsFromCookies() {
    const pauseTime = getCookie('pause_time');
    const pauseTimeElement = document.getElementById('pause_time');
    if (pauseTimeElement && pauseTime !== null && pauseTime !== '') {
        pauseTimeElement.value = pauseTime;
    }

    const clearPattern = getCookie('clear_pattern');
    const clearPatternElement = document.getElementById('clear_pattern');
    if (clearPatternElement && clearPattern !== null && clearPattern !== '') {
        clearPatternElement.value = clearPattern;
    }

    const runMode = getCookie('run_mode');
    if (runMode !== null && runMode !== '') {
        const runModeElement = document.querySelector(`input[name="run_mode"][value="${runMode}"]`);
        if (runModeElement) {
            runModeElement.checked = true;
        }
    }

    const shuffle = getCookie('shuffle');
    const shuffleElement = document.getElementById('shuffle_playlist');
    if (shuffleElement && shuffle !== null && shuffle !== '') {
        shuffleElement.checked = shuffle === 'true';
    }

    logMessage('Settings loaded from cookies.');
}

// Call this function to save settings when a value is changed
function attachSettingsSaveListeners() {
    // Add event listeners to inputs
    document.getElementById('pause_time').addEventListener('change', saveSettingsToCookies);
    document.getElementById('clear_pattern').addEventListener('change', saveSettingsToCookies);
    document.querySelectorAll('input[name="run_mode"]').forEach(input => {
        input.addEventListener('change', saveSettingsToCookies);
    });
    document.getElementById('shuffle_playlist').addEventListener('change', saveSettingsToCookies);
}


// Tab switching logic with cookie storage
function switchTab(tabName) {
    // Hide all tab content
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(tab => tab.style.display = 'none');
    
    // Remove active class from all tab buttons
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => button.classList.remove('active'));
    
    // Show the selected tab content
    const selectedTab = document.getElementById(`${tabName}-tab`);
    if (selectedTab) {
        selectedTab.style.display = 'flex';
        
        // Add active class to the selected tab button
        const activeNavButton = document.getElementById(`nav-${tabName}`);
        if (activeNavButton) {
            activeNavButton.classList.add('active');
        } else {
            console.error(`Error: Nav button for "${tabName}" not found.`);
        }
    }
}

function connectStatusWebSocket() {
    // If already connected, don't reconnect
    if (statusSocket && statusSocket.readyState === WebSocket.OPEN) {
        console.log('WebSocket already connected');
        return;
    }

    // If we've reached the maximum number of reconnect attempts, stop trying
    if (reconnectAttempts >= maxReconnectAttempts) {
        console.log(`Maximum reconnect attempts (${maxReconnectAttempts}) reached. Stopping reconnection.`);
        return;
    }

    try {
        // Determine WebSocket protocol (wss for HTTPS, ws for HTTP)
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        
        // For debugging
        console.log('WebSocket protocol:', protocol);
        console.log('WebSocket host:', host);
        console.log('Base URL:', baseUrl);
        
        // Clean the base URL for WebSocket connection
        let cleanBaseUrl = baseUrl;
        if (cleanBaseUrl.startsWith('/')) {
            cleanBaseUrl = cleanBaseUrl.substring(1);
        }
        if (cleanBaseUrl.endsWith('/')) {
            cleanBaseUrl = cleanBaseUrl.substring(0, cleanBaseUrl.length - 1);
        }
        
        console.log('Cleaned base URL for WebSocket:', cleanBaseUrl);
        
        // Construct the WebSocket URL
        let wsUrl;
        if (baseUrl) {
            // We're in Home Assistant, use the ingress path
            wsUrl = `${protocol}//${host}/${cleanBaseUrl}/ws/status`;
        } else {
            // Direct access
            wsUrl = `${protocol}//${host}/ws/status`;
        }
        
        console.log('WebSocket URL:', wsUrl);
        
        statusSocket = new WebSocket(wsUrl);
        
        statusSocket.onopen = () => {
            console.log('WebSocket connection established');
            wsConnected = true;
            reconnectAttempts = 0; // Reset reconnect attempts on successful connection
            
            // Clear any existing interval
            if (statusUpdateInterval) {
                clearInterval(statusUpdateInterval);
            }
            
            // Set up interval to check connection status
            statusUpdateInterval = setInterval(() => {
                if (statusSocket.readyState !== WebSocket.OPEN) {
                    console.log('WebSocket connection lost. Attempting to reconnect...');
                    wsConnected = false;
                    connectStatusWebSocket();
                }
            }, 5000); // Check every 5 seconds
        };
        
        statusSocket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'status_update') {
                    updateCurrentlyPlayingUI(data.data);
                }
            } catch (error) {
                console.error('Error parsing WebSocket message:', error);
            }
        };
        
        statusSocket.onclose = () => {
            console.log('WebSocket connection closed');
            wsConnected = false;
            
            // Clear the interval when the connection is closed
            if (statusUpdateInterval) {
                clearInterval(statusUpdateInterval);
                statusUpdateInterval = null;
            }
            
            // Attempt to reconnect after a delay
            reconnectAttempts++;
            setTimeout(() => {
                connectStatusWebSocket();
            }, 3000); // Wait 3 seconds before reconnecting
        };
        
        statusSocket.onerror = (error) => {
            console.error('WebSocket error:', error);
            wsConnected = false;
        };
    } catch (error) {
        console.error('Error setting up WebSocket:', error);
    }
}

function disconnectStatusWebSocket() {
    if (statusSocket && wsConnected) {
        wsConnected = false;
        statusSocket.close();
        statusSocket = null;
        reconnectAttempts = 0;
    }
}

// Track the last played file to detect when a new pattern starts
let lastPlayedFile = null;

function updateCurrentlyPlayingUI(status) {
    console.log('Updating UI with status:', status);

    // Get all required DOM elements once
    const container = document.getElementById('currently-playing-container');
    const fileNameElement = document.getElementById('currently-playing-file');
    const progressBar = document.getElementById('play_progress');
    const progressText = document.getElementById('play_progress_text');
    const pausePlayButton = document.getElementById('pausePlayCurrent');
    const speedDisplay = document.getElementById('current_speed_display');

    // Check if all required elements exist
    if (!container || !fileNameElement || !progressBar || !progressText) {
        console.log('Required DOM elements not found:', {
            container: !!container,
            fileNameElement: !!fileNameElement,
            progressBar: !!progressBar,
            progressText: !!progressText
        });
        setTimeout(() => updateCurrentlyPlayingUI(status), 100);
        return;
    }

    // Update container visibility based on status
    if (status.current_file && status.is_running) {
        document.body.classList.add('playing');
        container.style.display = 'flex';
        
        // Hide the preview container when a pattern is playing
        const previewContainer = document.getElementById('pattern-preview-container');
        if (previewContainer) {
            previewContainer.classList.add('hidden');
            previewContainer.classList.remove('visible');
            // Clear any selected file highlights
            document.querySelectorAll('#theta_rho_files .file-item').forEach(item => {
                item.classList.remove('selected');
            });
        }
    } else {
        document.body.classList.remove('playing');
        container.style.display = 'none';
    }

    // Update file name display
    if (status.current_file) {
        const fileName = status.current_file.replace('./patterns/', '');
        fileNameElement.textContent = fileName;
    } else {
        fileNameElement.textContent = 'No pattern playing';
    }

    // Update next file display
    const nextFileElement = document.getElementById('next-file');
    if (nextFileElement) {
        if (status.playlist && status.playlist.next_file) {
            const nextFileName = status.playlist.next_file.replace('./patterns/', '');
            nextFileElement.textContent = `(Next: ${nextFileName})`;
            nextFileElement.style.display = 'block';
        } else {
            nextFileElement.style.display = 'none';
        }
    }

    // Update speed display if it exists
    if (speedDisplay && status.speed) {
        speedDisplay.textContent = `Current Speed: ${status.speed}`;
    }

    // Update pattern preview if it's a new pattern
    if (status.current_file && lastPlayedFile !== status.current_file) {
        lastPlayedFile = status.current_file;
        const cleanFileName = status.current_file.replace('./patterns/', '');
        previewPattern(cleanFileName, 'currently-playing-container');
    }

    // Update progress information
    if (status.progress) {
        const { percentage, remaining_time, elapsed_time } = status.progress;
        const formattedPercentage = percentage.toFixed(1);
        const remainingText = remaining_time === null ? 'calculating...' : formatSecondsToHMS(remaining_time);
        const elapsedText = formatSecondsToHMS(elapsed_time);

        progressBar.value = formattedPercentage;
        progressText.textContent = `${formattedPercentage}% (Elapsed: ${elapsedText} | Remaining: ${remainingText})`;
    } else {
        progressBar.value = 0;
        progressText.textContent = '0%';
    }

    // Update pause/play button if it exists
    if (pausePlayButton) {
        pausePlayButton.innerHTML = status.is_paused ? 
            '<i class="fa-solid fa-play"></i>' : 
            '<i class="fa-solid fa-pause"></i>';
    }
}

// Initialize WebSocket variables
let statusSocket = null;
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;
let statusUpdateInterval = null;
let wsConnected = false;

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const activeTab = getCookie('activeTab') || 'patterns'; // Default to 'patterns' tab
    switchTab(activeTab); // Load the active tab
    checkSerialStatus(); // Check connection status
    loadThetaRhoFiles(); // Load files on page load
    loadAllPlaylists(); // Load all playlists on page load
    attachSettingsSaveListeners(); // Attach event listeners to save changes
    attachFullScreenListeners();
    loadWledIp();
    updateWledUI();

    // Initialize WebSocket connection for status updates
    connectStatusWebSocket();

    // Handle visibility change
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && statusSocket && statusSocket.readyState !== WebSocket.OPEN) {
            connectStatusWebSocket();
        }
    });

    checkForUpdates();
});

// Update the small UI segment to show the IP or hide it if none
function updateWledUI() {
    const wledIp = localStorage.getItem('wled_ip');
    const wledContainer = document.getElementById('wled-container');
    const wledFrame = document.getElementById('wled-frame');
    const wledStatus = document.getElementById('wled-status');

    if (!wledIp) {
        wledContainer.classList.add('hidden');
        return;
    }

    // Show the container and load WLED UI
    wledContainer.classList.remove('hidden');
    wledFrame.src = `http://${wledIp}`;
}

// Save or clear the WLED IP, updating both the browser and backend
async function saveWledIp() {
    const ipInput = document.getElementById('wled_ip');
    const saveButton = document.querySelector('.wled-settings button.cta');
    const currentIp = localStorage.getItem('wled_ip');

    if (currentIp) {
        // Clear the saved IP if one is already set
        localStorage.removeItem('wled_ip');
        ipInput.disabled = false;
        ipInput.value = '';
        saveButton.innerHTML = '<i class="fa-solid fa-save"></i><span>Save</span>';
        logMessage('WLED IP cleared.', LOG_TYPE.INFO);

        // Also clear the IP on the backend
        try {
            const response = await fetch(apiUrl('/set_wled_ip'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ wled_ip: null })
            });
            const data = await response.json();
            if (data.success) {
                logMessage('Backend IP cleared successfully.', LOG_TYPE.INFO);
            } else {
                logMessage('Failed to clear backend IP.', LOG_TYPE.ERROR);
            }
        } catch (error) {
            logMessage(`Error clearing backend IP: ${error.message}`, LOG_TYPE.ERROR);
        }
    } else {
        // Validate and save the new IP
        const ip = ipInput.value.trim();
        if (!validateIp(ip)) {
            logMessage('Invalid IP address format.', LOG_TYPE.ERROR);
            return;
        }
        localStorage.setItem('wled_ip', ip);
        ipInput.disabled = true;
        saveButton.innerHTML = '<i class="fa-solid fa-xmark"></i><span>Clear</span>';
        logMessage(`WLED IP saved: ${ip}`, LOG_TYPE.SUCCESS);

        // Also save the IP to the backend
        try {
            const response = await fetch(apiUrl('/set_wled_ip'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ wled_ip: ip })
            });
            const data = await response.json();
            if (data.success) {
                logMessage('Backend IP saved successfully.', LOG_TYPE.SUCCESS);
            } else {
                logMessage('Failed to save backend IP.', LOG_TYPE.ERROR);
            }
        } catch (error) {
            logMessage(`Error saving backend IP: ${error.message}`, LOG_TYPE.ERROR);
        }
    }
    
    updateWledUI(); // Refresh any UI elements that depend on the IP
}

// Load the WLED IP from localStorage; if not available, retrieve it from the backend
async function loadWledIp() {
    const ipInput = document.getElementById('wled_ip');
    const saveButton = document.querySelector('.wled-settings button.cta');
    let savedIp = localStorage.getItem('wled_ip');

    if (!savedIp) {
        // Attempt to load from the backend if not found in localStorage
        try {
            const response = await fetch(apiUrl('/get_wled_ip'));
            // Check if the response is OK before trying to parse JSON
            if (response.ok) {
                const data = await response.json();
                if (data.wled_ip) {
                    savedIp = data.wled_ip;
                    localStorage.setItem('wled_ip', savedIp);
                }
            } else {
                console.log(`WLED IP not set on backend (status: ${response.status})`);
                // This is expected if no WLED IP is set, so we don't need to log an error
            }
        } catch (error) {
            console.log(`Error fetching WLED IP from backend: ${error.message}`);
            // Don't show error message to user as this is expected behavior
        }
    }

    if (savedIp) {
        ipInput.value = savedIp;
        ipInput.disabled = true;
        saveButton.innerHTML = '<i class="fa-solid fa-xmark"></i><span>Clear</span>';
    } else {
        ipInput.disabled = false;
        saveButton.innerHTML = '<i class="fa-solid fa-save"></i><span>Save</span>';
    }
    
    updateWledUI(); // Update any dependent UI segments
}

function validateIp(ip) {
    const ipRegex = /^(25[0-5]|2[0-4]\d|1\d\d|\d?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|\d?\d)){3}$/;
    return ipRegex.test(ip);
}