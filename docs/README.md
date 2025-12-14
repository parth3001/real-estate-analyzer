# Documentation Organization Guide

**Project**: Real Estate Analyzer - Multi-Family Feature Development
**Last Updated**: 2025-11-16

---

## 📋 **Documentation Storage Rules**

### **✅ Root Folder** (Only Primary Project Files)
Store in project root (`/`):
- `ISSUE_TRACKER.md` - Central issue tracking (main reference)
- `/CLAUDE.md` - Project context and instructions for Claude
- `/README.md` - Project overview

**Rule**: ONLY files that are referenced constantly and belong at project root.

---

### **✅ /docs Folder** (All Other Documentation)
Store in `/docs` folder:

#### **Architecture & Planning**
- `ARCHITECT_*.md` - Architectural analysis and decisions
- `METRICS_STRATEGY_ARCHITECTURE.md` - **🏗️ Strategy-aware metrics system** (ADR for extensible BRRRR/House Hack foundation)
- `TECHNICAL_*.md` - Technical planning documents
- `*_PLAN.md` - Implementation plans

#### **Story & Sprint Documentation**
- `STORY_*.md` - User story documentation
- `SPRINT_*.md` - Sprint planning and summaries

#### **Issue & Bug Documentation**
- `ISSUE_*.md` - Individual issue analysis and fixes
- `SESSION_*.md` - Session summaries and handoffs

#### **Testing & QA**
- `TEST_*.md` - Testing guides and reports
- `QE_*.md` - QA engineer documentation

#### **Feature-Specific Documentation**
- `MF_*.md` - Multi-family feature docs
- `TAX_*.md` - Tax calculation docs
- `UX_*.md` - User experience designs

#### **Data & Reference**
- `DATA_*.md` - Data dictionaries and mappings
- `*_REFERENCE.md` - Reference materials
- `*_GUIDE.md` - User and developer guides

#### **Validation & Expert Reviews**
- `EXPERT_*.md` - Expert validation reports
- `*_VALIDATION.md` - Business validation docs

---

## 🚫 **What NOT to Store in Root**

❌ **NEVER store in root folder:**
- Temporary working documents
- Session summaries
- Issue fix documentation
- Architecture analysis docs
- Testing reports
- Implementation plans
- Expert validation reports
- Any `.md` file that isn't a primary project file

**Why**: Keeps root clean and makes project navigation easier

---

## 🔍 **Finding Documentation**

### **For Current Issues:**
→ Start with `/ISSUE_TRACKER.md` (root)

### **For Story Implementation:**
→ `/docs/STORY_*.md` files

### **For Architecture Decisions:**
→ `/docs/ARCHITECT_*.md` files
→ `/docs/METRICS_STRATEGY_ARCHITECTURE.md` - **Strategy-aware metrics system** (extensible foundation for BRRRR, House Hack, etc.)
→ `/docs/METRICS_REORGANIZATION_PLAN.md` - Metrics reorganization implementation plan

### **For Testing:**
→ `/docs/COMPLETE_TEST_INVENTORY.md` + `/docs/TEST_*.md`

### **For Multi-Family Features:**
→ `/docs/MF_*.md` files

### **For Data Definitions:**
→ `/docs/DATA_DICTIONARY.md`

---

## 📝 **Document Naming Conventions**

### **Prefixes**
- `STORY_X.Y_` - User story X.Y documentation
- `ISSUE_N_` - Issue number N analysis/fixes
- `ARCHITECT_` - Architectural review/analysis
- `SESSION_` - Session summaries/handoffs
- `MF_` - Multi-family feature specific
- `TEST_` / `QE_` - Testing documentation
- `TEMP_` - Temporary (clean up when done)

### **Suffixes**
- `_PLAN.md` - Planning documents
- `_SUMMARY.md` - Summary documents
- `_GUIDE.md` - User/developer guides
- `_REFERENCE.md` - Reference materials
- `_CHECKLIST.md` - Testing/validation checklists

---

## 🎯 **Before Creating New Documentation**

**Ask yourself:**
1. Is this a primary project file? → **Root folder**
2. Is this any other documentation? → **`/docs` folder**
3. What prefix should I use? (See naming conventions)
4. Does similar documentation already exist? (Check first!)

**Example Decision Tree:**
```
Creating: "Issue #11 Fix Summary"
├─ Primary project file? NO
├─ Goes to: /docs folder ✅
├─ Naming: ISSUE_11_FIX_SUMMARY.md
└─ Location: /docs/ISSUE_11_FIX_SUMMARY.md
```

---

## 🧹 **Cleanup Guidelines**

### **Temporary Documents** (`TEMP_*.md`)
- Review monthly
- Move to archive or delete when no longer needed
- Don't let temporary docs accumulate

### **Session Summaries** (`SESSION_*.md`)
- Useful for context between sessions
- Archive after 90 days
- Extract key info to permanent docs first

### **Old Test Reports**
- Keep latest reports
- Archive older than 30 days
- Maintain historical trend data separately

---

## ⚠️ **Common Mistakes to Avoid**

❌ Creating docs in root folder
❌ Not using standard prefixes
❌ Creating duplicate documentation
❌ Leaving `TEMP_` docs indefinitely
❌ Not referencing this README before creating docs

✅ Check this README first
✅ Use `/docs` for all documentation
✅ Follow naming conventions
✅ Search for existing docs before creating
✅ Clean up temporary docs regularly

---

**Maintained by**: Development Team
**Reference**: Always check `/docs/README.md` before creating new documentation
