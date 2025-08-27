# Alpine.js Devtools Browser Extension

This document provides a directory-level documentation for the Alpine.js devtools browser extension.

## High-Level Overview

The browser extension is a devtool for debugging Alpine.js applications. It is built with Solid.js and TypeScript, and it is compatible with Chrome's Manifest v3.

The extension has three main parts:

1.  **Devtools Panel:** A UI that is added to the browser's developer tools. It displays the Alpine.js components and their data.
2.  **Content Script:** A script that is injected into the web page. It detects the Alpine.js components and sends them to the devtools panel.
3.  **Background Script:** A service worker that runs in the background. It manages the communication between the content script and the devtools panel.

## File and Directory Structure

Here is a breakdown of the important files and directories in the `packages/browser-extension` directory:

*   **`manifest.json`**: The main configuration file for the extension. It defines the extension's name, version, permissions, and the scripts it uses.

*   **`src/`**: This directory contains the main source code for the extension.

    *   **`src/devtools/`**: This directory contains the source code for the devtools panel. It is built with Solid.js and TypeScript.
        *   **`panel.tsx`**: The entry point for the devtools panel.
        *   **`App.tsx`**: The main application component for the devtools panel.
        *   **`components/`**: Contains the Solid.js components used in the devtools panel.
        *   **`state/`**: Contains the state management logic for the devtools panel.

    *   **`src/lib/`**: This directory contains shared utility functions.

    *   **`src/scripts/`**: This directory contains the background scripts, content scripts, and other scripts that run in the browser.
        *   **`background.ts`**: The service worker that runs in the background.
        *   **`content.ts`**: The content script that is injected into the web page.
        *   **`detector.ts`**: A script that detects the Alpine.js components on the page.

*   **`assets/`**: This directory contains static assets like images, HTML files, and icons.

*   **`cypress/`**: This directory contains the end-to-end tests for the extension.

*   **`package.json`**: This file lists the project's dependencies and scripts.

*   **`README.md`**: This file provides a general overview of the project.

## How the Parts Work Together

1.  The **content script** (`content.ts`) is injected into the web page.
2.  The content script uses the **detector script** (`detector.ts`) to find all the Alpine.js components on the page.
3.  The content script sends the component data to the **background script** (`background.ts`).
4.  The **devtools panel** (`panel.tsx`) communicates with the background script to get the component data.
5.  The devtools panel displays the component data in a user-friendly way.
