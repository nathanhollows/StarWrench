# Changelog

All notable changes to StarWrench will be documented in this file.

## [Unreleased]

### Added
- Dashboard Tweaks: styled search bar in dashboard headers that filters rows across every panel. Includes a clear (×) button, Esc-to-clear, and auto-loads panels in parallel via the StarRez `ActiveTable.GetPage` endpoint (no scrolling required) when a search yields no matches but the panel has more records on the server. Falls back to scroll-driven loading if the endpoint is unavailable.
- Dashboard search loading feedback: while panels are loading, the input placeholder cycles through status messages and a blue spinner replaces the × button. Esc cancels in-flight loads so the user can filter on whatever's already loaded.

### Fixed
- Dashboard search filter no longer carries over when navigating between dashboards. The previous query stayed in plugin closure state and re-filtered the new dashboard's rows while the freshly created search input rendered empty.

### Added
- Quick Add Participants: Auto Link Participants button now silently auto-fires once when it loads on a Duty Rounds or Incident screen — adds any @-mentioned residents not already participants without any toast or popup. Clicking the button manually still shows success/failure toasts as before.
- Quick Incident Participants plugin now fully functional - can add residents to incidents via StarRez API
- Proper StarRez API integration using `starrez.sm.GetCurrentlyDisplayedScreenID()` for incident ID detection

### Changed
- Improved incident ID detection method in Quick Incident Participants plugin for better reliability

### Fixed
- Quick Incident Participants plugin now actually adds participants instead of showing placeholder alerts

## [1.3.6] - Previous Release
- Multiple plugin functionality as documented in the main script