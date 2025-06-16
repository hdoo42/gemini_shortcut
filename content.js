// content.js
// Updated with more specific selectors and model selection logic.
// Gemini site's UI element selectors can change. If a shortcut stops working,
// use browser Developer Tools (F12 or Ctrl+Shift+I) to find the new selector.

console.log("Gemini 단축키 확장 프로그램 로드됨 (v7)"); // Version updated

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
      `${description} 클릭됨 (Target: ${typeof target === "string" ? target : "DIRECT_ELEMENT"}).`,
    );
    return true;
  } else {
    console.error(
      `${description}을(를) 찾을 수 없습니다. (Target: ${typeof target === "string" ? target : "DIRECT_ELEMENT"})`,
    );
    if (typeof target === "string") {
      showTemporaryMessage(`${description} 요소를 찾을 수 없습니다.`);
    }
    return false;
  }
}

// Helper function to focus an element
function focusElement(selector, description) {
  const element = document.querySelector(selector);
  if (element) {
    element.focus();
    console.log(`${description} 포커스됨:`, selector);
    return true;
  } else {
    console.error(`${description}을(를) 찾을 수 없습니다. 선택자: ${selector}`);
    showTemporaryMessage(`${description} 요소를 찾을 수 없습니다.`);
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
    showTemporaryMessage(`모델 메뉴를 여는 버튼을 찾지 못했습니다.`);
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
      const textElement = item.querySelector("span.gds-label-l.gds-label-m");
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
            `${menuItemDescription} 선택됨: ${menuItemTextToFind}`,
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
  const triggerDesc = `모델 메뉴 트리거 (${menuTriggerButton.tagName}${menuTriggerButton.getAttribute("data-test-id") ? `[data-test-id="${menuTriggerButton.getAttribute("data-test-id")}"]` : `.${menuTriggerButton.className.split(" ")[0]}`})`;
  console.log(`Attempting to click ${triggerDesc}.`);
  if (!clickElement(menuTriggerButton, "모델 메뉴 트리거")) {
    console.error("모델 메뉴 트리거를 클릭하지 못했습니다.");
    showTemporaryMessage("모델 메뉴를 열지 못했습니다.");
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
              `${menuItemDescription} ("${menuItemTextToFind}")을(를) 메뉴에서 찾거나 클릭할 수 없습니다 (최종 시도 후).`,
            );
            showTemporaryMessage(
              `${menuItemDescription} (${menuItemTextToFind})을(를) 선택할 수 없습니다.`,
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
      case "j": // 새 채팅 (New Chat)
        event.preventDefault();
        console.log("Cmd/Ctrl + J 눌림: 새 채팅 시도");
        actionTaken =
          clickElement(
            'side-nav-action-button[data-test-id="new-chat-button"] button[data-test-id="expanded-button"]',
            "새 채팅 버튼",
          ) ||
          clickElement(
            'button[aria-label="New chat"]',
            "새 채팅 버튼 (대체)",
          ) ||
          clickElement(
            'button[aria-label="새 채팅"]',
            "새 채팅 버튼 (대체 한국어)",
          );
        break;

      case "d": // 사이드바 토글 (Sidebar Toggle)
        event.preventDefault();
        console.log("Cmd/Ctrl + D 눌림: 사이드바 토글 시도");
        actionTaken =
          clickElement(
            'button[data-test-id="side-nav-menu-button"][aria-label="기본 메뉴"]',
            "사이드바 토글 버튼 (기본 메뉴)",
          ) ||
          clickElement(
            'button[data-test-id="side-nav-menu-button"]',
            "사이드바 토글 버튼 (data-test-id)",
          ) ||
          clickElement(
            'button[aria-label*="sidebar"], button[aria-label*="사이드바"]',
            "사이드바 토글 버튼 (이전 대체)",
          );
        break;

      case "k": // 검색 (Search)
        event.preventDefault();
        console.log("Cmd/Ctrl + K 눌림: 검색 시도");
        actionTaken = clickElement(
          'button.search-button[aria-label="검색"]',
          "검색 버튼",
        );
        if (!actionTaken) {
          actionTaken = focusElement(
            'input[placeholder*="Search"], input[placeholder*="검색"], input[aria-label*="Search"], input[aria-label*="검색"]',
            "검색 입력창",
          );
        }
        break;

      case "i": // Flash 모델 선택 (Select Flash Model)
        event.preventDefault();
        console.log("Cmd/Ctrl + I 눌림: Flash 모델 선택 시도");
        actionTaken = await openMenuAndClickItem(
          modelMenuTriggerSelectors,
          "Flash 모델",
          "2.5 Flash", // Ensure this text exactly matches the menu item
        );
        break;

      case "o": // Pro 모델 선택 (Select Pro Model)
        event.preventDefault();
        console.log("Cmd/Ctrl + O 눌림: Pro 모델 선택 시도");
        actionTaken = await openMenuAndClickItem(
          modelMenuTriggerSelectors,
          "Pro 모델",
          "2.5 Pro", // Ensure this text exactly matches the menu item
        );
        break;

      case "b": // Deep Research
        event.preventDefault();
        console.log("Cmd/Ctrl + B 눌림: Deep Research 시도");
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
            "Deep Research 버튼",
          );
        } else {
          actionTaken = clickElement(
            'button.toolbox-drawer-item-button:has(mat-icon[fonticon="travel_explore"])',
            "Deep Research 버튼 (icon fallback)",
          );
          if (!actionTaken) {
            console.error("Deep Research 버튼을 찾을 수 없습니다.");
            showTemporaryMessage("Deep Research 버튼을 찾을 수 없습니다.");
          }
        }
        break;
    }
    // if (actionTaken) { // Optional: Give feedback only if an action was attempted.
    //   // Message is shown by individual functions now.
    // }
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
  messageDiv.style.backgroundColor = "rgba(0,0,0,0.85)"; // Slightly more opaque
  messageDiv.style.color = "white";
  messageDiv.style.borderRadius = "8px";
  messageDiv.style.zIndex = "10001"; // Ensure it's on top
  messageDiv.style.fontSize = "14px";
  messageDiv.style.boxShadow = "0 4px 12px rgba(0,0,0,0.25)"; // Enhanced shadow
  messageDiv.style.textAlign = "center";
  messageDiv.style.fontFamily = "Roboto, Arial, sans-serif"; // Consistent font
  document.body.appendChild(messageDiv);

  setTimeout(() => {
    if (document.body.contains(messageDiv)) {
      document.body.removeChild(messageDiv);
    }
  }, duration);
}
