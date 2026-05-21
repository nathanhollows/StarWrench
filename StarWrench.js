// ==UserScript==
// @name         StarWrench
// @namespace    http://tampermonkey.net/
// @version      1.14.1
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

    const SUITE_VERSION = '1.14.1';
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
            dashboardTweaks: {
                enabled: true,
                name: '📊 Dashboard Tweaks',
                description: 'Adds search to dashboard headers (filters rows across all panels), search to the dashboard dropdown menu, and a button to copy Entry IDs to clipboard'
            },
            initials: {
                enabled: true,
                name: '👤 Expand Initials',
                description: 'Expands initials in shift and incident reports for easy reading'
            },
            autoLinker: {
                enabled: true,
                name: '🔗 Auto Linker',
                description: 'Converts "incident ######", "report ######", and ###### references into links, and @##### mentions into resident links with autocomplete'
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
            },
            layoutFixes: {
                enabled: true,
                name: '📐 Layout Fixes',
                description: 'Fixes common layout issues: constrains read-more text areas and bulk-edit field widths'
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
    // Uses StarRez's ToggleDirectorySelection API to select records server-side,
    // bypassing the need to scroll/render every row in the DOM.
    function initAutoSelectPlugin() {
        function addAutoSelectButton() {
            var targetButton = document.querySelector('button[aria-label="Add New Item"].sr_button_module_add');
            if (!targetButton || document.querySelector('.auto-select')) return;

            var autoSelectButton = document.createElement('habitat-button');
            autoSelectButton.setAttribute('variant', 'primary');
            autoSelectButton.setAttribute('compact', '');
            autoSelectButton.className = 'ui-order-tabs-button auto-select';
            autoSelectButton.style.cssText = 'top: 0; margin: 0;';

            var icon = document.createElement('habitat-fa-icon');
            icon.setAttribute('variant', 'fa-check');
            autoSelectButton.appendChild(icon);
            autoSelectButton.appendChild(document.createTextNode('Auto Select'));

            autoSelectButton.addEventListener('click', function() {
                var userInput = prompt("Enter IDs to auto-select (separated by newlines, spaces, or tabs):");
                if (!userInput || !userInput.trim()) return;

                var idArray = userInput.split(/[\n\s\t]+/).map(function(id) { return id.trim(); }).filter(function(id) { return id.length > 0; });
                if (idArray.length === 0) {
                    alert('No valid IDs found.');
                    return;
                }

                // Convert to numbers for the API
                var recordIDs = idArray.map(function(id) { return Number(id); }).filter(function(id) { return !isNaN(id); });
                if (recordIDs.length === 0) {
                    alert('No valid numeric IDs found.');
                    return;
                }

                // Get the directory manager instance
                var directoryMgr = null;
                try {
                    if (typeof starrez !== 'undefined' && starrez.directory && starrez.directory.GetDirectory) {
                        directoryMgr = starrez.directory.GetDirectory();
                    }
                } catch (e) {
                    console.error('StarWrench: Could not get directory manager', e);
                }

                if (!directoryMgr) {
                    alert('Could not access the directory manager. Make sure you are on a directory page.');
                    return;
                }

                var savedListName = directoryMgr.GetSelectionSavedListName();
                var controller = directoryMgr.options.Controller;
                var area = MVC.GetControllerArea(controller);

                // Batch IDs in chunks of 200 to avoid oversized requests
                var BATCH_SIZE = 200;
                var batches = [];
                for (var i = 0; i < recordIDs.length; i += BATCH_SIZE) {
                    batches.push(recordIDs.slice(i, i + BATCH_SIZE));
                }

                var completedBatches = 0;
                var finalCount = 0;

                function processBatch(batchIndex) {
                    if (batchIndex >= batches.length) {
                        // All batches done — update UI and refresh
                        directoryMgr.SetDirectoryFooter(finalCount);
                        directoryMgr.currentSelectionAmount = finalCount;
                        // Refresh the directory grid to reflect selections visually
                        directoryMgr.RefreshDirectory(true, directoryMgr.options.LoadCount);
                        alert('Auto-select completed!\nSent ' + recordIDs.length + ' IDs to server.\n' + finalCount + ' total selected.');
                        return;
                    }

                    try {
                        var call = new MVC.Directory.ToggleDirectorySelection(area, batches[batchIndex], savedListName, true);
                        call.Controller = controller;
                        call.Request({ ShowLoading: false }).done(function(amount) {
                            completedBatches++;
                            finalCount = amount;
                            processBatch(batchIndex + 1);
                        }).fail(function(jqxhr, textStatus, errorThrown) {
                            console.error('StarWrench: Batch ' + (batchIndex + 1) + ' failed', textStatus, errorThrown);
                            alert('Auto-select failed on batch ' + (batchIndex + 1) + ' of ' + batches.length + '.\n' + completedBatches + ' batches completed before failure.\nError: ' + textStatus);
                        });
                    } catch (e) {
                        console.error('StarWrench: Error creating API call', e);
                        alert('Auto-select error: ' + e.message);
                    }
                }

                processBatch(0);
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
        var lastTitle = document.title;
        var observer = new MutationObserver(function() {
            if (document.title !== lastTitle) {
                lastTitle = document.title;
                setTimeout(checkAndAddButton, 500);
            }
        });
        observer.observe(document.querySelector('title') || document.head, { childList: true, characterData: true, subtree: true });
    }

    // DASHBOARD TWEAKS PLUGIN (quick copy + search)
    function initDashboardTweaksPlugin() {
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

        function getDashboardExpectedCount(dashboardItem) {
            const moduleOptions = dashboardItem.querySelector('.sys-module-options');
            if (moduleOptions) {
                const c = moduleOptions.getAttribute('data-recordcount');
                if (c) return parseInt(c, 10);
            }
            const footer = dashboardItem.querySelector('.dashboard-footer');
            if (footer) {
                const m = footer.textContent.match(/Records:\s*(\d+)/);
                if (m) return parseInt(m[1], 10);
            }
            return 0;
        }

        async function loadAllRecordsViaApi(dashboardItem) {
            // Fast path: call StarRez's ActiveTable.GetPage endpoint directly.
            // The pageable object key, pagesize, and TableBuilder metadata live on
            // the .ui-active-table element; the lazy-load itself uses the same
            // service internally — we just drive it without waiting on scroll.
            const table = dashboardItem.querySelector('table.ui-active-table');
            if (!table) return false;

            const activeTableKey = table.getAttribute('data-pageable-object');
            const metadataJsonBase64 = table.getAttribute('data-builder-metadata');
            const metadataTypeName = table.getAttribute('data-builder-metadata-type');
            const pageSize = parseInt(table.getAttribute('data-pagesize'), 10) || 30;
            if (!activeTableKey || !metadataJsonBase64 || !metadataTypeName) return false;

            if (typeof starrez === 'undefined' ||
                !starrez.service || !starrez.service.controls ||
                !starrez.service.controls.activeTable ||
                !starrez.service.controls.activeTable.GetPage) {
                return false;
            }

            const tbody = table.querySelector('tbody');
            if (!tbody) return false;

            const expectedCount = getDashboardExpectedCount(dashboardItem);
            if (!expectedCount) return true;

            const tableBuilder = {
                metadataTypeName: metadataTypeName,
                metadataJsonBase64: metadataJsonBase64
            };

            const seen = new Set();
            tbody.querySelectorAll('tr[data-recordid]').forEach(r => {
                const id = r.getAttribute('data-recordid');
                if (id) seen.add(id);
            });

            // Initial render is page 0; subsequent batches are 1, 2, …
            let pageNo = Math.max(1, Math.ceil(seen.size / pageSize));
            let safety = 200;
            while (safety-- > 0) {
                if (tbody.querySelectorAll('tr[data-recordid]').length >= expectedCount) {
                    return true;
                }

                let html;
                try {
                    const call = new starrez.service.controls.activeTable.GetPage(
                        activeTableKey, pageNo, false, null, tableBuilder
                    );
                    html = await new Promise((resolve, reject) => {
                        const req = call.Request();
                        req.done(resolve);
                        req.fail(() => reject(new Error('GetPage failed')));
                    });
                } catch (err) {
                    return false; // Let caller fall back to scrolling
                }

                if (!html || html === 'false') return true;

                const tmp = document.createElement('tbody');
                tmp.innerHTML = html;
                const newRows = Array.from(tmp.querySelectorAll('tr'));
                if (newRows.length === 0) return true;

                let appended = 0;
                newRows.forEach(r => {
                    const id = r.getAttribute('data-recordid');
                    if (id && !seen.has(id)) {
                        seen.add(id);
                        tbody.appendChild(r);
                        appended++;
                    }
                });

                if (appended === 0) return true; // Server returned only dupes — done
                pageNo++;
            }
            return true;
        }

        async function loadAllRecordsViaScroll(dashboardItem) {
            const container = dashboardItem.querySelector('.dashboard-item-container');
            if (!container) return false;

            const expectedCount = getDashboardExpectedCount(dashboardItem);
            if (!expectedCount) return true;

            // While the user has a query active, hidden rows have zero height —
            // the scroll container shrinks and the lazy-load trigger never fires.
            // Temporarily restore display for any rows we hid, then re-filter
            // once we're done.
            const hidden = [];
            dashboardItem.querySelectorAll('tbody tr[data-recordid]').forEach(r => {
                if (r.style.display === 'none') {
                    hidden.push(r);
                    r.style.removeProperty('display');
                }
            });

            try {
                let previousCount = 0;
                let stalls = 0;
                const maxStalls = 8;
                const pollDelay = 300;

                while (stalls < maxStalls) {
                    const currentCount = dashboardItem.querySelectorAll('tbody tr[data-recordid]').length;
                    if (currentCount >= expectedCount) return true;
                    if (currentCount === previousCount) stalls++; else stalls = 0;
                    previousCount = currentCount;
                    container.scrollTop = container.scrollHeight;
                    await new Promise(resolve => setTimeout(resolve, pollDelay));
                }
                return true;
            } finally {
                // Re-filter rows; the MutationObserver handles newly arrived rows,
                // but the ones we manually unhid need explicit re-application.
                if (typeof currentSearchQuery !== 'undefined' && currentSearchQuery) {
                    filterDashboardItem(dashboardItem, currentSearchQuery);
                }
            }
        }

        async function loadAllRecords(dashboardItem) {
            const apiOk = await loadAllRecordsViaApi(dashboardItem);
            if (apiOk) return true;
            return loadAllRecordsViaScroll(dashboardItem);
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

        // ── DASHBOARD SEARCH ──────────────────────────────────────────────────
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

        // ── DASHBOARD HEADER SEARCH ───────────────────────────────────────────
        const HEADER_SEARCH_ADDED = 'data-sw-dashboard-search';
        const TBODY_OBSERVED = 'data-sw-tbody-observed';
        let currentSearchQuery = '';
        let autoLoadDebounce = null;
        const loadingInProgress = new WeakSet();

        function getExpectedCount(dashboardItem) {
            const moduleOptions = dashboardItem.querySelector('.sys-module-options');
            if (moduleOptions) {
                const c = moduleOptions.getAttribute('data-recordcount');
                if (c) return parseInt(c, 10);
            }
            const footer = dashboardItem.querySelector('.dashboard-footer');
            if (footer) {
                const m = footer.textContent.match(/Records:\s*(\d+)/);
                if (m) return parseInt(m[1], 10);
            }
            return 0;
        }

        function filterDashboardItem(dashboardItem, query) {
            const rows = dashboardItem.querySelectorAll('tbody tr[data-recordid]');
            let visible = 0;
            rows.forEach(row => {
                if (!query || (row.textContent || '').toLowerCase().includes(query)) {
                    row.style.removeProperty('display');
                    visible++;
                } else {
                    row.style.display = 'none';
                }
            });
            if (query && rows.length > 0 && visible === 0) {
                dashboardItem.classList.add('sw-empty-dashboard');
            } else {
                dashboardItem.classList.remove('sw-empty-dashboard');
            }
            return { total: rows.length, visible: visible };
        }

        function applyFilterEverywhere(query) {
            const items = document.querySelectorAll('.dashboard-item');
            items.forEach(item => filterDashboardItem(item, query));
        }

        function scheduleAutoLoad(query) {
            if (autoLoadDebounce) clearTimeout(autoLoadDebounce);
            if (!query) return;
            autoLoadDebounce = setTimeout(() => {
                // Fire all panels in parallel — loadAllRecords uses the StarRez
                // ActiveTable.GetPage endpoint directly, so each panel's pages
                // load over its own XHR rather than competing for the scroll
                // container.
                document.querySelectorAll('.dashboard-item').forEach(item => {
                    if (loadingInProgress.has(item)) return;
                    const result = filterDashboardItem(item, query);
                    const expected = getExpectedCount(item);
                    if (result.visible === 0 && expected > result.total) {
                        loadingInProgress.add(item);
                        loadAllRecords(item).then(() => {
                            loadingInProgress.delete(item);
                            filterDashboardItem(item, currentSearchQuery);
                        }).catch(() => {
                            loadingInProgress.delete(item);
                        });
                    }
                });
            }, 200);
        }

        function observeTbody(dashboardItem) {
            const tbody = dashboardItem.querySelector('tbody');
            if (!tbody || tbody.hasAttribute(TBODY_OBSERVED)) return;
            tbody.setAttribute(TBODY_OBSERVED, 'true');
            const obs = new MutationObserver(() => {
                if (currentSearchQuery) {
                    filterDashboardItem(dashboardItem, currentSearchQuery);
                }
            });
            obs.observe(tbody, { childList: true });
        }

        function observeAllTbodies() {
            document.querySelectorAll('.dashboard-item').forEach(observeTbody);
        }

        function addHeaderSearch(headerEl) {
            if (headerEl.hasAttribute(HEADER_SEARCH_ADDED)) return;
            if (!headerEl.querySelector('.ui-dashboardbuttons')) return;

            const wrapper = document.createElement('div');
            wrapper.className = 'sw-dashboard-search';
            wrapper.style.cssText = 'flex: 1 1 auto; display: flex; justify-content: center; align-items: center; margin: 0 1.5em; min-width: 0;';

            const inputWrap = document.createElement('div');
            inputWrap.style.cssText = 'position: relative; width: 100%; max-width: 460px;';

            const icon = document.createElement('i');
            icon.className = 'fa fa-search';
            icon.style.cssText = 'position: absolute; left: 0.85em; top: 50%; transform: translateY(-50%); color: #888; pointer-events: none; font-size: 0.9em;';

            const input = document.createElement('input');
            input.type = 'text';
            input.placeholder = 'Search dashboard';
            input.className = 'sw-dashboard-search-input';
            input.setAttribute('aria-label', 'Search dashboard rows');
            input.style.cssText = 'width: 100%; padding: 0.5em 2.2em 0.5em 2.2em; border-radius: 999px; border: 1px solid #cfd6e0; background: #fff; font-size: 0.95em; outline: none; box-shadow: 0 1px 2px rgba(0,0,0,0.04); transition: border-color 0.15s, box-shadow 0.15s; box-sizing: border-box;';

            const clearBtn = document.createElement('button');
            clearBtn.type = 'button';
            clearBtn.className = 'sw-dashboard-search-clear';
            clearBtn.setAttribute('aria-label', 'Clear search');
            clearBtn.title = 'Clear (Esc)';
            clearBtn.innerHTML = '<i class="fa fa-times"></i>';
            clearBtn.style.cssText = 'position: absolute; right: 0.35em; top: 50%; transform: translateY(-50%); background: transparent; border: none; cursor: pointer; padding: 0.3em 0.55em; color: #888; display: none; border-radius: 999px;';
            clearBtn.addEventListener('mouseenter', () => { clearBtn.style.background = '#eef1f5'; clearBtn.style.color = '#333'; });
            clearBtn.addEventListener('mouseleave', () => { clearBtn.style.background = 'transparent'; clearBtn.style.color = '#888'; });

            input.addEventListener('focus', () => {
                input.style.borderColor = '#4a90e2';
                input.style.boxShadow = '0 0 0 3px rgba(74,144,226,0.18)';
            });
            input.addEventListener('blur', () => {
                input.style.borderColor = '#cfd6e0';
                input.style.boxShadow = '0 1px 2px rgba(0,0,0,0.04)';
            });

            function setQuery(q) {
                currentSearchQuery = (q || '').toLowerCase();
                clearBtn.style.display = q ? '' : 'none';
                applyFilterEverywhere(currentSearchQuery);
                scheduleAutoLoad(currentSearchQuery);
            }

            input.addEventListener('input', () => setQuery(input.value));
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    e.preventDefault();
                    if (input.value) {
                        input.value = '';
                        setQuery('');
                    } else {
                        input.blur();
                    }
                }
            });

            clearBtn.addEventListener('click', () => {
                input.value = '';
                setQuery('');
                input.focus();
            });

            inputWrap.appendChild(icon);
            inputWrap.appendChild(input);
            inputWrap.appendChild(clearBtn);
            wrapper.appendChild(inputWrap);

            const buttons = headerEl.querySelector('.buttons.ui-dashboardbuttons');
            if (buttons) {
                headerEl.insertBefore(wrapper, buttons);
            } else {
                headerEl.appendChild(wrapper);
            }

            // Make header layout flex so search sits between title and buttons
            const computed = window.getComputedStyle(headerEl);
            if (computed.display !== 'flex') {
                headerEl.style.display = 'flex';
                headerEl.style.alignItems = 'center';
            }
            const h1 = headerEl.querySelector('h1');
            if (h1) h1.style.flex = '0 0 auto';

            headerEl.setAttribute(HEADER_SEARCH_ADDED, 'true');
        }

        function scanDashboardHeaders() {
            document.querySelectorAll('header').forEach(h => {
                if (h.querySelector('.ui-dashboardbuttons')) {
                    addHeaderSearch(h);
                }
            });
            observeAllTbodies();
            if (currentSearchQuery) {
                applyFilterEverywhere(currentSearchQuery);
            }
        }

        setTimeout(scanDashboardHeaders, 1000);

        const dashSearchObserver = new MutationObserver(() => {
            scanDashboardHeaders();
        });
        dashSearchObserver.observe(document.body, { childList: true, subtree: true });
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
                // Skip initials containing non-letter characters (e.g. "[preferred]" name parts)
                // to avoid generating invalid regex patterns
                if (!/^[A-Za-z]+$/.test(initials)) continue;

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

    // AUTO LINKER PLUGIN
    function initAutoLinkerPlugin() {
        // Inline styles work in both light DOM and shadow roots
        const LINK_STYLE = [
            'color: #0077cc',
            'text-decoration: underline',
            'cursor: pointer',
            'background: rgba(0, 119, 204, 0.1)',
            'padding: 1px 3px',
            'border-radius: 3px',
            'transition: background 0.2s ease',
        ].join('; ');

        const LINK_STYLE_HOVER = [
            'color: #0077cc',
            'text-decoration: none',
            'cursor: pointer',
            'background: rgba(0, 119, 204, 0.2)',
            'padding: 1px 3px',
            'border-radius: 3px',
        ].join('; ');

        // ── UTILITIES ─────────────────────────────────────────────────────────
        function isInInput(node) {
            let parent = node.parentNode;
            while (parent && parent.nodeType === Node.ELEMENT_NODE) {
                const tag = parent.tagName.toLowerCase();
                if (tag === 'input' || tag === 'select' || tag === 'textarea' || tag === 'habitat-textarea') return true;
                parent = parent.parentNode;
            }
            return false;
        }

        function alreadyLinked(node) {
            let parent = node.parentNode;
            while (parent && parent.nodeType === Node.ELEMENT_NODE) {
                if (parent.getAttribute && (
                    parent.getAttribute('data-sw-inc-link') === 'true' ||
                    parent.getAttribute('data-sw-at-link') === 'true'
                )) return true;
                parent = parent.parentNode;
            }
            return false;
        }

        // ── INCIDENT LINKER ───────────────────────────────────────────────────
        function createIncidentLink(incidentNumber, displayText) {
            const link = document.createElement('span');
            link.setAttribute('style', LINK_STYLE);
            link.setAttribute('data-sw-inc-link', 'true');
            link.textContent = displayText;
            link.title = 'Open incident ' + incidentNumber;
            link.addEventListener('mouseenter', function() { link.setAttribute('style', LINK_STYLE_HOVER); });
            link.addEventListener('mouseleave', function() { link.setAttribute('style', LINK_STYLE); });
            link.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                if (typeof starrez !== 'undefined' && starrez.sm) {
                    starrez.sm.NavigateTo('#!incident:' + incidentNumber + ':quick%20information');
                }
            });
            return link;
        }

        function linkifyIncidentReferences(textNode) {
            if (isInInput(textNode) || alreadyLinked(textNode)) return false;

            const text = textNode.textContent;
            // "incident/report ######" (6-7 digits) or standalone ###### (6-7 digits, not preceded by word char)
            const regex = /\b(incident|report)\s+(\d{6,7})\b|(?<!\w)#(\d{6,7})\b/gi;

            if (!regex.test(text)) return false;
            regex.lastIndex = 0;

            let lastIndex = 0;
            let modified = false;
            const fragment = document.createDocumentFragment();
            let match;

            while ((match = regex.exec(text)) !== null) {
                const matchStart = match.index;
                const matchEnd = matchStart + match[0].length;
                const incidentNumber = match[2] || match[3];

                if (matchStart > lastIndex) {
                    fragment.appendChild(document.createTextNode(text.slice(lastIndex, matchStart)));
                }

                fragment.appendChild(createIncidentLink(incidentNumber, match[0]));
                lastIndex = matchEnd;
                modified = true;
            }

            if (lastIndex < text.length) {
                fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
            }

            if (modified && textNode.parentNode) {
                textNode.parentNode.replaceChild(fragment, textNode);
            }

            return modified;
        }

        // ── AT-MENTION LINKER ─────────────────────────────────────────────────
        function createEntryLink(entryId) {
            const link = document.createElement('span');
            link.setAttribute('style', LINK_STYLE);
            link.setAttribute('data-sw-at-link', 'true');
            link.setAttribute('data-sw-autolink-id', entryId);

            let displayText = '@' + entryId;
            if (typeof window.starWrenchResidentDB !== 'undefined') {
                const resident = window.starWrenchResidentDB.getById(entryId);
                if (resident) {
                    const firstName = resident.namePreferred || resident.nameFirst || '';
                    displayText = (firstName + ' ' + (resident.nameLast || '')).trim();
                }
            }

            link.textContent = displayText;
            link.title = 'Open entry ' + entryId;
            link.addEventListener('mouseenter', function() { link.setAttribute('style', LINK_STYLE_HOVER); });
            link.addEventListener('mouseleave', function() { link.setAttribute('style', LINK_STYLE); });
            link.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                if (typeof starrez !== 'undefined' && starrez.sm) {
                    starrez.sm.NavigateTo('#!Entry:' + entryId);
                }
            });
            return link;
        }

        function linkifyAtMentions(textNode) {
            if (isInInput(textNode) || alreadyLinked(textNode)) return false;

            const text = textNode.textContent;
            const atRegex = /@(\d{4,5})\b/g;

            if (!atRegex.test(text)) return false;
            atRegex.lastIndex = 0;

            let lastIndex = 0;
            let modified = false;
            const fragment = document.createDocumentFragment();
            let match;

            while ((match = atRegex.exec(text)) !== null) {
                const matchStart = match.index;
                const matchEnd = matchStart + match[0].length;

                if (matchStart > lastIndex) {
                    fragment.appendChild(document.createTextNode(text.slice(lastIndex, matchStart)));
                }

                fragment.appendChild(createEntryLink(match[1]));
                lastIndex = matchEnd;
                modified = true;
            }

            if (lastIndex < text.length) {
                fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
            }

            if (modified && textNode.parentNode) {
                textNode.parentNode.replaceChild(fragment, textNode);
            }

            return modified;
        }

        // ── COMBINED ROOT PROCESSOR ───────────────────────────────────────────
        // doMentions must only be true for known read-only display containers.
        // Never pass true for document.body — form textareas live there.
        function processRoot(root, doMentions) {
            // Incident/report/# references — safe to run anywhere
            var incNodes = [];
            var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
                acceptNode: function(node) {
                    if (!node.textContent.trim() || isInInput(node) || alreadyLinked(node)) return NodeFilter.FILTER_REJECT;
                    if (/\b(incident|report)\s+\d+\b/i.test(node.textContent) || /(?<!\w)#\d{6,7}/.test(node.textContent)) return NodeFilter.FILTER_ACCEPT;
                    return NodeFilter.FILTER_REJECT;
                }
            });
            var n;
            while ((n = walker.nextNode())) incNodes.push(n);
            incNodes.forEach(function(n) { if (n.parentNode) linkifyIncidentReferences(n); });

            if (!doMentions) return;

            // @mentions — restricted to read-only display areas only
            var mentionNodes = [];
            walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
                acceptNode: function(node) {
                    if (!node.textContent.trim() || isInInput(node) || alreadyLinked(node)) return NodeFilter.FILTER_REJECT;
                    if (/@\d{4,5}\b/.test(node.textContent)) return NodeFilter.FILTER_ACCEPT;
                    return NodeFilter.FILTER_REJECT;
                }
            });
            while ((n = walker.nextNode())) mentionNodes.push(n);
            mentionNodes.forEach(function(n) { if (n.parentNode) linkifyAtMentions(n); });
        }

        let linkingInProgress = false;
        function processAllTargets() {
            if (linkingInProgress) return;
            linkingInProgress = true;
            try {
                // habitat-display paragraphs are read-only — run both linkers
                document.querySelectorAll('habitat-display[role="paragraph"]').forEach(function(el) {
                    if (el.shadowRoot) processRoot(el.shadowRoot, true);
                    processRoot(el, true);
                });
                // span.textarea (incident/shift report display) — run both linkers
                document.querySelectorAll('span.textarea').forEach(function(el) {
                    processRoot(el, true);
                });
                // Full light DOM: incidents only — @mentions here would corrupt editable form fields
                processRoot(document.body, false);
            } catch (e) {
                console.error('[AutoLinker] Error:', e);
            }
            linkingInProgress = false;
        }

        // Observe a shadow root so content changes inside it trigger a rescan
        const observedShadowRoots = new WeakSet();
        function observeShadowRoot(shadowRoot) {
            if (observedShadowRoots.has(shadowRoot)) return;
            observedShadowRoots.add(shadowRoot);
            const shadowObserver = new MutationObserver(function() {
                setTimeout(processAllTargets, 600);
            });
            shadowObserver.observe(shadowRoot, { childList: true, subtree: true, characterData: true });
        }

        function attachShadowObservers() {
            document.querySelectorAll('habitat-display[role="paragraph"]').forEach(function(el) {
                if (el.shadowRoot) {
                    observeShadowRoot(el.shadowRoot);
                }
            });
        }

        // URL tracking: detect SPA navigation (hash changes) and rescan
        let lastUrl = window.location.href;
        function checkUrlChange() {
            const currentUrl = window.location.href;
            if (currentUrl !== lastUrl) {
                lastUrl = currentUrl;
                // Content loads asynchronously after navigation; scan at 1s and 2.5s
                setTimeout(processAllTargets, 1000);
                setTimeout(processAllTargets, 2500);
                setTimeout(attachShadowObservers, 2500);
            }
        }
        setInterval(checkUrlChange, 500);

        setTimeout(processAllTargets, 1500);
        setInterval(processAllTargets, 4000);

        // Regular DOM observer: catches new span.textarea elements and new habitat-display elements
        const observer = new MutationObserver(function() {
            attachShadowObservers();
            setTimeout(processAllTargets, 600);
        });
        observer.observe(document.body, { childList: true, subtree: true });

        attachShadowObservers();

        // ── AT-MENTION AUTOCOMPLETE ───────────────────────────────────────────
        // Shows a resident picker popup when the user types @ in any textarea,
        // including those inside shadow roots (e.g. habitat-textarea).

        var acPopup = null;
        var acField = null;   // textarea currently being monitored
        var acAtPos = -1;     // index of the triggering @ character
        var acResults = [];
        var acIndex = 0;

        function acGetPopup() {
            if (acPopup) return acPopup;
            acPopup = document.createElement('div');
            acPopup.setAttribute('style', [
                'position:fixed',
                'z-index:999999',
                'background:#fff',
                'border:1px solid #d1d5db',
                'border-radius:8px',
                'box-shadow:0 6px 16px rgba(0,0,0,0.14)',
                'min-width:240px',
                'max-width:360px',
                'max-height:256px',
                'overflow-y:auto',
                'display:none',
                'font-size:13px',
                'line-height:1.4',
            ].join(';'));
            document.body.appendChild(acPopup);
            return acPopup;
        }

        function acHide() {
            if (acPopup) acPopup.style.display = 'none';
            acField = null;
            acAtPos = -1;
            acResults = [];
            acIndex = 0;
        }

        function acPosition(field) {
            var p = acGetPopup();
            var r = field.getBoundingClientRect();
            var spaceBelow = window.innerHeight - r.bottom;
            // Horizontal: align to field left, but keep on screen
            p.style.left = Math.min(r.left, window.innerWidth - 264) + 'px';
            if (spaceBelow >= 180 || spaceBelow >= r.top) {
                p.style.top = (r.bottom + 3) + 'px';
                p.style.transform = '';
            } else {
                p.style.top = (r.top - 3) + 'px';
                p.style.transform = 'translateY(-100%)';
            }
        }

        function acRender() {
            var p = acGetPopup();
            p.innerHTML = '';
            if (acResults.length === 0) {
                acHide();
                return;
            }
            acResults.forEach(function(resident, i) {
                var item = document.createElement('div');
                var selected = i === acIndex;
                item.setAttribute('style', [
                    'padding:6px 10px',
                    'cursor:pointer',
                    'display:flex',
                    'justify-content:space-between',
                    'align-items:baseline',
                    'gap:10px',
                    selected ? 'background:#eff6ff' : '',
                    i < acResults.length - 1 ? 'border-bottom:1px solid #f3f4f6' : '',
                ].filter(Boolean).join(';'));
                item.dataset.swAcIdx = i;

                var firstName = resident.namePreferred || resident.nameFirst || '';
                var nameSpan = document.createElement('span');
                nameSpan.textContent = (firstName + ' ' + (resident.nameLast || '')).trim();

                var metaSpan = document.createElement('span');
                metaSpan.textContent = (resident.roomSpace ? resident.roomSpace + ' · ' : '') + resident.entryId;
                metaSpan.setAttribute('style', 'color:#9ca3af;font-size:11px;white-space:nowrap;flex-shrink:0');

                item.appendChild(nameSpan);
                item.appendChild(metaSpan);

                // mousedown with preventDefault keeps textarea focused; click is a fallback
                // (if mousedown already inserted, acField is null and acInsert is a no-op)
                item.addEventListener('mousedown', function(e) {
                    e.preventDefault();
                    acInsert(resident.entryId);
                });
                item.addEventListener('click', function() {
                    acInsert(resident.entryId);
                });
                item.addEventListener('mouseover', function() {
                    acIndex = i;
                    acRender();
                });
                p.appendChild(item);
            });
            p.style.display = 'block';
        }

        function acQuery(query) {
            if (typeof window.starWrenchResidentDB === 'undefined') {
                acResults = [];
                acRender();
                return;
            }
            var matches;
            if (query === '') {
                matches = window.starWrenchResidentDB.getAll(true);
            } else {
                matches = window.starWrenchResidentDB.search(query, true);
            }
            acResults = matches.filter(function(r) {
                return r.status === 'In Room';
            }).slice(0, 8);
            acIndex = 0;
            acRender();
        }

        function acInsert(entryId) {
            if (!acField || acAtPos < 0) return;
            var field = acField;
            var cursor = field.selectionStart;
            var before = field.value.substring(0, acAtPos);
            var after = field.value.substring(cursor);
            var insertion = '@' + entryId + ' ';
            field.value = before + insertion + after;
            var newPos = before.length + insertion.length;
            field.setSelectionRange(newPos, newPos);
            field.dispatchEvent(new Event('input', { bubbles: true }));
            field.dispatchEvent(new Event('change', { bubbles: true }));
            acHide();
            field.focus();
        }

        function acHandleInput(e) {
            var field = e.target;
            if (!field || field.tagName !== 'TEXTAREA') return;
            var cursor = field.selectionStart;
            var textBefore = field.value.substring(0, cursor);
            // Match @ followed by up to two words (first + optional last name) right before cursor.
            // A second space dismisses the popup.
            // [^\s@] excludes both whitespace and @ so a new @ always starts a fresh trigger
            var match = textBefore.match(/@([^\s@]*(?:\s[^\s@]*)?)$/);
            if (!match) {
                acHide();
                return;
            }
            acField = field;
            acAtPos = match.index;
            acPosition(field);
            acQuery(match[1]);
        }

        function acHandleKeydown(e) {
            if (!acPopup || acPopup.style.display === 'none') return;
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                acIndex = Math.min(acIndex + 1, acResults.length - 1);
                acRender();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                acIndex = Math.max(acIndex - 1, 0);
                acRender();
            } else if (e.key === 'Enter' || e.key === 'Tab') {
                if (acResults.length > 0) {
                    e.preventDefault();
                    acInsert(acResults[acIndex].entryId);
                }
            } else if (e.key === 'Escape') {
                acHide();
            }
        }

        function acAttach(textarea) {
            if (textarea._swAcAttached) return;
            textarea._swAcAttached = true;
            textarea.addEventListener('input', acHandleInput);
            textarea.addEventListener('keydown', acHandleKeydown);
            textarea.addEventListener('blur', function() {
                // Delay allows mousedown on popup item to fire first
                setTimeout(acHide, 160);
            });
        }

        function acAttachToRoot(root) {
            root.querySelectorAll('textarea').forEach(acAttach);
        }

        // For habitat-textarea (shadow root contains the actual <textarea>)
        var acObservedShadows = new WeakSet();
        function acAttachToHabitatTextarea(el) {
            if (!el.shadowRoot || acObservedShadows.has(el)) return;
            acObservedShadows.add(el);
            acAttachToRoot(el.shadowRoot);
            var shadowObs = new MutationObserver(function() {
                acAttachToRoot(el.shadowRoot);
            });
            shadowObs.observe(el.shadowRoot, { childList: true, subtree: true });
        }

        function acScan() {
            acAttachToRoot(document);
            document.querySelectorAll('habitat-textarea').forEach(acAttachToHabitatTextarea);
        }

        // Dismiss when clicking outside the popup
        document.addEventListener('mousedown', function(e) {
            if (acPopup && acPopup.style.display !== 'none' && !acPopup.contains(e.target)) {
                acHide();
            }
        });

        // Catch newly added textareas/habitat-textareas
        var acBodyObserver = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType !== Node.ELEMENT_NODE) return;
                    if (node.tagName === 'TEXTAREA') {
                        acAttach(node);
                    } else if (node.tagName === 'HABITAT-TEXTAREA') {
                        acAttachToHabitatTextarea(node);
                    } else {
                        node.querySelectorAll('textarea').forEach(acAttach);
                        node.querySelectorAll('habitat-textarea').forEach(acAttachToHabitatTextarea);
                    }
                });
            });
        });
        acBodyObserver.observe(document.body, { childList: true, subtree: true });

        setTimeout(acScan, 600);
        // Re-scan after SPA navigation (reuse the existing URL-change interval above)
        var acLastUrl = window.location.href;
        setInterval(function() {
            var url = window.location.href;
            if (url !== acLastUrl) {
                acLastUrl = url;
                setTimeout(acScan, 1200);
                setTimeout(acScan, 2800);
            }
        }, 500);
        // ─────────────────────────────────────────────────────────────────────
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
                if (e.key === 'Escape' || (e.key === '/' && searchInput.value === '')) {
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

        // Add quick access hint between breadcrumb and search bar.
        // If the search bar isn't available (limited-access users), insert a
        // search button before the header buttons bar instead.
        function addSearchHint(instantSearch) {
            const originalSearch = document.querySelector('habitat-search-input#header-global-search');

            // Check if hint/button already exists
            if (document.getElementById('starwrench-search-hint')) {
                return true;
            }

            if (originalSearch) {
                // Full-access path: insert hint text next to the native search bar
                const hintContainer = document.createElement('span');
                hintContainer.id = 'starwrench-search-hint';

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

                hintContainer.appendChild(document.createTextNode('type '));
                hintContainer.appendChild(kbdElement);
                hintContainer.appendChild(document.createTextNode('for quick access'));
                originalSearch.parentNode.insertBefore(hintContainer, originalSearch);
                return true;
            }

            // Limited-access path: no native search bar, so add a search button
            const buttonsBar = document.querySelector('.habitat-siteheading-buttons');
            if (!buttonsBar) {
                return false;
            }

            const btn = document.createElement('button');
            btn.id = 'starwrench-search-hint';
            btn.title = 'Quick search (/)';
            btn.setAttribute('aria-label', 'Quick search');
            btn.style.cssText = `
                background: none;
                border: none;
                cursor: pointer;
                padding: 0 8px;
                height: 100%;
                display: flex;
                align-items: center;
                color: var(--color-grey-g60, #666);
                font-size: 16px;
                opacity: 0.75;
                transition: opacity 0.15s;
            `;
            btn.innerHTML = '<i class="fa fa-magnifying-glass" aria-hidden="true"></i>';
            btn.addEventListener('mouseover', function() { btn.style.opacity = '1'; });
            btn.addEventListener('mouseout', function() { btn.style.opacity = '0.75'; });
            btn.addEventListener('click', function() { instantSearch.openModal(); });

            buttonsBar.parentNode.insertBefore(btn, buttonsBar);
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

                    // Walk shadow DOM to find the real focused element
                    let activeEl = document.activeElement;
                    while (activeEl && activeEl.shadowRoot && activeEl.shadowRoot.activeElement) {
                        activeEl = activeEl.shadowRoot.activeElement;
                    }

                    // If focused on quick access input with text already, ignore
                    if (activeEl === quickAccessInput && activeEl.value.length > 0) {
                        return; // Let the "/" be typed normally
                    }

                    // Only allow triggering from the habitat search container input; block all other inputs/textareas
                    if (['INPUT', 'TEXTAREA'].includes(activeEl.tagName)) {
                        if (!activeEl.closest('.habitat-search-container')) {
                            return; // Let the "/" be typed normally
                        }
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

            // Add hint/button — retry once if the header isn't rendered yet
            setTimeout(() => {
                const success = addSearchHint(instantSearch);
                if (!success) {
                    setTimeout(() => addSearchHint(instantSearch), 500);
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
                const hash = window.location.hash;

                if (hash && hash.includes('dutyrounds:')) {
                    const match = hash.match(/dutyrounds:(\d+)/);
                    return match ? { id: match[1], type: 'dutyrounds' } : null;
                }

                let pageType = null;
                if (hash && hash.includes('incident:')) {
                    pageType = 'incident';
                } else if (hash && hash.includes('program:') && hash.includes(':attendees')) {
                    pageType = 'program';
                } else {
                    return null;
                }

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

            // Show loading state on the search input
            if (searchInput) {
                searchInput.disabled = true;
                searchInput.placeholder = 'Adding participant...';
                searchInput.style.opacity = '0.6';
            }

            var call;
            var entryIdStr = entryId.toString();

            if (screenInfo.type === 'dutyrounds') {
                call = new starrez.ServerRequest("CampusLife", "DutyRoundsEntry", "New", {
                    parentID: parseInt(screenInfo.id, 10),
                    vm: {
                        __ChangedFields: ["SelectedEntries", "EntryID"],
                        SelectedEntries: entryIdStr,
                        EntryID: entryIdStr
                    },
                    handler: { _error: { _autoFix: false, _autoIgnore: false } }
                });
            } else if (screenInfo.type === 'incident') {
                // Use the AddMultipleParticipants wizard endpoint (broader permission support)
                var formData = JSON.stringify({
                    IncidentInvolvementID: "0",
                    Reported: false,
                    SelectedEntries: entryIdStr,
                    EntryID: entryIdStr,
                    Comments: "",
                    AddAnother: false,
                    MultiStepData: [{
                        __ChangedFields: ["IncidentInvolvementID", "Reported", "SelectedEntries", "EntryID", "Comments", "AddAnother"],
                        IncidentInvolvementID: "0",
                        Reported: false,
                        SelectedEntries: entryIdStr,
                        EntryID: entryIdStr,
                        Comments: "",
                        AddAnother: false
                    }]
                });

                call = new MVC.Wizard.ExecuteWizard(
                    "StarNet.StarRez.Web.Main.Code.Functions.Providers.IncidentFunctions.AddMultipleParticipants",
                    parseInt(screenInfo.id, 10),
                    { _error: { _autoFix: false, _autoIgnore: false } },
                    formData,
                    true,
                    0,
                    new Date()
                );
            } else if (screenInfo.type === 'program') {
                // Program still uses the direct ServerRequest approach
                var data = {
                    parentID: parseInt(screenInfo.id, 10),
                    vm: {
                        __ChangedFields: ["EntryID", "Status", "CheckInDate", "CheckOutDate", "WorkflowID"],
                        EntryID: entryIdStr,
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
                call = new starrez.ServerRequest("CampusLife", "ProgramEntry", "New", data);
            }

            call.Request({
                ShowLoading: true
            }).done(function(response) {
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
                if (searchInput) {
                    searchInput.disabled = false;
                    searchInput.placeholder = screenInfo.type === 'program' ? 'Add attendee...' : 'Add participant...';
                    searchInput.style.opacity = '1';
                }
            });
        }

        // Collect all @-mentioned resident IDs from DOM and shadow roots
        function collectAutoLinkIds() {
            const ids = new Set();
            function collectFromRoot(root) {
                root.querySelectorAll('[data-sw-autolink-id]').forEach(function(el) {
                    const id = el.getAttribute('data-sw-autolink-id');
                    if (id) ids.add(id);
                });
            }
            collectFromRoot(document);
            document.querySelectorAll('habitat-display').forEach(function(el) {
                if (el.shadowRoot) collectFromRoot(el.shadowRoot);
            });
            return Array.from(ids);
        }

        // Add all @-mentioned residents as participants in one request
        function addLinkedParticipants(ids, button) {
            const screenInfo = getCurrentScreenInfo();
            if (!screenInfo) {
                alert('Cannot determine page type.');
                return;
            }
            if (!window.starrez || !window.starrez.ServerRequest) {
                alert('StarRez API not available. Please refresh and try again.');
                return;
            }

            button.disabled = true;
            const idsStr = ids.join(',');
            const lastId = ids[ids.length - 1];
            let call;

            if (screenInfo.type === 'dutyrounds') {
                call = new starrez.ServerRequest("CampusLife", "DutyRoundsEntry", "New", {
                    parentID: parseInt(screenInfo.id, 10),
                    vm: {
                        __ChangedFields: ["SelectedEntries", "EntryID"],
                        SelectedEntries: idsStr,
                        EntryID: lastId
                    },
                    handler: { _error: { _autoFix: false, _autoIgnore: false } }
                });
            } else if (screenInfo.type === 'incident') {
                var formData = JSON.stringify({
                    IncidentInvolvementID: "0",
                    Reported: false,
                    SelectedEntries: idsStr,
                    EntryID: lastId,
                    Comments: "",
                    AddAnother: false,
                    MultiStepData: [{
                        __ChangedFields: ["IncidentInvolvementID", "Reported", "SelectedEntries", "EntryID", "Comments", "AddAnother"],
                        IncidentInvolvementID: "0",
                        Reported: false,
                        SelectedEntries: idsStr,
                        EntryID: lastId,
                        Comments: "",
                        AddAnother: false
                    }]
                });
                call = new MVC.Wizard.ExecuteWizard(
                    "StarNet.StarRez.Web.Main.Code.Functions.Providers.IncidentFunctions.AddMultipleParticipants",
                    parseInt(screenInfo.id, 10),
                    { _error: { _autoFix: false, _autoIgnore: false } },
                    formData,
                    true, 0, new Date()
                );
            } else {
                button.disabled = false;
                return;
            }

            call.Request({ ShowLoading: true }).done(function() {
                console.log('[QuickAddParticipants] Linked participants added: ' + idsStr);
                if (typeof toastr !== 'undefined') {
                    toastr.success('', 'Added ' + ids.length + ' participant' + (ids.length === 1 ? '' : 's'));
                }
                if (typeof starrez.sm !== 'undefined' && starrez.sm.RefreshCurrentSection) {
                    starrez.sm.RefreshCurrentSection();
                }
            }).fail(function(jqXHR, textStatus, errorThrown) {
                console.error('[QuickAddParticipants] Error linking participants:', errorThrown);
                if (typeof toastr !== 'undefined') {
                    toastr.error('Please try again or add manually.', 'Failed to add participants');
                } else {
                    alert('Failed to add participants. Please try again or add manually.');
                }
            }).always(function() {
                button.disabled = false;
            });
        }

        function insertAutoLinkButton() {
            if (document.querySelector('.starwrench-autolink-btn')) return true;
            const editBtn = document.querySelector('habitat-fieldset > habitat-button[slot="button"]');
            if (!editBtn) return false;

            const button = document.createElement('habitat-button');
            button.setAttribute('slot', 'button');
            button.setAttribute('compact', '');
            button.setAttribute('class', 'starwrench-autolink-btn');
            button.setAttribute('title', 'Add all @-mentioned residents as participants');
            button.textContent = 'Auto Link Participants';

            button.addEventListener('click', function(e) {
                e.stopPropagation();
                const ids = collectAutoLinkIds();
                if (ids.length === 0) {
                    if (typeof toastr !== 'undefined') {
                        toastr.info('', 'No @-mentioned residents found on this page.');
                    } else {
                        alert('No @-mentioned residents found on this page.');
                    }
                    return;
                }
                addLinkedParticipants(ids, button);
            });

            editBtn.parentElement.insertBefore(button, editBtn);
            console.log('[QuickAddParticipants] Auto Link button added');
            return true;
        }

        function removeAutoLinkButton() {
            const btn = document.querySelector('.starwrench-autolink-btn');
            if (btn) btn.remove();
        }

        // Parse existing participant names from the participants table.
        // Format: "PAR: LastName, FirstName  (PreferredName) - [Status]"
        function getExistingParticipants(container) {
            const participants = [];
            container.querySelectorAll('span.field.view-control[data-name="IncidentEntryID"]').forEach(function(span) {
                const text = span.textContent.trim();
                const withoutRole = text.replace(/^[A-Z]+:\s*/, '');
                const lastName = withoutRole.split(',')[0].trim().toLowerCase();
                const prefMatch = withoutRole.match(/\(([^)]+)\)/);
                const preferred = prefMatch ? prefMatch[1].trim().toLowerCase() : '';
                participants.push({ lastName, preferred });
            });
            return participants;
        }

        function isAlreadyParticipant(entryId, existing) {
            if (!window.starWrenchResidentDB) return false;
            const resident = window.starWrenchResidentDB.getById(entryId);
            if (!resident) return false;
            const resLast = (resident.nameLast || '').trim().toLowerCase();
            const resPref = (resident.namePreferred || resident.nameFirst || '').trim().toLowerCase();
            return existing.some(function(p) {
                if (p.lastName !== resLast) return false;
                if (p.preferred && resPref) return p.preferred === resPref;
                return true;
            });
        }

        function insertAutoAddButton() {
            const wrapper = document.querySelector('.starwrench-quick-participants-search');
            if (!wrapper || wrapper.querySelector('.starwrench-auto-add-btn')) return;

            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'starwrench-auto-add-btn';
            button.textContent = 'Auto Add';
            button.title = 'Add all @-mentioned residents as participants, skipping existing ones';
            button.style.cssText = `
                margin-left: 6px;
                height: 28px;
                padding: 0 10px;
                font-size: 13px;
                background: var(--color-blue-b60, #0066cc);
                color: white;
                border: none;
                border-radius: var(--control-border-radius, 4px);
                cursor: pointer;
                white-space: nowrap;
            `;

            button.addEventListener('click', function() {
                const ids = collectAutoLinkIds();
                if (ids.length === 0) {
                    if (typeof toastr !== 'undefined') toastr.info('', 'No @-mentioned residents found on this page.');
                    else alert('No @-mentioned residents found on this page.');
                    return;
                }

                const container = wrapper.closest('.fieldset-block.ui-fieldset-block');
                const existing = container ? getExistingParticipants(container) : [];
                const newIds = ids.filter(function(id) { return !isAlreadyParticipant(id, existing); });

                if (newIds.length === 0) {
                    if (typeof toastr !== 'undefined') toastr.info('', 'All @-mentioned residents are already participants.');
                    else alert('All @-mentioned residents are already participants.');
                    return;
                }

                addLinkedParticipants(newIds, button);
            });

            wrapper.appendChild(button);
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

        // Monitor for page changes and try to insert search bar and auto-link button
        function monitorForSections() {
            try {
                let lastUrl = window.location.href;

                function checkAndInsert() {
                    try {
                        const currentUrl = window.location.href;

                        if (currentUrl !== lastUrl) {
                            lastUrl = currentUrl;
                            removeAutoLinkButton();
                        }

                        if (currentUrl.includes('incident:') || (currentUrl.includes('program:') && currentUrl.includes(':attendees'))) {
                            setTimeout(() => { insertSearchBar(); insertAutoAddButton(); }, 1000);
                        }

                        if (currentUrl.includes('dutyrounds:') || currentUrl.includes('incident:')) {
                            insertAutoLinkButton();
                        }

                        if (currentUrl.includes('incident:')) {
                            insertAutoAddButton();
                        }
                    } catch (error) {
                        console.error('[QuickAddParticipants] Error in checkAndInsert:', error);
                    }
                }

                // Initial insertion
                setTimeout(insertAutoLinkButton, 1500);
                checkAndInsert();

                setInterval(checkAndInsert, 2000);

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
                templateContainer.innerHTML = 'Templates: <a href="#" id="shift-report-template-link">Shift Report</a> | <a href="#" id="flat-meeting-template-link">Flat Meeting</a>';

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

                var flatMeetingLink = templateContainer.querySelector('#flat-meeting-template-link');
                if (flatMeetingLink) {
                    flatMeetingLink.addEventListener('click', function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        applyFlatMeetingTemplate($modal);
                    });
                }

            } catch (error) {
                console.error('Error adding template button:', error);
            }
        }

        function removeFlatMeetingNotes($modal) {
            var existing = $modal.querySelector('#flat-meeting-notes-li');
            if (existing) {
                existing.parentNode.removeChild(existing);
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

                removeFlatMeetingNotes($modal);

                titleInput.value = 'Shift Report - HALL';
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

        function applyFlatMeetingTemplate($modal) {
            try {
                var titleInput = $modal.querySelector('input[name="Title"]');
                var descriptionTextarea = $modal.querySelector('textarea[name="Description"]');

                if (!titleInput || !descriptionTextarea) {
                    console.error('Could not find Title or Description fields');
                    return;
                }

                removeFlatMeetingNotes($modal);

                titleInput.value = 'Flat Meeting - FLAT';
                descriptionTextarea.value = '# Meeting summary\n\n\n\n# Individual resident notes (concerns, engagement, things of note)\n\n';

                var descLi = descriptionTextarea.closest('li');
                if (descLi) {
                    var notesLi = document.createElement('li');
                    notesLi.id = 'flat-meeting-notes-li';
                    notesLi.innerHTML = '<label for="474da9ec73d9400e9967e7c210bbb989_input" title="Description">Notes:</label><div style="display: inline-block; padding-top: 0.6em; max-width: 74ch;">Add something personal/observational for each resident.<br>Upload photos of the rules + roster.<br>Tag all participants. </div>';
                    descLi.parentNode.insertBefore(notesLi, descLi.nextSibling);
                }

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

                console.log('Flat Meeting template applied successfully');

            } catch (error) {
                console.error('Error applying flat meeting template:', error);
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

    // LAYOUT FIXES PLUGIN
    function initLayoutFixesPlugin() {
        if (typeof toastr !== 'undefined') {
            Object.assign(toastr.options, {
                closeButton: true,
                progressBar: true,
                showDuration: '100',
                hideDuration: '100',
                timeOut: '3000',
                extendedTimeOut: '3000',
            });
        }

        const style = document.createElement('style');
        style.textContent = `
            .textarea[data-add-readmore="True"] {
                display: inline-block;
                max-width: 80ch;
            }
            .ui-bulkedit-multimodify-content-container input[type="text"],
            .ui-bulkedit-multimodify-content-container select {
                width: min-content;
                max-width: 230px;
            }
            habitat-display[multiline][role="paragraph"] {
                display: block;
                max-width: 128ch;
            }
            .column.ui-dashboard-column {
                display: flex;
                flex-direction: column;
            }
            .dashboard-item:has(.panel-error),
            .dashboard-item.sw-empty-dashboard {
                order: 99;
            }
            .dashboard-item:has(.panel-error) .item-title.ui-dashboard-item-title,
            .dashboard-item.sw-empty-dashboard .item-title.ui-dashboard-item-title {
                color: #676767;
                background-color: #e3e3e3;
            }
            .dashboard-item-title-options {
                transition: all 0.1s;
                opacity: 0.3;
            }
            .dashboard-item.ui-dashboard-item:hover .dashboard-item-title-options {
                opacity: 1;
            }
        `;
        document.head.appendChild(style);

        var expandedEls = new WeakSet();

        function expandHabitatDisplay(el) {
            if (expandedEls.has(el)) return;
            var sr = el.shadowRoot;
            if (!sr) return;
            var linkBtn = sr.querySelector('habitat-link-button');
            if (!linkBtn) return;
            expandedEls.add(el);
            var innerBtn = linkBtn.shadowRoot && linkBtn.shadowRoot.querySelector('button');
            if (innerBtn) {
                innerBtn.click();
            } else {
                linkBtn.click();
            }
        }

        function processHabitatDisplays() {
            document.querySelectorAll('habitat-display[multiline][role="paragraph"]').forEach(expandHabitatDisplay);
        }

        processHabitatDisplays();
        setTimeout(processHabitatDisplays, 500);
        setTimeout(processHabitatDisplays, 1500);

        var layoutObserver = new MutationObserver(function() {
            setTimeout(processHabitatDisplays, 200);
        });
        layoutObserver.observe(document.body, { childList: true, subtree: true });

        // ── PHONE FORMATTER ───────────────────────────────────────────────────
        var formattingInProgress = false;

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
                        return '+64 ' + prefix + ' ' + firstGroup + ' ' + secondGroup;
                    } else {
                        const remainingDigits = cleaned.slice(4);
                        const prefix = cleaned.charAt(3);
                        const firstGroup = remainingDigits.slice(0, 3);
                        const secondGroup = remainingDigits.slice(3);
                        return '+64 ' + prefix + ' ' + firstGroup + ' ' + secondGroup;
                    }
                }
            }

            if (cleaned.startsWith('02') && cleaned.length >= 9) {
                const prefix = cleaned.slice(0, 3);
                const remainingDigits = cleaned.slice(3);
                return prefix + ' ' + remainingDigits.slice(0, 3) + ' ' + remainingDigits.slice(3);
            }

            if (cleaned.startsWith('0') && cleaned.length >= 8) {
                const prefix = cleaned.slice(0, 2);
                const remainingDigits = cleaned.slice(2);
                return prefix + ' ' + remainingDigits.slice(0, 3) + ' ' + remainingDigits.slice(3);
            }

            if (cleaned.length <= 7) {
                return cleaned.slice(0, 3) + ' ' + cleaned.slice(3);
            }
            return cleaned.slice(0, 3) + ' ' + cleaned.slice(3, 6) + ' ' + cleaned.slice(6);
        }

        function formatPhoneNumbersInPage() {
            if (formattingInProgress) return;
            formattingInProgress = true;
            try {
                document.querySelectorAll('ul[class*="personal-info-tile-styles"] li, li').forEach(function(item) {
                    const paragraphs = item.querySelectorAll('p');
                    if (paragraphs.length >= 2) {
                        const labelEl = paragraphs[0];
                        const valueEl = paragraphs[1];
                        if (labelEl && labelEl.textContent && labelEl.textContent.includes('Phone Number') && valueEl && valueEl.textContent) {
                            const orig = valueEl.textContent.trim();
                            if (orig && /^\+?[0-9]{7,15}$/.test(orig.replace(/\s/g, '')) && (orig.match(/ /g) || []).length < 2) {
                                const formatted = formatPhoneNumber(orig);
                                if (formatted !== orig) valueEl.textContent = formatted;
                            }
                        }
                    }
                });
                document.querySelectorAll('span[data-name="Phone"]').forEach(function(span) {
                    if (span && span.textContent) {
                        const orig = span.textContent.trim();
                        if (orig && /^\+?[0-9]{7,15}$/.test(orig.replace(/\s/g, '')) && (orig.match(/ /g) || []).length < 2) {
                            const formatted = formatPhoneNumber(orig);
                            if (formatted !== orig) span.textContent = formatted;
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

        var phoneObserver = new MutationObserver(function() {
            setTimeout(formatPhoneNumbersInPage, 500);
        });
        phoneObserver.observe(document.body, { childList: true, subtree: true });
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
            case 'dashboardTweaks':
            case 'clipboard':  // backwards compat — merged into dashboardTweaks
            case 'dashboard':  // backwards compat — merged into dashboardTweaks
            case 'dropdown':   // backwards compat
                initDashboardTweaksPlugin();
                break;
            case 'initials':
                initInitialsPlugin();
                break;
            case 'phone':      // backwards compat — merged into layoutFixes
            case 'wordHighlighter': // removed — no-op for saved settings
                break;
            case 'autoLinker':
            case 'atMentionLinker': // backwards compat — merged into autoLinker
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
            case 'layoutFixes':
                initLayoutFixesPlugin();
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
