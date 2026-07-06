# Installing StarWrench

StarWrench is a userscript — a small program that runs in your browser and enhances the StarRez interface with quality-of-life features. To run it, you'll need a userscript manager extension. This guide walks you through the whole process in a few minutes.

---

## Step 1 — Install Tampermonkey

Tampermonkey is a userscript manager. It lets you load custom scripts like StarWrench.

| Browser | Link |
|---------|------|
| Chrome | [Chrome Web Store](https://chromewebstore.google.com/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) |
| Firefox | [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/) |
| Edge | [Microsoft Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd) |
| Safari | [App Store](https://apps.apple.com/app/tampermonkey/id1482490089) |

Click **Add to [Browser]** and confirm when prompted.

![Tampermonkey extension page showing the Add to Chrome button](_images/01-tampermonkey-store.png)

Note: Developer mode needs to be enabled and Tampermonkey needs to have Userscripts enabled in Edge and Chrome. These must be set before StarWrench will work.

---

## Step 3 — Install StarWrench

Click the link below to open the StarWrench script. Tampermonkey will intercept it and show an installation page.

**[Click here to install StarWrench](https://raw.githubusercontent.com/nathanhollows/StarWrench/refs/heads/main/StarWrench.js)**

![Tampermonkey installation page showing the StarWrench script details](_images/03-install-page.png)

---

## Step 4 — Confirm the installation

On the Tampermonkey installation page you'll see the script name, version, and the websites it will run on. Click **Install** to confirm.

> StarWrench only runs on `vuw.starrezhousing.com` — it has no access to any other sites.

![Tampermonkey confirmation screen with the Install button highlighted](_images/04-confirm-install.png)

---

## Step 5 — Open StarRez

Navigate to StarRez as you normally would. StarWrench loads automatically in the background — no extra steps needed.

You'll know it's working when you see the **StarWrench settings icon** appear in the top navigation bar.

![StarRez interface with the StarWrench settings icon visible in the top bar](_images/05-starrez-loaded.png)

---

## Step 6 — Configure your plugins

Click the StarWrench icon to open the settings panel. From here you can toggle individual features on or off to suit your workflow. Your preferences are saved automatically and persist across sessions.

![StarWrench settings panel showing toggleable plugin list](_images/06-settings-panel.png)

---

## You're all set

StarWrench will keep itself up to date — when a new version is available, Tampermonkey will notify you and can install it automatically.

If anything isn't working, check that:
- Tampermonkey is enabled (the icon should not be greyed out)
- You're on a `vuw.starrezhousing.com` page
- The script is toggled **on** in Tampermonkey's dashboard

Questions or issues? Reach out and we'll sort it out.
