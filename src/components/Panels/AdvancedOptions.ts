////////the code below designed for new tabs /////////////

import * as OBC from "@thatopen/components";
import * as BUI from "@thatopen/ui";
import * as WEBIFC from "web-ifc";

export default (components: OBC.Components) => {
  const ifcLoader = components.get(OBC.IfcLoader);

  // State for IFC import settings
  let coordinateToOrigin = false;
  const excludedCategories = new Set<number>();

  // Function to update IFC loader settings
  const updateIfcLoaderSettings = () => {
    ifcLoader.settings.webIfc.COORDINATE_TO_ORIGIN = coordinateToOrigin;
    ifcLoader.settings.excludedCategories = excludedCategories;
  };

  // Create UI for IFC import settings
  const advancedOptionsPanel = BUI.Component.create<BUI.Panel>(() => {
    return BUI.html`
      <bim-panel>
        <bim-panel-section label="IFC Import Settings" icon="mdi:settings">
          <bim-checkbox
            label="Coordinate to Origin"
            .checked=${coordinateToOrigin}
            @change=${(e: Event) => {
              coordinateToOrigin = (e.target as HTMLInputElement).checked;
              updateIfcLoaderSettings();
            }}
            tooltip-title="Coordinate to Origin"
            tooltip-text="If checked, the model will be centered at the origin"
          ></bim-checkbox>
          
          <bim-dropdown label="Excluded Categories" multiple>
            ${Object.entries(WEBIFC)
              .filter(([key]) => key.startsWith("IFC"))
              .map(
                ([key, value]) => BUI.html`
                  <bim-option
                    value=${value}
                    label=${key}
                    @change=${(e: Event) => {
                      if ((e.target as HTMLInputElement).checked) {
                        excludedCategories.add(value as number);
                      } else {
                        excludedCategories.delete(value as number);
                      }
                      updateIfcLoaderSettings();
                    }}
                  ></bim-option>
                `
              )}
          </bim-dropdown>
        </bim-panel-section>
      </bim-panel>
    `;
  });

  return advancedOptionsPanel;
};