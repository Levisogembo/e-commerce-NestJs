#!/bin/sh
set -e

echo "Loading Docker secrets..."

read_secret() {
    if [ ! -f "$1" ]; then
        echo "ERROR: Secret file $1 not found"
        exit 1
    fi

    cat "$1"
}

export DB_USERNAME=$(read_secret /run/secrets/postgres_user)
export DB_PASSWORD=$(read_secret /run/secrets/postgres_password)
export DB_NAME=$(read_secret /run/secrets/postgres_db)

echo "Secrets loaded successfully."

exec "$@"