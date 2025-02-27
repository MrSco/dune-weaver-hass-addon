ARG BUILD_FROM=ghcr.io/home-assistant/amd64-base:3.16
FROM ${BUILD_FROM}

# Set the working directory in the container
WORKDIR /app

# Install required system packages
RUN apk add --no-cache \
    python3 \
    py3-pip \
    gcc \
    python3-dev \
    musl-dev \
    git \
    wget \
    unzip

# Copy the application files
COPY rootfs /
COPY run.sh /
RUN chmod a+x /run.sh

# Make scripts executable if they exist
RUN if [ -f "/app/test_deps.py" ]; then chmod a+x /app/test_deps.py; fi
RUN if [ -f "/app/install_deps.sh" ]; then chmod a+x /app/install_deps.sh; fi
RUN if [ -f "/app/check_imports.py" ]; then chmod a+x /app/check_imports.py; fi
RUN if [ -f "/app/start.py" ]; then chmod a+x /app/start.py; fi
RUN if [ -f "/app/test_app.py" ]; then chmod a+x /app/test_app.py; fi
RUN if [ -f "/app/startup.py" ]; then chmod a+x /app/startup.py; fi

# Install Python dependencies with error handling
# First upgrade pip
RUN pip3 install --no-cache-dir --upgrade pip

# Install essential dependencies one by one with error handling
RUN pip3 install --no-cache-dir fastapi || echo "Warning: fastapi installation failed, will try at runtime"
RUN pip3 install --no-cache-dir uvicorn || echo "Warning: uvicorn installation failed, will try at runtime"
RUN pip3 install --no-cache-dir pydantic || echo "Warning: pydantic installation failed, will try at runtime"
RUN pip3 install --no-cache-dir jinja2 || echo "Warning: jinja2 installation failed, will try at runtime"
RUN pip3 install --no-cache-dir websockets || echo "Warning: websockets installation failed, will try at runtime"
RUN pip3 install --no-cache-dir python-multipart || echo "Warning: python-multipart installation failed, will try at runtime"
RUN pip3 install --no-cache-dir aiofiles || echo "Warning: aiofiles installation failed, will try at runtime"

# Install non-essential dependencies with error handling
RUN pip3 install --no-cache-dir pyserial || echo "Warning: pyserial installation failed, will try at runtime"
RUN pip3 install --no-cache-dir paho-mqtt || echo "Warning: paho-mqtt installation failed, will try at runtime"
RUN pip3 install --no-cache-dir websocket-client || echo "Warning: websocket-client installation failed, will try at runtime"
RUN pip3 install --no-cache-dir tqdm || echo "Warning: tqdm installation failed, will try at runtime"
RUN pip3 install --no-cache-dir python-dotenv || echo "Warning: python-dotenv installation failed, will try at runtime"

# Set shell
SHELL ["/bin/bash", "-o", "pipefail", "-c"]

# Build arguments
ARG BUILD_ARCH
ARG BUILD_DATE
ARG BUILD_DESCRIPTION
ARG BUILD_NAME
ARG BUILD_REF
ARG BUILD_REPOSITORY
ARG BUILD_VERSION

# Labels
LABEL \
    io.hass.name="${BUILD_NAME}" \
    io.hass.description="${BUILD_DESCRIPTION}" \
    io.hass.arch="${BUILD_ARCH}" \
    io.hass.type="addon" \
    io.hass.version=${BUILD_VERSION} \
    maintainer="MrSco <mrsco@proton.me>" \
    org.opencontainers.image.title="${BUILD_NAME}" \
    org.opencontainers.image.description="${BUILD_DESCRIPTION}" \
    org.opencontainers.image.vendor="Home Assistant Add-ons" \
    org.opencontainers.image.authors="MrSco <mrsco@proton.me>" \
    org.opencontainers.image.licenses="MIT" \
    org.opencontainers.image.url="https://github.com/mrsco/dune-weaver" \
    org.opencontainers.image.source="https://github.com/${BUILD_REPOSITORY}" \
    org.opencontainers.image.documentation="https://github.com/${BUILD_REPOSITORY}/blob/main/README.md" \
    org.opencontainers.image.created=${BUILD_DATE} \
    org.opencontainers.image.revision=${BUILD_REF} \
    org.opencontainers.image.version=${BUILD_VERSION}

# Start the application
CMD [ "/run.sh" ] 