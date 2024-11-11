#!/bin/bash

set -e

# ========================================
#  Create devcontainer.env file
# ========================================

# ファイルが存在しない場合は作成する
if [ ! -e .devcontainer/devcontainer.env ]; then
  cp .devcontainer/devcontainer.env.example .devcontainer/devcontainer.env
fi

# ========================================
#  Create .env file
# ========================================

# ファイルが存在しない場合は作成する
if [ ! -e .env ]; then
  cp .env.example .env
fi

# ========================================
#  Create docker network
# ========================================
NETWORK_NAME=garaku-shared-network
if [ -z "`docker network ls | grep ${NETWORK_NAME}`" ]; then docker network create ${NETWORK_NAME}; fi
