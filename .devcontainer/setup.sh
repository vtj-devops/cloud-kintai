#!/bin/bash

set -e

BASE_PATH=/home/node

# --------------------------------------------------
#  Git settings
# --------------------------------------------------
# user.email が設定されていない場合は設定する
if [ -z "$(git config --local user.email)" ]; then
  echo "Git user.email is not set."
  if [ -n "${GIT_EMAIL}" ]; then
    echo "Use GIT_EMAIL environment variable."
    git config --local user.email "${GIT_EMAIL}"
  elif [ -n "${GRAKU_GIT_EMAIL}" ]; then
    echo "Use GRAKU_GIT_EMAIL environment variable."
    git config --local user.email "${GRAKU_GIT_EMAIL}"
  else
    # 入力を求める
    echo "Please enter your email address."
    read INPUT_GIT_EMAIL

    if [ -z "${INPUT_GIT_EMAIL}" ]; then
      echo "Email address is required."
      exit 1
    fi
    git config --local user.email "${INPUT_GIT_EMAIL}"
  fi
else
  echo "Git user.email is already set."
fi

# user.name が設定されていない場合は設定する
if [ -z "$(git config --local user.name)" ]; then
  echo "Git user.name is not set."
  if [ -n "${GIT_USER}" ]; then
    echo "Use GIT_USER environment variable."
    git config --local user.name "${GIT_USER}"
  elif [ -n "${GRAKU_GIT_USER}" ]; then
    echo "Use GRAKU_GIT_USER environment variable."
    git config --local user.name "${GRAKU_GIT_USER}"
  else
    # 入力を求める
    echo "Please enter your name."
    read INPUT_GIT_USER

    if [ -z "${INPUT_GIT_USER}" ]; then
      echo "Name is required."
      exit 1
    fi
    git config --local user.name "${INPUT_GIT_USER}"
  fi
else
  echo "Git user.name is already set."
fi

# --------------------------------------------------
#  Add Custom settings in .config.fish
# --------------------------------------------------
if [ -e ".devcontainer/fish/config.fish" ]; then
  FISH_CONFIG_PATH=${BASE_PATH}/.config/fish/config.fish
  cp .devcontainer/fish/config.fish ${FISH_CONFIG_PATH}
fi

# --------------------------------------------------
# Install dependencies
# --------------------------------------------------
if [ ! -e "node_modules" ]; then
  echo "Install dependencies..."
  npm install
fi

# --------------------------------------------------
#  シークレット情報を設定
# --------------------------------------------------
echo "HashiCorp Vault login..."
vlt login > /dev/null 2>&1
if [ $? -ne 0 ]; then
  echo "HashiCorp Vault login failed."
  exit 1
fi

echo "HashiCorp Vault config..."
vlt config init

if [ ! -e "${BASE_PATH}/.aws" ]; then
  echo "Create .aws directory..."
  mkdir -p ${BASE_PATH}/.aws
fi

if [ ! -e "${BASE_PATH}/.aws/config" ]; then
  echo "Generate AWS config..."
  touch ${BASE_PATH}/.aws/config
  cat <<EOF > ${BASE_PATH}/.aws/config
[default]
region = $(vlt secrets get --plaintext AWS_DEFAULT_REGION)
EOF
else
  echo "AWS config already exists. Skipped."
fi

if [ ! -e "${BASE_PATH}/.aws/credentials" ]; then
  echo "Generate AWS credentials..."
  touch ${BASE_PATH}/.aws/credentials
  cat <<EOF > ${BASE_PATH}/.aws/credentials
[default]
aws_access_key_id = $(vlt secrets get --plaintext AWS_ACCESS_KEY_ID)
aws_secret_access_key = $(vlt secrets get --plaintext AWS_SECRET_ACCESS_KEY)
EOF
else
  echo "AWS credentials already exists. Skipped."
fi

# --------------------------------------------------
#  Amplify pull
# --------------------------------------------------
if [ ! -e "src/aws-exports.js" ]; then
  echo "Amplify pull..."
  amplify pull --appId dmghdnhtsemgt --envName dev --restore -y
else
  echo "'aws-exports.js' already exists. Skipped."
fi
