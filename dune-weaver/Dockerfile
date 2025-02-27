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
COPY rootfs /rootfs
COPY run.sh /
RUN chmod a+x /run.sh

# Create necessary directories and copy files
RUN mkdir -p /app/static /app/templates /app/modules
RUN if [ -d "/rootfs/app/static" ]; then cp -r /rootfs/app/static/* /app/static/; fi
RUN if [ -d "/rootfs/app/templates" ]; then cp -r /rootfs/app/templates/* /app/templates/; fi
RUN if [ -d "/rootfs/app/modules" ]; then cp -r /rootfs/app/modules/* /app/modules/; fi
RUN if [ -f "/rootfs/app/app.py" ]; then cp /rootfs/app/app.py /app/; fi
RUN if [ -f "/rootfs/app/startup.py" ]; then cp /rootfs/app/startup.py /app/; fi

# Make scripts executable if they exist
RUN if [ -f "/app/test_deps.py" ]; then chmod a+x /app/test_deps.py; fi
RUN if [ -f "/app/install_deps.sh" ]; then chmod a+x /app/install_deps.sh; fi
RUN if [ -f "/app/check_imports.py" ]; then chmod a+x /app/check_imports.py; fi
RUN if [ -f "/app/start.py" ]; then chmod a+x /app/start.py; fi
RUN if [ -f "/app/test_app.py" ]; then chmod a+x /app/test_app.py; fi
RUN if [ -f "/app/startup.py" ]; then chmod a+x /app/startup.py; fi
RUN chmod a+x /app/startup.py

# Install Python dependencies with error handling
# First upgrade pip
RUN pip3 install --no-cache-dir --upgrade pip

# Install essential dependencies
RUN pip3 install --no-cache-dir fastapi uvicorn pydantic jinja2 websockets python-multipart aiofiles

# Install non-essential dependencies
RUN pip3 install --no-cache-dir pyserial paho-mqtt websocket-client tqdm python-dotenv

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