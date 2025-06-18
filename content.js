// content.js
// Updated with more specific selectors, model selection logic, and help message.
// Gemini site's UI element selectors can change. If a shortcut stops working,
// use browser Developer Tools (F12 or Ctrl+Shift+I) to find the new selector.

console.log("Gemini Shortcut Extension Loaded (v1.0.1)");

// Helper function to click an element (can be selector string or actual element)
function clickElement(target, description) {
  const element =
    typeof target === "string" ? document.querySelector(target) : target;

  if (element) {
    const styles = window.getComputedStyle(element);
    if (
      styles.display === "none" ||
      styles.visibility === "hidden" ||
      styles.opacity === "0" ||
      element.disabled ||
      element.getAttribute("aria-disabled") === "true"
    ) {
      console.warn(
        `${description} (${typeof target === "string" ? target : "DIRECT_ELEMENT"}) is found but currently not visible or interactable. This might be expected if its parent menu is closed.`,
      );
      return false;
    }
    element.click();
    console.log(
      `${description} clicked (Target: ${typeof target === "string" ? target : "DIRECT_ELEMENT"}).`,
    );
    return true;
  } else {
    console.error(
      `Could not find ${description}. (Target: ${typeof target === "string" ? target : "DIRECT_ELEMENT"})`,
    );
    if (typeof target === "string") {
      showTemporaryMessage(`Could not find the ${description} element.`);
    }
    return false;
  }
}

// Helper function to focus an element
function focusElement(selector, description) {
  const element = document.querySelector(selector);
  if (element) {
    element.focus();
    console.log(`${description} focused:`, selector);
    return true;
  } else {
    console.error(`Could not find ${description}. Selector: ${selector}`);
    showTemporaryMessage(`Could not find the ${description} element.`);
    return false;
  }
}

// Helper function to open a menu and click a specific item within it
async function openMenuAndClickItem(
  menuTriggerSelectors,
  menuItemDescription,
  menuItemTextToFind,
  specificMenuItemClass = "button.mat-mdc-menu-item.bard-mode-list-button", // User's original specific class for model items
  overlayContainerSelector = "div.cdk-overlay-container", // As requested, look within this container
) {
  console.log("HERE");
  let menuTriggerButton = null;
  for (const selector of menuTriggerSelectors) {
    menuTriggerButton = document.querySelector(selector);
    console.log("selected button: ", menuTriggerButton);
    if (menuTriggerButton) {
      console.log(`Menu trigger found with selector: ${selector}`);
      break;
    }
  }

  if (!menuTriggerButton) {
    console.error(
      `Menu trigger button not found (tried: ${menuTriggerSelectors.join(", ")}) for ${menuItemDescription}.`,
    );
    showTemporaryMessage(`Could not find the button to open the model menu.`);
    return false;
  }

  const attemptClickItem = () => {
    const overlay = document.querySelector(overlayContainerSelector);
    let itemsContainer = document; // Default to document if overlay/panel not found

    if (overlay) {
      // Try to narrow down to the menu panel within the overlay
      // Common selectors for Angular Material menu panels
      const menuPanel = overlay.querySelector(
        'div[role="menu"], mat-menu, div.mat-mdc-menu-panel',
      );
      if (menuPanel) {
        itemsContainer = menuPanel;
        console.log(
          `Searching for menu items within detected panel in ${overlayContainerSelector}.`,
        );
      } else {
        itemsContainer = overlay; // Search within the whole overlay if specific panel not found
        console.warn(
          `Specific menu panel not distinct in ${overlayContainerSelector}, searching within the whole overlay container.`,
        );
      }
    } else {
      console.warn(
        `${overlayContainerSelector} not found. Searching for menu items globally (fallback).`,
      );
    }

    const menuItems = itemsContainer.querySelectorAll(specificMenuItemClass);
    console.log(
      `Searching for "${menuItemTextToFind}" among ${menuItems.length} items (class: ${specificMenuItemClass}, scope: ${itemsContainer === document ? "document" : "overlay/panel approx."}).`,
    );

    for (const item of menuItems) {
      // User's selector for the model name text within the menu item
      const textElement = item.querySelector("span.gds-label-m, span.gds-label-l");
      if (
        textElement &&
        textElement.textContent.trim().includes(menuItemTextToFind)
      ) {
        console.log(
          `Found matching menu item: "${textElement.textContent.trim()}" for "${menuItemTextToFind}".`,
        );
        // clickElement will check for visibility/interactability
        if (
          clickElement(item, `${menuItemDescription} ("${menuItemTextToFind}")`)
        ) {
          showTemporaryMessage(
            `${menuItemDescription} selected: ${menuItemTextToFind}`,
          );
          return true;
        } else {
          // This log helps if clickElement determined it's not clickable
          console.warn(
            `${menuItemDescription} ("${menuItemTextToFind}") found but clickElement indicated it was not clickable at this moment.`,
          );
        }
      }
    }
    return false; // Item not found or not clicked
  };

  // Check if the menu trigger indicates the menu is already open
  const isMenuTriggerExpanded =
    menuTriggerButton.getAttribute("aria-expanded") === "true";
  if (isMenuTriggerExpanded) {
    console.log(
      "Menu trigger already has aria-expanded='true'. Attempting to click item directly.",
    );
    if (attemptClickItem()) {
      return true; // Successfully clicked item in already open menu
    }
    // If item not clicked, menu might be stale or item not yet rendered.
    // Proceed to click trigger to refresh the menu.
    console.log(
      "Item not clicked even though menu seemed open. Proceeding to click trigger to refresh menu state.",
    );
  }

  // If menu is not open, or if it was open but item wasn't clicked, click the trigger.
  const triggerDesc = `Model Menu Trigger (${menuTriggerButton.tagName}${menuTriggerButton.getAttribute("data-test-id") ? `[data-test-id="${menuTriggerButton.getAttribute("data-test-id")}"]` : `.${menuTriggerButton.className.split(" ")[0]}`})`;
  console.log(`Attempting to click ${triggerDesc}.`);
  if (!clickElement(menuTriggerButton, "Model Menu Trigger")) {
    console.error("Failed to click the model menu trigger.");
    showTemporaryMessage("Failed to open the model menu.");
    return false; // Stop if trigger can't be clicked
  }

  // Wait for the menu to open and items to become available, then try to click.
  return new Promise((resolve) => {
    setTimeout(() => {
      // First attempt after opening
      if (attemptClickItem()) {
        resolve(true);
      } else {
        // Try one more time after a slightly longer delay if the first attempt failed
        setTimeout(() => {
          // Second attempt
          if (attemptClickItem()) {
            resolve(true);
          } else {
            console.error(
              `Could not find or click ${menuItemDescription} ("${menuItemTextToFind}") in the menu (after final attempt).`,
            );
            showTemporaryMessage(
              `Could not select ${menuItemDescription} (${menuItemTextToFind}).`,
            );
            resolve(false);
          }
        }, 350); // User's original second delay
      }
    }, 250); // User's original initial delay
  });
}

document.addEventListener("keydown", async function (event) {
  const isModifierKey = event.metaKey || event.ctrlKey;

  if (isModifierKey) {
    let actionTaken = false;
    // Updated model menu trigger selectors based on the new HTML and priority
    const modelMenuTriggerSelectors = [
      // Most specific and likely selectors based on provided HTML
      "bard-mode-switcher button.logo-pill-btn", // The button element itself
      'bard-mode-switcher div[data-test-id="bard-mode-menu-button"]', // The div wrapper that might be the trigger

      // General selectors for the button based on its classes
      "button.gds-mode-switch-button.logo-pill-btn",
      'div[data-test-id="bard-mode-menu-button"]', // This could also be the trigger directly

      // Fallbacks from previous versions or more generic selectors
      "mdc-button.mat-mdc-button-base.gds-mode-switch-button.logo-pill-btn.mdc-button--unelevated.mat-mdc-unelevated-button.mat-unthemed.ng-star-inserted", // Very specific class list, prone to break
      'button[data-test-id="bard-mode-menu-button"]', // If the button itself has this test-id
      "bard-mode-switcher button.gds-mode-switch-button", // More general button inside switcher
      'button[aria-controls^="mat-menu-panel-"]', // Generic for mat-menu triggers
      '[data-testid="model-selector"]', // Generic test ID
      'button[aria-label*="Model"]', // English label
      'button[aria-label*="모델"]', // Korean label
    ];

    switch (event.key.toLowerCase()) {
      case "j": // New Chat
        event.preventDefault();
        console.log("Cmd/Ctrl + J pressed: Attempting new chat");
        const newChatSelector1 =
          'side-nav-action-button[data-test-id="new-chat-button"] button[data-test-id="expanded-button"]';
        const newChatSelector2 = 'button[aria-label="New chat"]';
        const newChatSelector3 = 'button[aria-label="새 채팅"]'; // Keeping Korean as a fallback

        if (document.querySelector(newChatSelector1)) {
          actionTaken = clickElement(newChatSelector1, "New Chat Button");
        } else if (document.querySelector(newChatSelector2)) {
          actionTaken = clickElement(
            newChatSelector2,
            "New Chat Button (fallback)",
          );
        } else {
          actionTaken = clickElement(
            newChatSelector3,
            "New Chat Button (Korean fallback)",
          );
        }
        break;

      case "d": // Sidebar Toggle
        event.preventDefault();
        console.log("Cmd/Ctrl + D pressed: Attempting to toggle sidebar");
        const sidebarSelector1 =
          'button[data-test-id="side-nav-menu-button"][aria-label="Main menu"]';
        const sidebarSelector2 = 'button[data-test-id="side-nav-menu-button"]';
        const sidebarSelector3 =
          'button[aria-label*="sidebar"], button[aria-label*="사이드바"]'; // Keeping Korean as a fallback

        if (document.querySelector(sidebarSelector1)) {
          actionTaken = clickElement(
            sidebarSelector1,
            "Sidebar Toggle Button (Main menu)",
          );
        } else if (document.querySelector(sidebarSelector2)) {
          actionTaken = clickElement(
            sidebarSelector2,
            "Sidebar Toggle Button (data-test-id)",
          );
        } else {
          actionTaken = clickElement(
            sidebarSelector3,
            "Sidebar Toggle Button (previous fallback)",
          );
        }
        break;

      case "k": // Search
        event.preventDefault();
        console.log("Cmd/Ctrl + K pressed: Attempting search");
        actionTaken = clickElement(
          'button.search-button[aria-label="Search"], button.search-button[aria-label="검색"]',
          "Search Button",
        );
        if (!actionTaken) {
          actionTaken = focusElement(
            'input[placeholder*="Search"], input[placeholder*="검색"], input[aria-label*="Search"], input[aria-label*="검색"]',
            "Search Input",
          );
        }
        break;

      case "i": // Select Flash Model
        event.preventDefault();
        console.log("Cmd/Ctrl + I pressed: Attempting to select Flash model");
        actionTaken = await openMenuAndClickItem(
          modelMenuTriggerSelectors,
          "Flash Model",
          "2.5 Flash", // Ensure this text exactly matches the menu item
        );
        break;

      case "o": // Select Pro Model
        event.preventDefault();
        console.log("Cmd/Ctrl + O pressed: Attempting to select Pro model");
        actionTaken = await openMenuAndClickItem(
          modelMenuTriggerSelectors,
          "Pro Model",
          "2.5 Pro", // Ensure this text exactly matches the menu item
        );
        break;

      case "b": // Deep Research
        event.preventDefault();
        console.log("Cmd/Ctrl + B pressed: Attempting Deep Research");
        const deepResearchButtons = document.querySelectorAll(
          "button.toolbox-drawer-item-button",
        );
        let targetDeepResearchButton = null;
        for (const btn of deepResearchButtons) {
          const labelDiv = btn.querySelector("div.toolbox-drawer-button-label");
          if (
            labelDiv &&
            labelDiv.textContent.trim().toLowerCase() === "deep research"
          ) {
            targetDeepResearchButton = btn;
            break;
          }
        }
        if (targetDeepResearchButton) {
          actionTaken = clickElement(
            targetDeepResearchButton,
            "Deep Research Button",
          );
        } else {
          actionTaken = clickElement(
            'button.toolbox-drawer-item-button:has(mat-icon[fonticon="travel_explore"])',
            "Deep Research Button (icon fallback)",
          );
          if (!actionTaken) {
            console.error("Could not find the Deep Research button.");
            showTemporaryMessage("Could not find the Deep Research button.");
          }
        }
        break;

      case "/": // Show help message
        event.preventDefault();
        console.log("Cmd/Ctrl + / pressed: Showing help");
        showHelpMessage();
        actionTaken = true;
        break;
    }
  }
});

function showTemporaryMessage(message, duration = 3000) {
  const existingMessage = document.getElementById("gemini-shortcut-message");
  if (existingMessage) {
    existingMessage.remove();
  }

  const messageDiv = document.createElement("div");
  messageDiv.id = "gemini-shortcut-message";
  messageDiv.textContent = message;
  messageDiv.style.position = "fixed";
  messageDiv.style.bottom = "20px";
  messageDiv.style.left = "50%";
  messageDiv.style.transform = "translateX(-50%)";
  messageDiv.style.padding = "10px 20px";
  messageDiv.style.backgroundColor = "rgba(0,0,0,0.85)";
  messageDiv.style.color = "white";
  messageDiv.style.borderRadius = "8px";
  messageDiv.style.zIndex = "10001";
  messageDiv.style.fontSize = "14px";
  messageDiv.style.boxShadow = "0 4px 12px rgba(0,0,0,0.25)";
  messageDiv.style.textAlign = "center";
  messageDiv.style.fontFamily = "Roboto, Arial, sans-serif";
  document.body.appendChild(messageDiv);

  setTimeout(() => {
    if (document.body.contains(messageDiv)) {
      document.body.removeChild(messageDiv);
    }
  }, duration);
}

// New function to display a formatted help message
function showHelpMessage(duration = 7000) {
  // Longer duration for reading
  const messageId = "gemini-shortcut-help-message";
  const existingMessage = document.getElementById(messageId);

  // If help is already shown, the keypress will hide it (toggle).
  if (existingMessage) {
    existingMessage.remove();
    return;
  }

  const messageDiv = document.createElement("div");
  messageDiv.id = messageId;

  const title = "Gemini Shortcuts";
  const shortcuts = {
    "New Chat": "Cmd/Ctrl + J",
    "Toggle Sidebar": "Cmd/Ctrl + D",
    Search: "Cmd/Ctrl + K",
    "Select Flash Model": "Cmd/Ctrl + I",
    "Select Pro Model": "Cmd/Ctrl + O",
    "Deep Research": "Cmd/Ctrl + B",
    "Show/Hide Help": "Cmd/Ctrl + /",
  };

  let content = `<div style="margin-bottom: 8px; font-weight: bold; font-size: 15px; border-bottom: 1px solid #555; padding-bottom: 5px;">${title}</div>`;
  content +=
    '<ul style="margin: 0; padding: 0; list-style: none; text-align: left;">';
  for (const action in shortcuts) {
    content += `<li style="margin-bottom: 6px; display: flex; justify-content: space-between; align-items: center;">
                    <span>${action}</span>
                    <code style="background-color: #333; padding: 2px 6px; border-radius: 4px; margin-left: 15px;">${shortcuts[action]}</code>
                  </li>`;
  }
  content += "</ul>";

  messageDiv.innerHTML = content;

  // Style the help panel
  messageDiv.style.position = "fixed";
  messageDiv.style.bottom = "20px";
  messageDiv.style.right = "20px";
  messageDiv.style.padding = "12px 18px";
  messageDiv.style.backgroundColor = "rgba(20, 20, 20, 0.95)";
  messageDiv.style.color = "white";
  messageDiv.style.borderRadius = "10px";
  messageDiv.style.zIndex = "10002"; // Higher than other messages
  messageDiv.style.fontSize = "14px";
  messageDiv.style.boxShadow = "0 5px 15px rgba(0,0,0,0.3)";
  messageDiv.style.fontFamily = "Roboto, Arial, sans-serif";
  messageDiv.style.minWidth = "300px";

  document.body.appendChild(messageDiv);

  // Auto-hide after the specified duration
  setTimeout(() => {
    if (document.body.contains(messageDiv)) {
      document.body.removeChild(messageDiv);
    }
  }, duration);
}
