#!/bin/bash
# Performance monitoring helper for Claude
# Shows key performance metrics from logs

LOG_FILE="./performance-test.log"

if [ ! -f "$LOG_FILE" ]; then
    echo "❌ Log file not found. Start backend first with: ./start-with-logging.sh"
    exit 1
fi

echo "📊 PERFORMANCE MONITORING"
echo "========================"
echo ""

echo "🚀 PARALLEL SCENARIO GENERATION (Optimization 1A):"
grep "PARALLEL scenario generation completed" "$LOG_FILE" | tail -5

echo ""
echo "⏱️  TOTAL ANALYSIS TIMES:"
grep -E "Analysis START|Analysis COMPLETE" "$LOG_FILE" | tail -10

echo ""
echo "🎯 SENSITIVITY ANALYSIS TIMING:"
grep -E "Generating sensitivity analysis|Sensitivity analysis generation completed" "$LOG_FILE" | tail -10

echo ""
echo "🤖 AI CONTENT GENERATION:"
grep -E "AI-enhanced tab content|AI-enhanced content generation completed" "$LOG_FILE" | tail -5

echo ""
echo "📈 INVESTMENT DECISION ENGINE:"
grep -E "Investment Decision Engine: Starting analysis|Decision generated:" "$LOG_FILE" | tail -10

echo ""
echo "========================"
echo "📝 Full log available at: $LOG_FILE"
echo "💡 Use: tail -f $LOG_FILE (to follow in real-time)"
