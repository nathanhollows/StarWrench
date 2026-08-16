# Changelog

All notable changes to StarWrench will be documented in this file.

## [Unreleased]

## [1.19.0] - 2026-08-14

### Added
- Field History plugin: any "Log Activities" change log table (bookings, applications, incidents, etc.) gets a collapsed-by-default detail row inserted under each entry — click a row to expand a clean field-by-field breakdown (old → new as colored pills, long free-text fields like Description/Cause as wrapped blocks, empty values as neutral gray pills), with an "Expand All"/"Collapse All" button in the table header. Clicking a field name opens a small popup scoped to just that field's full history across the table. Lookup IDs (e.g. `RoomRateID` showing `89` instead of `89 (2026 Flexi term)`) resolve automatically in the background, rate-limited and cached so nothing is ever re-fetched. Dates are reformatted to a consistent human-readable style throughout. Only covers rows currently loaded on the page (no auto-pagination). The original table row and its data are never modified — everything is additive, so the row stays intact and re-readable no matter how many times the table re-renders.

## [1.18.5] - 2026-07-20

### Added
- Auto Linker: the "IncidentID: 150940" text in an incident's own detail-nav breadcrumb footer is now a click-to-copy chip with a copy icon and an instant CSS tooltip ("Click to copy", switching to "Copied!" for 1s) instead of a navigational link — clicking it copies the normalized "#150940" form to the clipboard. Navigating there would just reload the incident you're already on, and people were copying the raw label text verbatim into reports.

## [1.18.4] - 2026-07-20

### Added
- Auto Linker: also links StarRez's own "IncidentID: 149793" field-label format (e.g. copy-pasted from a grid or export), not just "incident ######" and "#######".

### Changed
- Auto Linker: incident links are now orange (previously the same blue as @mentions) and @mentions of historic (no-longer-resident) residents are now grey, so it's easy to tell incidents, current residents, and historic residents apart at a glance.

## [1.18.2] - 2026-07-14

### Added
- Dashboard Tweaks: the "Records: N" footer on each dashboard panel now updates live to show the number of matching rows while searching, so you can quickly see how many results a search turned up. Reverts to the panel's original total once the search is cleared.

## [1.18.1] - 2026-07-13

### Added
- Violation Checker: shows an alert on the Quick Information section of an incident when it has no Violations tab (i.e. no violation recorded), with a button that opens the Add Violation wizard directly. Disappears automatically once a violation is added.

### Removed
- Incident Templates plugin (Shift Report / Flat Meeting templates for incident report descriptions) — no longer needed now that reports are done via another tool.

### Fixed
- Quick Add Participants: Auto Link Participants (manual and duty-rounds silent auto-fire) no longer pulls in @-mentioned residents from *other* incidents/duty-rounds records that were viewed earlier in the session. StarRez keeps previously opened records loaded in the DOM as background tabs (only one visible at a time) and never removes the @-mention links autoLinker renders into them, so an unscoped page-wide search for mentions was picking up residents from unrelated records and silently adding them as participants to whatever record was currently open. The search is now scoped to the current record's own detail screen.

## [1.16.2] - 2026-05-27

### Added
- Console utility `window.starWrenchInjectInitials()` for retrofitting old records: with no arguments, reads the clipboard, rewrites raw `@id` mentions into the picker's `INITIALS @id` + bare `INITIALS` repeat format, and writes the result back to the clipboard ready to paste. Passing text directly (`starWrenchInjectInitials(text)`) still works as a sync transform. Idempotent on already-prefixed input.

## [1.16.0] - 2026-05-25

### Added
- Resident picker now inserts `INITIALS @id` on first mention and just `INITIALS` on subsequent mentions of the same resident in the same textarea, keeping reports readable for people without the plugin while still anchoring once for click/lookup. Initials use the first letter of every space-separated name part (preferred + last).
- Rendered @-mention links are now `user-select: none`, so when plugin users copy a report the resident's full name is excluded from the clipboard — what gets pasted matches the initials-only view non-plugin readers see.

## [1.15.0] - 2026-05-22

### Added
- Quick Add Participants: Auto Link Participants button now silently auto-fires once when it loads on a Duty Rounds or Incident screen — adds any @-mentioned residents not already participants without any toast or popup. Clicking the button manually still shows success/failure toasts as before.

## [1.14.3] - 2026-05-22

### Fixed
- Dashboard search filter no longer carries over when navigating between dashboards. The previous query stayed in plugin closure state and re-filtered the new dashboard's rows while the freshly created search input rendered empty.

## [1.14.2] - 2026-05-22

### Added
- Dashboard search loading feedback: while panels are loading, the input placeholder cycles through status messages and a blue spinner replaces the × button. Esc cancels in-flight loads so the user can filter on whatever's already loaded.

## [1.14.1] - 2026-05-21

### Added
- Dashboard Tweaks: styled search bar in dashboard headers that filters rows across every panel. Includes a clear (×) button, Esc-to-clear, and auto-loads panels in parallel via the StarRez `ActiveTable.GetPage` endpoint (no scrolling required) when a search yields no matches but the panel has more records on the server. Falls back to scroll-driven loading if the endpoint is unavailable.

## [1.4.0] - 2025-10-30

### Added
- Quick Incident Participants plugin (later renamed Quick Add Participants) now fully functional - can add residents to incidents via StarRez API
- Proper StarRez API integration using `starrez.sm.GetCurrentlyDisplayedScreenID()` for incident ID detection

### Changed
- Improved incident ID detection method in Quick Incident Participants plugin for better reliability

### Fixed
- Quick Incident Participants plugin now actually adds participants instead of showing placeholder alerts

## [1.3.6] - Previous Release
- Multiple plugin functionality as documented in the main script