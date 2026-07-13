# Changelog

All notable changes to StarWrench will be documented in this file.

## [Unreleased]

### Added
- Dashboard Tweaks: the "Records: N" footer on each dashboard panel now updates live to show the number of matching rows while searching, so you can quickly see how many results a search turned up. Reverts to the panel's original total once the search is cleared.

### Fixed
- Quick Add Participants: Auto Link Participants (manual and duty-rounds silent auto-fire) no longer pulls in @-mentioned residents from *other* incidents/duty-rounds records that were viewed earlier in the session. StarRez keeps previously opened records loaded in the DOM as background tabs (only one visible at a time) and never removes the @-mention links autoLinker renders into them, so an unscoped page-wide search for mentions was picking up residents from unrelated records and silently adding them as participants to whatever record was currently open. The search is now scoped to the current record's own detail screen.

### Added
- Violation Checker: shows an alert on the Quick Information section of an incident when it has no Violations tab (i.e. no violation recorded), with a button that opens the Add Violation wizard directly. Disappears automatically once a violation is added.

### Removed
- Incident Templates plugin (Shift Report / Flat Meeting templates for incident report descriptions) — no longer needed now that reports are done via another tool.

### Added
- Dashboard Tweaks: styled search bar in dashboard headers that filters rows across every panel. Includes a clear (×) button, Esc-to-clear, and auto-loads panels in parallel via the StarRez `ActiveTable.GetPage` endpoint (no scrolling required) when a search yields no matches but the panel has more records on the server. Falls back to scroll-driven loading if the endpoint is unavailable.
- Dashboard search loading feedback: while panels are loading, the input placeholder cycles through status messages and a blue spinner replaces the × button. Esc cancels in-flight loads so the user can filter on whatever's already loaded.

### Fixed
- Dashboard search filter no longer carries over when navigating between dashboards. The previous query stayed in plugin closure state and re-filtered the new dashboard's rows while the freshly created search input rendered empty.

### Added
- Quick Add Participants: Auto Link Participants button now silently auto-fires once when it loads on a Duty Rounds or Incident screen — adds any @-mentioned residents not already participants without any toast or popup. Clicking the button manually still shows success/failure toasts as before.
- Resident picker now inserts `INITIALS @id` on first mention and just `INITIALS` on subsequent mentions of the same resident in the same textarea, keeping reports readable for people without the plugin while still anchoring once for click/lookup. Initials use the first letter of every space-separated name part (preferred + last).
- Rendered @-mention links are now `user-select: none`, so when plugin users copy a report the resident's full name is excluded from the clipboard — what gets pasted matches the initials-only view non-plugin readers see.
- Console utility `window.starWrenchInjectInitials()` for retrofitting old records: with no arguments, reads the clipboard, rewrites raw `@id` mentions into the picker's `INITIALS @id` + bare `INITIALS` repeat format, and writes the result back to the clipboard ready to paste. Passing text directly (`starWrenchInjectInitials(text)`) still works as a sync transform. Idempotent on already-prefixed input.
- Quick Incident Participants plugin now fully functional - can add residents to incidents via StarRez API
- Proper StarRez API integration using `starrez.sm.GetCurrentlyDisplayedScreenID()` for incident ID detection

### Changed
- Improved incident ID detection method in Quick Incident Participants plugin for better reliability

### Fixed
- Quick Incident Participants plugin now actually adds participants instead of showing placeholder alerts

## [1.3.6] - Previous Release
- Multiple plugin functionality as documented in the main script