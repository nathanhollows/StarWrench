// ==UserScript==
// @name         StarWrench
// @namespace    http://tampermonkey.net/
// @version      1.9.1
// @description  An opinionated and unofficial StarRez enhancement suite with toggleable features
// @author       You
// @match        https://vuw.starrezhousing.com/StarRezWeb/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=starrezhousing.com
// @grant        none
// @run-at       document-idle
// @updateURL    https://raw.githubusercontent.com/nathanhollows/StarWrench/refs/heads/main/StarWrench.js
// @downloadURL  https://raw.githubusercontent.com/nathanhollows/StarWrench/refs/heads/main/StarWrench.js
// ==/UserScript==

(function() {
    'use strict';

    // ================================
    // CONFIGURATION & CONSTANTS
    // ================================

    const SUITE_VERSION = '1.9.1';
    const SETTINGS_KEY = 'starWrenchEnhancementSuiteSettings';

    // Default settings for all plugins
    const DEFAULT_SETTINGS = {
        plugins: {
            bookmarks: {
                enabled: true,
                name: '📖 Bookmarks',
                description: 'Save and organise frequently visited pages with drag-and-drop management'
            },
            autoSelect: {
                enabled: true,
                name: '🎯 Auto-Select',
                description: 'Bulk select entries by pasting a list of IDs (works on Main -> Entries page)'
            },
            clipboard: {
                enabled: true,
                name: '📋 Dashboard Quick Copy',
                description: 'Copy Entry IDs from dashboard sections to clipboard for easy export'
            },
            dashboard: {
                enabled: true,
                name: '🔍 Dashboard Search',
                description: 'Add search functionality to the Dashboard dropdown menu'
            },
            initials: {
                enabled: true,
                name: '👤 Expand Initials',
                description: 'Expands initials in shift and incident reports for easy reading'
            },
            phone: {
                enabled: true,
                name: '📱 Phone Formatter',
                description: 'Automatically format phone numbers with proper spacing and grouping'
            },
            wordHighlighter: {
                enabled: false,
                name: '🖍️ Word Highlighter',
                description: 'Colour codes your colour codes. Makes "Orange" and "Yellow" appear orange and yellow'
            },
            autoLinker: {
                enabled: true,
                name: '🔗 Incident Auto Linker',
                description: 'Automatically converts "incident ######" or "report ######" text into clickable links'
            },
            residentSearch: {
                enabled: true,
                name: '🔎 Instant Search',
                description: 'Replaces global search with a fast resident lookup powered by the local database'
            },
            quickAddParticipants: {
                enabled: true,
                name: '👥 Quick Add Participants',
                description: 'Add a search bar to quickly add residents to incident Participants or program Attendees'
            },
            quickIncidentStatus: {
                enabled: true,
                name: '🚦 Quick Incident Status',
                description: 'Add quick status change buttons (In Progress/Close) to incident details'
            },
            sharepointLinks: {
                enabled: true,
                name: '📂 SharePoint Links',
                description: 'Add SharePoint directory links to room detail pages for configured halls'
            },
            incidentTemplates: {
                enabled: true,
                name: '📝 Incident Templates',
                description: 'Quick templates for incident reports (e.g., Shift Report template)'
            }
        }
    };

    // ================================
    // SETTINGS MANAGEMENT
    // ================================

    let currentSettings = {};

    function loadSettings() {
        try {
            const stored = localStorage.getItem(SETTINGS_KEY);

            if (!stored) {
                // No saved settings, use defaults
                currentSettings = { ...DEFAULT_SETTINGS };
                return;
            }

            const savedSettings = JSON.parse(stored);

            // Merge saved settings with defaults to handle new plugins
            currentSettings = {
                plugins: {}
            };

            // First, add all default plugins
            Object.keys(DEFAULT_SETTINGS.plugins).forEach(pluginName => {
                if (savedSettings.plugins && savedSettings.plugins[pluginName]) {
                    // Plugin exists in saved settings, use saved enabled state
                    currentSettings.plugins[pluginName] = {
                        ...DEFAULT_SETTINGS.plugins[pluginName],
                        enabled: savedSettings.plugins[pluginName].enabled
                    };
                } else {
                    // New plugin, use default settings
                    currentSettings.plugins[pluginName] = {
                        ...DEFAULT_SETTINGS.plugins[pluginName]
                    };
                    console.log(`[StarWrench] New plugin detected: ${DEFAULT_SETTINGS.plugins[pluginName].name}`);
                }
            });

            // Save the merged settings back to persist new plugins
            saveSettings();

        } catch (error) {
            console.error('Failed to load settings:', error);
            currentSettings = { ...DEFAULT_SETTINGS };
        }
    }

    function saveSettings() {
        try {
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(currentSettings));
        } catch (error) {
            console.error('Failed to save settings:', error);
        }
    }

    function isPluginEnabled(pluginName) {
        return currentSettings.plugins[pluginName] && currentSettings.plugins[pluginName].enabled || false;
    }


    // ================================
    // PLUGIN MANAGER UI
    // ================================

    function createPluginManagerDropdown(container) {
        let dropdown = document.getElementById('plugin-manager-dropdown');
        if (dropdown) {
            dropdown.remove();
            return;
        }

        dropdown = document.createElement('div');
        dropdown.id = 'plugin-manager-dropdown';
        dropdown.style.cssText = `
            position: absolute;
            top: 50px;
            right: 10px;
            z-index: 99999;
            background: #fff;
            border: 1px solid #ccc;
            padding: 15px;
            width: 350px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            font-family: Arial, sans-serif;
            max-height: 500px;
            overflow-y: auto;
            border-radius: 8px;
        `;

        // Header
        const header = document.createElement('div');
        header.innerHTML = `
            <h3 style="margin: 0 0 15px 0; padding-bottom: 10px; border-bottom: 1px solid #eee; color: #333;">
                StarWrench v${SUITE_VERSION}
            </h3>
        `;
        dropdown.appendChild(header);

        // Plugin toggles
        const pluginsContainer = document.createElement('div');
        Object.entries(currentSettings.plugins).forEach(([key, plugin]) => {
            const pluginDiv = document.createElement('div');
            pluginDiv.style.cssText = 'margin-bottom: 15px; padding: 10px; border: 1px solid #e9ecef; border-radius: 6px; background: #f8f9fa;';

            pluginDiv.innerHTML = `
                <label style="display: flex; align-items: flex-start; cursor: pointer; gap: 8px;">
                    <input type="checkbox" ${plugin.enabled ? 'checked' : ''} data-plugin="${key}"
                           style="margin-top: 2px; transform: scale(1.2); flex-shrink: 0;">
                    <div style="flex: 1;">
                        <div style="font-size: 14px; font-weight: 500; color: #333; margin-bottom: 4px;">
                            ${plugin.name}
                        </div>
                        <div style="font-size: 12px; color: #666; line-height: 1.4;">
                            ${plugin.description}
                        </div>
                    </div>
                </label>
            `;

            const checkbox = pluginDiv.querySelector('input');
            checkbox.addEventListener('change', (e) => {
                currentSettings.plugins[key].enabled = e.target.checked;
                saveSettings();

                if (e.target.checked) {
                    // Initialize the plugin
                    initializePlugin(key);
                    if (typeof starrez.ui !== 'undefined' && starrez.ui.ShowAlertMessage) {
                        starrez.ui.ShowAlertMessage(`${plugin.name} enabled! Refresh the page for full functionality.`, 'Plugin Enabled');
                    }
                } else {
                    if (typeof starrez.ui !== 'undefined' && starrez.ui.ShowAlertMessage) {
                        starrez.ui.ShowAlertMessage(`${plugin.name} disabled! Refresh the page to fully remove functionality.`, 'Plugin Disabled');
                    }
                }
            });

            pluginsContainer.appendChild(pluginDiv);
        });

        dropdown.appendChild(pluginsContainer);

        // Footer with reset button
        const footer = document.createElement('div');
        footer.style.cssText = 'margin-top: 20px; padding-top: 15px; border-top: 1px solid #eee; text-align: center;';
        footer.innerHTML = `
            <button id="reset-settings-btn" style="padding: 10px 20px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 13px;">
                Reset All Settings
            </button>
            <div style="margin-top: 10px; font-size: 11px; color: #999;">
                StarWrench - unofficial and unaffiliated with StarRez.
            </div>
        `;

        footer.querySelector('#reset-settings-btn').addEventListener('click', () => {
            if (confirm('Reset all settings to defaults? This will enable all plugins.')) {
                currentSettings = { ...DEFAULT_SETTINGS };
                saveSettings();
                dropdown.remove();
                createPluginManagerDropdown(container);
                if (typeof starrez.ui !== 'undefined' && starrez.ui.ShowAlertMessage) {
                    starrez.ui.ShowAlertMessage('Settings reset to defaults. Refresh the page for changes to take effect.', 'Settings Reset');
                }
            }
        });

        dropdown.appendChild(footer);
        document.body.appendChild(dropdown);

        // Close dropdown when clicking outside
        setTimeout(() => {
            const closeOnClickOutside = (e) => {
                if (!dropdown.contains(e.target)) {
                    dropdown.remove();
                    document.removeEventListener('click', closeOnClickOutside);
                }
            };
            document.addEventListener('click', closeOnClickOutside);
        }, 100);
    }

    function addPluginManagerButton() {
        setTimeout(() => {
            const container = document.querySelector('.habitat-siteheading-buttons');
            if (container && !document.querySelector('#plugin-manager-button')) {
                const newButton = document.createElement('habitat-header-button');
                newButton.setAttribute('aria-label', 'StarWrench');
                newButton.setAttribute('tooltip', 'StarWrench');
                newButton.setAttribute('id', 'plugin-manager-button');
                newButton.setAttribute('icon', 'fa-wrench');
                newButton.setAttribute('dropdown-heading', 'StarWrench');

                newButton.addEventListener('click', () => {
                    createPluginManagerDropdown(container);
                });

                const userMenuButton = container.querySelector('#header-user-button');
                container.insertBefore(newButton, userMenuButton);
            }
        }, 1000);
    }

    // ================================
    // PLUGIN IMPLEMENTATIONS
    // ================================

    // BOOKMARKS PLUGIN
    function initBookmarksPlugin() {
        const BOOKMARKS_KEY = 'starrezBookmarks';

        const loadBookmarks = () => JSON.parse(localStorage.getItem(BOOKMARKS_KEY) || '[]');
        const saveBookmarks = (bookmarks) => localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));

        const parseUrl = (url) => {
            const urlObj = new URL(url);
            const hash = urlObj.hash;
            const pathParts = urlObj.pathname.split('/').filter(p => p);

            if (hash && hash.startsWith('#!')) {
                return { type: 'shortcode', shortcode: hash.substring(2) };
            }

            return {
                type: 'module',
                module: pathParts[1] || '',
                submodule: pathParts[2] || ''
            };
        };

        const navigateToBookmark = (url) => {
            const navInfo = parseUrl(url);

            if (navInfo.type === 'shortcode') {
                starrez.sm.NavigateTo(`#!${navInfo.shortcode}`);
            } else {
                if (window.location.hash && window.location.hash.startsWith('#!')) {
                    starrez.sm.CloseAllDetailScreens().done(() => {
                        starrez.mm.NavigateTo(navInfo.module, navInfo.submodule);
                    });
                } else {
                    starrez.mm.NavigateTo(navInfo.module, navInfo.submodule);
                }
            }
        };

        const createDropdown = (container, bookmarks) => {
            let dropdown = document.getElementById('bookmarks-dropdown');
            if (dropdown) {
                dropdown.remove();
                return;
            }

            dropdown = document.createElement('div');
            dropdown.id = 'bookmarks-dropdown';
            dropdown.style.cssText = `
                position: absolute; top: 50px; right: 10px; z-index: 99999;
                background: #fff; border: 1px solid #ccc; padding: 10px; width: 400px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.2); font-family: Arial, sans-serif;
                max-height: 400px; overflow-y: auto; border-radius: 8px;
            `;

            const list = document.createElement('ul');
            list.style.cssText = 'list-style: none; padding: 0; margin: 0;';

            bookmarks.forEach((bm, index) => {
                const li = document.createElement('li');
                li.style.cssText = 'margin-bottom: 10px; display: flex; align-items: center; gap: 5px;';
                li.draggable = true;
                li.dataset.index = index;

                // Drag functionality
                li.addEventListener('dragstart', (e) => {
                    e.dataTransfer.setData('text/plain', index);
                    li.style.opacity = '0.5';
                });
                li.addEventListener('dragend', () => li.style.opacity = '1');
                li.addEventListener('dragover', (e) => e.preventDefault());
                li.addEventListener('drop', (e) => {
                    e.preventDefault();
                    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
                    const toIndex = parseInt(li.dataset.index);
                    if (fromIndex !== toIndex) {
                        const [movedItem] = bookmarks.splice(fromIndex, 1);
                        bookmarks.splice(toIndex, 0, movedItem);
                        saveBookmarks(bookmarks);
                        createDropdown(container, bookmarks);
                    }
                });

                // Drag handle
                const dragHandle = document.createElement('span');
                dragHandle.textContent = '☰';
                dragHandle.style.cssText = 'cursor: grab; font-size: 18px; color: #666; user-select: none;';
                dragHandle.title = 'Drag to reorder';

                // Bookmark link
                const link = document.createElement('a');
                link.href = '#';
                link.textContent = bm.name;
                link.style.cssText = 'color: #0077cc; text-decoration: none; cursor: pointer; flex: 1; user-select: none;';

                const handleNavigation = (e) => {
                    e.preventDefault();
                    navigateToBookmark(bm.url);
                    dropdown.remove();
                };
                link.addEventListener('click', handleNavigation);

                // Edit button
                const editBtn = document.createElement('button');
                editBtn.textContent = '✏️';
                editBtn.style.cssText = 'background: none; border: none; cursor: pointer; font-size: 16px;';
                editBtn.onclick = () => {
                    link.removeEventListener('click', handleNavigation);
                    link.contentEditable = 'true';
                    link.style.outline = '1px solid #0077cc';
                    link.focus();
                    editBtn.style.display = 'none';
                    acceptBtn.style.display = 'inline';
                };

                // Accept button
                const acceptBtn = document.createElement('button');
                acceptBtn.textContent = '✓';
                acceptBtn.style.cssText = 'background: none; border: none; cursor: pointer; font-size: 16px; color: #28a745; display: none;';
                acceptBtn.onclick = () => {
                    const newName = link.textContent.trim();
                    if (newName) {
                        bookmarks[index].name = newName;
                        saveBookmarks(bookmarks);
                    }
                    link.contentEditable = 'false';
                    link.style.outline = 'none';
                    link.addEventListener('click', handleNavigation);
                    editBtn.style.display = 'inline';
                    acceptBtn.style.display = 'none';
                };

                // Delete button
                const delBtn = document.createElement('button');
                delBtn.textContent = '🗑️';
                delBtn.style.cssText = 'background: none; border: none; cursor: pointer; font-size: 16px;';
                delBtn.onclick = () => {
                    bookmarks.splice(index, 1);
                    saveBookmarks(bookmarks);
                    createDropdown(container, bookmarks);
                };

                li.append(dragHandle, link, editBtn, acceptBtn, delBtn);
                list.appendChild(li);
            });

            const addBtn = document.createElement('button');
            addBtn.textContent = 'Add Current Page';
            addBtn.style.cssText = 'margin-top: 10px; padding: 8px 12px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;';
            addBtn.onclick = () => {
                bookmarks.push({
                    name: document.title || 'Untitled',
                    url: window.location.href
                });
                saveBookmarks(bookmarks);
                createDropdown(container, bookmarks);
            };

            dropdown.append(list, addBtn);
            document.body.appendChild(dropdown);

            // Close dropdown when clicking outside
            setTimeout(() => {
                const closeOnClickOutside = (e) => {
                    if (!dropdown.contains(e.target)) {
                        dropdown.remove();
                        document.removeEventListener('click', closeOnClickOutside);
                    }
                };
                document.addEventListener('click', closeOnClickOutside);
            }, 100);
        };

        // Add bookmarks button
        setTimeout(() => {
            const container = document.querySelector('.habitat-siteheading-buttons');
            if (container && !document.querySelector('#bookmarks-button')) {
                const newButton = document.createElement('habitat-header-button');
                newButton.setAttribute('aria-label', 'Bookmarks');
                newButton.setAttribute('tooltip', 'Bookmarks');
                newButton.setAttribute('id', 'bookmarks-button');
                newButton.setAttribute('icon', 'fa-bookmark');

                newButton.addEventListener('click', () => {
                    createDropdown(container, loadBookmarks());
                });

                const thirdButton = container.children[2] || container.children[1];
                container.insertBefore(newButton, thirdButton);
            }
        }, 1200);
    }

    // AUTO-SELECT PLUGIN
    function initAutoSelectPlugin() {
        function addAutoSelectButton() {
            const targetButton = document.querySelector('button[aria-label="Add New Item"].sr_button_module_add');
            if (!targetButton || document.querySelector('.auto-select')) return;

            const autoSelectButton = document.createElement('habitat-button');
            autoSelectButton.setAttribute('variant', 'primary');
            autoSelectButton.setAttribute('compact', '');
            autoSelectButton.className = 'ui-order-tabs-button auto-select';
            autoSelectButton.style.cssText = 'top: 0; margin: 0;';

            const icon = document.createElement('habitat-fa-icon');
            icon.setAttribute('variant', 'fa-check');
            autoSelectButton.appendChild(icon);
            autoSelectButton.appendChild(document.createTextNode('Auto Select'));

            autoSelectButton.addEventListener('click', () => {
                const userInput = prompt("Enter IDs to auto-select (separated by newlines, spaces, or tabs):");
                if (!userInput?.trim()) return;

                const idArray = userInput.split(/[\n\s\t]+/).map(id => id.trim()).filter(id => id.length > 0);
                if (idArray.length === 0) {
                    alert('No valid IDs found.');
                    return;
                }

                const directoryGrid = document.querySelector('.directory-grid.ui-directory-grid');
                if (!directoryGrid) {
                    alert('Directory grid not found.');
                    return;
                }

                const allRows = directoryGrid.querySelectorAll('tr[data-id]');
                const clickedIds = [];
                const notFoundIds = [...idArray];

                allRows.forEach(row => {
                    const rowId = row.getAttribute('data-id');
                    if (idArray.includes(rowId)) {
                        const checkbox = row.querySelector('td.tick-cell input[type="checkbox"]');
                        if (checkbox && !checkbox.checked) {
                            checkbox.click();
                        }
                        clickedIds.push(rowId);
                        const index = notFoundIds.indexOf(rowId);
                        if (index > -1) notFoundIds.splice(index, 1);
                    }
                });

                let message = `Auto-select completed!\nSelected: ${clickedIds.length} items\n`;
                if (notFoundIds.length > 0) {
                    message += `\nNot found: ${notFoundIds.length <= 20 ? notFoundIds.join(', ') : notFoundIds.length + ' items'}`;
                }
                alert(message);
            });

            targetButton.parentNode.insertBefore(autoSelectButton, targetButton.nextSibling);
        }

        function checkAndAddButton() {
            if (document.title === "Entries") {
                addAutoSelectButton();
            }
        }

        checkAndAddButton();

        // Monitor for page changes
        let lastTitle = document.title;
        const observer = new MutationObserver(() => {
            if (document.title !== lastTitle) {
                lastTitle = document.title;
                setTimeout(checkAndAddButton, 500);
            }
        });
        observer.observe(document.querySelector('title') || document.head, { childList: true, characterData: true, subtree: true });
    }

    // CLIPBOARD PLUGIN
    function initClipboardPlugin() {
        function getEntryIdsFromDashboard(dashboardItem) {
            const links = dashboardItem.querySelectorAll('a[href*="#!Entry:"]');
            const entryIds = [];

            links.forEach(link => {
                const href = link.getAttribute('href');
                // Match #!Entry:XXXXX pattern, extracting just the number
                const match = href.match(/#!Entry:(\d+)/);
                if (match) {
                    entryIds.push(match[1]);
                }
            });

            // Remove duplicates while preserving order
            return [...new Set(entryIds)];
        }

        async function copyToClipboard(text) {
            try {
                if (navigator.clipboard && window.isSecureContext) {
                    await navigator.clipboard.writeText(text);
                    return true;
                } else {
                    const textArea = document.createElement('textarea');
                    textArea.value = text;
                    textArea.style.cssText = 'position: fixed; left: -999999px; top: -999999px;';
                    document.body.appendChild(textArea);
                    textArea.select();
                    const successful = document.execCommand('copy');
                    document.body.removeChild(textArea);
                    return successful;
                }
            } catch (err) {
                return false;
            }
        }

        async function loadAllRecords(dashboardItem) {
            const container = dashboardItem.querySelector('.dashboard-item-container');
            if (!container) return false;

            // Get expected total record count
            const moduleOptions = dashboardItem.querySelector('.sys-module-options');
            const footer = dashboardItem.querySelector('.dashboard-footer');
            let expectedCount = 0;

            if (moduleOptions) {
                const count = moduleOptions.getAttribute('data-recordcount');
                expectedCount = count ? parseInt(count, 10) : 0;
            }

            if (!expectedCount && footer) {
                const match = footer.textContent.match(/Records:\s*(\d+)/);
                expectedCount = match ? parseInt(match[1], 10) : 0;
            }

            if (!expectedCount) return true; // No count found, assume all loaded

            // Keep scrolling until all records are loaded
            let previousCount = 0;
            let attempts = 0;
            const maxAttempts = 100; // Safety limit

            while (attempts < maxAttempts) {
                const currentRows = dashboardItem.querySelectorAll('tbody tr[data-recordid]');
                const currentCount = currentRows.length;

                // Check if we have all records
                if (currentCount >= expectedCount) {
                    return true;
                }

                // Check if no new records loaded (might be stuck)
                if (currentCount === previousCount) {
                    attempts++;
                    if (attempts > 3) {
                        // Tried 3 times with no new records, assume we have all we can get
                        return true;
                    }
                } else {
                    attempts = 0; // Reset attempts counter if we got new records
                }

                previousCount = currentCount;

                // Scroll to bottom of container
                container.scrollTop = container.scrollHeight;

                // Wait for lazy load (2 seconds)
                await new Promise(resolve => setTimeout(resolve, 2000));
            }

            return true;
        }

        async function handleClipboardClick(dashboardItem) {
            // Get current and expected counts
            const moduleOptions = dashboardItem.querySelector('.sys-module-options');
            const footer = dashboardItem.querySelector('.dashboard-footer');
            let expectedCount = 0;

            if (moduleOptions) {
                const count = moduleOptions.getAttribute('data-recordcount');
                expectedCount = count ? parseInt(count, 10) : 0;
            }

            if (!expectedCount && footer) {
                const match = footer.textContent.match(/Records:\s*(\d+)/);
                expectedCount = match ? parseInt(match[1], 10) : 0;
            }

            const currentRows = dashboardItem.querySelectorAll('tbody tr[data-recordid]');
            const currentCount = currentRows.length;

            // Only prompt if we need to load more records
            if (expectedCount > 0 && currentCount < expectedCount) {
                const needToLoad = expectedCount - currentCount;
                const loadingAlert = confirm(`Currently showing ${currentCount} of ${expectedCount} records. This will scroll to load the remaining ${needToLoad} records. Continue?`);
                if (!loadingAlert) return;

                // Load all records
                await loadAllRecords(dashboardItem);

                // Verify all records were loaded
                const loadedRows = dashboardItem.querySelectorAll('tbody tr[data-recordid]');
                const loadedCount = loadedRows.length;

                if (loadedCount < expectedCount) {
                    const proceed = confirm(`Warning: Only loaded ${loadedCount} of ${expectedCount} expected records. Continue copying?`);
                    if (!proceed) return;
                }
            }

            const entryIds = getEntryIdsFromDashboard(dashboardItem);
            if (entryIds.length === 0) {
                alert('No Entry IDs found.');
                return;
            }

            const idsText = entryIds.join('\n');
            const success = await copyToClipboard(idsText);

            if (success) {
                let message = `Successfully copied ${entryIds.length} Entry IDs to clipboard!`;
                if (expectedCount > 0 && entryIds.length !== expectedCount) {
                    message += `\n\nNote: Expected ${expectedCount} records but found ${entryIds.length} Entry IDs.`;
                }
                alert(message);
            } else {
                alert(`Failed to copy. Found ${entryIds.length} IDs:\n\n${idsText}`);
            }
        }

        function addClipboardButton(dashboardItem) {
            // Remove existing button if present
            const existingButton = dashboardItem.querySelector('.clipboard-copy-btn');
            if (existingButton) {
                existingButton.remove();
            }

            // Check if this dashboard item has any Entry links
            const entryIds = getEntryIdsFromDashboard(dashboardItem);
            if (entryIds.length === 0) {
                return; // Don't add button if no Entry links found
            }

            const titleOptions = dashboardItem.querySelector('.dashboard-item-title-options');
            if (!titleOptions) return;

            const button = document.createElement('button');
            button.className = 'sr_button_icon sr_button clipboard-copy-btn';
            button.title = 'Copy Entry IDs to Clipboard';
            button.innerHTML = '<i class="fa fa-clipboard"></i>';
            button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                handleClipboardClick(dashboardItem);
            });

            titleOptions.insertBefore(button, titleOptions.firstChild);
        }

        function processAllDashboardItems() {
            document.querySelectorAll('.dashboard-item').forEach(addClipboardButton);
        }

        setTimeout(processAllDashboardItems, 1000);

        // Monitor for changes
        let currentUrl = window.location.href;
        setInterval(() => {
            if (window.location.href !== currentUrl) {
                currentUrl = window.location.href;
                setTimeout(processAllDashboardItems, 1000);
            }
        }, 2000);
    }

    // DASHBOARD SEARCH PLUGIN
    function initDashboardPlugin() {
        const PROCESSED_ATTRIBUTE = 'data-search-filter-added';

        function addSearchToDropdown(dropdown) {
            if (dropdown.hasAttribute(PROCESSED_ATTRIBUTE)) return;

            let selectedIndex = -1;

            const searchInput = document.createElement('input');
            searchInput.className = 'input search-filter-input';
            searchInput.type = 'text';
            searchInput.placeholder = 'Search';
            searchInput.style.cssText = `
                width: 100%; position: sticky; top: 0; padding: 1em 0.4em;
                border: none; border-bottom: 1px solid #d0d0d0; text-indent: 1em;
                font-size: 1.2em; z-index: 9999;
            `;
            searchInput.onclick = (e) => e.stopPropagation();

            function getVisibleItems() {
                return Array.from(dropdown.querySelectorAll('ul li')).filter(item => {
                    return item.style.display !== 'none';
                });
            }

            function setSelectedIndex(index) {
                selectedIndex = index;
                const visibleItems = getVisibleItems();

                visibleItems.forEach((item, i) => {
                    if (i === index) {
                        item.style.backgroundColor = 'var(--color-blue-b20, #e6f2ff)';
                    } else {
                        item.style.backgroundColor = '';
                    }
                });

                if (visibleItems[index]) {
                    visibleItems[index].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                }
            }

            searchInput.addEventListener('input', function() {
                const filterText = this.value.toLowerCase();
                dropdown.querySelectorAll('ul li').forEach(item => {
                    item.style.display = item.textContent.toLowerCase().includes(filterText) ? '' : 'none';
                });
                selectedIndex = -1;
                setSelectedIndex(-1);
            });

            searchInput.addEventListener('keydown', (e) => {
                const visibleItems = getVisibleItems();
                const itemCount = visibleItems.length;

                switch (e.key) {
                    case 'ArrowDown':
                        e.preventDefault();
                        if (selectedIndex < itemCount - 1) {
                            setSelectedIndex(selectedIndex + 1);
                        }
                        break;

                    case 'ArrowUp':
                        e.preventDefault();
                        if (selectedIndex > 0) {
                            setSelectedIndex(selectedIndex - 1);
                        } else if (selectedIndex === 0) {
                            setSelectedIndex(-1);
                        }
                        break;

                    case 'Enter':
                        e.preventDefault();
                        if (selectedIndex >= 0 && visibleItems[selectedIndex]) {
                            const link = visibleItems[selectedIndex].querySelector('a');
                            if (link) {
                                link.click();
                            }
                        }
                        break;

                    case 'Escape':
                        e.preventDefault();
                        dropdown.classList.add('hidden');
                        searchInput.value = '';
                        selectedIndex = -1;
                        setSelectedIndex(-1);
                        break;
                }
            });

            dropdown.insertBefore(searchInput, dropdown.firstChild);
            dropdown.setAttribute(PROCESSED_ATTRIBUTE, 'true');
            setTimeout(() => searchInput.focus(), 50);
        }

        function scanForDropdowns(focusInput = false) {
            document.querySelectorAll('.ui-submodules-more-dropdown.srw_subModuleTabs_more_dropdown').forEach(dropdown => {
                if (!dropdown.hasAttribute(PROCESSED_ATTRIBUTE)) {
                    addSearchToDropdown(dropdown);
                } else if (focusInput) {
                    const searchInput = dropdown.querySelector('.search-filter-input');
                    if (searchInput) {
                        setTimeout(() => searchInput.focus(), 100);
                    }
                }
            });
        }

        function setupMoreButtonListeners() {
            document.querySelectorAll('.srw_subModuleTabs_more, .srw_subModuleTabs_more_button, .ui-sub-module-more-group-button').forEach(button => {
                if (!button.hasAttribute('data-filter-listener')) {
                    button.addEventListener('click', () => setTimeout(() => scanForDropdowns(true), 300));
                    button.setAttribute('data-filter-listener', 'true');
                }
            });
        }

        setTimeout(() => {
            setupMoreButtonListeners();
            scanForDropdowns();
        }, 1500);

        // Monitor for changes
        const observer = new MutationObserver(() => {
            setupMoreButtonListeners();
            scanForDropdowns();
        });
        observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
    }

    // INITIALS HIGHLIGHTER PLUGIN
    function initInitialsPlugin() {
        let processingInProgress = false;
        let nameCache = {};
        let currentIncidentId = null;

        const styles = document.createElement('style');
        styles.textContent = `
            .initials-name {
                color: #666; font-size: 0.9em; opacity: 0.7; font-style: italic;
                margin-left: 2px; user-select: none;
            }
        `;
        document.head.appendChild(styles);

        function getCurrentIncidentId() {
            // Extract incident ID from URL hash like #!incident:144073:quick%20information
            const hash = window.location.hash;
            if (!hash || !hash.includes('incident:')) return null;

            const match = hash.match(/incident:(\d+)/);
            return match ? match[1] : null;
        }

        function extractNamesFromParticipants() {
            const names = {};
            document.querySelectorAll('table.viewdefault').forEach(table => {
                const fieldsetBlock = table.closest('.fieldset-block');
                if (!fieldsetBlock) return;

                const caption = fieldsetBlock.querySelector('.caption');
                if (!caption || !caption.textContent.includes('Participants')) return;

                table.querySelectorAll('tbody tr').forEach(row => {
                    const nameCell = row.querySelector('.incidententryid span.field');
                    if (!nameCell) return;

                    const fullText = nameCell.textContent.trim();
                    const match = fullText.match(/^[A-Z]+:\s*([^,]+),\s*([^(]+)(?:\(([^)]+)\))?/);

                    if (match) {
                        const lastName = match[1].trim();
                        const firstNames = match[2].trim();
                        const preferredName = match[3] ? match[3].trim() : '';
                        const firstNameParts = firstNames.split(/\s+/);
                        const primaryName = preferredName || firstNameParts[0];
                        const lastInitial = lastName.charAt(0).toUpperCase();
                        const firstInitial = primaryName.charAt(0).toUpperCase();

                        names[firstInitial + lastInitial] = `${primaryName} ${lastName}`;

                        if (firstNameParts.length > 1) {
                            let fullInitials = '';
                            firstNameParts.forEach(name => fullInitials += name.charAt(0).toUpperCase());
                            fullInitials += lastInitial;
                            names[fullInitials] = `${firstNames} ${lastName}`;
                        }
                    }
                });
            });
            return names;
        }

        function shouldSkipNode(node) {
            let parent = node.parentNode;
            while (parent && parent.nodeType === Node.ELEMENT_NODE) {
                const tagName = parent.tagName.toLowerCase();
                if (tagName === 'input' || tagName === 'select' || tagName === 'textarea') return true;
                if (parent.classList && parent.classList.contains('initials-highlight')) return true;
                parent = parent.parentNode;
            }
            return false;
        }

        function processTextNode(textNode, nameMap) {
            if (shouldSkipNode(textNode)) return false;

            const text = textNode.textContent;
            let modifiedText = text;
            let modified = false;

            const sortedInitials = Object.keys(nameMap).sort((a, b) => b.length - a.length);

            for (const initials of sortedInitials) {
                const fullName = nameMap[initials];

                // Build regex pattern that allows optional dots between letters and trailing dot
                // e.g., "JD" matches "JD", "J.D", "J.D."
                const letters = initials.split('');
                const pattern = letters.map(letter => `${letter}\\.?`).join('');

                // Special cases to exclude from expansion
                let regex;
                if (initials === 'CA') {
                    // Community Advisor: "CA" followed by space and capital letter (e.g., "CA Ido")
                    regex = new RegExp(`\\b${pattern}(?!\\s+[A-Z])(?![a-zA-Z])`, 'g');
                } else if (initials === 'ED') {
                    // ED House: "ED" followed by space and "House"
                    regex = new RegExp(`\\b${pattern}(?!\\s+House)(?![a-zA-Z])`, 'gi');
                } else if (initials === 'EH' || initials === 'KF') {
                    // EH/KF or EH KF: exclude when these appear in combination
                    // Don't expand "EH" when followed by /KF or space+KF
                    // Don't expand "KF" when preceded by EH/ or EH+space
                    if (initials === 'EH') {
                        regex = new RegExp(`\\b${pattern}(?!\\s*[/]?\\s*K\\.?F\\.?)(?![a-zA-Z])`, 'gi');
                    } else { // KF
                        regex = new RegExp(`(?<!E\\.?H\\.?\\s*[/]?\\s*)\\b${pattern}(?![a-zA-Z])`, 'gi');
                    }
                } else {
                    // Normal case: match initials with optional dots, not followed by more letters
                    regex = new RegExp(`\\b${pattern}(?![a-zA-Z])`, 'g');
                }

                if (regex.test(modifiedText)) {
                    // Reset regex for replacement
                    regex.lastIndex = 0;
                    modifiedText = modifiedText.replace(regex, (match) => {
                        // Preserve the matched text (with or without dots) in the highlight
                        return `<span class="initials-highlight" title="${fullName}">${match}</span><span class="initials-name">(${fullName})</span>`;
                    });
                    modified = true;
                }
            }

            if (modified) {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = modifiedText;
                const parent = textNode.parentNode;
                const fragment = document.createDocumentFragment();
                while (tempDiv.firstChild) {
                    fragment.appendChild(tempDiv.firstChild);
                }
                parent.replaceChild(fragment, textNode);
            }
            return modified;
        }

        function processDescriptionFields() {
            if (processingInProgress) return;
            processingInProgress = true;

            try {
                // Check if we've navigated to a different incident
                const incidentId = getCurrentIncidentId();
                if (incidentId !== currentIncidentId) {
                    // Clear the cache when switching incidents
                    nameCache = {};
                    currentIncidentId = incidentId;
                    console.log(`[Initials] Cleared cache for new incident: ${incidentId}`);
                }

                const nameMap = extractNamesFromParticipants();
                if (Object.keys(nameMap).length === 0) {
                    processingInProgress = false;
                    return;
                }

                // Replace the cache instead of merging
                nameCache = nameMap;

                document.querySelectorAll('span.field.view-control.textarea .textarea').forEach(field => {
                    const walker = document.createTreeWalker(
                        field,
                        NodeFilter.SHOW_TEXT,
                        {
                            acceptNode: (node) => {
                                if (!node.textContent.trim() || shouldSkipNode(node)) {
                                    return NodeFilter.FILTER_REJECT;
                                }
                                return NodeFilter.FILTER_ACCEPT;
                            }
                        }
                    );

                    const textNodes = [];
                    let node;
                    while (node = walker.nextNode()) {
                        textNodes.push(node);
                    }

                    textNodes.forEach(textNode => {
                        if (textNode.parentNode) {
                            processTextNode(textNode, nameCache);
                        }
                    });
                });
            } catch (error) {
                console.error('Error in initials highlighter:', error);
            }

            processingInProgress = false;
        }

        setTimeout(processDescriptionFields, 2000);
        setInterval(processDescriptionFields, 5000);

        const observer = new MutationObserver(() => {
            setTimeout(processDescriptionFields, 800);
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    // PHONE FORMATTER PLUGIN
    function initPhonePlugin() {
        let formattingInProgress = false;

        function formatPhoneNumber(phoneNumber) {
            const cleaned = phoneNumber.replace(/[^\d+]/g, '');
            if (cleaned.length < 7) return cleaned;

            if (cleaned.startsWith('+64')) {
                if (cleaned.length >= 5) {
                    if (cleaned.charAt(3) === '2') {
                        const remainingDigits = cleaned.slice(5);
                        const prefix = cleaned.slice(3, 5);
                        const firstGroup = remainingDigits.slice(0, 3);
                        const secondGroup = remainingDigits.slice(3);
                        return `+64 ${prefix} ${firstGroup} ${secondGroup}`;
                    } else {
                        const remainingDigits = cleaned.slice(4);
                        const prefix = cleaned.charAt(3);
                        const firstGroup = remainingDigits.slice(0, 3);
                        const secondGroup = remainingDigits.slice(3);
                        return `+64 ${prefix} ${firstGroup} ${secondGroup}`;
                    }
                }
            }

            if (cleaned.startsWith('02') && cleaned.length >= 9) {
                const prefix = cleaned.slice(0, 3);
                const remainingDigits = cleaned.slice(3);
                const firstGroup = remainingDigits.slice(0, 3);
                const secondGroup = remainingDigits.slice(3);
                return `${prefix} ${firstGroup} ${secondGroup}`;
            }

            if (cleaned.startsWith('0') && cleaned.length >= 8) {
                const prefix = cleaned.slice(0, 2);
                const remainingDigits = cleaned.slice(2);
                const firstGroup = remainingDigits.slice(0, 3);
                const secondGroup = remainingDigits.slice(3);
                return `${prefix} ${firstGroup} ${secondGroup}`;
            }

            if (cleaned.length <= 7) {
                return cleaned.slice(0, 3) + ' ' + cleaned.slice(3);
            } else {
                return cleaned.slice(0, 3) + ' ' + cleaned.slice(3, 6) + ' ' + cleaned.slice(6);
            }
        }

        function formatPhoneNumbersInPage() {
            if (formattingInProgress) return;
            formattingInProgress = true;

            try {
                // Format in personal info tiles
                document.querySelectorAll('ul[class*="personal-info-tile-styles"] li, li').forEach(item => {
                    const paragraphs = item.querySelectorAll('p');
                    if (paragraphs.length >= 2) {
                        const labelElement = paragraphs[0];
                        const valueElement = paragraphs[1];

                        if (labelElement?.textContent?.includes('Phone Number') && valueElement?.textContent) {
                            const originalNumber = valueElement.textContent.trim();
                            if (originalNumber && /^\+?[0-9]{7,15}$/.test(originalNumber.replace(/\s/g, ''))) {
                                const spaceCount = (originalNumber.match(/ /g) || []).length;
                                if (spaceCount < 2) {
                                    const formattedNumber = formatPhoneNumber(originalNumber);
                                    if (formattedNumber !== originalNumber) {
                                        valueElement.textContent = formattedNumber;
                                    }
                                }
                            }
                        }
                    }
                });

                // Format in search results
                document.querySelectorAll('span[data-name="Phone"]').forEach(span => {
                    if (span?.textContent) {
                        const originalNumber = span.textContent.trim();
                        if (originalNumber && /^\+?[0-9]{7,15}$/.test(originalNumber.replace(/\s/g, ''))) {
                            const spaceCount = (originalNumber.match(/ /g) || []).length;
                            if (spaceCount < 2) {
                                const formattedNumber = formatPhoneNumber(originalNumber);
                                if (formattedNumber !== originalNumber) {
                                    span.textContent = formattedNumber;
                                }
                            }
                        }
                    }
                });
            } catch (error) {
                console.error('Error in phone formatter:', error);
            }

            formattingInProgress = false;
        }

        setTimeout(formatPhoneNumbersInPage, 1500);
        setInterval(formatPhoneNumbersInPage, 3000);

        const observer = new MutationObserver(() => {
            setTimeout(formatPhoneNumbersInPage, 500);
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    // AUTO LINKER PLUGIN
    function initAutoLinkerPlugin() {
        let linkingInProgress = false;

        const styles = document.createElement('style');
        styles.textContent = `
            .auto-incident-link {
                color: #0077cc !important;
                text-decoration: underline !important;
                cursor: pointer !important;
                background: rgba(0, 119, 204, 0.1) !important;
                padding: 1px 3px !important;
                border-radius: 3px !important;
                transition: background 0.2s ease !important;
            }
            .auto-incident-link:hover {
                background: rgba(0, 119, 204, 0.2) !important;
                text-decoration: none !important;
            }
        `;
        document.head.appendChild(styles);

        function isInInputOrSelect(node) {
            let parent = node.parentNode;
            while (parent && parent.nodeType === Node.ELEMENT_NODE) {
                const tagName = parent.tagName.toLowerCase();
                if (tagName === 'input' || tagName === 'select' || tagName === 'textarea') {
                    return true;
                }
                parent = parent.parentNode;
            }
            return false;
        }

        function alreadyHasLinks(element) {
            if (element.querySelector && element.querySelector('.auto-incident-link')) {
                return true;
            }
            let parent = element.parentNode;
            while (parent && parent.nodeType === Node.ELEMENT_NODE) {
                if (parent.classList && parent.classList.contains('auto-incident-link')) {
                    return true;
                }
                parent = parent.parentNode;
            }
            return false;
        }

        function createIncidentLink(incidentNumber) {
            const link = document.createElement('span');
            link.className = 'auto-incident-link';
            link.title = `Open incident ${incidentNumber}`;
            link.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                // Navigate using StarRez shortcode system
                starrez.sm.NavigateTo(`#!incident:${incidentNumber}:quick%20information`);
            };
            return link;
        }

        function linkifyIncidentReferences(textNode) {
            if (isInInputOrSelect(textNode) || alreadyHasLinks(textNode)) {
                return false;
            }

            const text = textNode.textContent;
            // Match "incident ######" or "report ######" (both require exactly 6 digits, case insensitive)
            const incidentRegex = /\b(incident|report)\s+(\d{6})\b/gi;

            if (!incidentRegex.test(text)) {
                return false;
            }

            // Reset regex for actual replacement
            incidentRegex.lastIndex = 0;
            let modified = false;
            let lastIndex = 0;
            const fragment = document.createDocumentFragment();
            let match;

            while ((match = incidentRegex.exec(text)) !== null) {
                const matchStart = match.index;
                const matchEnd = matchStart + match[0].length;
                const incidentNumber = match[2];

                // Add text before the match
                if (matchStart > lastIndex) {
                    const beforeText = document.createTextNode(text.slice(lastIndex, matchStart));
                    fragment.appendChild(beforeText);
                }

                // Create the clickable link
                const link = createIncidentLink(incidentNumber);
                link.textContent = match[0]; // The full matched text
                fragment.appendChild(link);

                lastIndex = matchEnd;
                modified = true;
            }

            // Add remaining text after the last match
            if (lastIndex < text.length) {
                const afterText = document.createTextNode(text.slice(lastIndex));
                fragment.appendChild(afterText);
            }

            if (modified) {
                const parent = textNode.parentNode;
                parent.replaceChild(fragment, textNode);
            }

            return modified;
        }

        function processIncidentLinksInPage() {
            if (linkingInProgress) return;
            linkingInProgress = true;

            try {
                const walker = document.createTreeWalker(
                    document.body,
                    NodeFilter.SHOW_TEXT,
                    {
                        acceptNode: (node) => {
                            if (!node.textContent.trim() || isInInputOrSelect(node) || alreadyHasLinks(node)) {
                                return NodeFilter.FILTER_REJECT;
                            }
                            // Only process nodes that contain incident/report references
                            if (/\b(incident|report)\s+\d+\b/i.test(node.textContent)) {
                                return NodeFilter.FILTER_ACCEPT;
                            }
                            return NodeFilter.FILTER_REJECT;
                        }
                    }
                );

                const textNodes = [];
                let node;
                while (node = walker.nextNode()) {
                    textNodes.push(node);
                }

                textNodes.forEach(textNode => {
                    if (textNode.parentNode) {
                        linkifyIncidentReferences(textNode);
                    }
                });
            } catch (error) {
                console.error('Error in auto linker:', error);
            }

            linkingInProgress = false;
        }

        setTimeout(processIncidentLinksInPage, 1500);
        setInterval(processIncidentLinksInPage, 4000);

        const observer = new MutationObserver(() => {
            setTimeout(processIncidentLinksInPage, 600);
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    // WORD HIGHLIGHTER PLUGIN
    function initWordHighlighterPlugin() {
        let highlightingInProgress = false;

        const styles = document.createElement('style');
        styles.textContent = `
            mark.orange-highlight {
                background: orange !important;
                opacity: 0;
                animation: fadeIn 0.5s ease-in forwards;
            }
            mark.yellow-highlight {
                background: yellow !important;
                opacity: 0;
                animation: fadeIn 0.5s ease-in forwards;
            }
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
        `;
        document.head.appendChild(styles);

        function isInInputOrSelect(node) {
            let parent = node.parentNode;
            while (parent && parent.nodeType === Node.ELEMENT_NODE) {
                const tagName = parent.tagName.toLowerCase();
                if (tagName === 'input' || tagName === 'select' || tagName === 'textarea') {
                    return true;
                }
                parent = parent.parentNode;
            }
            return false;
        }

        function alreadyHasMarks(element) {
            if (element.querySelector && element.querySelector('mark.orange-highlight, mark.yellow-highlight')) {
                return true;
            }
            let parent = element.parentNode;
            while (parent && parent.nodeType === Node.ELEMENT_NODE) {
                if (parent.tagName && parent.tagName.toLowerCase() === 'mark') {
                    return true;
                }
                parent = parent.parentNode;
            }
            return false;
        }

        function wrapWordsWithMark(textNode) {
            if (isInInputOrSelect(textNode) || alreadyHasMarks(textNode)) {
                return false;
            }

            const text = textNode.textContent;
            if (text.includes('Orange') || text.includes('Yellow')) {
                const tempDiv = document.createElement('div');
                let modifiedText = text;

                modifiedText = modifiedText.replace(/Orange/g, '<mark class="orange-highlight">Orange</mark>');
                modifiedText = modifiedText.replace(/Yellow/g, '<mark class="yellow-highlight">Yellow</mark>');

                if (modifiedText !== text) {
                    tempDiv.innerHTML = modifiedText;
                    const parent = textNode.parentNode;
                    const fragment = document.createDocumentFragment();
                    while (tempDiv.firstChild) {
                        fragment.appendChild(tempDiv.firstChild);
                    }
                    parent.replaceChild(fragment, textNode);
                    return true;
                }
            }
            return false;
        }

        function highlightWordsInPage() {
            if (highlightingInProgress) return;
            highlightingInProgress = true;

            try {
                const walker = document.createTreeWalker(
                    document.body,
                    NodeFilter.SHOW_TEXT,
                    {
                        acceptNode: (node) => {
                            if (!node.textContent.trim() || isInInputOrSelect(node) || alreadyHasMarks(node)) {
                                return NodeFilter.FILTER_REJECT;
                            }
                            if (node.textContent.includes('Orange') || node.textContent.includes('Yellow')) {
                                return NodeFilter.FILTER_ACCEPT;
                            }
                            return NodeFilter.FILTER_REJECT;
                        }
                    }
                );

                const textNodes = [];
                let node;
                while (node = walker.nextNode()) {
                    textNodes.push(node);
                }

                textNodes.forEach(textNode => {
                    if (textNode.parentNode) {
                        wrapWordsWithMark(textNode);
                    }
                });
            } catch (error) {
                console.error('Error in word highlighter:', error);
            }

            highlightingInProgress = false;
        }

        setTimeout(highlightWordsInPage, 1500);
        setInterval(highlightWordsInPage, 3000);

        const observer = new MutationObserver(() => {
            setTimeout(highlightWordsInPage, 500);
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    // RESIDENT DATABASE FROM CSV (Background Service)
    // Allows importing resident data via CSV drag-and-drop
    function initResidentDatabaseFromCSV() {
        const RESIDENT_DB_KEY = 'starWrenchResidentDatabase';
        const RESIDENT_DB_META_KEY = 'starWrenchResidentDatabaseMeta';
        const CURRENT_STATUSES = ['Reserved', 'Tentative', 'In Room'];

        let residentDB = {};

        // Load database from localStorage
        function loadDatabase() {
            try {
                const stored = localStorage.getItem(RESIDENT_DB_KEY);
                if (stored) {
                    residentDB = JSON.parse(stored);
                } else {
                    residentDB = {};
                }
            } catch (error) {
                console.error('[ResidentDB] Failed to load database:', error);
                residentDB = {};
            }
        }

        // Save database to localStorage
        function saveDatabase() {
            try {
                localStorage.setItem(RESIDENT_DB_KEY, JSON.stringify(residentDB));
                localStorage.setItem(RESIDENT_DB_META_KEY, JSON.stringify({
                    lastUpdated: new Date().toISOString(),
                    recordCount: Object.keys(residentDB).length
                }));
            } catch (error) {
                console.error('[ResidentDB] Failed to save database:', error);
            }
        }

        // Parse CSV text with flexible header detection
        function parseCSV(csvText) {
            const lines = csvText.split('\n').map(line => line.trim()).filter(line => line);
            if (lines.length === 0) return [];

            // Parse header row to find column indices
            const headerLine = lines[0];
            const headers = parseCSVLine(headerLine);

            // Find required column indices (case-insensitive)
            const columnMap = {};
            const requiredColumns = ['Entry ID', 'First Name', 'Preferred Name', 'Last Name', 'Room', 'Entry Status'];

            headers.forEach((header, index) => {
                const normalizedHeader = header.trim();
                requiredColumns.forEach(reqCol => {
                    if (normalizedHeader.toLowerCase() === reqCol.toLowerCase()) {
                        columnMap[reqCol] = index;
                    }
                });
            });

            // Check if we have Entry ID (required)
            if (columnMap['Entry ID'] === undefined) {
                throw new Error('CSV must contain "Entry ID" column');
            }

            // Parse data rows
            const records = [];
            for (let i = 1; i < lines.length; i++) {
                const values = parseCSVLine(lines[i]);

                const entryId = values[columnMap['Entry ID']]?.trim();
                if (!entryId) continue; // Skip rows without entry ID

                const record = {
                    entryId: entryId,
                    nameFirst: values[columnMap['First Name']]?.trim() || '',
                    namePreferred: values[columnMap['Preferred Name']]?.trim() || '',
                    nameLast: values[columnMap['Last Name']]?.trim() || '',
                    roomSpace: values[columnMap['Room']]?.trim() || '',
                    status: values[columnMap['Entry Status']]?.trim() || '',
                    lastUpdated: new Date().toISOString()
                };

                records.push(record);
            }

            return records;
        }

        // Parse a single CSV line handling quoted fields
        function parseCSVLine(line) {
            const result = [];
            let current = '';
            let inQuotes = false;

            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                const nextChar = line[i + 1];

                if (char === '"') {
                    if (inQuotes && nextChar === '"') {
                        // Escaped quote
                        current += '"';
                        i++; // Skip next quote
                    } else {
                        // Toggle quote mode
                        inQuotes = !inQuotes;
                    }
                } else if (char === ',' && !inQuotes) {
                    // Field separator
                    result.push(current);
                    current = '';
                } else {
                    current += char;
                }
            }

            // Add last field
            result.push(current);

            return result;
        }

        // Import CSV data into database
        function importCSV(csvText) {
            try {
                const records = parseCSV(csvText);

                let addedCount = 0;
                let updatedCount = 0;

                records.forEach(record => {
                    const existing = residentDB[record.entryId];

                    if (!existing) {
                        residentDB[record.entryId] = record;
                        addedCount++;
                    } else {
                        // Check if anything changed
                        const changed =
                            existing.nameFirst !== record.nameFirst ||
                            existing.namePreferred !== record.namePreferred ||
                            existing.nameLast !== record.nameLast ||
                            existing.roomSpace !== record.roomSpace ||
                            existing.status !== record.status;

                        if (changed) {
                            residentDB[record.entryId] = record;
                            updatedCount++;
                        }
                    }
                });

                saveDatabase();

                return { addedCount, updatedCount, totalRecords: records.length };
            } catch (error) {
                console.error('[ResidentDB] Failed to import CSV:', error);
                throw error;
            }
        }


        // Expose API for search plugin
        window.starWrenchResidentDB = {
            search: function(query, currentOnly = true) {
                if (!query || typeof query !== 'string') return [];

                const lowerQuery = query.toLowerCase();
                const results = [];

                Object.values(residentDB).forEach(resident => {
                    const isCurrent = CURRENT_STATUSES.includes(resident.status);

                    if (currentOnly && !isCurrent) {
                        return;
                    }
                    if (!currentOnly && isCurrent) {
                        return;
                    }

                    const searchableText = [
                        resident.nameFirst,
                        resident.namePreferred,
                        resident.nameLast,
                        resident.entryId,
                        resident.roomSpace
                    ].join(' ').toLowerCase();

                    if (searchableText.includes(lowerQuery)) {
                        results.push(resident);
                    }
                });

                return results;
            },
            getById: function(entryId) {
                return residentDB[entryId] || null;
            },
            getAll: function(currentOnly = true) {
                const all = Object.values(residentDB);
                if (currentOnly) {
                    return all.filter(r => CURRENT_STATUSES.includes(r.status));
                }
                return all;
            },
            getCount: function() {
                return Object.keys(residentDB).length;
            },
            importCSV: function(csvText) {
                return importCSV(csvText);
            }
        };

        // Initialize
        loadDatabase();

        console.log(`[ResidentDB] Loaded ${Object.keys(residentDB).length} residents from storage`);
    }

    // QUICK ACCESS PLUGIN
    function initQuickAccessPlugin() {
        // Inject CSS for proper layout
        function injectStyles() {
            if (document.getElementById('starwrench-search-styles')) {
                return;
            }

            const style = document.createElement('style');
            style.id = 'starwrench-search-styles';
            style.textContent = `
                #habitat-site-header .habitat-siteheading-bar {
                    display: flex !important;
                    width: 100%;
                    justify-content: space-between;
                }

                #habitat-site-header .habitat-siteheading-bar #starwrench-search-hint {
                    margin-left: auto;
                    margin-right: 0;
                    font-size: 13px;
                    color: var(--color-grey-g60, #666);
                    white-space: nowrap;
                    flex-shrink: 1;
                }

                #starwrench-instant-search-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.5);
                    z-index: 100000;
                    display: flex;
                    justify-content: center;
                    padding-top: 15vh;
                }

                #starwrench-instant-search-container {
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                    width: 90%;
                    max-width: 600px;
                    max-height: 70vh;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                }

                #starwrench-instant-search-header {
                    display: flex;
                    align-items: center;
                    border-bottom: 1px solid var(--color-grey-g30, #ccc);
                }

                #starwrench-instant-search-input {
                    border: none;
                    padding: 16px 20px;
                    font-size: 18px;
                    outline: none;
                    flex: 1;
                }

                #starwrench-instant-search-tabs {
                    display: flex;
                    gap: 4px;
                    padding: 8px 12px;
                    border-left: 1px solid var(--color-grey-g30, #ccc);
                }

                .starwrench-search-tab {
                    padding: 6px 12px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                    color: var(--color-grey-g60, #666);
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }

                .starwrench-search-tab:hover {
                    background: var(--color-grey-g20, #f0f0f0);
                }

                .starwrench-search-tab.active {
                    background: var(--color-blue-b60, #0066cc);
                    color: white;
                }

                .starwrench-search-tab-icon {
                    font-size: 12px;
                }

                #starwrench-instant-search-results {
                    overflow-y: auto;
                    display: none;
                    flex-grow: 1;
                }

                #starwrench-instant-search-results.visible {
                    display: block;
                }

                #starwrench-instant-search-footer {
                    padding: 8px 20px;
                    border-top: 1px solid var(--color-grey-g30, #ccc);
                    font-size: 11px;
                    color: var(--color-grey-g60, #666);
                    background: var(--color-grey-g10, #f8f8f8);
                    text-align: center;
                }

                #starwrench-instant-search-container.drag-over {
                    border: 3px dashed var(--color-blue-b60, #0066cc);
                    background: rgb(243, 249, 255);
                }

                #starwrench-instant-search-container.drag-over #starwrench-instant-search-results,
                #starwrench-instant-search-container.drag-over #starwrench-instant-search-header,
                #starwrench-instant-search-container.drag-over #starwrench-instant-search-footer {
                    background: rgb(243, 249, 255);
                }

                .starwrench-instant-search-result {
                    padding: 12px 20px;
                    cursor: pointer;
                    border-bottom: 1px solid var(--color-grey-g20, #f0f0f0);
                    transition: background-color 0.1s;
                }

                .starwrench-instant-search-result:hover,
                .starwrench-instant-search-result.selected {
                    background: var(--color-blue-b20, #e6f2ff);
                }

                .starwrench-instant-search-empty {
                    padding: 40px 20px;
                    text-align: center;
                    color: var(--color-grey-g60, #666);
                }

                .starwrench-instant-search-empty h3 {
                    margin: 0 0 16px 0;
                    color: var(--color-grey-g70, #555);
                }

                .starwrench-instant-search-empty ol {
                    text-align: left;
                    max-width: 400px;
                    margin: 16px auto;
                }
            `;
            document.head.appendChild(style);
        }

        // Create instant search modal
        function createInstantSearchModal() {
            const BOOKMARKS_KEY = 'starrezBookmarks';
            const SEARCH_MODE_CURRENT = 'current';
            const SEARCH_MODE_HISTORIC = 'historic';
            const SEARCH_MODE_BOOKMARKS = 'bookmarks';

            let searchInput = null;
            let resultsContainer = null;
            let currentResults = [];
            let selectedIndex = -1;
            let searchTimeout = null;
            let currentMode = SEARCH_MODE_BOOKMARKS;

            // Create modal structure
            const modal = document.createElement('div');
            modal.id = 'starwrench-instant-search-modal';
            modal.style.display = 'none';

            const container = document.createElement('div');
            container.id = 'starwrench-instant-search-container';

            // Header with input and tabs
            const header = document.createElement('div');
            header.id = 'starwrench-instant-search-header';

            searchInput = document.createElement('input');
            searchInput.id = 'starwrench-instant-search-input';
            searchInput.type = 'text';
            searchInput.placeholder = 'Search residents...';
            searchInput.setAttribute('autocomplete', 'off');

            // Tabs for mode switching
            const tabs = document.createElement('div');
            tabs.id = 'starwrench-instant-search-tabs';

            const currentTab = document.createElement('div');
            currentTab.className = 'starwrench-search-tab';
            currentTab.dataset.mode = SEARCH_MODE_CURRENT;
            currentTab.innerHTML = `<i class="fa fa-user starwrench-search-tab-icon"></i>`;
            currentTab.title = 'Current Residents';

            const historicTab = document.createElement('div');
            historicTab.className = 'starwrench-search-tab';
            historicTab.dataset.mode = SEARCH_MODE_HISTORIC;
            historicTab.innerHTML = `<i class="fa fa-history starwrench-search-tab-icon"></i>`;
            historicTab.title = 'Historic Residents';

            const bookmarksTab = document.createElement('div');
            bookmarksTab.className = 'starwrench-search-tab active';
            bookmarksTab.dataset.mode = SEARCH_MODE_BOOKMARKS;
            bookmarksTab.innerHTML = `<i class="fa fa-bookmark starwrench-search-tab-icon"></i>`;
            bookmarksTab.title = 'Bookmarks';

            tabs.appendChild(currentTab);
            tabs.appendChild(historicTab);
            tabs.appendChild(bookmarksTab);

            header.appendChild(searchInput);
            header.appendChild(tabs);

            resultsContainer = document.createElement('div');
            resultsContainer.id = 'starwrench-instant-search-results';

            const footer = document.createElement('div');
            footer.id = 'starwrench-instant-search-footer';
            footer.innerHTML = 'To update index: <strong>Main</strong> → Filter residents → <strong>Print view as report</strong> → <strong>CSV</strong> → Drag and drop here';

            container.appendChild(header);
            container.appendChild(resultsContainer);
            container.appendChild(footer);
            modal.appendChild(container);
            document.body.appendChild(modal);

            // Load bookmarks from localStorage
            function loadBookmarks() {
                try {
                    return JSON.parse(localStorage.getItem(BOOKMARKS_KEY) || '[]');
                } catch (error) {
                    console.error('[QuickAccess] Failed to load bookmarks:', error);
                    return [];
                }
            }

            // Parse URL to determine navigation type (same as bookmarks plugin)
            function parseUrl(url) {
                const urlObj = new URL(url);
                const hash = urlObj.hash;
                const pathParts = urlObj.pathname.split('/').filter(p => p);

                if (hash && hash.startsWith('#!')) {
                    return { type: 'shortcode', shortcode: hash.substring(2) };
                }

                return {
                    type: 'module',
                    module: pathParts[1] || '',
                    submodule: pathParts[2] || ''
                };
            }

            // Navigate to URL (same as bookmarks plugin)
            function navigateToUrl(url) {
                closeModal();

                const navInfo = parseUrl(url);

                if (navInfo.type === 'shortcode') {
                    if (typeof starrez !== 'undefined' && starrez.sm && starrez.sm.NavigateTo) {
                        starrez.sm.NavigateTo(`#!${navInfo.shortcode}`);
                    }
                } else {
                    if (typeof starrez !== 'undefined' && starrez.mm && starrez.mm.NavigateTo) {
                        if (window.location.hash && window.location.hash.startsWith('#!')) {
                            starrez.sm.CloseAllDetailScreens().done(() => {
                                starrez.mm.NavigateTo(navInfo.module, navInfo.submodule);
                            });
                        } else {
                            starrez.mm.NavigateTo(navInfo.module, navInfo.submodule);
                        }
                    }
                }
            }

            // Navigate to resident
            function navigateToResident(entryId) {
                if (!entryId) return;
                closeModal();
                if (typeof starrez !== 'undefined' && starrez.sm && starrez.sm.NavigateTo) {
                    starrez.sm.NavigateTo(`#!Entry:${entryId}`);
                }
            }

            // Switch mode and update UI
            function switchMode(newMode) {
                currentMode = newMode;

                // Update tab active state
                document.querySelectorAll('.starwrench-search-tab').forEach(tab => {
                    if (tab.dataset.mode === newMode) {
                        tab.classList.add('active');
                    } else {
                        tab.classList.remove('active');
                    }
                });

                // Update placeholder
                if (newMode === SEARCH_MODE_BOOKMARKS) {
                    searchInput.placeholder = 'Search residents...';
                } else if (newMode === SEARCH_MODE_CURRENT) {
                    searchInput.placeholder = 'Search current residents...';
                } else {
                    searchInput.placeholder = 'Search historic residents...';
                }

                // Refresh display
                if (searchInput.value.trim()) {
                    handleSearch(searchInput.value);
                } else if (newMode === SEARCH_MODE_BOOKMARKS) {
                    showBookmarks();
                } else {
                    resultsContainer.classList.remove('visible');
                }
            }

            // Create bookmark item
            function createBookmarkItem(bookmark, index) {
                const item = document.createElement('div');
                item.className = 'starwrench-instant-search-result';
                item.dataset.index = index;
                item.dataset.url = bookmark.url;

                item.innerHTML = `
                    <div style="font-weight: 600; color: var(--color-grey-g90, #333); font-size: 14px; line-height: 1.3;">
                        ${bookmark.name}
                    </div>
                    <div style="font-size: 11px; color: var(--color-grey-g60, #666); line-height: 1.3;">
                        ${bookmark.url}
                    </div>
                `;

                item.addEventListener('click', () => {
                    navigateToUrl(bookmark.url);
                });

                item.addEventListener('mouseenter', () => {
                    setSelectedIndex(index);
                });

                return item;
            }

            // Create resident result item
            function createResidentItem(resident, index) {
                const item = document.createElement('div');
                item.className = 'starwrench-instant-search-result';
                item.dataset.index = index;
                item.dataset.entryId = resident.entryId;

                const displayName = `${resident.namePreferred || resident.nameFirst} ${resident.nameLast}`;
                const roomInfo = resident.roomSpace || 'No room';

                item.innerHTML = `
                    <div style="font-weight: 600; color: var(--color-grey-g90, #333); font-size: 14px; line-height: 1.3;">
                        ${displayName}
                    </div>
                    <div style="font-size: 12px; color: var(--color-grey-g60, #666); line-height: 1.3;">
                        ${roomInfo} • Entry ${resident.entryId}
                    </div>
                `;

                item.addEventListener('click', () => {
                    navigateToResident(resident.entryId);
                });

                item.addEventListener('mouseenter', () => {
                    setSelectedIndex(index);
                });

                return item;
            }

            // Update selected index
            function setSelectedIndex(index) {
                selectedIndex = index;
                const items = resultsContainer.querySelectorAll('.starwrench-instant-search-result');
                items.forEach((item, i) => {
                    if (i === index) {
                        item.classList.add('selected');
                        item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                    } else {
                        item.classList.remove('selected');
                    }
                });
            }

            // Show bookmarks
            function showBookmarks() {
                const bookmarks = loadBookmarks();
                currentResults = bookmarks;
                selectedIndex = -1;
                resultsContainer.innerHTML = '';
                resultsContainer.classList.add('visible');

                if (bookmarks.length === 0) {
                    resultsContainer.innerHTML = `
                        <div class="starwrench-instant-search-empty">
                            <h3>No bookmarks</h3>
                            <p>Create bookmarks by clicking the bookmark icon in the header</p>
                        </div>
                    `;
                    return;
                }

                bookmarks.forEach((bookmark, index) => {
                    const item = createBookmarkItem(bookmark, index);
                    resultsContainer.appendChild(item);
                });
            }

            // Show empty state for search
            function showEmptyState() {
                const dbCount = window.starWrenchResidentDB ? window.starWrenchResidentDB.getCount() : 0;

                if (dbCount === 0) {
                    resultsContainer.innerHTML = `
                        <div class="starwrench-instant-search-empty">
                            <h3>No resident data available</h3>
                            <p>To populate the search index:</p>
                            <ol>
                                <li>Navigate to <strong>Main → Entries</strong></li>
                                <li>Filter to the residents you want to index</li>
                                <li>Click <strong>Print the view as report</strong></li>
                                <li>Select <strong>CSV</strong> format</li>
                                <li>Drag and drop the CSV file onto <strong>this search window</strong></li>
                            </ol>
                        </div>
                    `;
                } else {
                    resultsContainer.innerHTML = `
                        <div class="starwrench-instant-search-empty">
                            <p>No results found for "${searchInput.value}"</p>
                            <p style="font-size: 12px; margin-top: 8px;">Try searching by name, entry ID, or room number</p>
                        </div>
                    `;
                }
                resultsContainer.classList.add('visible');
            }

            // Show search results
            function showSearchResults(results) {
                currentResults = results;
                selectedIndex = -1;
                resultsContainer.innerHTML = '';
                resultsContainer.classList.add('visible');

                if (results.length === 0) {
                    showEmptyState();
                    return;
                }

                results.slice(0, 20).forEach((resident, index) => {
                    const item = createResidentItem(resident, index);
                    resultsContainer.appendChild(item);
                });
            }

            // Handle search
            function handleSearch(query) {
                clearTimeout(searchTimeout);

                if (!query || query.trim().length === 0) {
                    // Clear search - return to bookmarks
                    switchMode(SEARCH_MODE_BOOKMARKS);
                    return;
                }

                // When typing, switch to current mode if in bookmarks
                if (currentMode === SEARCH_MODE_BOOKMARKS) {
                    switchMode(SEARCH_MODE_CURRENT);
                    return; // switchMode will call handleSearch again
                }

                searchTimeout = setTimeout(() => {
                    if (!window.starWrenchResidentDB) {
                        showEmptyState();
                        return;
                    }

                    const searchCurrentOnly = currentMode === SEARCH_MODE_CURRENT;
                    const results = window.starWrenchResidentDB.search(query.trim(), searchCurrentOnly);
                    showSearchResults(results);
                }, 150);
            }

            // Handle keyboard navigation
            function handleKeyDown(e) {
                if (e.key === 'Escape') {
                    e.preventDefault();
                    closeModal();
                    return;
                }

                if (e.key === 'Tab') {
                    e.preventDefault();
                    // Cycle through modes: bookmarks -> current -> historic -> bookmarks
                    if (currentMode === SEARCH_MODE_BOOKMARKS) {
                        switchMode(SEARCH_MODE_CURRENT);
                    } else if (currentMode === SEARCH_MODE_CURRENT) {
                        switchMode(SEARCH_MODE_HISTORIC);
                    } else {
                        switchMode(SEARCH_MODE_BOOKMARKS);
                    }
                    return;
                }

                const itemCount = currentResults.length > 20 ? 20 : currentResults.length;

                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    if (selectedIndex < itemCount - 1) {
                        setSelectedIndex(selectedIndex + 1);
                    }
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    if (selectedIndex > 0) {
                        setSelectedIndex(selectedIndex - 1);
                    } else if (selectedIndex === -1 && itemCount > 0) {
                        setSelectedIndex(itemCount - 1);
                    }
                } else if (e.key === 'Enter') {
                    e.preventDefault();
                    if (selectedIndex >= 0 && currentResults[selectedIndex]) {
                        // Check if it's a bookmark or resident
                        const result = currentResults[selectedIndex];
                        if (result.url) {
                            navigateToUrl(result.url);
                        } else if (result.entryId) {
                            navigateToResident(result.entryId);
                        }
                    }
                }
            }

            // Open modal
            function openModal() {
                modal.style.display = 'flex';
                searchInput.value = '';
                currentResults = [];
                selectedIndex = -1;

                // Reset to bookmarks mode
                switchMode(SEARCH_MODE_BOOKMARKS);

                // Focus input after a brief delay
                setTimeout(() => {
                    searchInput.focus();
                }, 50);
            }

            // Close modal
            function closeModal() {
                modal.style.display = 'none';
                searchInput.value = '';
                resultsContainer.innerHTML = '';
                resultsContainer.classList.remove('visible');
                currentResults = [];
                selectedIndex = -1;
            }

            // Event listeners
            searchInput.addEventListener('input', (e) => handleSearch(e.target.value));
            searchInput.addEventListener('keydown', handleKeyDown);

            // Click handlers for tabs
            currentTab.addEventListener('click', () => switchMode(SEARCH_MODE_CURRENT));
            historicTab.addEventListener('click', () => switchMode(SEARCH_MODE_HISTORIC));
            bookmarksTab.addEventListener('click', () => switchMode(SEARCH_MODE_BOOKMARKS));

            // Click outside to close
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    closeModal();
                }
            });

            // Global escape handler (even when input not focused)
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && modal.style.display === 'flex') {
                    e.preventDefault();
                    closeModal();
                }
            });

            // Setup drag-and-drop on modal container
            setupDragAndDropOnModal(container);

            return { openModal, closeModal };
        }

        // Setup drag-and-drop on modal container
        function setupDragAndDropOnModal(targetElement) {
            targetElement.addEventListener('dragenter', (e) => {
                e.preventDefault();
                e.stopPropagation();
                targetElement.classList.add('drag-over');
            });

            targetElement.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.stopPropagation();
            });

            targetElement.addEventListener('dragleave', (e) => {
                e.preventDefault();
                e.stopPropagation();
                // Only remove if leaving the container itself, not a child
                if (e.target === targetElement) {
                    targetElement.classList.remove('drag-over');
                }
            });

            targetElement.addEventListener('drop', (e) => {
                e.preventDefault();
                e.stopPropagation();
                targetElement.classList.remove('drag-over');

                const files = e.dataTransfer.files;
                if (files.length === 0) return;

                const file = files[0];
                if (!file.name.endsWith('.csv')) {
                    alert('Please drop a CSV file');
                    return;
                }

                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        const csvText = event.target.result;

                        if (!window.starWrenchResidentDB || !window.starWrenchResidentDB.importCSV) {
                            alert('Resident database not available');
                            return;
                        }

                        const result = window.starWrenchResidentDB.importCSV(csvText);

                        if (typeof starrez !== 'undefined' && starrez.ui && starrez.ui.ShowAlertMessage) {
                            starrez.ui.ShowAlertMessage(
                                `CSV imported successfully!\n\nAdded: ${result.addedCount}\nUpdated: ${result.updatedCount}\nTotal: ${result.totalRecords}`,
                                'success'
                            );
                        } else {
                            alert(`CSV imported successfully!\n\nAdded: ${result.addedCount}\nUpdated: ${result.updatedCount}\nTotal: ${result.totalRecords}`);
                        }
                    } catch (error) {
                        if (typeof starrez !== 'undefined' && starrez.ui && starrez.ui.ShowAlertMessage) {
                            starrez.ui.ShowAlertMessage(`Failed to import CSV: ${error.message}`, 'error');
                        } else {
                            alert(`Failed to import CSV: ${error.message}`);
                        }
                    }
                };
                reader.readAsText(file);
            });
        }

        // Add quick access hint between breadcrumb and search bar
        function addSearchHint() {
            const originalSearch = document.querySelector('habitat-search-input#header-global-search');
            if (!originalSearch) {
                console.log('[QuickAccess] Original search input not found');
                return false;
            }

            // Check if hint already exists
            if (document.getElementById('starwrench-search-hint')) {
                return true;
            }

            // Create hint text with kbd element
            const hintContainer = document.createElement('span');
            hintContainer.id = 'starwrench-search-hint';

            // Create kbd element for the slash
            const kbdElement = document.createElement('kbd');
            kbdElement.textContent = '/';
            kbdElement.style.cssText = `
                background: var(--color-grey-g20, #f0f0f0);
                border: 1px solid var(--color-grey-g30, #ccc);
                border-radius: 3px;
                padding: 2px 6px;
                font-size: 11px;
                font-family: monospace;
                color: var(--color-grey-g60, #666);
                line-height: 1;
                box-shadow: 0 1px 2px rgba(0,0,0,0.1);
                margin-right: 4px;
            `;

            // Assemble hint: "type / for quick access"
            hintContainer.appendChild(document.createTextNode('type '));
            hintContainer.appendChild(kbdElement);
            hintContainer.appendChild(document.createTextNode('for quick access'));

            // Insert hint BEFORE the search input (between breadcrumb and search)
            originalSearch.parentNode.insertBefore(hintContainer, originalSearch);

            return true;
        }

        // Initialize the plugin
        function initialize() {
            // Inject styles immediately
            injectStyles();

            // Create instant search modal
            const instantSearch = createInstantSearchModal();

            // Global keyboard shortcut for "/" to toggle search
            document.addEventListener('keydown', (e) => {
                if (e.key === '/') {
                    const quickAccessInput = document.getElementById('starwrench-instant-search-input');

                    // If focused on a non-quick-access input/textarea, ignore
                    if (['INPUT', 'TEXTAREA'].includes(e.target.tagName) && e.target !== quickAccessInput) {
                        return; // Let the "/" be typed normally
                    }

                    // If focused on quick access input with text already, ignore
                    if (e.target === quickAccessInput && e.target.value.length > 0) {
                        return; // Let the "/" be typed normally
                    }

                    // Otherwise, toggle the modal
                    e.preventDefault();
                    const modal = document.getElementById('starwrench-instant-search-modal');
                    const isModalOpen = modal && modal.style.display === 'flex';

                    if (isModalOpen) {
                        instantSearch.closeModal();
                    } else {
                        instantSearch.openModal();
                    }
                }
            });

            // Add hint much faster to prevent layout jank
            setTimeout(() => {
                const success = addSearchHint();
                if (!success) {
                    // Retry after a shorter delay
                    setTimeout(() => addSearchHint(), 500);
                }
            }, 100);
        }

        initialize();
    }

    // QUICK ADD PARTICIPANTS PLUGIN
    function initQuickAddParticipantsPlugin() {

        let searchInput = null;
        let resultsContainer = null;
        let currentResults = [];
        let selectedIndex = -1;
        let searchTimeout = null;

        // Wait for the resident database to be available and populated
        function waitForDatabase(callback, attempts = 0) {
            if (window.starWrenchResidentDB && window.starWrenchResidentDB.getCount() > 0) {
                callback();
            } else if (attempts < 50) {
                setTimeout(() => waitForDatabase(callback, attempts + 1), 100);
            } else {
                console.log('[QuickAddParticipants] Resident database not populated yet. Visit Main -> Directory to build the database.');
            }
        }

        // Get current screen ID and type from StarRez API
        function getCurrentScreenInfo() {
            try {
                // First check the URL hash to see if we're even on a relevant page
                const hash = window.location.hash;

                let pageType = null;
                if (hash && hash.includes('incident:')) {
                    pageType = 'incident';
                } else if (hash && hash.includes('program:') && hash.includes(':attendees')) {
                    pageType = 'program';
                } else {
                    return null;
                }

                // Only call GetCurrentlyDisplayedScreenID if we're on a relevant page
                if (typeof starrez === 'undefined' || typeof starrez.sm === 'undefined' || typeof starrez.sm.GetCurrentlyDisplayedScreenID !== 'function') {
                    return null;
                }

                const screenId = starrez.sm.GetCurrentlyDisplayedScreenID();
                return { id: screenId, type: pageType };
            } catch (error) {
                console.error('[QuickAddParticipants] Error in getCurrentScreenInfo:', error);
                return null;
            }
        }

        // Add participant to incident or program via StarRez API
        function addParticipant(entryId, displayName) {
            const screenInfo = getCurrentScreenInfo();
            if (!screenInfo) {
                console.error('[QuickAddParticipants] Cannot determine screen ID or type');
                if (typeof starrez.ui !== 'undefined' && starrez.ui.ShowAlertMessage) {
                    starrez.ui.ShowAlertMessage('Unable to determine current screen. Please try again.', 'Error');
                } else {
                    alert('Unable to determine current screen. Please try again.');
                }
                return;
            }

            if (!window.starrez || !window.starrez.ServerRequest) {
                console.error('[QuickAddParticipants] StarRez ServerRequest API not available');
                if (typeof starrez.ui !== 'undefined' && starrez.ui.ShowAlertMessage) {
                    starrez.ui.ShowAlertMessage('StarRez API not available. Please refresh the page and try again.', 'Error');
                } else {
                    alert('StarRez API not available. Please refresh the page and try again.');
                }
                return;
            }

            let data, endpoint;

            if (screenInfo.type === 'incident') {
                // Incident data structure
                data = {
                    parentID: parseInt(screenInfo.id, 10),
                    vm: {
                        __ChangedFields: [
                            "IncidentInvolvementID", "Reported", "IdentityKnown", "EntryID", "Name",
                            "Age", "GenderEnum", "Height", "Weight", "HairColour", "EyeColour",
                            "Race", "Religion", "Ethnicity", "Demographic", "Comments",
                            "LinkRelationship", "WorkflowID"
                        ],
                        IncidentInvolvementID: "0",
                        Reported: false,
                        IdentityKnown: true,
                        EntryID: entryId.toString(),
                        Name: "",
                        Age: "",
                        GenderEnum: "0",
                        Height: "",
                        Weight: "",
                        HairColour: "",
                        EyeColour: "",
                        Race: "",
                        Religion: "",
                        Ethnicity: "",
                        Demographic: "",
                        Comments: "",
                        LinkRelationship: "",
                        WorkflowID: "0"
                    },
                    handler: {
                        _error: {
                            _autoFix: false,
                            _autoIgnore: false
                        }
                    }
                };
                endpoint = ["CampusLife", "IncidentEntry", "New"];
            } else if (screenInfo.type === 'program') {
                // Program data structure
                data = {
                    parentID: parseInt(screenInfo.id, 10),
                    vm: {
                        __ChangedFields: ["EntryID", "Status", "CheckInDate", "CheckOutDate", "WorkflowID"],
                        EntryID: entryId.toString(),
                        Status: "0",
                        CheckInDate: "",
                        CheckOutDate: "",
                        WorkflowID: "0"
                    },
                    handler: {
                        _error: {
                            _autoFix: false,
                            _autoIgnore: false
                        }
                    }
                };
                endpoint = ["CampusLife", "ProgramEntry", "New"];
            }

            // Show loading state on the search input
            if (searchInput) {
                searchInput.disabled = true;
                searchInput.placeholder = screenInfo.type === 'incident' ? 'Adding participant...' : 'Adding attendee...';
                searchInput.style.opacity = '0.6';
            }

            // Use StarRez's ServerRequest API to add the participant
            const call = new starrez.ServerRequest(endpoint[0], endpoint[1], endpoint[2], data);

            call.Request({
                ShowLoading: true
            }).done(response => {
                console.log(`[QuickAddParticipants] Successfully added participant: ${displayName} to ${screenInfo.type}`);

                // Refresh the current section to show the new participant
                if (typeof starrez.sm !== 'undefined' && starrez.sm.RefreshCurrentSection) {
                    starrez.sm.RefreshCurrentSection();
                } else {
                    // Fallback: trigger the same event that happens after manual save
                    if (typeof starrez.FireEvent !== 'undefined') {
                        starrez.FireEvent('DBObjectEvent', screenInfo.type, parseInt(screenInfo.id, 10));
                    }
                }

                // Auto-focus the search input after refresh for next participant
                setTimeout(() => {
                    if (searchInput && document.contains(searchInput)) {
                        searchInput.focus();
                        searchInput.select();
                    }
                }, 1000);

            }).fail((jqXHR, textStatus, errorThrown) => {
                console.error('[QuickAddParticipants] Error adding participant:', errorThrown);

                const contextName = screenInfo.type === 'incident' ? 'incident' : 'program';

                // Check if this is a data rule violation (duplicate participant)
                if (jqXHR.responseText && jqXHR.responseText.includes('HandleDataRuleViolation')) {
                    console.log(`[QuickAddParticipants] ${displayName} is already a participant in this ${contextName}`);

                    // StarRez will show its own popup for data rule violations
                    // We don't need to show an additional error message
                    // The user will see the StarRez popup and can dismiss it

                    // Just clear the search input and continue
                    if (searchInput) {
                        searchInput.value = '';
                    }
                } else {
                    // Show user-friendly error message for other types of errors
                    if (typeof starrez.ui !== 'undefined' && starrez.ui.ShowAlertMessage) {
                        starrez.ui.ShowAlertMessage(`Failed to add ${displayName} to the ${contextName}. Please try again or add manually.`, 'Error');
                    } else {
                        alert(`Failed to add ${displayName} to the ${contextName}. Please try again or add manually.`);
                    }
                }
            }).always(() => {
                // Restore search input state
                if (searchInput) {
                    searchInput.disabled = false;
                    searchInput.placeholder = screenInfo.type === 'incident' ? 'Add participant...' : 'Add attendee...';
                    searchInput.style.opacity = '1';
                }
            });
        }

        // Create the results dropdown
        function createResultsContainer() {
            const container = document.createElement('div');
            container.className = 'starwrench-quick-participants-results';
            container.style.cssText = `
                position: absolute;
                top: 100%;
                right: 0;
                min-width: 300px;
                width: max-content;
                max-width: 400px;
                background: white;
                border: 1px solid var(--color-grey-g30, #ccc);
                border-top: none;
                border-radius: 0 0 4px 4px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                max-height: 400px;
                overflow-y: auto;
                z-index: 10000;
                display: none;
                margin-top: -1px;
                text-align: left;
            `;
            return container;
        }

        // Create a single result item
        function createResultItem(resident, index) {
            const item = document.createElement('div');
            item.className = 'starwrench-search-result-item';
            item.dataset.index = index;
            item.dataset.entryId = resident.entryId;

            const displayName = `${resident.namePreferred || resident.nameFirst} ${resident.nameLast}`;
            const roomInfo = resident.roomSpace || 'No room';

            item.style.cssText = `
                padding: 6px 10px;
                cursor: pointer;
                border-bottom: 1px solid var(--color-grey-g20, #f0f0f0);
                transition: background-color 0.1s;
            `;

            item.innerHTML = `
                <div style="font-weight: 600; color: var(--color-grey-g90, #333); font-size: 14px; line-height: 1.3;">
                    ${displayName}
                </div>
                <div style="font-size: 11px; color: var(--color-grey-g60, #666); line-height: 1.3;">
                    ${roomInfo}
                </div>
                <div style="font-size: 11px; color: var(--color-grey-g50, #999); line-height: 1.3;">
                    Entry ${resident.entryId}
                </div>
            `;

            // Click handler (using mousedown to fire before blur event)
            item.addEventListener('mousedown', (e) => {
                e.preventDefault();
                e.stopPropagation();
                addParticipant(resident.entryId, displayName);
                closeResults();
                if (searchInput) searchInput.value = '';
            });

            // Hover handler
            item.addEventListener('mouseenter', () => {
                setSelectedIndex(index);
            });

            return item;
        }

        // Update the visual selection
        function setSelectedIndex(index) {
            selectedIndex = index;

            const items = resultsContainer.querySelectorAll('.starwrench-search-result-item');
            items.forEach((item, i) => {
                if (i === index) {
                    item.style.backgroundColor = 'var(--color-blue-b20, #e6f2ff)';
                } else {
                    item.style.backgroundColor = 'white';
                }
            });

            // Scroll into view if needed
            if (items[index]) {
                items[index].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
        }

        // Display search results
        function showResults(results) {
            currentResults = results;
            selectedIndex = -1;
            resultsContainer.innerHTML = '';

            if (results.length === 0) {
                const noResults = document.createElement('div');
                noResults.style.cssText = 'padding: 16px 12px; text-align: center; color: var(--color-grey-g60, #666); font-size: 12px; line-height: 1.5;';
                noResults.innerHTML = `
                    <div style="margin-bottom: 6px;">No residents found</div>
                    <div style="font-size: 11px; color: var(--color-grey-g50, #999);">
                        Search is populated from Main → Directory.<br>
                        Visit there to expand the database.
                    </div>
                `;
                resultsContainer.appendChild(noResults);
                resultsContainer.style.display = 'block';
                return;
            }

            // Limit to top 20 results
            const limitedResults = results.slice(0, 20);
            limitedResults.forEach((resident, index) => {
                const item = createResultItem(resident, index);
                resultsContainer.appendChild(item);
            });

            resultsContainer.style.display = 'block';
        }

        // Close the results dropdown
        function closeResults() {
            if (resultsContainer) {
                resultsContainer.style.display = 'none';
                resultsContainer.innerHTML = '';
            }
            currentResults = [];
            selectedIndex = -1;
        }

        // Handle search input
        function handleSearch(query) {
            clearTimeout(searchTimeout);

            if (!query || query.trim().length < 2) {
                closeResults();
                return;
            }

            searchTimeout = setTimeout(() => {
                if (!window.starWrenchResidentDB) {
                    console.error('[QuickAddParticipants] Database not available');
                    return;
                }

                const results = window.starWrenchResidentDB.search(query.trim(), true); // Current residents only
                showResults(results);
            }, 150); // Debounce 150ms
        }

        // Handle keyboard navigation
        function handleKeyDown(e) {
            if (!resultsContainer || resultsContainer.style.display === 'none') {
                return;
            }

            const itemCount = currentResults.length > 20 ? 20 : currentResults.length;

            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    if (selectedIndex < itemCount - 1) {
                        setSelectedIndex(selectedIndex + 1);
                    }
                    break;

                case 'ArrowUp':
                    e.preventDefault();
                    if (selectedIndex > 0) {
                        setSelectedIndex(selectedIndex - 1);
                    }
                    break;

                case 'Enter':
                    e.preventDefault();
                    if (selectedIndex >= 0 && currentResults[selectedIndex]) {
                        const resident = currentResults[selectedIndex];
                        const displayName = `${resident.namePreferred || resident.nameFirst} ${resident.nameLast}`;
                        addParticipant(resident.entryId, displayName);
                        closeResults();
                        if (searchInput) searchInput.value = '';
                    }
                    break;

                case 'Escape':
                    e.preventDefault();
                    closeResults();
                    if (searchInput) searchInput.blur();
                    break;
            }
        }

        // Insert search bar into the Participants or Attendees section
        function insertSearchBar() {
            try {
                const screenInfo = getCurrentScreenInfo();
                if (!screenInfo) {
                    return false;
                }

            let targetSection, targetContainer, className;

            if (screenInfo.type === 'incident') {
                // Find the Participants section
                targetSection = Array.from(document.querySelectorAll('.fieldset-block .caption')).find(
                    caption => caption.textContent.trim() === 'Participants'
                );

                if (!targetSection) {
                    return false;
                }

                targetContainer = targetSection.parentElement;
                className = 'starwrench-quick-participants-search';
            } else if (screenInfo.type === 'program') {
                // Find the Attendees section
                targetSection = Array.from(document.querySelectorAll('.caption.ui-fieldset-caption')).find(
                    caption => caption.textContent.trim() === 'Attendees'
                );

                if (!targetSection) {
                    return false;
                }

                // For programs, we need to insert after the record count
                const header = targetSection.parentElement;
                const buttonBar = header.querySelector('.button-bar');
                const paginationContainer = buttonBar ? buttonBar.querySelector('.pagination-container') : null;

                if (!paginationContainer) {
                    return false;
                }

                targetContainer = paginationContainer;
                className = 'starwrench-quick-attendees-search';
            } else {
                return false;
            }

            // Check if search bar already exists
            if (targetContainer.querySelector(`.${className}`)) {
                return true;
            }

            // Create wrapper for positioning
            const wrapper = document.createElement('div');
            wrapper.className = className;

            if (screenInfo.type === 'incident') {
                wrapper.style.cssText = `
                    position: relative;
                    display: flex;
                    margin-left: auto;
                    align-content: center;
                    align-items: center;
                `;
            } else if (screenInfo.type === 'program') {
                wrapper.style.cssText = `
                    position: relative;
                    display: inline-flex;
                    margin-left: 15px;
                    align-content: center;
                    align-items: center;
                `;
            }

            // Create search input
            searchInput = document.createElement('input');
            searchInput.type = 'text';
            searchInput.placeholder = screenInfo.type === 'incident' ? 'Add participant...' : 'Add attendee...';
            searchInput.setAttribute('aria-label', 'Search residents to add');
            searchInput.style.cssText = `
                border: 1px solid var(--color-grey-g30, #ccc);
                height: 28px;
                background: white;
                border-radius: var(--control-border-radius, 4px);
                padding: 0 8px;
                width: 200px;
                font-size: 13px;
                outline: none;
                box-sizing: border-box;
            `;

            // Focus styling
            searchInput.addEventListener('focus', () => {
                searchInput.style.outline = '2px solid var(--color-blue-b60, #0066cc)';
                searchInput.style.borderColor = 'var(--color-blue-b60, #0066cc)';
            });

            searchInput.addEventListener('blur', () => {
                searchInput.style.outline = 'none';
                searchInput.style.borderColor = 'var(--color-grey-g30, #ccc)';
                // Delay closing to allow clicks on results
                setTimeout(closeResults, 200);
            });

            // Create results container
            resultsContainer = createResultsContainer();

            // Assemble
            wrapper.appendChild(searchInput);
            wrapper.appendChild(resultsContainer);

            // Insert into target container
            targetContainer.appendChild(wrapper);

            // Add event listeners
            searchInput.addEventListener('input', (e) => handleSearch(e.target.value));
            searchInput.addEventListener('keydown', handleKeyDown);

            // Click outside to close
            document.addEventListener('click', (e) => {
                if (!wrapper.contains(e.target)) {
                    closeResults();
                }
            });

            // Auto-focus for programs since that's the main purpose of the page
            if (screenInfo.type === 'program') {
                setTimeout(() => {
                    searchInput.focus();
                }, 100);
            }

            return true;
            } catch (error) {
                console.error('[QuickAddParticipants] Error in insertSearchBar:', error);
                return false;
            }
        }

        // Monitor for page changes and try to insert search bar
        function monitorForSections() {
            try {
                let lastUrl = window.location.href;

                function checkAndInsert() {
                    try {
                        const currentUrl = window.location.href;

                        // Check if URL changed or if we're on a relevant page
                        if (currentUrl !== lastUrl || currentUrl.includes('incident:') || (currentUrl.includes('program:') && currentUrl.includes(':attendees'))) {
                            lastUrl = currentUrl;

                            // Try to insert after a delay to ensure DOM is ready
                            setTimeout(() => {
                                insertSearchBar();
                            }, 1000);
                        }
                    } catch (error) {
                        console.error('[QuickAddParticipants] Error in checkAndInsert:', error);
                    }
                }

                // Check initially
                checkAndInsert();

                // Monitor for changes
                setInterval(checkAndInsert, 2000);

                // Also monitor DOM changes for dynamic content
                const observer = new MutationObserver(() => {
                    setTimeout(checkAndInsert, 500);
                });

                observer.observe(document.body, {
                    childList: true,
                    subtree: true
                });

            } catch (error) {
                console.error('[QuickAddParticipants] Error in monitorForSections:', error);
            }
        }

        // Initialize the plugin
        function initialize() {
            try {
                waitForDatabase(() => {
                    monitorForSections();
                });
            } catch (error) {
                console.error('[QuickAddParticipants] Error in initialize:', error);
            }
        }

        initialize();
    }

    // QUICK INCIDENT STATUS PLUGIN
    function initQuickIncidentStatusPlugin() {
        const STATUS_IDS = {
            CLOSED: '0',
            OPEN: '1',
            IN_PROGRESS: '2'
        };

        // Get current incident ID from URL
        function getCurrentIncidentId() {
            const hash = window.location.hash;
            if (!hash || !hash.includes('incident:')) return null;
            const match = hash.match(/incident:(\d+)/);
            return match ? match[1] : null;
        }

        // Get current incident status
        function getCurrentStatus() {
            const statusElement = document.querySelector('span.field.view-control[data-name="IncidentStatusID"]');
            if (!statusElement) return null;
            return statusElement.getAttribute('data-id');
        }

        // Change incident status via API
        function changeIncidentStatus(incidentId, newStatusId, buttonText) {
            if (!window.starrez || !window.starrez.ServerRequest) {
                console.error('[QuickIncidentStatus] StarRez ServerRequest API not available');
                return;
            }

            const data = {
                id: parseInt(incidentId, 10),
                vm: {
                    __ChangedFields: ["IncidentID", "IncidentStatusID"],
                    IncidentID: incidentId.toString(),
                    IncidentStatusID: newStatusId.toString()
                },
                handler: {
                    _error: {
                        _autoFix: false,
                        _autoIgnore: false
                    }
                }
            };

            // Show loading state
            const buttons = document.querySelectorAll('.starwrench-status-button');
            buttons.forEach(btn => {
                btn.disabled = true;
                btn.style.opacity = '0.6';
            });

            // Use StarRez's ServerRequest API
            const call = new starrez.ServerRequest("CampusLife", "IncidentMain", "EditData", data);

            call.Request({
                ShowLoading: true
            }).done(response => {
                console.log(`[QuickIncidentStatus] Successfully changed status to ${buttonText}`);

                // Use StarRez's built-in screen refresh
                if (typeof starrez.sm !== 'undefined' && starrez.sm.RefreshCurrentScreen) {
                    starrez.sm.RefreshCurrentScreen();
                } else {
                    // Fallback: trigger the same event that happens after manual save
                    if (typeof starrez.FireEvent !== 'undefined') {
                        starrez.FireEvent('DBObjectEvent', 'incident', parseInt(incidentId, 10));
                    }
                }
            }).fail((jqXHR, textStatus, errorThrown) => {
                console.error('[QuickIncidentStatus] Error changing status:', errorThrown);

                // Show user-friendly error message
                if (typeof starrez.ui !== 'undefined' && starrez.ui.ShowAlertMessage) {
                    starrez.ui.ShowAlertMessage(`Failed to change status to ${buttonText}. Please try again or use the Edit button.`, 'Error');
                } else {
                    alert(`Failed to change status to ${buttonText}. Please try again or use the Edit button.`);
                }

                // Re-enable buttons on error
                buttons.forEach(btn => {
                    btn.disabled = false;
                    btn.style.opacity = '1';
                });
            });
        }

        // Create a status button
        function createStatusButton(buttonText, statusName, statusId, incidentId) {
            const button = document.createElement('button');
            button.className = 'sr_button_primary sr_button starwrench-status-button';
            button.type = 'button';
            button.setAttribute('aria-label', buttonText);
            button.setAttribute('title', `Change incident status to "${statusName}"`);

            // Add icon
            const icon = document.createElement('i');
            icon.className = 'fa Functions sr_button_primary_icon';
            icon.setAttribute('role', 'presentation');

            // Add caption
            const caption = document.createElement('span');
            caption.className = 'ui_button_caption sr_button_primary_caption';
            caption.textContent = buttonText;

            button.appendChild(icon);
            button.appendChild(caption);

            button.addEventListener('click', () => {
                if (confirm(`Change incident status to "${statusName}"?`)) {
                    changeIncidentStatus(incidentId, statusId, statusName);
                }
            });

            return button;
        }

        // Insert status buttons
        function insertStatusButtons() {
            // Check if we're on an incident page
            const incidentId = getCurrentIncidentId();
            if (!incidentId) return false;

            // Find the button bar
            const buttonBar = document.querySelector('.fieldset-block .header .button-bar');
            if (!buttonBar) return false;

            // Check if buttons already exist
            if (buttonBar.querySelector('.starwrench-status-button')) {
                return true;
            }

            // Get current status
            const currentStatus = getCurrentStatus();
            if (!currentStatus) return false;

            // Don't show buttons if incident is closed
            if (currentStatus === STATUS_IDS.CLOSED) {
                console.log('[QuickIncidentStatus] Incident is closed, not showing buttons');
                return true;
            }

            // Create appropriate buttons based on status
            let buttonsToAdd = [];

            if (currentStatus === STATUS_IDS.OPEN) {
                // Show both "Mark as In Progress" and "Close" buttons
                buttonsToAdd.push(createStatusButton('Mark as In Progress', 'In Progress', STATUS_IDS.IN_PROGRESS, incidentId));
                buttonsToAdd.push(createStatusButton('Close', 'Closed', STATUS_IDS.CLOSED, incidentId));
            } else if (currentStatus === STATUS_IDS.IN_PROGRESS) {
                // Show only "Close" button
                buttonsToAdd.push(createStatusButton('Close', 'Closed', STATUS_IDS.CLOSED, incidentId));
            }

            // Insert buttons before the first child (Edit button)
            buttonsToAdd.forEach(button => {
                buttonBar.insertBefore(button, buttonBar.firstChild);
            });

            console.log(`[QuickIncidentStatus] Added ${buttonsToAdd.length} button(s) for incident ${incidentId}`);
            return true;
        }

        // Remove existing status buttons (for cleanup on status change)
        function removeStatusButtons() {
            const buttons = document.querySelectorAll('.starwrench-status-button');
            buttons.forEach(button => button.remove());
        }

        // Monitor for page changes and incident details updates
        function monitorForIncidentDetails() {
            let lastUrl = window.location.href;
            let lastStatus = null;

            function checkAndInsert() {
                const currentUrl = window.location.href;
                const currentStatus = getCurrentStatus();

                // Check if URL changed or status changed
                if (currentUrl !== lastUrl || currentStatus !== lastStatus) {
                    lastUrl = currentUrl;
                    lastStatus = currentStatus;

                    // Remove old buttons and add new ones
                    removeStatusButtons();

                    if (currentUrl.includes('incident:')) {
                        setTimeout(() => {
                            insertStatusButtons();
                        }, 1000);
                    }
                }
            }

            // Check initially
            checkAndInsert();

            // Monitor for changes
            setInterval(checkAndInsert, 2000);

            // Also monitor DOM changes for when incident details reload
            const observer = new MutationObserver(() => {
                setTimeout(checkAndInsert, 500);
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        }

        // Initialize the plugin
        function initialize() {
            monitorForIncidentDetails();
        }

        initialize();
    }

    // SHAREPOINT LINKS PLUGIN
    function initSharePointLinksPlugin() {
        const VALID_HALL_CODES = ['222', 'EH', 'ED', 'WTA', 'KF', 'WH', 'WM'];
        const SHAREPOINT_BASE = 'https://vuw.sharepoint.com/sites/ACCO_COL_IndependentLiving/Shared%20Documents/Forms/AllItems.aspx?id=%2Fsites%2FACCO%5FCOL%5FIndependentLiving%2FShared%20Documents%2FOperations%2FRoom%20photos%2F';

        // Check if we're on a roomspace page
        function isRoomSpacePage() {
            const hash = window.location.hash;
            return hash.includes('#!roomspace:');
        }

        // Get room name from the specific roomspace detail screen
        function getRoomName() {
            const match = window.location.hash.match(/#!roomspace:(\d+)/);
            if (!match) return null;

            const roomspaceScreen = document.querySelector(`#roomspace${match[1]}-detail-screen`);
            if (!roomspaceScreen) return null;

            const heading = roomspaceScreen.querySelector('.header_caption.ui-header_caption h2.detail-header-heading.ui-detail-header');
            return heading ? heading.textContent.trim() : null;
        }

        // Get room type from the specific roomspace detail screen
        function getRoomType() {
            const match = window.location.hash.match(/#!roomspace:(\d+)/);
            if (!match) return null;

            const roomspaceScreen = document.querySelector(`#roomspace${match[1]}-detail-screen`);
            if (!roomspaceScreen) return null;

            const subheader = roomspaceScreen.querySelector('.ui-detail-subheader.subheader.subheader-text strong');
            return subheader ? subheader.textContent.trim() : null;
        }

        // Check if room code is valid
        function isValidRoomCode(roomName) {
            return VALID_HALL_CODES.some(code => roomName.startsWith(code + '-'));
        }

        // Parse room name into parts
        function parseRoomName(roomName) {
            return roomName.split('-');
        }

        // Generate SharePoint URL for a path
        function generateSharePointUrl(parts) {
            const path = parts.join('%2F');
            return SHAREPOINT_BASE + path;
        }

        // Create SharePoint links breadcrumb
        function createSharePointLinks(roomName, roomType) {
            const parts = parseRoomName(roomName);

            // Determine how many parts to link based on room type
            const isBed = roomType === 'Bed';
            const maxParts = isBed ? parts.length : Math.min(3, parts.length);

            // Create container (inline span)
            const container = document.createElement('span');
            container.className = 'starwrench-sharepoint-links';
            container.style.cssText = `
                margin-left: 12px;
                display: inline-flex;
                align-items: center;
                gap: 2px;
                font-size: 13px;
            `;

            // Add label
            const label = document.createElement('span');
            label.textContent = 'SharePoint:';
            label.style.cssText = 'color: var(--color-grey-g60, #666); margin-right: 4px;';
            container.appendChild(label);

            // Add breadcrumb links
            for (let i = 0; i < maxParts; i++) {
                const linkParts = parts.slice(0, i + 1);
                const url = generateSharePointUrl(linkParts);

                const link = document.createElement('a');
                link.href = url;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                link.textContent = parts[i];
                link.style.cssText = `
                    color: var(--color-blue-b50, #0078d4);
                    text-decoration: none;
                    padding: 2px 4px;
                    border-radius: 3px;
                    transition: background-color 0.2s;
                `;
                link.addEventListener('mouseenter', () => {
                    link.style.backgroundColor = 'var(--color-blue-b20, #e6f2ff)';
                });
                link.addEventListener('mouseleave', () => {
                    link.style.backgroundColor = 'transparent';
                });

                container.appendChild(link);

                // Add separator (except after last link)
                if (i < maxParts - 1) {
                    const separator = document.createElement('span');
                    separator.textContent = '/';
                    separator.style.cssText = 'color: var(--color-grey-g50, #999); padding: 0 1px;';
                    container.appendChild(separator);
                }
            }

            return container;
        }

        // Try to insert SharePoint links if needed
        function tryInsertLinks() {
            if (!isRoomSpacePage()) return;

            const roomName = getRoomName();
            if (!roomName || !isValidRoomCode(roomName)) return;

            const roomType = getRoomType();
            if (!roomType) return;

            const match = window.location.hash.match(/#!roomspace:(\d+)/);
            const roomspaceScreen = match ? document.querySelector(`#roomspace${match[1]}-detail-screen`) : null;
            if (!roomspaceScreen) return;

            const subheader = roomspaceScreen.querySelector('.ui-detail-subheader.subheader.subheader-text');
            if (!subheader || subheader.querySelector('.starwrench-sharepoint-links')) return;

            const links = createSharePointLinks(roomName, roomType);
            subheader.appendChild(links);
        }

        // Poll every 2 seconds (less aggressive than before)
        setInterval(tryInsertLinks, 2000);
        setTimeout(tryInsertLinks, 500); // Try immediately on load
    }

    // INCIDENT TEMPLATES PLUGIN
    function initIncidentTemplatesPlugin() {
        let processedModals = new Set();

        const styles = document.createElement('style');
        styles.textContent = `
            .incident-template-link {
                float: right;
                font-size: 12px;
                color: #666;
                margin-left: 10px;
                min-width: fit-content;
            }
            .incident-template-link a {
                color: #0077cc !important;
                text-decoration: underline !important;
                cursor: pointer !important;
            }
            .incident-template-link a:hover {
                color: #005fa3 !important;
            }
        `;
        document.head.appendChild(styles);

        function isIncidentModalOpen() {
            try {
                if (typeof starrez === 'undefined' || !starrez.popup) {
                    return false;
                }

                var $visiblePopup = document.querySelector('.ui-popup-parent:not(.hide)');
                if (!$visiblePopup) {
                    return false;
                }

                var headerElement = $visiblePopup.querySelector('.ui-popup-header');
                if (!headerElement) {
                    return false;
                }

                var headerText = headerElement.textContent.trim();
                return headerText === 'Incident';

            } catch (error) {
                console.error('Error checking modal state:', error);
                return false;
            }
        }

        function getModalId($modal) {
            var modalId = $modal.getAttribute('id');
            if (!modalId) {
                modalId = $modal.querySelector('.ui-popup-header');
                if (modalId) {
                    modalId = modalId.textContent.trim() + '-' + Date.now();
                }
            }
            return modalId || 'unknown-' + Date.now();
        }

        function addTemplateButton() {
            try {
                if (!isIncidentModalOpen()) {
                    return;
                }

                var $modal = document.querySelector('.ui-popup-parent:not(.hide)');
                if (!$modal) {
                    return;
                }

                var modalId = getModalId($modal);
                if (processedModals.has(modalId)) {
                    return;
                }

                var $whatHappenedHeader = null;
                var headers = $modal.querySelectorAll('.fieldset-block .header');

                for (var i = 0; i < headers.length; i++) {
                    var caption = headers[i].querySelector('.ui-fieldset-caption');
                    if (caption && caption.textContent.trim() === 'What happened?') {
                        $whatHappenedHeader = headers[i];
                        break;
                    }
                }

                if (!$whatHappenedHeader) {
                    return;
                }

                if ($whatHappenedHeader.querySelector('.incident-template-link')) {
                    processedModals.add(modalId);
                    return;
                }

                var templateContainer = document.createElement('div');
                templateContainer.className = 'incident-template-link';
                templateContainer.innerHTML = 'Templates: <a href="#" id="shift-report-template-link">Shift Report</a>';

                $whatHappenedHeader.appendChild(templateContainer);
                processedModals.add(modalId);

                var link = templateContainer.querySelector('#shift-report-template-link');
                if (link) {
                    link.addEventListener('click', function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        applyShiftReportTemplate($modal);
                    });
                }

            } catch (error) {
                console.error('Error adding template button:', error);
            }
        }

        function applyShiftReportTemplate($modal) {
            try {
                var titleInput = $modal.querySelector('input[name="Title"]');
                var descriptionTextarea = $modal.querySelector('textarea[name="Description"]');

                if (!titleInput || !descriptionTextarea) {
                    console.error('Could not find Title or Description fields');
                    return;
                }

                titleInput.value = 'Shift Report - HALL | 7:00-2:30 2:30-10:00';
                descriptionTextarea.value = '# Follow up required: Yes/No\n\n# Resident interactions\n\n- \n\n# Tasks\n\n- \n\n# Incidents (IDs or "none to note")\n\n- \n\n# Duty rounds\n\n- \n- \n- \n';

                if (typeof starrez !== 'undefined' &&
                    typeof starrez.library !== 'undefined' &&
                    starrez.library.controls &&
                    starrez.library.controls.FlagChanged) {

                    var titleControl = titleInput.closest('.edit-control');
                    var descControl = descriptionTextarea.closest('.edit-control');

                    if (titleControl && titleControl.id) {
                        var $titleControl = document.getElementById(titleControl.id);
                        if ($titleControl && window.$ && window.$($titleControl)) {
                            starrez.library.controls.FlagChanged(window.$($titleControl));
                        }
                    }

                    if (descControl && descControl.id) {
                        var $descControl = document.getElementById(descControl.id);
                        if ($descControl && window.$ && window.$($descControl)) {
                            starrez.library.controls.FlagChanged(window.$($descControl));
                        }
                    }
                }

                if (titleInput.dispatchEvent) {
                    titleInput.dispatchEvent(new Event('change', { bubbles: true }));
                    titleInput.dispatchEvent(new Event('input', { bubbles: true }));
                }
                if (descriptionTextarea.dispatchEvent) {
                    descriptionTextarea.dispatchEvent(new Event('change', { bubbles: true }));
                    descriptionTextarea.dispatchEvent(new Event('input', { bubbles: true }));
                }

                console.log('Shift Report template applied successfully');

            } catch (error) {
                console.error('Error applying shift report template:', error);
            }
        }

        function checkForIncidentModal() {
            try {
                if (isIncidentModalOpen()) {
                    addTemplateButton();
                }
            } catch (error) {
                console.error('Error in checkForIncidentModal:', error);
            }
        }

        setTimeout(checkForIncidentModal, 1000);
        setInterval(checkForIncidentModal, 2000);

        var observer = new MutationObserver(function() {
            setTimeout(checkForIncidentModal, 300);
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    // ================================
    // PLUGIN INITIALIZATION
    // ================================

    function initializePlugin(pluginName) {
        if (!isPluginEnabled(pluginName)) return;

        switch (pluginName) {
            case 'bookmarks':
                initBookmarksPlugin();
                break;
            case 'autoSelect':
                initAutoSelectPlugin();
                break;
            case 'clipboard':
                initClipboardPlugin();
                break;
            case 'dashboard':
            case 'dropdown': // Backwards compatibility
                initDashboardPlugin();
                break;
            case 'initials':
                initInitialsPlugin();
                break;
            case 'phone':
                initPhonePlugin();
                break;
            case 'wordHighlighter':
                initWordHighlighterPlugin();
                break;
            case 'autoLinker':
                initAutoLinkerPlugin();
                break;
            case 'residentSearch':
                initQuickAccessPlugin();
                break;
            case 'quickAddParticipants':
                initQuickAddParticipantsPlugin();
                break;
            case 'quickIncidentStatus':
                initQuickIncidentStatusPlugin();
                break;
            case 'sharepointLinks':
                initSharePointLinksPlugin();
                break;
            case 'incidentTemplates':
                initIncidentTemplatesPlugin();
                break;
        }
    }

    function initializeAllPlugins() {
        Object.keys(currentSettings.plugins).forEach(initializePlugin);
    }

    // ================================
    // MAIN INITIALIZATION
    // ================================

    function initialize() {
        console.log(`🚀 StarWrench v${SUITE_VERSION} loading...`);

        // Load settings
        loadSettings();

        // Always add the plugin manager button
        addPluginManagerButton();

        // Initialize background services (always on, not user-configurable)
        setTimeout(() => {
            initResidentDatabaseFromCSV();
        }, 500);

        // Initialize enabled plugins
        setTimeout(initializeAllPlugins, 500);

        console.log(`✅ StarWrench v${SUITE_VERSION} loaded successfully!`);
    }

    // Start the suite
    initialize();

})();
