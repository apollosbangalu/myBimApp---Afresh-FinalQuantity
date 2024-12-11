import * as OBC from "@thatopen/components";
import * as BUI from "@thatopen/ui";
import * as CUI from "@thatopen/ui-obc";
import * as FRAGS from "@thatopen/fragments";
import JSZip from "jszip";
import { BCFTopics } from "../../BCF";

// Function to prompt user for file selection
const askForFile = (extension: string): Promise<File | null> => {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = extension;
    input.multiple = false;
    input.onchange = () => {
      const filesList = input.files;
      if (!(filesList && filesList[0])) {
        resolve(null);
        return;
      }
      const file = filesList[0];
      resolve(file);
    };
    input.click();
  });
};

export default (components: OBC.Components) => {
  const fragments = components.get(OBC.FragmentsManager);
  const indexer = components.get(OBC.IfcRelationsIndexer);
  const ifcLoader = components.get(OBC.IfcLoader);
  const bcfTopics = components.get(BCFTopics);

  // Load IFC function
  const loadIfc = async () => {
    const file = await askForFile(".ifc");
    if (!file) return;

    const buffer = await file.arrayBuffer();
    await ifcLoader.load(new Uint8Array(buffer));
    // The model is added to the scene in the FragmentsManager's onFragmentsLoaded event
  };

  // Load fragments function
  const loadFragments = async () => {
    const fragmentsZip = await askForFile(".zip");
    if (!fragmentsZip) return;
    const zipBuffer = await fragmentsZip.arrayBuffer();
    const zip = new JSZip();
    await zip.loadAsync(zipBuffer);
    const geometryBuffer = zip.file("geometry.frag");
    if (!geometryBuffer) {
      alert("No geometry found in the file!");
      return;
    }

    const geometry = await geometryBuffer.async("uint8array");

    let properties: FRAGS.IfcProperties | undefined;
    const propsFile = zip.file("properties.json");
    if (propsFile) {
      const json = await propsFile.async("string");
      properties = JSON.parse(json);
    }

    let relationsMap: OBC.RelationsMap | undefined;
    const relationsMapFile = zip.file("relations-map.json");
    if (relationsMapFile) {
      const json = await relationsMapFile.async("string");
      relationsMap = indexer.getRelationsMapFromJSON(json);
    }

    fragments.load(geometry, { properties, relationsMap });
  };

  // Load BCF function
  const loadBCF = async () => {
    const file = await askForFile(".bcf");
    if (!file) return;

    const buffer = await file.arrayBuffer();
    const worlds = components.get(OBC.Worlds);
    const worldKeys = Array.from(worlds.list.keys());
    if (worldKeys.length === 0) {
      console.error("No worlds found");
      return;
    }
    const world = worlds.list.get(worldKeys[0]); // Get the first available world
    if (!world) {
      console.error("World not found");
      return;
    }
    const { topics, viewpoints } = await bcfTopics.load(
      new Uint8Array(buffer),
      world
    );

    console.log(
      `Loaded ${topics.length} topics and ${viewpoints.length} viewpoints.`
    );
    // TODO: Update UI to reflect newly loaded BCF data
  };

  // Create IFC load button
  const [loadBtn] = CUI.buttons.loadIfc({ components });
  loadBtn.label = "IFC";
  loadBtn.tooltipTitle = "Load IFC";
  loadBtn.tooltipText =
    "Loads an IFC file into the scene. The IFC gets automatically converted to Fragments.";
  loadBtn.onclick = loadIfc;

  // Create UI component
  return BUI.Component.create<BUI.PanelSection>(() => {
    return BUI.html`
      <bim-toolbar-section label="Import" icon="solar:import-bold">
        ${loadBtn}
        <bim-button @click=${loadFragments} label="Fragments" icon="fluent:puzzle-cube-piece-20-filled" 
          tooltip-title="Load Fragments"
          tooltip-text="Loads a pre-converted IFC from a Fragments file. Use this option if you want to avoid the conversion from IFC to Fragments.">
        </bim-button>
        <bim-button @click=${loadBCF} label="BCF" icon="mdi:comment-text-outline" 
          tooltip-title="Load BCF"
          tooltip-text="Loads a BCF (Building Collaboration Format) file, importing topics and viewpoints.">
        </bim-button>
      </bim-toolbar-section>
    `;
  });
};
