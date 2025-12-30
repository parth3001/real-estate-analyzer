#!/bin/bash
# Start backend with logs redirected to file for Claude monitoring
# Usage: ./start-with-logging.sh

LOG_FILE="./performance-test.log"

echo "Starting backend with logging to: $LOG_FILE"
echo "Performance test started at $(date)" > "$LOG_FILE"

# Start backend and redirect all output to log file
npm run dev 2>&1 | tee "$LOG_FILE"
