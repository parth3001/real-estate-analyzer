# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
- Fixed TypeScript errors in AnalysisResults component
- Corrected property access and type definitions in analysis interfaces
- Resolved conditional React Hook usage issue
- Improved expense breakdown chart handling for mortgage data
- Fixed data structure references throughout the analysis components
- Added proper type checking for optional fields
- Removed duplicate type definitions and unused imports
- Cleaned up unused code in MultiFamilyAnalysis component:
  - Removed unused axios import
  - Removed unused backupFormData function
  - Integrated form data backup into handleAnalyze function
- Improved MultiFamilyAnalysisResults component:
  - Removed unused getScoreColor function
  - Integrated color logic directly into component styling
  - Enhanced investment score display with theme colors
- Updated analysis type definitions to match actual data structure:
  - Added proper monthly analysis types with gross rent
  - Updated annual analysis with effective gross income
  - Added yearly projections with detailed metrics
  - Enhanced key metrics interface with new fields
  - Fixed AI insights investment score to be nullable

### Changed
- Improved error handling for missing or invalid expense data
- Enhanced type safety in analysis results display
- Optimized chart data processing
- Streamlined analysis type definitions
- Improved code organization and removed dead code
- Enhanced form data persistence strategy
- Updated analysis results display to match design:
  - Added top metrics cards
  - Enhanced key metrics grid
  - Improved monthly and annual analysis tables
  - Added tabbed chart interface

### Added
- Better null checking for expense breakdown data
- Type-safe handling of mortgage object structure
- Filtering for zero-value expenses in charts
- Improved TypeScript type definitions for analysis results
- Direct localStorage integration for form data recovery
- New metrics display components:
  - Monthly cash flow card
  - Cap rate indicator
  - Cash on cash return display
  - DSCR calculation

## [1.0.0] - 2025-06-01

### Added
- Full OpenAI API integration for AI-powered insights
- Comprehensive property analysis with financial metrics
- Interactive data visualization with dynamic charts
- TypeScript support throughout the application
- Environment-based configuration
- Secure API key handling
- Error handling with graceful fallbacks

### Changed
- Improved OpenAI client initialization to be on-demand
- Enhanced error handling in deals controller
- Updated documentation to reflect current features
- Refactored expense breakdown chart handling
- Improved TypeScript type definitions

### Fixed
- OpenAI API key handling and initialization
- Type definition conflicts and missing interfaces
- React component lifecycle issues
- Data transformation and display inconsistencies

## [0.1.0] - Initial Release

### Added
- Basic property analysis functionality
- Frontend React application setup
- Backend Express server setup
- Initial documentation 