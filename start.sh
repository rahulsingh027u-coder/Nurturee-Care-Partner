#!/bin/bash
# Start Nurturee Care Partner Portal - Next.js standalone production server
# Key: HOSTNAME must be 127.0.0.1 (not 0.0.0.0) for IPv4 binding in this environment
cd /home/z/my-project/.next/standalone
exec node server.js
