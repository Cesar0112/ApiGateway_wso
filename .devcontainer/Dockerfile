# Dev Container image based on official Node image
FROM node:22-bullseye

# Evitar ejecutar como root
ARG USERNAME=node
ARG USER_UID=1000
ARG USER_GID=$USER_UID

# Instalar utilidades necesarias
RUN apt-get update \
  && apt-get install -y --no-install-recommends git ca-certificates curl build-essential \
  && rm -rf /var/lib/apt/lists/*

# Crear usuario si no existe y configurar home
RUN id -u $USERNAME &>/dev/null || useradd -m --uid $USER_UID $USERNAME || true

# Instalar yarn global si no está disponible
RUN corepack enable && corepack prepare yarn@stable --activate

# Crear directorio de trabajo
WORKDIR /workspace/api-gateway

# Asegurar que el usuario no root sea el por defecto
USER $USERNAME

# Por defecto, este Dockerfile no copia código (la extensión montará tu workspace)
CMD ["/bin/bash"]
