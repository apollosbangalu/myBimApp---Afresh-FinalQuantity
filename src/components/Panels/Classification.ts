////////the code below designed for new tabs classification information /////////////

import * as OBC from "@thatopen/components";
import * as BUI from "@thatopen/ui";
import * as CUI from "@thatopen/ui-obc";

export default (components: OBC.Components) => {
  const fragmentsManager = components.get(OBC.FragmentsManager);
  const classifier = components.get(OBC.Classifier);

  // Create classification tree
  const [classificationsTree, updateClassificationsTree] =
    CUI.tables.classificationTree({
      components,
      classifications: [],
    });

  // Set up classification logic
  fragmentsManager.onFragmentsLoaded.add(async (model) => {
    classifier.byEntity(model);
    await classifier.byPredefinedType(model);

    const classifications = [
      { system: "entities", label: "Entities" },
      { system: "predefinedTypes", label: "Predefined Types" },
    ];

    updateClassificationsTree({ classifications });
  });

  return BUI.Component.create<BUI.Panel>(() => {
    return BUI.html`
      <bim-panel>
        <bim-panel-section label="Classifications">
          <bim-text-input 
            placeholder="Search classifications..." 
            @input=${(e: Event) => {
              classificationsTree.queryString = (e.target as HTMLInputElement).value;
            }}
            tooltip-title="Search Classifications"
            tooltip-text="Type to filter classifications"
          ></bim-text-input>
          ${classificationsTree}
        </bim-panel-section>
      </bim-panel>
    `;
  });
};