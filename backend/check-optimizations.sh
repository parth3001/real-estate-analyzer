#!/bin/bash
# Quick check for all Phase 1 optimizations

LOG_FILE="./performance-test.log"

echo "🎯 PHASE 1 OPTIMIZATION VERIFICATION"
echo "===================================="
echo ""

echo "✅ OPTIMIZATION 1A (Parallel Generators):"
grep "PARALLEL scenario generation completed" "$LOG_FILE" | tail -1

echo ""
echo "✅ OPTIMIZATION 1B (Parallel Scenarios Within):"
echo "   Price:"
grep "Price scenarios completed" "$LOG_FILE" | tail -1
echo "   Rent:"
grep "Rent scenarios completed" "$LOG_FILE" | tail -1
echo "   Interest Rate:"
grep "Interest rate scenarios completed" "$LOG_FILE" | tail -1

echo ""
echo "✅ OPTIMIZATION 1C (Parallel AI + Sensitivity):"
grep "PARALLEL enhancements completed" "$LOG_FILE" | tail -1

echo ""
echo "📊 TOTAL ANALYSIS TIME:"
grep "POST /api/deals/analyze" "$LOG_FILE" | grep -E "[0-9]+\.[0-9]+ ms" | tail -1

echo ""
echo "===================================="
echo "💡 Run a new analysis to see all optimizations in action!"
