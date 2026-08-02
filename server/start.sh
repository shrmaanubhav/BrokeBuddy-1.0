#!/bin/sh

set -e

if [ "$RUN_MIGRATIONS" = "true" ]; then
    echo "Applying Prisma migrations..."
    npx prisma migrate deploy
fi

echo "Starting Express..."
exec node src/index.js