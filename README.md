# StarWrench

StarWrench is an unofficial and unaffiliated suite of time-saving and quality of life enhancements for StarRez. This userscript provides a collection of toggleable plugins that enhance the StarRez experience with features like bookmarks, auto-selection, clipboard utilities, and more.

> **Disclaimer:** This tool is not affiliated with or endorsed by StarRez. All trademarks belong to their respective owners.

## Features

StarWrench includes the following enhancement plugins:

### 🔎 Resident Search
Replaces the global search with a fast, intelligent resident lookup. Search by name, entry ID, or room assignment and get instant results. Features keyboard navigation (arrow keys + enter) and shows up to 20 results with preferred name, room assignment, and entry ID. Powered by the local resident database for lightning-fast searches.

### 📖 Bookmarks
Save and organize frequently visited pages with drag-and-drop management. Easily access your most-used StarRez pages.

### 🎯 Auto-Select
Bulk select entries by pasting a list of IDs. Particularly useful on the Main → Entries page for batch operations.

### 📋 Clipboard Copy
Copy record IDs from dashboard sections to clipboard for easy export and external processing.

### 🔍 Dropdown Search
Add search functionality to the Dashboard dropdown menu for quick navigation.

### 👤 Initials Expander
Expands initials in shift and incident reports for easier reading and identification.

### 📱 Phone Formatter
Automatically format phone numbers with proper spacing and grouping for improved readability.

### 🖍️ Word Highlighter
Color codes your color codes. Makes words like "Orange" and "Yellow" appear in their respective colors.

### 🔗 Incident Auto Linker
Automatically converts "incident ######" or "report ######" text into clickable links for quick navigation.

## Background Services

StarWrench includes always-on background services that power other features:

### 🗄️ Resident Database
Automatically builds and maintains a searchable local database of residents from the directory page. Only stores residents with status "Reserved" or "In Room". The database updates automatically as you browse the directory and tracks name changes and room assignments. This service powers the Resident Search feature and can be used by future plugins.

## Installation

### Prerequisites
- A userscript manager extension such as:
  - [Tampermonkey](https://tampermonkey.net/) (Chrome, Firefox, Safari, Edge)
  - [Greasemonkey](https://addons.mozilla.org/en-US/firefox/addon/greasemonkey/) (Firefox)
  - [Violentmonkey](https://violentmonkey.github.io/) (Chrome, Firefox, Edge)

### Install Steps
1. Install a userscript manager extension in your browser
2. Click on the following link to install StarWrench:
   ```
   https://raw.githubusercontent.com/nathanhollows/StarWrench/refs/heads/main/StarWrench.js
   ```
3. Your userscript manager should prompt you to install the script
4. Navigate to any StarRez page (matching `https://vuw.starrezhousing.com/StarRezWeb/*`)
5. The enhancements will automatically load and be available

## Usage

Once installed, StarWrench will automatically load on compatible StarRez pages. You can:

- **Configure plugins**: Access the settings to enable/disable individual features
- **Use features**: Each plugin works automatically or provides intuitive interfaces
- **Manage bookmarks**: Save frequently visited pages and organize them with drag-and-drop
- **Copy data**: Use clipboard features to extract record IDs for external use

## Configuration

StarWrench includes a settings interface where you can toggle individual plugins on or off based on your needs. Settings are automatically saved and persist across browser sessions.

## Compatibility

- **Target site**: StarRez Web interface (`https://vuw.starrezhousing.com/StarRezWeb/*`)
- **Version**: 1.1.0
- **Browsers**: All modern browsers with userscript manager support
- **Run timing**: Document idle (loads after page content)

## Development

The project consists of a single JavaScript file (`StarWrench.js`) that contains all enhancement plugins. The code is structured with:

- Configuration constants and default settings
- Individual plugin implementations
- Settings management interface
- Auto-update functionality

## Updates

StarWrench includes automatic update checking. When updates are available, your userscript manager will notify you and can automatically install the latest version.

## License

This project is released into the public domain under the [Unlicense](LICENSE). You are free to copy, modify, publish, use, compile, sell, or distribute this software for any purpose, commercial or non-commercial.

## Support

This is an unofficial tool and support is community-driven. If you encounter issues:

1. Check that your userscript manager is up to date
2. Ensure you're using the latest version of StarWrench
3. Verify you're on a compatible StarRez page
4. Review the browser console for any error messages

## Contributing

Contributions are welcome! Feel free to fork the repository and submit pull requests with improvements or additional features.