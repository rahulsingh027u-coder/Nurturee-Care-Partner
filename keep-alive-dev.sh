#!/bin/bash
cd /home/z/my-project
while true; do
  echo "$(date): Starting Next.js dev server..."
  NODE_OPTIONS="--max-old-space-size=256" npx next dev -p 3000 -H 0.0.0.0 >> /tmp/next-server.log 2>&1
  EXITCODE=$?
  echo "$(date): Server exited with code $EXITCODE, restarting in 3s..."
  sleep 3
done
