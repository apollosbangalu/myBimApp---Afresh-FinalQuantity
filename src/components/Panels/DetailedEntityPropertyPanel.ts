// code for detailed entity property panel

import * as OBC from "@thatopen/components";
import * as BUI from "@thatopen/ui";
import * as CUI from "@thatopen/ui-obc";
import * as WEBIFC from "web-ifc";
import { FragmentIdMap } from "@thatopen/fragments";

export default (components: OBC.Components) => {
  // Define base style for consistent appearance
  const baseStyle: Record<string, string> = {
    padding: "0.25rem",
    borderRadius: "0.25rem",
  };

  // Define custom styles for different entity types
  const tableDefinition: BUI.TableDataTransform = {
    Entity: (entity) => {
      let style = {};
      if (entity === OBC.IfcCategoryMap[WEBIFC.IFCPROPERTYSET]) {
        style = {
          ...baseStyle,
          backgroundColor: "purple",
          color: "white",
        };
      }
      if (String(entity).includes("IFCWALL")) {
        style = {
          ...baseStyle,
          backgroundColor: "green",
          color: "white",
        };
      }
      return BUI.html`<bim-label style=${BUI.styleMap(
        style
      )}>${entity}</bim-label>`;
    },
    PredefinedType: (type) => {
      const colors = ["#1c8d83", "#3c1c8d", "#386c19", "#837c24"];
      const randomIndex = Math.floor(Math.random() * colors.length);
      const backgroundColor = colors[randomIndex];
      const style = { ...baseStyle, backgroundColor, color: "white" };
      return BUI.html`<bim-label style=${BUI.styleMap(
        style
      )}>${type}</bim-label>`;
    },
    NominalValue: (value) => {
      let style = {};
      if (typeof value === "boolean") {
        style = {
          ...baseStyle,
          backgroundColor: value ? "#18882c" : "#b13535",
          color: "white",
        };
      }
      return BUI.html`<bim-label style=${BUI.styleMap(
        style
      )}>${value}</bim-label>`;
    },
  };

  // Create the attributes table
  const [attributesTable, updateAttributesTable] = CUI.tables.entityAttributes({
    components,
    fragmentIdMap: {},
    tableDefinition,
    attributesToInclude: () => {
      const attributes: any[] = [
        "Name",
        "ContainedInStructure",
        "HasProperties",
        "HasPropertySets",
        (name: string) => name.includes("Value"),
        (name: string) => name.startsWith("Material"),
        (name: string) => name.startsWith("Relating"),
        (name: string) => {
          const ignore = ["IsGroupedBy", "IsDecomposedBy"];
          return name.startsWith("Is") && !ignore.includes(name);
        },
      ];
      return attributes;
    },
  });

  // Configure table options
  attributesTable.expanded = true;
  attributesTable.indentationInText = true;
  attributesTable.preserveStructureOnFilter = true;

  // Search input handler
  const onSearchInput = (e: Event) => {
    const input = e.target as BUI.TextInput;
    attributesTable.queryString = input.value;
  };

  // Preserve structure checkbox handler
  const onPreserveStructureChange = (e: Event) => {
    const checkbox = e.target as BUI.Checkbox;
    attributesTable.preserveStructureOnFilter = checkbox.checked;
  };

  // Export to JSON handler
  const onExportJSON = () => {
    attributesTable.downloadData("entities-attributes");
  };

  // Copy to TSV handler
  const onCopyTSV = async () => {
    await navigator.clipboard.writeText(attributesTable.tsv);
    alert(
      "Table data copied as TSV in clipboard! Try to paste it in a spreadsheet app."
    );
  };

  // Attribute selection handler
  const onAttributesChange = (e: Event) => {
    const dropdown = e.target as BUI.Dropdown;
    updateAttributesTable({
      attributesToInclude: () => {
        const attributes: any[] = [
          ...dropdown.value,
          (name: string) => name.includes("Value"),
          (name: string) => name.startsWith("Material"),
          (name: string) => name.startsWith("Relating"),
          (name: string) => {
            const ignore = ["IsGroupedBy", "IsDecomposedBy"];
            return name.startsWith("Is") && !ignore.includes(name);
          },
        ];
        return attributes;
      },
    });
  };

  // Create the panel component
  const panelComponent = BUI.Component.create(() => {
    return BUI.html`
      <bim-panel>
        <bim-panel-section label="Entity Attributes" fixed>
          <div style="display: flex; gap: 0.5rem; justify-content: space-between;">
            <div style="display: flex; gap: 0.5rem;">
              <bim-text-input @input=${onSearchInput} type="search" placeholder="Search" debounce="250" tooltip-title="Search Attributes" tooltip-text="Filter attributes based on your input"></bim-text-input>
              <bim-checkbox @change=${onPreserveStructureChange} label="Preserve Structure" inverted checked tooltip-title="Preserve Structure" tooltip-text="Maintain attribute hierarchy when filtering"></bim-checkbox>
            </div>
            <div style="display: flex; gap: 0.5rem;">
              <bim-dropdown @change=${onAttributesChange} multiple tooltip-title="Select Attributes" tooltip-text="Choose which attributes to display">
                <bim-option label="Name" checked></bim-option> 
                <bim-option label="ContainedInStructure" checked></bim-option>
                <bim-option label="ForLayerSet"></bim-option>
                <bim-option label="LayerThickness"></bim-option>
                <bim-option label="HasProperties" checked></bim-option>
                <bim-option label="HasAssociations"></bim-option>
                <bim-option label="HasAssignments"></bim-option>
                <bim-option label="HasPropertySets" checked></bim-option>
                <bim-option label="PredefinedType"></bim-option>
                <bim-option label="Quantities"></bim-option>
                <bim-option label="ReferencedSource"></bim-option>
                <bim-option label="Identification"></bim-option>
                <bim-option label="Prefix"></bim-option>
                <bim-option label="LongName"></bim-option>
              </bim-dropdown>
              <bim-button @click=${onCopyTSV} icon="solar:copy-bold" tooltip-title="Copy TSV" tooltip-text="Copy the table contents as tab-separated values for spreadsheet use"></bim-button>
              <bim-button @click=${onExportJSON} icon="ph:export-fill" tooltip-title="Export JSON" tooltip-text="Download the table contents as a JSON file"></bim-button>
            </div>
          </div>
          ${attributesTable}
        </bim-panel-section>
      </bim-panel>
    `;
  });

  // Return both the panel component and the update function
  return {
    panel: panelComponent,
    updatePanel: (args: { fragmentIdMap: FragmentIdMap }) =>
      updateAttributesTable(args),
  };
};
