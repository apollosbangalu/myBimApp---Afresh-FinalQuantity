// File: src/components/Panels/BCFPanel.ts

import * as BUI from "@thatopen/ui";
import * as OBC from "@thatopen/components";
import { BCFTopics, Topic } from "../BCF";
import { BCFDialog } from "../BCF/BCFDialog";
import { BCFTopicTable } from "../BCF/BCFTopicTable";

export function createBCFPanel(components: OBC.Components) {
  const bcfTopics = components.get(BCFTopics);
  const bcfDialog = new BCFDialog(components);
  const bcfTopicTable = new BCFTopicTable(components);

  // State to track visibility of topic list panel
  let isTopicListVisible = false;

  // Function to create a new topic
  function createNewTopic() {
    console.log("createNewTopic called");
    bcfDialog.show();
  }

  // Function to edit an existing topic
  function editTopic(topic: Topic) {
    console.log("editTopic called", topic);
    bcfDialog.show(topic);
  }

  // Function to toggle topic list visibility
  function toggleTopicList(visible: boolean) {
    console.log("toggleTopicList called", visible);
    isTopicListVisible = visible;
    bcfTopicTable.toggle(visible);
  }

  // Function to download BCF data
  function downloadBCF() {
    console.log("downloadBCF called");
    bcfTopics.export().then((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "bcf_export.bcf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }

  // Event listener for editing a topic
  document.addEventListener("bcfEditTopic", ((e: CustomEvent) => {
    console.log("bcfEditTopic event received", e.detail);
    editTopic(e.detail.topic);
  }) as EventListener);

  // Event listener for when a topic is saved
  document.addEventListener("bcfTopicSaved", ((e: CustomEvent) => {
    console.log("bcfTopicSaved event received", e.detail);
    bcfTopicTable.update();
  }) as EventListener);

  // Create and return the BCF panel component
  return BUI.Component.create(() => {
    console.log("Rendering BCF Panel");
    return BUI.html`
      <bim-panel>
        <style>
          .bcf-controls {
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin-bottom: 16px;
          }
          .bcf-controls-row {
            display: flex;
            gap: 8px;
          }
          .bcf-controls bim-button,
          .bcf-controls bim-checkbox {
            flex: 0 0 auto;
          }
        </style>
        <div class="bcf-controls">
          <div class="bcf-controls-row">
            <bim-checkbox
              label="Show Topic List"
              .checked=${isTopicListVisible}
              @change=${(e: Event) =>
                toggleTopicList((e.target as HTMLInputElement).checked)}
              tooltip-title="Toggle Topic List"
              tooltip-text="Show or hide the list of BCF topics">
            </bim-checkbox>
          </div>
          <div class="bcf-controls-row">
            <bim-button 
              label="New Topic" 
              @click=${createNewTopic}
              tooltip-title="Create New Topic"
              tooltip-text="Click to create a new BCF topic">
            </bim-button>
            <bim-button 
              label="Download BCF" 
              @click=${downloadBCF}
              tooltip-title="Download BCF"
              tooltip-text="Click to download BCF data">
            </bim-button>
            <bim-button 
              label="Refresh Topics" 
              @click=${() => bcfTopicTable.update()}
              tooltip-title="Refresh Topics"
              tooltip-text="Click to refresh the list of BCF topics">
            </bim-button>
          </div>
        </div>
      </bim-panel>
    `;
  });
}
