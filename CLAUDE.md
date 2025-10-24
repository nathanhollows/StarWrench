# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**StarWrench** is a userscript enhancement suite for StarRez (a housing management platform). It provides quality-of-life improvements through a plugin-based architecture with toggleable features. This is an unofficial, unaffiliated tool targeting `https://vuw.starrezhousing.com/StarRezWeb/*`.

## Repository Structure

The git repository is located in **`StarWrench/`** - this is what gets committed to version control.

Files in the parent directory (`/home/hollowna/starrez/`) are development/reference files:
- **starrez.min.js**: Official StarRez JavaScript code for deconstructing functionality (reference only, do not modify or commit)
- **starrez-enhancement-suite.js**: Older/alternate version of the suite (not actively maintained)
- **tamper/**: Individual plugin files for isolated development/testing (7 separate userscripts)

The **StarWrench/** directory (the actual repository) contains:
- **StarWrench.js**: Production userscript with all plugins bundled (~1281 lines)
- **README.md**: User-facing documentation
- **LICENSE**: Unlicense (public domain)

## Architecture

### Plugin System

StarWrench uses a **monolithic plugin architecture** where all plugins are compiled into a single userscript file. The system consists of:

1. **Settings Management** (lines 71-98 in StarWrench.js)
   - Settings stored in `localStorage` under `starWrenchEnhancementSuiteSettings`
   - Each plugin has `enabled`, `name`, and `description` properties
   - Default settings defined in `DEFAULT_SETTINGS` constant

2. **Plugin Manager UI** (lines 100-235)
   - Dropdown interface accessible via gear icon button in StarRez header
   - Located at `.habitat-siteheading-buttons`
   - Plugins can be toggled on/off individually
   - Changes take effect immediately (but refresh recommended for full functionality)

3. **Individual Plugin Implementations** (lines 236-1219)
   - Each plugin is a self-contained function: `initBookmarksPlugin()`, `initAutoSelectPlugin()`, etc.
   - Plugins directly manipulate the StarRez DOM and hook into StarRez global objects (`starrez.sm`, `starrez.mm`, `starrez.ui`)
   - All styling is inline CSS (no external stylesheets)

4. **Plugin Initialization** (lines 1220-1258)
   - `initializePlugin(pluginName)`: Switches on plugin name and calls init function
   - `initializeAllPlugins()`: Iterates through enabled plugins
   - Plugins initialize 500ms after script load to ensure StarRez DOM is ready

### Available Plugins

- **bookmarks** (initBookmarksPlugin:241): URL bookmarking with drag-and-drop reordering
- **autoSelect** (initAutoSelectPlugin:434): Bulk select entries by pasting ID lists
- **clipboard** (initClipboardPlugin:513): Copy record IDs from dashboard sections
- **dropdown** (initDropdownPlugin:611): Search functionality for Dashboard dropdown menu
- **initials** (initInitialsPlugin:674): Expands user initials in reports to full names
- **phone** (initPhonePlugin:826): Formats phone numbers for readability
- **wordHighlighter** (initWordHighlighterPlugin:1097): Color-codes color words
- **autoLinker** (initAutoLinkerPlugin:933): Converts "incident ######" text to clickable links
- **residentSearch** (initResidentSearchPlugin:1258): Replaces global search with fast resident lookup. Shows top 20 results with keyboard navigation (arrows + enter). Displays preferred name + last name, room assignment, and entry ID. Includes toggle button to switch between current (default) and historical residents. Navigates to Entry detail screen.

### Background Services (Always-On)

These services run automatically and are not user-configurable:

- **residentDatabase** (initResidentDatabasePlugin:1557): Builds and maintains a searchable local database of residents from the directory page. Stores ALL residents except "Admin" status. Current statuses: Reserved, Tentative, In Room. Historical: all other statuses. Tracks: nameFirst, namePreferred, nameLast, entryId, roomSpace (RoomSpace_Description), status. Room assignments are updated when changes are detected. Provides API at `window.starWrenchResidentDB` with methods:
  - `search(query, currentOnly=true)`: Full-text search with optional filter for current residents only
  - `getById(entryId)`: Get resident by entry ID
  - `getAll(currentOnly=true)`: Get all cached residents with optional current filter
  - `getCount()`: Get total count
  - `refresh()`: Manually trigger database update
  - Storage: `localStorage.starWrenchResidentDatabase` and `localStorage.starWrenchResidentDatabaseMeta`

### StarRez Navigation Patterns

Plugins interact with two navigation types:

1. **Shortcode navigation**: URLs with `#!shortcode` format
   - Navigate using: `starrez.sm.NavigateTo('#!shortcode')`
   - Example: `#!Entry/12345`

2. **Module navigation**: URLs like `/StarRezWeb/module/submodule`
   - Navigate using: `starrez.mm.NavigateTo(module, submodule)`
   - May need to close detail screens first: `starrez.sm.CloseAllDetailScreens().done(() => {...})`

## Development Workflow

### Testing Individual Plugins

1. Develop/test plugins independently in `../tamper/` directory (parent directory, outside git repo)
2. Each file is a standalone userscript with Tampermonkey metadata
3. Install directly in userscript manager for isolated testing

### Integrating Plugins into StarWrench

1. Copy plugin implementation function from `../tamper/*.js`
2. Paste into "PLUGIN IMPLEMENTATIONS" section in `StarWrench.js` (in the git repo)
3. Add plugin configuration to `DEFAULT_SETTINGS.plugins` object
4. Add case to `initializePlugin()` switch statement
5. Update version number in both `@version` and `SUITE_VERSION` constant
6. Commit changes to the `StarWrench/` repository

### Timing and DOM Readiness

- All scripts use `@run-at document-idle` to ensure DOM is loaded
- Main initialization includes additional 500-1000ms delays for StarRez-specific elements
- Use `setTimeout()` when waiting for dynamically loaded StarRez components
- Check for existing elements before adding UI components to avoid duplicates

### StarRez DOM Patterns

- Header buttons: `.habitat-siteheading-buttons`
- Custom elements: `<habitat-button>`, `<habitat-fa-icon>`, `<habitat-header-button>`
- Common attributes: `variant`, `compact`, `aria-label`, `tooltip`, `icon`
- Main entry grid: `.sr_grid` (for auto-select functionality)

### Local Storage Keys

- Main settings: `starWrenchEnhancementSuiteSettings`
- Bookmarks: `starrezBookmarks` (separate storage for bookmark data)
- Individual plugins may use additional keys

### Working with starrez.min.js

The `../starrez.min.js` file (outside the git repo) contains the official StarRez JavaScript code:
- Use for reference when deconstructing StarRez functionality
- Understand available global objects and APIs (`starrez.sm`, `starrez.mm`, `starrez.ui`)
- Do not modify or commit this file
- Not part of the StarWrench repository

## Deployment

The production file is served from:
```
https://raw.githubusercontent.com/nathanhollows/StarWrench/refs/heads/main/StarWrench.js
```

Update URLs are configured in the userscript metadata:
```javascript
// @updateURL    https://raw.githubusercontent.com/nathanhollows/StarWrench/refs/heads/main/StarWrench.js
// @downloadURL  https://raw.githubusercontent.com/nathanhollows/StarWrench/refs/heads/main/StarWrench.js
```

## Important Notes

- This is userscript code that runs in the browser context (not Node.js)
- No build system, bundler, or package manager - direct JavaScript files
- All dependencies are inline (no imports or requires)
- StarRez global object (`window.starrez`) provides API access
- Plugins must handle cases where StarRez UI elements don't exist yet
- Use `@grant none` - no special Tampermonkey permissions required
