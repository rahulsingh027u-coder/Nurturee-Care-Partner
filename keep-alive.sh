#!/bin/bash
# Auto-restart Next.js standalone server with memory constraints
# Designed for sandbox environments with aggressive process killing
cd /home/z/my-project

while true; do
  NODE_OPTIONS="--max-old-space-size=128" HOSTNAME=127.0.0.1 PORT=3000 node .next/standalone/server.js > /tmp/next-server.log 2>&1
  EXIT_CODE=$?
  echo "$(date '+%H:%M:%S'): Server exited (code=$EXIT_CODE), restarting in 2s..." >> /tmp/keep-alive.log
  sleep 1
done
