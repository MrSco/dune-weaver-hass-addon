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
RUN chmod a+x /app/test_deps.py
RUN chmod a+x /app/install_deps.sh

# Install Python dependencies
COPY rootfs/app/requirements.txt /tmp/requirements.txt
RUN pip3 install --no-cache-dir --upgrade pip && \
    pip3 install --no-cache-dir -r /tmp/requirements.txt && \
    # Install critical packages explicitly to ensure they're available
    pip3 install --no-cache-dir \
    fastapi==0.100.0 \
    uvicorn==0.23.0 \
    pydantic==2.0.0 \
    jinja2==3.1.2 \
    websockets==11.0.3 \
    python-multipart==0.0.6 \
    aiofiles==23.1.0 \
    pyserial==3.5 \
    paho-mqtt==1.6.1 \
    websocket-client==1.6.1 \
    tqdm==4.65.0 \
    python-dotenv==1.0.0 \
    esptool==4.1

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