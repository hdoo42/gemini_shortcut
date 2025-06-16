# Gemini Shortcuts

A Chrome extension that adds keyboard shortcuts to Gemini (gemini.google.com) for faster navigation and interaction.

## Features

- **New Chat**: Cmd/Ctrl + J
- **Toggle Sidebar**: Cmd/Ctrl + D
- **Search**: Cmd/Ctrl + K
- **Select Flash Model**: Cmd/Ctrl + I
- **Select Pro Model**: Cmd/Ctrl + O
- **Deep Research**: Cmd/Ctrl + B
- **Show/Hide Help**: Cmd/Ctrl + /

## Installation

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory
5. The extension will be active on gemini.google.com

## Usage

Once installed, the keyboard shortcuts will work automatically when you're on gemini.google.com. Press Cmd/Ctrl + / to see the help panel with all available shortcuts.

## Technical Details

- **Manifest Version**: 3
- **Permissions**: Runs only on gemini.google.com
- **Content Script**: Injects keyboard event listeners and UI interaction logic

## File Structure

- `manifest.json` - Extension configuration
- `content.js` - Main script with keyboard shortcuts and UI interactions
- `images/` - Extension icons (16px, 48px, 128px)

## Development Notes

The extension uses specific CSS selectors to interact with Gemini's UI elements. If shortcuts stop working after Gemini updates, the selectors in `content.js` may need to be updated. Use browser Developer Tools (F12) to inspect and find new selectors.
