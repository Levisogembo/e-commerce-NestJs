#!/bin/sh
set -e #exists immediately incase any secret file is missing or unreadable

echo "Loading Docker secrets..."

export DB_USERNAME=$(cat /run/secrets/postgres_user)
export DB_PASSWORD=$(cat /run/secrets/postgres_password)
export DB_NAME=$(cat /run/secrets/postgres_db)
echo "Secrets loaded successfully."
echo "Starting NestJS..."

exec "$@"