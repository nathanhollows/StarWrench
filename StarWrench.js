// ==UserScript==
// @name         StarWrench
// @namespace    http://tampermonkey.net/
// @version      1.3.6
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

    const SUITE_VERSION = '1.3.6';
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
                name: '📋 Clipboard Copy',
                description: 'Copy record IDs from dashboard sections to clipboard for easy export'
            },
            dropdown: {
                enabled: true,
                name: '🔍 Dropdown Search',
                description: 'Add search functionality to the Dashboard dropdown menu'
            },
            initials: {
                enabled: true,
                name: '👤 Initials Expander',
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
                name: '🔎 Resident Search',
                description: 'Replaces global search with a fast resident lookup powered by the local database'
            },
            quickIncidentParticipants: {
                enabled: true,
                name: '👥 Quick Incident Participants',
                description: 'Add a search bar in incident Participants section to quickly add residents'
            },
            quickIncidentStatus: {
                enabled: true,
                name: '🚦 Quick Incident Status',
                description: 'Add quick status change buttons (In Progress/Close) to incident details'
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
        return currentSettings.plugins[pluginName]?.enabled || false;
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
                    starrez.ui?.ShowAlertMessage?.(`${plugin.name} enabled! Refresh the page for full functionality.`, 'Plugin Enabled');
                } else {
                    starrez.ui?.ShowAlertMessage?.(`${plugin.name} disabled! Refresh the page to fully remove functionality.`, 'Plugin Disabled');
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
                starrez.ui?.ShowAlertMessage?.('Settings reset to defaults. Refresh the page for changes to take effect.', 'Settings Reset');
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
                newButton.setAttribute('icon', 'fa-cogs');
                newButton.setAttribute('dropdown-heading', 'StarWrench');

                newButton.addEventListener('click', () => {
                    createPluginManagerDropdown(container);
                });

                const secondButton = container.children[1];
                container.insertBefore(newButton, secondButton);
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
        function getRecordCountFromFooter(dashboardItem) {
            const footer = dashboardItem.querySelector('.dashboard-footer.ui-dashboard-footer');
            if (!footer || window.getComputedStyle(footer).display === 'none') {
                return 0;
            }
            const match = footer.textContent.match(/Records:\s*(\d+)/);
            return match ? parseInt(match[1], 10) : null;
        }

        function getRecordIdsFromDashboard(dashboardItem) {
            const rows = dashboardItem.querySelectorAll('tr[data-recordid]');
            return Array.from(rows).map(row => row.getAttribute('data-recordid')).filter(id => id);
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

        async function handleClipboardClick(dashboardItem) {
            const footerCount = getRecordCountFromFooter(dashboardItem);
            if (footerCount === 0) {
                alert('No data available to copy.');
                return;
            }
            if (footerCount === null) {
                alert('Could not determine record count.');
                return;
            }

            const recordIds = getRecordIdsFromDashboard(dashboardItem);
            if (recordIds.length === 0) {
                alert('No record IDs found.');
                return;
            }

            const idsText = recordIds.join('\n');
            const success = await copyToClipboard(idsText);

            if (success) {
                alert(`Successfully copied ${recordIds.length} record IDs to clipboard! (Expected: ${footerCount})`);
            } else {
                alert(`Failed to copy. Found ${recordIds.length} IDs (Expected: ${footerCount}):\n\n${idsText}`);
            }
        }

        function addClipboardButton(dashboardItem) {
            if (dashboardItem.querySelector('.clipboard-copy-btn')) return;

            const titleOptions = dashboardItem.querySelector('.dashboard-item-title-options');
            if (!titleOptions) return;

            const button = document.createElement('button');
            button.className = 'sr_button_icon sr_button clipboard-copy-btn';
            button.title = 'Copy Record IDs to Clipboard';
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

    // DROPDOWN SEARCH PLUGIN
    function initDropdownPlugin() {
        const PROCESSED_ATTRIBUTE = 'data-search-filter-added';

        function addSearchToDropdown(dropdown) {
            if (dropdown.hasAttribute(PROCESSED_ATTRIBUTE)) return;

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

            searchInput.addEventListener('input', function() {
                const filterText = this.value.toLowerCase();
                dropdown.querySelectorAll('ul li').forEach(item => {
                    item.style.display = item.textContent.toLowerCase().includes(filterText) ? '' : 'none';
                });
            });

            dropdown.insertBefore(searchInput, dropdown.firstChild);
            dropdown.setAttribute(PROCESSED_ATTRIBUTE, 'true');
            setTimeout(() => searchInput.focus(), 50);
        }

        function scanForDropdowns() {
            document.querySelectorAll('.ui-submodules-more-dropdown.srw_subModuleTabs_more_dropdown').forEach(dropdown => {
                if (!dropdown.hasAttribute(PROCESSED_ATTRIBUTE)) {
                    addSearchToDropdown(dropdown);
                } else if (!dropdown.classList.contains('hidden')) {
                    const searchInput = dropdown.querySelector('.search-filter-input');
                    if (searchInput) setTimeout(() => searchInput.focus(), 50);
                }
            });
        }

        function setupMoreButtonListeners() {
            document.querySelectorAll('.srw_subModuleTabs_more, .srw_subModuleTabs_more_button, .ui-sub-module-more-group-button').forEach(button => {
                if (!button.hasAttribute('data-filter-listener')) {
                    button.addEventListener('click', () => setTimeout(scanForDropdowns, 200));
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

    // RESIDENT SEARCH PLUGIN
    function initResidentSearchPlugin() {
        let searchInput = null;
        let resultsContainer = null;
        let filterCheckbox = null;
        let currentResults = [];
        let selectedIndex = -1;
        let searchTimeout = null;
        let showCurrentOnly = true; // Default to current residents only

        // Wait for the resident database to be available
        function waitForDatabase(callback, attempts = 0) {
            if (window.starWrenchResidentDB) {
                callback();
            } else if (attempts < 50) {
                setTimeout(() => waitForDatabase(callback, attempts + 1), 100);
            } else {
                console.error('[ResidentSearch] Resident database not available');
            }
        }

        // Navigate to a resident's entry
        function navigateToResident(entryId) {
            if (!entryId) return;
            const shortcode = `Entry:${entryId}`;
            starrez.sm.NavigateTo(`#!${shortcode}`);
        }

        // Create the results dropdown
        function createResultsContainer() {
            const container = document.createElement('div');
            container.id = 'starwrench-resident-search-results';
            container.style.cssText = `
                position: absolute;
                top: 100%;
                left: 0;
                min-width: 100%;
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
                navigateToResident(resident.entryId);
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

            // Add filter checkbox at the top
            const filterContainer = document.createElement('div');
            filterContainer.style.cssText = `
                padding: 8px 10px;
                border-bottom: 1px solid var(--color-grey-g30, #ddd);
                background: var(--color-grey-g10, #f8f8f8);
                display: flex;
                align-items: center;
                gap: 6px;
                font-size: 12px;
            `;

            filterCheckbox = document.createElement('input');
            filterCheckbox.type = 'checkbox';
            filterCheckbox.id = 'starwrench-current-only-filter';
            filterCheckbox.checked = showCurrentOnly;
            filterCheckbox.style.cssText = 'cursor: pointer;';

            const filterLabel = document.createElement('label');
            filterLabel.setAttribute('for', 'starwrench-current-only-filter');
            filterLabel.textContent = 'Current residents only (uncheck for historical)';
            filterLabel.style.cssText = 'cursor: pointer; user-select: none; color: var(--color-grey-g70, #555);';

            filterCheckbox.addEventListener('change', () => {
                toggleFilter();
            });

            filterContainer.appendChild(filterCheckbox);
            filterContainer.appendChild(filterLabel);
            resultsContainer.appendChild(filterContainer);

            if (results.length === 0) {
                const noResults = document.createElement('div');
                noResults.style.cssText = 'padding: 16px 12px; text-align: center; color: var(--color-grey-g60, #666);';
                noResults.textContent = 'No residents found';
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
                    console.error('[ResidentSearch] Database not available');
                    return;
                }

                const results = window.starWrenchResidentDB.search(query.trim(), showCurrentOnly);
                showResults(results);
            }, 150); // Debounce 150ms
        }

        // Toggle between current and historical residents
        function toggleFilter() {
            showCurrentOnly = filterCheckbox ? filterCheckbox.checked : true;

            // Re-run search if there's text
            if (searchInput && searchInput.value.trim().length >= 2) {
                handleSearch(searchInput.value);
            }
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
                        navigateToResident(currentResults[selectedIndex].entryId);
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

        // Replace the search input
        function replaceSearchInput() {
            const originalSearch = document.querySelector('habitat-search-input#header-global-search');
            if (!originalSearch) {
                console.log('[ResidentSearch] Original search input not found');
                return false;
            }

            // Create wrapper for positioning
            const wrapper = document.createElement('div');
            wrapper.style.cssText = `
                position: relative;
                display: inline-block;
                width: 100%;
            `;

            // Create new search input
            const newSearch = document.createElement('input');
            newSearch.id = 'starwrench-resident-search-input';
            newSearch.type = 'text';
            newSearch.placeholder = 'Search residents...';
            newSearch.setAttribute('aria-label', 'Search residents');
            newSearch.style.cssText = `
                border: 1px solid var(--color-grey-g30, #ccc);
                height: var(--control-compact-size, 32px);
                background: white;
                border-radius: var(--control-border-radius, 4px);
                padding: 0 8px;
                width: 100%;
                font-size: 14px;
                outline: none;
                box-sizing: border-box;
            `;

            // Focus styling
            newSearch.addEventListener('focus', () => {
                newSearch.style.outline = '2px solid var(--color-blue-b60, #0066cc)';
                newSearch.style.borderColor = 'var(--color-blue-b60, #0066cc)';
            });

            newSearch.addEventListener('blur', () => {
                newSearch.style.outline = 'none';
                newSearch.style.borderColor = 'var(--color-grey-g30, #ccc)';
                // Delay closing to allow clicks on results
                setTimeout(closeResults, 200);
            });

            // Create results container
            resultsContainer = createResultsContainer();

            // Assemble
            wrapper.appendChild(newSearch);
            wrapper.appendChild(resultsContainer);

            // Replace original
            originalSearch.parentNode.replaceChild(wrapper, originalSearch);
            searchInput = newSearch;

            // Add event listeners
            searchInput.addEventListener('input', (e) => handleSearch(e.target.value));
            searchInput.addEventListener('keydown', handleKeyDown);

            // Click outside to close
            document.addEventListener('click', (e) => {
                if (!wrapper.contains(e.target)) {
                    closeResults();
                }
            });

            console.log('[ResidentSearch] Search input replaced successfully');
            return true;
        }

        // Initialize the plugin
        function initialize() {
            waitForDatabase(() => {
                setTimeout(() => {
                    const success = replaceSearchInput();
                    if (!success) {
                        // Retry after a delay
                        setTimeout(() => replaceSearchInput(), 2000);
                    }
                }, 1500);
            });
        }

        initialize();
    }

    // QUICK INCIDENT PARTICIPANTS PLUGIN
    function initQuickIncidentParticipantsPlugin() {
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
                console.log('[QuickIncidentParticipants] Resident database not populated yet. Visit Main -> Directory to build the database.');
            }
        }

        // Get current incident ID from StarRez API
        function getCurrentIncidentId() {
            if (typeof starrez.sm !== 'undefined' && starrez.sm.GetCurrentlyDisplayedScreenID) {
                return starrez.sm.GetCurrentlyDisplayedScreenID();
            }
            return null;
        }

        // Add participant to incident via StarRez API
        function addParticipantToIncident(entryId, displayName) {
            const incidentId = getCurrentIncidentId();
            if (!incidentId) {
                console.error('[QuickIncidentParticipants] Cannot determine incident ID');
                if (typeof starrez.ui !== 'undefined' && starrez.ui.ShowAlertMessage) {
                    starrez.ui.ShowAlertMessage('Unable to determine incident ID. Please try again.', 'Error');
                } else {
                    alert('Unable to determine incident ID. Please try again.');
                }
                return;
            }

            if (!window.starrez?.ServerRequest) {
                console.error('[QuickIncidentParticipants] StarRez ServerRequest API not available');
                if (typeof starrez.ui !== 'undefined' && starrez.ui.ShowAlertMessage) {
                    starrez.ui.ShowAlertMessage('StarRez API not available. Please refresh the page and try again.', 'Error');
                } else {
                    alert('StarRez API not available. Please refresh the page and try again.');
                }
                return;
            }

            // Prepare data structure for the API call
            const data = {
                parentID: parseInt(incidentId, 10),
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

            // Show loading state on the search input
            if (searchInput) {
                searchInput.disabled = true;
                searchInput.placeholder = 'Adding participant...';
                searchInput.style.opacity = '0.6';
            }

            // Use StarRez's ServerRequest API to add the participant
            const call = new starrez.ServerRequest("CampusLife", "IncidentEntry", "New", data);

            call.Request({
                ShowLoading: true
            }).done(response => {
                console.log(`[QuickIncidentParticipants] Successfully added participant: ${displayName}`);

                // Refresh the current section to show the new participant
                if (typeof starrez.sm !== 'undefined' && starrez.sm.RefreshCurrentSection) {
                    starrez.sm.RefreshCurrentSection();
                } else {
                    // Fallback: trigger the same event that happens after manual save
                    starrez.FireEvent?.('DBObjectEvent', 'incident', parseInt(incidentId, 10));
                }

            }).fail((jqXHR, textStatus, errorThrown) => {
                console.error('[QuickIncidentParticipants] Error adding participant:', errorThrown);

                // Show user-friendly error message
                if (typeof starrez.ui !== 'undefined' && starrez.ui.ShowAlertMessage) {
                    starrez.ui.ShowAlertMessage(`Failed to add ${displayName} to the incident. Please try again or add manually.`, 'Error');
                } else {
                    alert(`Failed to add ${displayName} to the incident. Please try again or add manually.`);
                }
            }).always(() => {
                // Restore search input state
                if (searchInput) {
                    searchInput.disabled = false;
                    searchInput.placeholder = 'Add participant...';
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
                addParticipantToIncident(resident.entryId, displayName);
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
                    console.error('[QuickIncidentParticipants] Database not available');
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
                        addParticipantToIncident(resident.entryId, displayName);
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

        // Insert search bar into the Participants section
        function insertSearchBar() {
            // Check if we're on an incident page
            if (!window.location.hash || !window.location.hash.includes('incident:')) {
                return false;
            }

            // Find the Participants section
            const participantsSection = Array.from(document.querySelectorAll('.fieldset-block .caption')).find(
                caption => caption.textContent.trim() === 'Participants'
            );

            if (!participantsSection) {
                return false;
            }

            // Check if search bar already exists
            if (participantsSection.parentElement.querySelector('.starwrench-quick-participants-search')) {
                return true;
            }

            const headerDiv = participantsSection.parentElement;

            // Create wrapper for positioning
            const wrapper = document.createElement('div');
            wrapper.className = 'starwrench-quick-participants-search';
            wrapper.style.cssText = `
                position: relative;
                display: flex;
                margin-left: auto;
                align-content: center;
                align-items: center;
            `;

            // Create search input
            searchInput = document.createElement('input');
            searchInput.type = 'text';
            searchInput.placeholder = 'Add participant...';
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

            // Insert into header
            headerDiv.appendChild(wrapper);

            // Add event listeners
            searchInput.addEventListener('input', (e) => handleSearch(e.target.value));
            searchInput.addEventListener('keydown', handleKeyDown);

            // Click outside to close
            document.addEventListener('click', (e) => {
                if (!wrapper.contains(e.target)) {
                    closeResults();
                }
            });

            console.log('[QuickIncidentParticipants] Search bar added successfully');
            return true;
        }

        // Monitor for page changes and try to insert search bar
        function monitorForParticipantsSection() {
            let lastUrl = window.location.href;

            function checkAndInsert() {
                const currentUrl = window.location.href;

                // Check if URL changed or if we're on an incident page
                if (currentUrl !== lastUrl || currentUrl.includes('incident:')) {
                    lastUrl = currentUrl;

                    // Try to insert after a delay to ensure DOM is ready
                    setTimeout(() => {
                        insertSearchBar();
                    }, 1000);
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
        }

        // Initialize the plugin
        function initialize() {
            waitForDatabase(() => {
                monitorForParticipantsSection();
            });
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
            if (!window.starrez?.ServerRequest) {
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
                    starrez.FireEvent?.('DBObjectEvent', 'incident', parseInt(incidentId, 10));
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

    // RESIDENT DATABASE PLUGIN
    function initResidentDatabasePlugin() {
        const RESIDENT_DB_KEY = 'starWrenchResidentDatabase';
        const RESIDENT_DB_META_KEY = 'starWrenchResidentDatabaseMeta';
        const CURRENT_STATUSES = ['Reserved', 'Tentative', 'In Room'];
        const EXCLUDED_STATUSES = ['Admin'];

        // Database structure: { entryId: { nameFirst, namePreferred, nameLast, entryId, roomSpace, status, lastUpdated } }
        let residentDB = {};
        let lastKnownDataHash = '';
        let isProcessing = false;

        // Load database from localStorage
        function loadDatabase() {
            try {
                const stored = localStorage.getItem(RESIDENT_DB_KEY);
                if (stored) {
                    residentDB = JSON.parse(stored);
                    console.log(`[ResidentDB] Loaded ${Object.keys(residentDB).length} residents from database`);
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

        // Extract text content from a table cell by class name
        function getCellText(row, className) {
            const cell = row.querySelector(`td.${className} .data-column`);
            if (!cell) return '';
            return cell.textContent.trim();
        }

        // Process a single table row
        function processRow(row) {
            const entryId = row.getAttribute('data-id');
            if (!entryId) return null;

            const status = getCellText(row, 'EntryStatusEnum');
            const nameFirst = getCellText(row, 'NameFirst');
            const namePreferred = getCellText(row, 'NamePreferred');
            const nameLast = getCellText(row, 'NameLast');
            const roomSpace = getCellText(row, 'RoomSpace_Description');

            return {
                entryId,
                nameFirst,
                namePreferred,
                nameLast,
                roomSpace,
                status,
                lastUpdated: new Date().toISOString()
            };
        }

        // Update the database with current page data
        function updateDatabase() {
            if (isProcessing) return;
            isProcessing = true;

            try {
                const table = document.querySelector('table.directory-grid tbody');
                if (!table) {
                    console.log('[ResidentDB] Directory table not found');
                    isProcessing = false;
                    return;
                }

                const rows = table.querySelectorAll('tr[data-id]');
                if (rows.length === 0) {
                    console.log('[ResidentDB] No data rows found');
                    isProcessing = false;
                    return;
                }

                let addedCount = 0;
                let updatedCount = 0;
                let removedCount = 0;
                const processedIds = new Set();

                // Process each row
                rows.forEach(row => {
                    const data = processRow(row);
                    if (!data) return;

                    processedIds.add(data.entryId);

                    // Check if this resident should be excluded (Admin status)
                    if (EXCLUDED_STATUSES.includes(data.status)) {
                        // Remove if exists
                        if (residentDB[data.entryId]) {
                            delete residentDB[data.entryId];
                            removedCount++;
                        }
                        return;
                    }

                    // Store all other residents
                    const existing = residentDB[data.entryId];

                    if (!existing) {
                        // New resident
                        residentDB[data.entryId] = data;
                        addedCount++;
                    } else {
                        // Check if anything changed
                        const changed =
                            existing.nameFirst !== data.nameFirst ||
                            existing.namePreferred !== data.namePreferred ||
                            existing.nameLast !== data.nameLast ||
                            existing.roomSpace !== data.roomSpace ||
                            existing.status !== data.status;

                        if (changed) {
                            residentDB[data.entryId] = data;
                            updatedCount++;
                        }
                    }
                });

                // Check for residents that are no longer on the page but were previously stored
                // (This handles cases where residents changed status on a different page)
                // We don't remove them here as they might just not be on this page of results

                if (addedCount > 0 || updatedCount > 0 || removedCount > 0) {
                    saveDatabase();
                    console.log(`[ResidentDB] Updated: +${addedCount} new, ~${updatedCount} modified, -${removedCount} removed. Total: ${Object.keys(residentDB).length}`);
                }

            } catch (error) {
                console.error('[ResidentDB] Error updating database:', error);
            }

            isProcessing = false;
        }

        // Debounced update function
        let updateTimeout;
        function scheduleUpdate(delay = 500) {
            clearTimeout(updateTimeout);
            updateTimeout = setTimeout(updateDatabase, delay);
        }

        // Check if we're on the directory page
        function isOnDirectoryPage() {
            return window.location.href.includes('/StarRezWeb/main/directory') ||
                   window.location.href.includes('/StarRezWeb/Main/Directory');
        }

        // Initialize the plugin
        function initialize() {
            // Always load the database from localStorage, regardless of page
            loadDatabase();

            if (!isOnDirectoryPage()) {
                console.log('[ResidentDB] Not on directory page, database loaded from cache');
                return;
            }

            console.log('[ResidentDB] Initializing on directory page');

            // Initial scan after page loads
            setTimeout(() => {
                updateDatabase();
            }, 2000);

            // Watch for AJAX requests to GetPagedData
            const originalFetch = window.fetch;
            window.fetch = function(...args) {
                const url = args[0];

                // Intercept GetPagedData requests
                if (typeof url === 'string' && url.includes('/Main/Directory/GetPagedData')) {
                    return originalFetch.apply(this, args).then(response => {
                        // Clone response so we can read it
                        const clonedResponse = response.clone();

                        // Schedule update after the DOM has been updated
                        scheduleUpdate(800);

                        return response;
                    });
                }

                return originalFetch.apply(this, args);
            };

            // Also watch for DOM changes as a backup
            const observer = new MutationObserver((mutations) => {
                const hasTableChanges = mutations.some(mutation => {
                    return Array.from(mutation.addedNodes).some(node => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            return node.matches && (
                                node.matches('tr[data-id]') ||
                                node.querySelector && node.querySelector('tr[data-id]')
                            );
                        }
                        return false;
                    });
                });

                if (hasTableChanges) {
                    scheduleUpdate(1000);
                }
            });

            // Observe the table container
            setTimeout(() => {
                const tableContainer = document.querySelector('table.directory-grid');
                if (tableContainer) {
                    observer.observe(tableContainer, {
                        childList: true,
                        subtree: true
                    });
                    console.log('[ResidentDB] Observing directory table for changes');
                }
            }, 1500);

            console.log('[ResidentDB] Plugin initialized successfully');
        }

        // Expose search function for other plugins to use
        window.starWrenchResidentDB = {
            search: function(query, currentOnly = true) {
                if (!query || typeof query !== 'string') return [];

                const lowerQuery = query.toLowerCase();
                const results = [];

                Object.values(residentDB).forEach(resident => {
                    // Filter by status based on currentOnly flag
                    const isCurrent = CURRENT_STATUSES.includes(resident.status);

                    // If currentOnly is true, skip non-current residents
                    // If currentOnly is false, skip current residents (show only historical)
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
            refresh: function() {
                updateDatabase();
            }
        };

        initialize();
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
            case 'dropdown':
                initDropdownPlugin();
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
                initResidentSearchPlugin();
                break;
            case 'quickIncidentParticipants':
                initQuickIncidentParticipantsPlugin();
                break;
            case 'quickIncidentStatus':
                initQuickIncidentStatusPlugin();
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
            initResidentDatabasePlugin();
        }, 500);

        // Initialize enabled plugins
        setTimeout(initializeAllPlugins, 500);

        console.log(`✅ StarWrench v${SUITE_VERSION} loaded successfully!`);
    }

    // Start the suite
    initialize();

})();
