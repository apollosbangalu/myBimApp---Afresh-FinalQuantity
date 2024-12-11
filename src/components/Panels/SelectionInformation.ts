/* eslint-disable prettier/prettier */
// ////////the code below designed for new tabs and entity properties information /////////////

import * as OBC from "@thatopen/components";
import * as OBF from "@thatopen/components-front";
import * as BUI from "@thatopen/ui";
import * as CUI from "@thatopen/ui-obc";

export default (components: OBC.Components) => {
  const highlighter = components.get(OBF.Highlighter);
  const [propsTable, updatePropsTable] = CUI.tables.elementProperties({
    components,
    fragmentIdMap: {},
  });

  propsTable.preserveStructureOnFilter = true;

  // State for detailed panel visibility
  let showDetailedPanel = false;

  highlighter.events.select.onHighlight.add((fragmentIdMap) => {
    updatePropsTable({ fragmentIdMap });
    if (showDetailedPanel) {
      // Dispatch event to show detailed panel with current selection
      const event = new CustomEvent("toggleDetailedPanel", {
        detail: { visible: true, fragmentIdMap },
        bubbles: true,
        composed: true,
      });
      document.dispatchEvent(event);
    }
  });

  highlighter.events.select.onClear.add(() => {
    updatePropsTable({ fragmentIdMap: {} });
    // Hide detailed panel when selection is cleared
    const event = new CustomEvent("toggleDetailedPanel", {
      detail: { visible: false, fragmentIdMap: {} },
      bubbles: true,
      composed: true,
    });
    document.dispatchEvent(event);
  });

  const search = (e: Event) => {
    const input = e.target as BUI.TextInput;
    propsTable.queryString = input.value;
  };

  const toggleExpanded = () => {
    propsTable.expanded = !propsTable.expanded;
  };

  const toggleDetailedPanel = (e: Event) => {
    showDetailedPanel = (e.target as HTMLInputElement).checked;
    const event = new CustomEvent("toggleDetailedPanel", {
      detail: {
        visible: showDetailedPanel,
        fragmentIdMap: highlighter.selection.select,
      },
      bubbles: true,
      composed: true,
    });
    document.dispatchEvent(event);
  };

  return BUI.Component.create<BUI.Panel>(() => {
    return BUI.html`
      <bim-panel>
        <bim-panel-section name="selection" label="Selection Information" icon="solar:document-bold" fixed>
          <bim-checkbox
            label="Show Detailed Entity Properties"
            @change=${toggleDetailedPanel}
            tooltip-title="Detailed Properties"
            tooltip-text="Show or hide the detailed entity properties panel at the bottom of the 3D window"
          ></bim-checkbox>
          <div style="display: flex; gap: 0.375rem; margin-top: 0.5rem;">
            <bim-text-input @input=${search} vertical placeholder="Search..." debounce="200" tooltip-title="Search Properties" tooltip-text="Filter properties based on your input"></bim-text-input>
            <bim-button style="flex: 0;" @click=${toggleExpanded} icon="eva:expand-fill" tooltip-title="Expand/Collapse" tooltip-text="Expand or collapse all property sections"></bim-button>
            <bim-button style="flex: 0;" @click=${() => propsTable.downloadData("ElementData", "tsv")} icon="ph:export-fill" tooltip-title="Export Data" tooltip-text="Export the shown properties to TSV format"></bim-button>
          </div>
          ${propsTable}
        </bim-panel-section>
      </bim-panel>
    `;
  });
};
