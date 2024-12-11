/* eslint-disable prettier/prettier */
// src/components/Panels/QuantitiesPanel.ts

// import * as BUI from "@thatopen/ui";
import * as OBC from "@thatopen/components";
import * as OBCF from "@thatopen/components-front";
import * as FRAGS from "@thatopen/fragments";
import { QuantitiesCalculator } from "../QuantitiesCalculator";

// Export interface for quantity data
export interface QuantityData {
  guid: string;
  type: string | number;
  name: string;
  material: string;
  volume: number | null;
  area: number | null;
  thickness: number | null;
}

// Interface for theme state management
interface ThemeState {
  isDark: boolean;
  textColor: string;
  backgroundColor: string;
  borderColor: string;
  headerColor: string;
}

// Global state management
let isTableInitialized = false;
let confirmationDialog: HTMLElement | null = null;
let currentThemeState: ThemeState;
let quantitiesCalculator: QuantitiesCalculator;
let components: OBC.Components;

// Utility function to get theme colors based on dark/light mode
const getThemeColors = (isDark: boolean): ThemeState => ({
  isDark,
  textColor: isDark ? "#ffffff" : "#000000",
  backgroundColor: isDark ? "#1a1a1a" : "#ffffff",
  borderColor: isDark ? "#333333" : "#e0e0e0",
  headerColor: isDark ? "#2a2a2a" : "#f0f0f0",
});

// Utility function to format quantity values
const formatQuantity = (value: number | null): string => {
  return value !== null ? value.toFixed(2) : "N/A";
};

// Base function for logging with timestamps
const logWithTimestamp = (
  message: string,
  level: "log" | "warn" | "error" = "log"
): void => {
  const timestamp = new Date().toISOString();
  const formattedMessage = `[Quantities Panel ${timestamp}] ${message}`;
  console[level](formattedMessage);
};

/**
 * Shows a confirmation dialog with custom message
 * @param message The message to display in the dialog
 * @returns Promise resolving to true if confirmed, false if canceled
 */
const showConfirmDialog = (message: string): Promise<boolean> => {
  return new Promise((resolve) => {
    if (!confirmationDialog) {
      confirmationDialog = document.createElement("div");
      confirmationDialog.className = "confirmation-dialog-container";
    }

    confirmationDialog.innerHTML = `
      <div class="confirmation-dialog">
        <p id="dialog-message">${message}</p>
        <div class="dialog-buttons">
          <button class="dialog-btn confirm-btn" 
            title="Confirm the action">Delete</button>
          <button class="dialog-btn cancel-btn" 
            title="Cancel the action">Cancel</button>
        </div>
      </div>
    `;

    const handleConfirm = (e: Event): void => {
      e.stopPropagation();
      confirmationDialog!.style.display = "none";
      logWithTimestamp("Dialog confirmed");
      resolve(true);
    };

    const handleCancel = (e: Event): void => {
      e.stopPropagation();
      confirmationDialog!.style.display = "none";
      logWithTimestamp("Dialog canceled");
      resolve(false);
    };

    const confirmBtn = confirmationDialog.querySelector(".confirm-btn");
    const cancelBtn = confirmationDialog.querySelector(".cancel-btn");

    // Add event listeners with cleanup
    confirmBtn?.addEventListener("click", handleConfirm, { once: true });
    cancelBtn?.addEventListener("click", handleCancel, { once: true });

    // Handle clicking outside the dialog
    confirmationDialog.onclick = (e: MouseEvent) => {
      if (e.target === confirmationDialog) {
        handleCancel(e);
      }
    };

    document.body.appendChild(confirmationDialog);
    confirmationDialog.style.display = "flex";
    logWithTimestamp("Confirmation dialog displayed");
  });
};

/**
 * Updates table styles based on current theme
 * @param isDarkTheme Boolean indicating if dark theme is active
 */
const updateTableStyles = (isDarkTheme: boolean): void => {
  const themeColors = getThemeColors(isDarkTheme);
  currentThemeState = themeColors;

  const tableContainer = document.getElementById("quantities-table-container");
  if (!tableContainer) {
    logWithTimestamp("Table container not found", "warn");
    return;
  }

  // Update container styles
  Object.assign(tableContainer.style, {
    backgroundColor: themeColors.backgroundColor,
    borderColor: themeColors.borderColor,
  });

  // Update table styles
  const table = tableContainer.querySelector("table");
  if (table instanceof HTMLTableElement) {
    Object.assign(table.style, {
      color: themeColors.textColor,
      backgroundColor: themeColors.backgroundColor,
    });

    // Update headers with theme colors
    table.querySelectorAll("th").forEach((header) => {
      Object.assign(header.style, {
        backgroundColor: themeColors.headerColor,
        color: themeColors.textColor,
        borderColor: themeColors.borderColor,
      });
    });

    // Update cells with theme colors
    table.querySelectorAll("td").forEach((cell) => {
      Object.assign(cell.style, {
        borderColor: themeColors.borderColor,
        color: themeColors.textColor,
      });
    });
  }

  // Update table header
  const tableHeader = tableContainer.querySelector(".table-header");
  if (tableHeader instanceof HTMLElement) {
    Object.assign(tableHeader.style, {
      color: themeColors.textColor,
      backgroundColor: themeColors.headerColor,
    });
  }

  logWithTimestamp(
    `Table styles updated for ${isDarkTheme ? "dark" : "light"} theme`
  );
};

/**
 * Creates the table header element
 * @returns HTMLElement containing the table header
 */
const createTableHeader = (): HTMLElement => {
  const header = document.createElement("div");
  header.className = "table-header";
  header.innerHTML = `
    <span>Quantities Table</span>
    <button class="close-button" 
      title="Close quantities table" 
      aria-label="Close quantities table">&times;</button>
  `;
  return header;
};

/**
 * Creates the quantities table element with headers
 * @returns HTMLTableElement containing the quantities table structure
 */
const createQuantitiesTable = (): HTMLTableElement => {
  const table = document.createElement("table");
  table.id = "quantities-table";
  table.innerHTML = `
    <thead>
      <tr>
        <th title="Index number" aria-label="Index">#</th>
        <th title="Global Unique Identifier" aria-label="GUID">GUID</th>
        <th title="Element type" aria-label="Type">Type</th>
        <th title="Element name" aria-label="Name">Name</th>
        <th title="Material name" aria-label="Material">Material</th>
        <th title="Volume in cubic meters" aria-label="Volume">Volume (m³)</th>
        <th title="Surface area in square meters" aria-label="Area">Area (m²)</th>
        <th title="Element thickness in meters" aria-label="Thickness">Thickness (m)</th>
        <th title="Available actions" aria-label="Actions">Actions</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;
  return table;
};

/**
 * Updates the quantities table with new data
 * @param quantityData Array of QuantityData to display
 */
const updateQuantitiesTable = async (
  quantityData: QuantityData[]
): Promise<void> => {
  const tableContainer = document.getElementById("quantities-table-container");
  if (!tableContainer) {
    logWithTimestamp("Quantities table container not found", "error");
    return;
  }

  const table = tableContainer.querySelector("table");
  if (!(table instanceof HTMLTableElement)) {
    logWithTimestamp("Quantities table element not found", "error");
    return;
  }

  const tbody = table.querySelector("tbody");
  if (!tbody) {
    logWithTimestamp("Table body not found", "error");
    return;
  }

  tbody.innerHTML = "";
  logWithTimestamp(`Updating table with ${quantityData.length} items`);

  quantityData.forEach((data, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${index + 1}</td>
      <td title="${data.guid}">${data.guid}</td>
      <td title="${data.type}">${data.type}</td>
      <td title="${data.name}">${data.name}</td>
      <td title="${data.material}">${data.material}</td>
      <td title="${data.volume !== null ? `${data.volume} m³` : "Not available"}">${formatQuantity(data.volume)}</td>
      <td title="${data.area !== null ? `${data.area} m²` : "Not available"}">${formatQuantity(data.area)}</td>
      <td title="${data.thickness !== null ? `${data.thickness} m` : "Not available"}">${formatQuantity(data.thickness)}</td>
      <td>
        <button class="table-btn edit-btn" data-guid="${data.guid}" 
          title="Edit quantity data for ${data.name}"
          aria-label="Edit ${data.name}">Edit</button>
        <button class="table-btn delete-btn" data-guid="${data.guid}" 
          title="Delete quantity data for ${data.name}"
          aria-label="Delete ${data.name}">Delete</button>
      </td>
    `;
    tbody.appendChild(row);
  });

  if (currentThemeState) {
    updateTableStyles(currentThemeState.isDark);
  }

  tableContainer.style.display = "block";
  logWithTimestamp("Quantities table updated successfully");
};

/**
 * Makes an element draggable by its header
 * @param container The element to make draggable
 */
const makeDraggable = (container: HTMLElement): void => {
  const header = container.querySelector(".table-header") as HTMLElement;
  if (!header) {
    logWithTimestamp("Draggable header not found", "warn");
    return;
  }

  let isDragging = false;
  let currentX: number;
  let currentY: number;
  let initialX: number;
  let initialY: number;

  const drag = (e: MouseEvent): void => {
    if (!isDragging) return;
    e.preventDefault();

    currentX = e.clientX - initialX;
    currentY = e.clientY - initialY;

    // Ensure the table stays within viewport bounds
    const maxX = window.innerWidth - container.offsetWidth;
    const maxY = window.innerHeight - container.offsetHeight;

    currentX = Math.max(0, Math.min(currentX, maxX));
    currentY = Math.max(0, Math.min(currentY, maxY));

    Object.assign(container.style, {
      left: `${currentX}px`,
      top: `${currentY}px`,
      transform: "none",
    });
  };

  const stopDrag = (): void => {
    isDragging = false;
    document.removeEventListener("mousemove", drag);
    document.removeEventListener("mouseup", stopDrag);
    logWithTimestamp("Drag operation ended");
  };

  const startDrag = (e: MouseEvent): void => {
    if (
      e.target instanceof HTMLElement &&
      e.target.classList.contains("close-button")
    ) {
      return;
    }

    initialX = e.clientX - container.offsetLeft;
    initialY = e.clientY - container.offsetTop;
    isDragging = true;

    document.addEventListener("mousemove", drag);
    document.addEventListener("mouseup", stopDrag);
    logWithTimestamp("Drag operation started");
  };

  header.addEventListener("mousedown", startDrag);
  logWithTimestamp("Draggable behavior initialized");
};

/**
 * Makes an element resizable
 * @param container The element to make resizable
 */
const makeResizable = (container: HTMLElement): void => {
  const resizer = document.createElement("div");
  resizer.className = "resizer";
  resizer.title = "Drag to resize";
  container.appendChild(resizer);

  let isResizing = false;
  let initialX: number;
  let initialY: number;
  let initialWidth: number;
  let initialHeight: number;

  const resize = (e: MouseEvent): void => {
    if (!isResizing) return;

    const width = initialWidth + (e.clientX - initialX);
    const height = initialHeight + (e.clientY - initialY);

    // Enforce minimum and maximum sizes
    const minWidth = 300;
    const minHeight = 200;
    const maxWidth = window.innerWidth - container.offsetLeft;
    const maxHeight = window.innerHeight - container.offsetTop;

    const newWidth = Math.max(minWidth, Math.min(width, maxWidth));
    const newHeight = Math.max(minHeight, Math.min(height, maxHeight));

    Object.assign(container.style, {
      width: `${newWidth}px`,
      height: `${newHeight}px`,
    });
  };

  const stopResize = (): void => {
    isResizing = false;
    document.removeEventListener("mousemove", resize);
    document.removeEventListener("mouseup", stopResize);
    logWithTimestamp("Resize operation ended");
  };

  const startResize = (e: MouseEvent): void => {
    isResizing = true;
    initialX = e.clientX;
    initialY = e.clientY;
    initialWidth = container.offsetWidth;
    initialHeight = container.offsetHeight;

    document.addEventListener("mousemove", resize);
    document.addEventListener("mouseup", stopResize);
    logWithTimestamp("Resize operation started");
  };

  resizer.addEventListener("mousedown", startResize);
  logWithTimestamp("Resizable behavior initialized");
};

/**
 * Creates the floating table container with all components
 * @returns HTMLElement containing the complete floating table
 */
const createFloatingTable = (): HTMLElement => {
  logWithTimestamp("Creating floating table");

  // We should first check if a table already exists
  const existingTable = document.getElementById("quantities-table-container");
  if (existingTable) {
    logWithTimestamp("Existing table found, returning existing instance");
    return existingTable;
  }

  const floatingTable = document.createElement("div");
  floatingTable.id = "quantities-table-container";
  floatingTable.className = "floating-table";
  floatingTable.style.display = "none";

  // Create and add table components
  const header = createTableHeader();
  const table = createQuantitiesTable();

  // Create actions container with export/import buttons
  const actionsContainer = document.createElement("div");
  actionsContainer.className = "table-actions";
  actionsContainer.innerHTML = `
    <bim-button id="export-quantities" label="Export" icon="mdi:export"
      tooltip-title="Export Quantities"
      tooltip-text="Export quantities data to JSON file">
    </bim-button>
    <bim-button id="import-quantities" label="Import" icon="mdi:import"
      tooltip-title="Import Quantities"
      tooltip-text="Import quantities data from JSON file">
    </bim-button>
  `;

  // Assemble the table
  floatingTable.appendChild(header);
  floatingTable.appendChild(table);
  floatingTable.appendChild(actionsContainer);

  document.body.appendChild(floatingTable);

  // Add interactive features
  makeResizable(floatingTable);
  makeDraggable(floatingTable);

  // Initialize with current theme
  const isDarkTheme =
    document.documentElement.classList.contains("bim-ui-dark");
  updateTableStyles(isDarkTheme);

  logWithTimestamp("Floating table created successfully");
  return floatingTable;
};

/**
 * Toggles the quantities table visibility and updates content
 * @param e The event that triggered the toggle
 * @param tableContainer The table container element
 */
const toggleQuantitiesTable = async (
  e: Event,
  tableContainer: HTMLElement
): Promise<void> => {
  const checkbox = e.target as HTMLInputElement;

  if (!tableContainer) {
    logWithTimestamp("Table container not found", "error");
    return;
  }

  if (checkbox.checked) {
    logWithTimestamp("Showing quantities table");
    tableContainer.style.display = "block";

    // Update table with current selection
    const highlighter = components.get(OBCF.Highlighter);
    const currentSelection = highlighter.selection.select;

    if (Object.keys(currentSelection).length > 0) {
      try {
        const quantityData =
          await quantitiesCalculator.calculateQuantities(currentSelection);
        await updateQuantitiesTable(quantityData);
        logWithTimestamp(
          `Updated table with ${Object.keys(currentSelection).length} selected items`
        );
      } catch (error) {
        logWithTimestamp(`Error calculating quantities: ${error}`, "error");
      }
    } else {
      logWithTimestamp("No elements currently selected");
    }

    if (!isTableInitialized) {
      isTableInitialized = true;
      logWithTimestamp("Quantities table initialized for first time");
    }

    const isDarkTheme =
      document.documentElement.classList.contains("bim-ui-dark");
    updateTableStyles(isDarkTheme);
  } else {
    logWithTimestamp("Hiding quantities table");
    tableContainer.style.display = "none";
  }
};

/**
 * Handles quantity data editing
 * @param guid GUID of the element to edit
 */
const editQuantity = async (guid: string): Promise<void> => {
  try {
    const quantity = await quantitiesCalculator.getQuantityByGuid(guid);
    if (!quantity) {
      logWithTimestamp(`No quantity data found for GUID: ${guid}`, "warn");
      return;
    }

    // TODO: Implement edit dialog
    logWithTimestamp(
      `Edit functionality for GUID ${guid} not yet implemented`,
      "warn"
    );
  } catch (error) {
    logWithTimestamp(
      `Error editing quantity for GUID ${guid}: ${error}`,
      "error"
    );
  }
};

/**
 * Handles quantity data deletion
 * @param guid GUID of the element to delete
 */
const deleteQuantity = async (guid: string): Promise<void> => {
  const confirmed = await showConfirmDialog(
    `Are you sure you want to delete the quantity data for element with GUID: ${guid}?`
  );

  if (confirmed) {
    try {
      await quantitiesCalculator.deleteQuantity(guid);
      const quantities = await quantitiesCalculator.getAllQuantities();
      await updateQuantitiesTable(quantities);
      logWithTimestamp(`Quantity data deleted for GUID: ${guid}`);
    } catch (error) {
      logWithTimestamp(
        `Error deleting quantity for GUID ${guid}: ${error}`,
        "error"
      );
    }
  }
};

/**
 * Exports quantity data to JSON file
 */
const exportQuantities = async (): Promise<void> => {
  try {
    const quantityData = await quantitiesCalculator.getAllQuantities();
    const dataStr = JSON.stringify(quantityData, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;

    const link = document.createElement("a");
    const filename = `quantities_export_${new Date().toISOString().split("T")[0]}.json`;

    Object.assign(link, {
      href: dataUri,
      download: filename,
    });

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    logWithTimestamp(`Quantities data exported to ${filename}`);
  } catch (error) {
    logWithTimestamp(`Error exporting quantities: ${error}`, "error");
  }
};

/**
 * Imports quantity data from JSON file
 */
const importQuantities = (): void => {
  const input = document.createElement("input");
  Object.assign(input, {
    type: "file",
    accept: ".json",
    style: "display: none",
  });

  input.onchange = async (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) {
      logWithTimestamp("No file selected for import", "warn");
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const content = event.target?.result as string;
          const importedData = JSON.parse(content) as QuantityData[];

          await quantitiesCalculator.importQuantities(importedData);
          await updateQuantitiesTable(importedData);

          logWithTimestamp(
            `Successfully imported ${importedData.length} quantity records`
          );
        } catch (error) {
          logWithTimestamp(`Error parsing import file: ${error}`, "error");
          await showConfirmDialog(
            "Error importing quantities. Please check the file format and try again."
          );
        }
      };

      reader.readAsText(file);
    } catch (error) {
      logWithTimestamp(`Error reading import file: ${error}`, "error");
    }
  };

  input.click();
};

/**
 * Sets up event listeners for the quantities panel
 * @param panel The main panel element
 * @param floatingTable The floating table element
 */
const setupEventListeners = (
  panel: HTMLElement,
  floatingTable: HTMLElement
): void => {
  // Keep track of event listener state
  const state = {
    initialized: false,
    updateQuantitiesHandler: null as ((event: Event) => Promise<void>) | null,
    themeChangedHandler: null as ((event: Event) => void) | null,
  };

  // Clear existing event listeners if they exist
  if (state.initialized) {
    logWithTimestamp("Removing existing event listeners");
    if (state.updateQuantitiesHandler) {
      document.removeEventListener(
        "updateQuantities",
        state.updateQuantitiesHandler
      );
    }
    if (state.themeChangedHandler) {
      document.removeEventListener("themeChanged", state.themeChangedHandler);
    }
  }

  // Checkbox event listener with cleaned-up behavior
  const checkbox = panel.querySelector("#show-quantities") as HTMLInputElement;
  if (checkbox) {
    checkbox.addEventListener("change", (e) => {
      // If unchecking, just hide the table
      if (!(e.target as HTMLInputElement).checked) {
        logWithTimestamp("Checkbox unchecked, hiding table");
        floatingTable.style.display = "none";
        return;
      }

      // If checking, ensure no duplicate table exists
      const existingTables = document.querySelectorAll(
        "#quantities-table-container"
      );
      existingTables.forEach((table, index) => {
        if (index > 0) {
          table.remove();
          logWithTimestamp("Removed duplicate table instance");
        }
      });

      toggleQuantitiesTable(e, floatingTable);
    });
  }

  // Export/Import button listeners
  const exportBtn = panel.querySelector("#export-quantities");
  const importBtn = panel.querySelector("#import-quantities");

  exportBtn?.addEventListener("click", exportQuantities);
  importBtn?.addEventListener("click", importQuantities);

  // Selection change event listener with proper cleanup
  state.updateQuantitiesHandler = async (event: Event) => {
    const customEvent = event as CustomEvent<{
      selection: FRAGS.FragmentIdMap;
    }>;
    const selection = customEvent.detail.selection;

    if (checkbox?.checked && floatingTable.style.display === "block") {
      try {
        const quantityData =
          await quantitiesCalculator.calculateQuantities(selection);
        await updateQuantitiesTable(quantityData);
        logWithTimestamp("Updated quantities for new selection");
      } catch (error) {
        logWithTimestamp(`Error updating quantities: ${error}`, "error");
      }
    }
  };

  document.addEventListener("updateQuantities", state.updateQuantitiesHandler);

  // Theme change listener with proper cleanup
  state.themeChangedHandler = (e: Event) => {
    const customEvent = e as CustomEvent;
    updateTableStyles(customEvent.detail.theme === "dark");
    logWithTimestamp(`Theme updated to ${customEvent.detail.theme}`);
  };

  document.addEventListener("themeChanged", state.themeChangedHandler);

  // Table button event listeners with improved handling
  floatingTable.addEventListener("click", async (e) => {
    const target = e.target as HTMLElement;

    if (target.classList.contains("close-button")) {
      logWithTimestamp("Close button clicked, hiding table");

      // Simply hide the table instead of removing it
      floatingTable.style.display = "none";
      if (checkbox) checkbox.checked = false;

      // Ensure no ghost tables remain
      const existingTables = document.querySelectorAll(
        "#quantities-table-container"
      );
      if (existingTables.length > 1) {
        existingTables.forEach((table, index) => {
          if (index > 0) table.remove();
        });
        logWithTimestamp("Cleaned up duplicate tables");
      }
      return;
    }

    const guid = target.getAttribute("data-guid");
    if (!guid) return;

    if (target.classList.contains("edit-btn")) {
      logWithTimestamp(`Editing quantity for GUID: ${guid}`);
      await editQuantity(guid);
    } else if (target.classList.contains("delete-btn")) {
      logWithTimestamp(`Deleting quantity for GUID: ${guid}`);
      await deleteQuantity(guid);
    }
  });

  state.initialized = true;
  logWithTimestamp("Event listeners initialized with cleanup handlers");
};

/**
 * Creates the quantities panel
 * @param comps OBC Components instance
 * @returns Promise resolving to the created panel element
 */
export async function createQuantitiesPanel(
  comps: OBC.Components
): Promise<HTMLElement> {
  logWithTimestamp("Initializing quantities panel");

  // Clean up any existing instances
  const existingTable = document.getElementById("quantities-table-container");
  if (existingTable) {
    existingTable.remove();
    logWithTimestamp("Removed existing table");
  }

  components = comps;
  quantitiesCalculator = components.get(QuantitiesCalculator);

  // Create the main panel
  const createPanel = (): HTMLElement => {
    const panel = document.createElement("bim-panel");
    panel.innerHTML = `
      <bim-panel-section label="Quantities" icon="mdi:calculator">
        <div id="quantities-controls" style="display: flex; gap: 10px; margin-bottom: 10px;">
          <bim-checkbox 
            id="show-quantities" 
            label="Show Quantities Table" 
            tooltip-title="Toggle Quantities Table"
            tooltip-text="Show or hide the quantities table for selected elements"
            style="display: inline-block; margin-right: 10px;">
          </bim-checkbox>
          <bim-button 
            id="export-quantities"
            label="Export" 
            icon="mdi:export"
            tooltip-title="Export Quantities"
            tooltip-text="Export quantities data to a JSON file"
            style="margin-right: 10px;">
          </bim-button>
          <bim-button 
            id="import-quantities"
            label="Import" 
            icon="mdi:import"
            tooltip-title="Import Quantities"
            tooltip-text="Import quantities data from a JSON file"
            style="margin-right: 10px;">
          </bim-button>
        </div>
      </bim-panel-section>
    `;

    return panel;
  };

  // Initialize the panel
  try {
    const panel = createPanel();
    const floatingTable = createFloatingTable();

    // Set up event listeners and store cleanup function
    const cleanup = setupEventListeners(panel, floatingTable);

    // Store cleanup function for later use
    (panel as any).__cleanup = cleanup;

    logWithTimestamp("Quantities panel initialized successfully");
    return panel;
  } catch (error) {
    logWithTimestamp(`Error initializing quantities panel: ${error}`, "error");
    throw error;
  }
}

// Export the createQuantitiesPanel function as the default export
export default createQuantitiesPanel;
