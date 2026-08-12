#!/bin/bash
cd /home/z/my-project
while true; do
  node --max-old-space-size=128 .next/standalone/server.js 2>/tmp/next-server.log
  # Instant restart, no sleep
done
