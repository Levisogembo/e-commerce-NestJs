#!/bin/sh
set -e

echo "Loading application configuration..."

# Reads from a Docker secret if present.
# Otherwise falls back to an existing environment variable.
load_secret() {
    SECRET_FILE="$1"
    ENV_NAME="$2"

    if [ -f "$SECRET_FILE" ]; then
        VALUE=$(cat "$SECRET_FILE")
        export "$ENV_NAME=$VALUE"
        echo "Loaded $ENV_NAME from Docker secret."
    else
        VALUE=$(printenv "$ENV_NAME")
        if [ -z "$VALUE" ]; then
            echo "ERROR: $ENV_NAME is not set and $SECRET_FILE was not found."
            exit 1
        fi
        echo "Loaded $ENV_NAME from environment."
    fi
}

# Database
load_secret /run/secrets/postgres_user DB_USERNAME
load_secret /run/secrets/postgres_password DB_PASSWORD
load_secret /run/secrets/postgres_db DB_NAME

# Redis
if [ -z "$REDIS_HOST" ]; then
    export REDIS_HOST=redis
fi

if [ -z "$REDIS_PORT" ]; then
    export REDIS_PORT=6379
fi

echo "Configuration loaded successfully."

exec "$@"