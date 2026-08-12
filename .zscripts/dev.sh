#!/bin/bash

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

log_step_start() {
        local step_name="$1"
        echo "=========================================="
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting: $step_name"
        echo "=========================================="
        export STEP_START_TIME
        STEP_START_TIME=$(date +%s)
}

log_step_end() {
        local step_name="${1:-Unknown step}"
        local end_time
        end_time=$(date +%s)
        local duration=$((end_time - STEP_START_TIME))
        echo "=========================================="
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] Completed: $step_name"
        echo "[LOG] Step: $step_name | Duration: ${duration}s"
        echo "=========================================="
        echo ""
}

cd "$PROJECT_DIR"

# Install dependencies
log_step_start "Installing dependencies"
bun install --silent 2>/dev/null
log_step_end "Installing dependencies"

# Database setup
log_step_start "Database setup"
bun run db:push 2>/dev/null || true
log_step_end "Database setup"

# Start Next.js server (production standalone preferred, dev fallback)
if [ -f ".next/standalone/server.js" ]; then
        log_step_start "Starting Next.js production server"

        # Launch server in background
        (
                cd .next/standalone
                NODE_OPTIONS="--max-old-space-size=128" HOSTNAME=127.0.0.1 PORT=3000 \
                        node server.js 2>/dev/null
        ) &
        SERVER_PID=$!

        # Wait for server to be ready
        for i in $(seq 1 15); do
                if curl -s --connect-timeout 1 --max-time 2 http://127.0.0.1:3000/ >/dev/null 2>&1; then
                        echo "Server is ready on port 3000"
                        break
                fi
                sleep 1
        done

        log_step_end "Starting Next.js production server"
else
        log_step_start "Starting Next.js dev server"
        bun run dev > dev.log 2>&1 &
        SERVER_PID=$!

        for i in $(seq 1 30); do
                if curl -s --connect-timeout 1 --max-time 2 http://localhost:3000/ >/dev/null 2>&1; then
                        echo "Dev server is ready on port 3000"
                        break
                fi
                sleep 1
        done

        log_step_end "Starting Next.js dev server"
fi

# Start mini-services
if [ -d "$PROJECT_DIR/mini-services" ]; then
        for service_dir in "$PROJECT_DIR/mini-services"/*; do
                [ -d "$service_dir" ] || continue
                service_name=$(basename "$service_dir")
                [ -f "$service_dir/package.json" ] || continue
                grep -q '"dev"' "$service_dir/package.json" || continue
                (
                        cd "$service_dir"
                        bun install --silent 2>/dev/null
                        exec bun run dev
                ) >"$PROJECT_DIR/.zscripts/mini-service-${service_name}.log" 2>&1 &
                disown "$!" 2>/dev/null || true
        done
fi

echo "All services started. Server PID: $SERVER_PID"
disown "$SERVER_PID" 2>/dev/null || true

# Keep dev.sh alive so the parent (container start.sh) considers it still running
# This prevents the sandbox from cleaning up our server process
wait "$SERVER_PID" 2>/dev/null || true

# If server dies, restart it
echo "Server exited, restarting..."
exec "$0"
