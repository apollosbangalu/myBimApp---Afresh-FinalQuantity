// the code has font size functionality
// src/components/Panels/Settings.ts

import * as BUI from "@thatopen/ui";
import * as CUI from "@thatopen/ui-obc";
import * as OBC from "@thatopen/components";

export default (components: OBC.Components) => {
  // Get the HTML element for theme manipulation
  const html = document.querySelector("html")!;

  // Function to handle theme changes
  const onThemeChange = (event: Event) => {
    const selector = event.target as BUI.Selector;
    let newTheme: string;

    // Determine the new theme based on the selector value
    if (
      selector.value === undefined ||
      selector.value === null ||
      selector.value === 0
    ) {
      // System theme
      html.classList.remove("bim-ui-dark", "bim-ui-light");
      newTheme = "system";
    } else if (selector.value === 1) {
      // Dark theme
      html.className = "bim-ui-dark";
      newTheme = "dark";
    } else if (selector.value === 2) {
      // Light theme
      html.className = "bim-ui-light";
      newTheme = "light";
    } else {
      // Invalid value, do nothing
      return;
    }

    // Dispatch a custom event for theme change
    const themeChangedEvent = new CustomEvent("themeChanged", {
      detail: { theme: newTheme },
      bubbles: true,
      composed: true,
    });
    document.dispatchEvent(themeChangedEvent);
  };

  // Create a table for world configuration
  const [worldsTable] = CUI.tables.worldsConfiguration({ components });

  // Function to handle world config search
  const onWorldConfigSearch = (e: Event) => {
    const input = e.target as BUI.TextInput;
    worldsTable.queryString = input.value;
  };

  // Function to update global font size
  const updateGlobalFontSize = (size: string) => {
    (window as any).currentFontSize = size;
    // Dispatch a custom event for font size change
    const fontSizeChangedEvent = new CustomEvent("fontSizeChanged", {
      detail: { size: size },
      bubbles: true,
      composed: true,
    });
    document.dispatchEvent(fontSizeChangedEvent);
  };

  // Function to update global line height
  const updateGlobalLineHeight = (height: string) => {
    (window as any).currentLineHeight = height;
    // Dispatch a custom event for line height change
    const lineHeightChangedEvent = new CustomEvent("lineHeightChanged", {
      detail: { height: height },
      bubbles: true,
      composed: true,
    });
    document.dispatchEvent(lineHeightChangedEvent);
  };

  // Return the BUI Component for the settings panel
  return BUI.Component.create<BUI.Panel>(() => {
    return BUI.html`
      <bim-panel>
        <bim-panel-section label="Aspect" icon="mage:box-3d-fill">
          <bim-selector vertical @change=${onThemeChange}>
            <bim-option
              value="0"
              label="System"
              icon="majesticons:laptop"
              .checked=${
                !html.classList.contains("bim-ui-dark") &&
                !html.classList.contains("bim-ui-light")
              }>
            </bim-option>
            <bim-option value="1" label="Dark" icon="solar:moon-bold" .checked=${html.classList.contains(
              "bim-ui-dark"
            )}></bim-option>
            <bim-option value="2" label="Light" icon="solar:sun-bold" .checked=${html.classList.contains(
              "bim-ui-light"
            )}></bim-option>
          </bim-selector>
        </bim-panel-section>
        
        <bim-panel-section label="Description Text" icon="mdi:format-font">
          <bim-dropdown 
            label="Font Size" 
            @change="${(e: Event) =>
              updateGlobalFontSize((e.target as HTMLSelectElement).value)}"
            tooltip-title="Adjust Font Size"
            tooltip-text="Change the size of description text across all tabs">
            <bim-option value="0.8rem" label="Small" ?selected=${
              (window as any).currentFontSize === "0.8rem"
            }></bim-option>
            <bim-option value="0.9rem" label="Medium" ?selected=${
              (window as any).currentFontSize === "0.9rem"
            }></bim-option>
            <bim-option value="1rem" label="Large" ?selected=${
              (window as any).currentFontSize === "1rem"
            }></bim-option>
          </bim-dropdown>
          <bim-dropdown 
            label="Line Height" 
            @change="${(e: Event) =>
              updateGlobalLineHeight((e.target as HTMLSelectElement).value)}"
            tooltip-title="Adjust Line Height"
            tooltip-text="Change the spacing between lines of text across all tabs">
            <bim-option value="1.2" label="Compact" ?selected=${
              (window as any).currentLineHeight === "1.2"
            }></bim-option>
            <bim-option value="1.4" label="Normal" ?selected=${
              (window as any).currentLineHeight === "1.4"
            }></bim-option>
            <bim-option value="1.6" label="Spacious" ?selected=${
              (window as any).currentLineHeight === "1.6"
            }></bim-option>
          </bim-dropdown>
        </bim-panel-section>
        
        <bim-panel-section label="Worlds" icon="tabler:world">
          <div style="display: flex; gap: 0.375rem;">
            <bim-text-input @input=${onWorldConfigSearch} vertical placeholder="Search..." debounce="200"></bim-text-input>
            <bim-button style="flex: 0;" @click=${() =>
              (worldsTable.expanded =
                !worldsTable.expanded)} icon="eva:expand-fill"></bim-button>
          </div>
          ${worldsTable}
        </bim-panel-section>
      </bim-panel> 
    `;
  });
};
