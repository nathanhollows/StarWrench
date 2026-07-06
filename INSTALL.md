# Installing StarWrench

StarWrench is a userscript — a small program that runs in your browser and enhances the StarRez interface with quality-of-life features. To run it, you'll need a userscript manager extension.

## Step 1 — Install Tampermonkey

Tampermonkey is a userscript manager. It lets you load custom scripts like StarWrench.

| Browser | Link |
|---------|------|
| Chrome | [Chrome Web Store](https://chromewebstore.google.com/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) |
| Firefox | [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/) |
| Edge | [Microsoft Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd) |
| Safari | [App Store](https://apps.apple.com/app/tampermonkey/id1482490089) |

Click **Add to [Browser]** and confirm when prompted.

## Step 2 — Copy the StarWrench script

Open the [StarWrench.js source](https://raw.githubusercontent.com/nathanhollows/StarWrench/refs/heads/main/StarWrench.js) and copy the entire contents — you'll paste this into Tampermonkey in a later step.

## Step 3 — Enable developer mode and allow user scripts

> [!NOTE]
> This step can't be skipped. Browsers disable these settings by default to neuter ad blockers, which also impacts other useful tools like Tampermonkey.

Open your browser's extensions menu and find Tampermonkey.

![Browser extensions menu with Tampermonkey listed](img/1%20extensions%20menu.png)

Turn on **Developer mode**.

![Developer mode toggle switched on](img/2%20developer%20mode.png)

Open Tampermonkey's extension details page.

![Tampermonkey extension details page](img/3%20extension%20details.png)

Turn on **Allow User Scripts**.

![Allow User Scripts toggle switched on](img/4%20enable%20user%20scripts.png)

## Step 4 — Create the script in Tampermonkey

Click the Tampermonkey icon in your toolbar and choose **Create a new script...**.

![Tampermonkey menu with Create a new script option](img/5%20create%20a%20new%20script.png)

Select all the placeholder code in the editor, paste in the StarWrench script you copied in Step 2, then save with **Ctrl+S**.

![Tampermonkey editor with the StarWrench script pasted in](img/6%20paste%20script%20and%20save%20%28ctrl%20s%29.png)

## Step 5 — Open or refresh StarRez

Navigate to StarRez as you normally would, or refresh the page if you already had it open. StarWrench loads automatically in the background — no extra steps needed.

You'll know it's working when you see the **StarWrench settings icon** appear in the top navigation bar.

## You're all set

StarWrench will keep itself up to date — when a new version is available, Tampermonkey will notify you and can install it automatically.

If anything isn't working, check that:
- Tampermonkey is enabled (the icon should not be greyed out)
- You're on a `vuw.starrezhousing.com` page
- The script is toggled **on** in Tampermonkey's dashboard

Questions or issues? Reach out and we'll sort it out.
