# Changelog

All notable changes to StarWrench will be documented in this file.

## [Unreleased]

### Added
- Dashboard Tweaks: styled search bar in dashboard headers that filters rows across every panel. Includes a clear (×) button, Esc-to-clear, and auto-loads panels in parallel via the StarRez `ActiveTable.GetPage` endpoint (no scrolling required) when a search yields no matches but the panel has more records on the server. Falls back to scroll-driven loading if the endpoint is unavailable.
- Quick Incident Participants plugin now fully functional - can add residents to incidents via StarRez API
- Proper StarRez API integration using `starrez.sm.GetCurrentlyDisplayedScreenID()` for incident ID detection

### Changed
- Improved incident ID detection method in Quick Incident Participants plugin for better reliability

### Fixed
- Quick Incident Participants plugin now actually adds participants instead of showing placeholder alerts

## [1.3.6] - Previous Release
- Multiple plugin functionality as documented in the main script