/* eslint-disable prettier/prettier */
// src/main.ts

import * as THREE from "three";
import * as OBC from "@thatopen/components";
import * as OBCF from "@thatopen/components-front";
import * as BUI from "@thatopen/ui";
import JSZip from "jszip";
import Stats from "stats.js";
import { FloorPlanManager } from "./components/floorPlanManager";
import projectInformation from "./components/Panels/ProjectInformation";
import selectionInformation from "./components/Panels/SelectionInformation";
import settings from "./components/Panels/Settings";
import load from "./components/Toolbars/Sections/Import";
import help from "./components/Panels/Help";
import camera from "./components/Toolbars/Sections/Camera";
import selection from "./components/Toolbars/Sections/Selection";
import advancedOptions from "./components/Panels/AdvancedOptions";
import classification from "./components/Panels/Classification";
import detailedEntityPropertyPanel from "./components/Panels/DetailedEntityPropertyPanel";
import { AppManager } from "./bim-components";
import { ClippingPlaneManager } from "./components/ClippingPlaneManager";
import { MeasurementManager } from "./components/MeasurementManager";
import { DataVisualizationManager } from "./components/DataVisualizationManager";
import dataVisualizationPanel from "./components/Panels/DataVisualizationPanel";
import { BCFTopics } from "./components/BCF";
import { createBCFPanel } from "./components/Panels/BCFPanel";
import "./styles/bcf.css";
import "./styles/quantities.css";
import { QuantitiesCalculator } from "./components/QuantitiesCalculator";
import { createQuantitiesPanel } from "./components/Panels/QuantitiesPanel";

// Define EventListener if it's not available in your environment
interface EventListener {
  (evt: Event): void;
}

// Global variables for font settings and text color
const currentFontSize = "0.9rem";
const currentLineHeight = "1.4";
let currentTextColor = "black"; // Default text color

// Feature descriptions for each tab
const featureDescriptions = {
  project:
    "View and manage project information. Navigate through the project structure to see details of different elements.",
  selection:
    "Select elements in the 3D view to see their properties and details. Use this tool to isolate and focus on specific parts of your model.",
  classification:
    "Explore and manage the classification of elements in your model. This helps in organizing and understanding the structure of your BIM data.",
  advanced:
    "Access advanced settings and options for fine-tuning your BIM experience.",
  settings:
    "Adjust application settings such as appearance, performance, and behavior to suit your preferences.",
  help: "Find guidance and information about using the BIM application. Explore tutorials and FAQs to enhance your experience.",
  floorPlans:
    "Generate and view 2D floor plans from your 3D model. Navigate between different levels and sections of your building.",
  clippingPlane:
    "How to use: Hold Ctrl and double-click on a surface to create a clipping plane. Adjust its properties in the control panel. Use Delete key to remove the last plane or the 'Delete all' button to clear all planes.",
  measurement: `How to use:
  - Length: Double-click to start and end a length measurement.
  - Edge: Hold Shift and double-click to measure along edges.
  - Volume: Select an element to see its volume in the console.
  - Area: Hold Alt + double-click to start area measurement. Click to add points for the area boundary. Double-click to complete the measurement.
  - Angle: Hold Alt + Shift + double-click for first point, click for vertex point, click for final point to measure angle.
  Enable/disable each measurement type using the checkboxes in the control panel.
  
  Tips:
  - Use snap points for accurate measurements
  - Delete key removes the last measurement
  - 'Delete all' button clears all measurements
  - Area measurements show in square meters (m²)
  - Angles are measured in degrees
  - Multiple measurements can be created for comparison`,
  dataVisualization:
    "Explore visual representations of your BIM data, including element type distributions and other model statistics.",
  bcf: "Manage Building Collaboration Format (BCF) topics. How to use: Click 'New Topic' to create a topic. Edit topics by clicking on them in the list. Use the 'Download' button to save BCF data. To add a comment or viewpoint, select a topic and use the respective buttons in the detail panel. Delete topics or comments using the 'Delete' button next to each item.",
  quantities:
    "View and analyze quantities (volume, area, thickness) of selected building elements. The table is resizable and draggable for your convenience. 'N/A' indicates that the quantity is not applicable or not calculable for the element.",
};

// Debounce function to limit the frequency of updates
function debounce(func: Function, wait: number) {
  let timeout: number | undefined;
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait) as unknown as number;
  };
}

// Main initialization function
async function initializeApp() {
  console.log("Initializing BIM application");

  // Add this declaration at the top of initializeApp for proper typing
  interface QuantitiesEventDetail {
    selection: {
      [fragmentId: string]: Set<number>;
    };
  }

  // Initialize BUI Manager
  BUI.Manager.init();

  // Create main components instance
  const components = new OBC.Components();
  const worlds = components.get(OBC.Worlds);

  // Create and set up the 3D world
  const world = worlds.create<
    OBC.SimpleScene,
    OBC.OrthoPerspectiveCamera,
    OBCF.PostproductionRenderer
  >();
  world.name = "Main";

  world.scene = new OBC.SimpleScene(components);
  world.scene.setup();
  world.scene.three.background = null;

  // Create viewport
  const viewport = BUI.Component.create<BUI.Viewport>(() => {
    return BUI.html`
      <bim-viewport>
        <bim-grid floating></bim-grid>
      </bim-viewport>
    `;
  });

  // Set up renderer and camera
  world.renderer = new OBCF.PostproductionRenderer(components, viewport);
  const { postproduction } = world.renderer;

  world.camera = new OBC.OrthoPerspectiveCamera(components);

  // Set up grid
  const worldGrid = components.get(OBC.Grids).create(world);
  worldGrid.material.uniforms.uColor.value = new THREE.Color(0x424242);
  worldGrid.material.uniforms.uSize1.value = 2;
  worldGrid.material.uniforms.uSize2.value = 8;

  // Handle resizing
  const resizeWorld = () => {
    world.renderer?.resize();
    world.camera.updateAspect();
  };

  viewport.addEventListener("resize", resizeWorld);

  // Initialize components
  components.init();

  // Set up postproduction
  postproduction.enabled = true;
  postproduction.customEffects.excludedMeshes.push(worldGrid.three);
  postproduction.setPasses({ custom: true, ao: true, gamma: true });
  postproduction.customEffects.lineColor = 0x17191c;

  // Set up app manager and viewport grid
  const appManager = components.get(AppManager);
  const viewportGrid = viewport.querySelector<BUI.Grid>("bim-grid[floating]")!;
  appManager.grids.set("viewport", viewportGrid);

  // Initialize DataVisualizationManager
  const dataVisualizationManager =
    DataVisualizationManager.getInstance(components);

  // Set up fragments manager and related components
  const fragments = components.get(OBC.FragmentsManager);
  const indexer = components.get(OBC.IfcRelationsIndexer);
  const classifier = components.get(OBC.Classifier);
  classifier.list.CustomSelections = {};

  // Set up IFC loader
  const ifcLoader = components.get(OBC.IfcLoader);
  await ifcLoader.setup();

  // Set up tiles loader
  const tilesLoader = components.get(OBCF.IfcStreamer);
  tilesLoader.url = "../resources/tiles/";
  tilesLoader.world = world;
  tilesLoader.culler.threshold = 10;
  tilesLoader.culler.maxHiddenTime = 1000;
  tilesLoader.culler.maxLostTime = 40000;

  // Set up highlighter
  const highlighter = components.get(OBCF.Highlighter);
  highlighter.setup({ world });

  // Set up culler
  const culler = components.get(OBC.Cullers).create(world);
  culler.threshold = 5;

  // Initialize quantities management
  let quantitiesPanel: HTMLElement | null = null;
  let quantitiesCalculator: QuantitiesCalculator;

  // Initialize quantities calculator and panel
  async function initializeQuantities(): Promise<void> {
    try {
      const calculatorInstance = new QuantitiesCalculator(components);
      components.add(QuantitiesCalculator.uuid, calculatorInstance);
      quantitiesCalculator = components.get(QuantitiesCalculator);
      quantitiesPanel = await createQuantitiesPanel(components);

      console.log("Quantities system initialized successfully");
    } catch (error) {
      console.error("Failed to initialize quantities system:", error);
    }
  }

  // Set up camera controls with debounced updates
  world.camera.controls.addEventListener(
    "rest",
    debounce(() => {
      culler.needsUpdate = true;
      tilesLoader.culler.needsUpdate = true;
    }, 250)
  );

  // Initialize FloorPlanManager
  const floorPlanManager = new FloorPlanManager(components, world);

  // Initialize ClippingPlaneManager
  const clippingPlaneManager = new ClippingPlaneManager(components, world);

  // Initialize MeasurementManager
  const measurementManager = new MeasurementManager(components, world);

  // Initialize BCFTopics
  const bcfTopics = components.get(BCFTopics);
  bcfTopics.setup({
    author: "default@example.com",
    version: "2.1",
  });

  // Create BCF panel
  const bcfPanel = createBCFPanel(components);

  // Set up quantities event listeners
  function setupQuantitiesEventListeners(): void {
    document.addEventListener("updateQuantities", async (event: Event) => {
      const customEvent = event as CustomEvent<QuantitiesEventDetail>;
      if (!customEvent.detail?.selection) {
        console.warn("Invalid quantities update event received");
        return;
      }

      try {
        const quantityData = await quantitiesCalculator.calculateQuantities(
          customEvent.detail.selection
        );
        document.dispatchEvent(
          new CustomEvent("quantitiesCalculated", {
            detail: { quantities: quantityData },
          })
        );
      } catch (error) {
        console.error("Failed to calculate quantities:", error);
      }
    });
  }

  // Handle fragment loading
  fragments.onFragmentsLoaded.add(async (model) => {
    try {
      if (model.hasProperties) {
        await indexer.process(model);
        classifier.byEntity(model);
        await classifier.byPredefinedType(model);
      }

      for (const fragment of model.items) {
        world.meshes.add(fragment.mesh);
        culler.add(fragment.mesh);
      }

      world.scene.three.add(model);
      setTimeout(async () => {
        world.camera.fit(world.meshes, 0.8);
      }, 50);

      // Set up model features
      await floorPlanManager.setupPlansAndStyles(model);
      clippingPlaneManager.setupStyles(model);
      dataVisualizationManager.updateCharts();

      // Update quantities if visible
      const showQuantitiesCheckbox = document.getElementById(
        "show-quantities"
      ) as HTMLInputElement;

      if (showQuantitiesCheckbox?.checked) {
        document.dispatchEvent(
          new CustomEvent<QuantitiesEventDetail>("updateQuantities", {
            detail: { selection: highlighter.selection.select },
          })
        );
      }

      console.log(
        `Model loaded successfully: ${model.name || "Unnamed model"}`
      );
    } catch (error) {
      console.error("Error loading fragments:", error);
    }
  });

  // Handle fragment disposal
  fragments.onFragmentsDisposed.add(async ({ fragmentIDs }) => {
    try {
      for (const fragmentID of fragmentIDs) {
        const mesh = [...world.meshes].find((mesh) => mesh.uuid === fragmentID);
        if (mesh) world.meshes.delete(mesh);
      }

      dataVisualizationManager.updateCharts();

      const showQuantitiesCheckbox = document.getElementById(
        "show-quantities"
      ) as HTMLInputElement;

      if (showQuantitiesCheckbox?.checked) {
        document.dispatchEvent(
          new CustomEvent<QuantitiesEventDetail>("updateQuantities", {
            detail: { selection: highlighter.selection.select },
          })
        );
      }

      console.log(`Fragments disposed: ${fragmentIDs.join(", ")}`);
    } catch (error) {
      console.error("Error disposing fragments:", error);
    }
  });

  // Update highlighter events for volume measurement and quantities
  highlighter.events.select.onHighlight.add((event) => {
    // Check which feature is active
    const showQuantitiesCheckbox = document.getElementById(
      "show-quantities"
    ) as HTMLInputElement;

    if (showQuantitiesCheckbox?.checked) {
      // Only update quantities table without showing volume on element
      document.dispatchEvent(
        new CustomEvent<QuantitiesEventDetail>("updateQuantities", {
          detail: { selection: event },
        })
      );
    } else {
      // Only show volume on element if in measurement mode and volume measurement is enabled
      const volume = measurementManager.getVolumeFromFragments(event);
      if (volume !== null && measurementManager.isVolumeMeasurementEnabled()) {
        console.log("Volume:", volume);
      }
    }
  });

  highlighter.events.select.onClear.add(() => {
    measurementManager.volumeMeasurement.clear();
    // Clear quantities table when selection is cleared
    document.dispatchEvent(new CustomEvent("clearQuantities"));
  });

  // Create UI components
  const projectInformationPanel = projectInformation(components);
  const selectionInformationPanel = selectionInformation(components);
  const advancedOptionsPanel = advancedOptions(components);
  const settingsPanel = settings(components);
  const helpPanel = help;
  const classificationPanel = classification(components);
  const { panel: detailedPanel, updatePanel: updateDetailedPanel } =
    detailedEntityPropertyPanel(components);

  // Create detailed panel element with proper styling
  const detailedPanelElement = document.createElement("div");
  detailedPanelElement.id = "detailedPanel";
  detailedPanelElement.style.display = "none";
  detailedPanelElement.style.position = "fixed";
  detailedPanelElement.style.bottom = "0";
  detailedPanelElement.style.left = "26rem";
  detailedPanelElement.style.right = "0";
  detailedPanelElement.style.height = "300px";
  detailedPanelElement.style.backgroundColor = "#1a1a1a";
  detailedPanelElement.style.zIndex = "1000";
  detailedPanelElement.style.overflowY = "auto";
  detailedPanelElement.style.border = "1px solid #333";
  detailedPanelElement.style.borderBottom = "none";
  detailedPanelElement.style.boxShadow = "0 -2px 10px rgba(0, 0, 0, 0.1)";
  detailedPanelElement.appendChild(detailedPanel);

  // Function to toggle detailed panel visibility
  const toggleDetailedPanel = (visible: boolean) => {
    if (detailedPanelElement) {
      detailedPanelElement.style.display = visible ? "block" : "none";
    }
  };

  // Add close button to detailed panel
  const closeButton = document.createElement("button");
  closeButton.textContent = "Close";
  closeButton.style.position = "sticky";
  closeButton.style.top = "10px";
  closeButton.style.right = "10px";
  closeButton.style.zIndex = "1001";
  closeButton.style.background = "none";
  closeButton.style.border = "none";
  closeButton.style.color = "#fff";
  closeButton.style.cursor = "pointer";
  closeButton.style.padding = "5px 10px";
  closeButton.style.borderRadius = "3px";
  closeButton.style.transition = "background-color 0.3s";

  // Add hover effects for close button
  closeButton.addEventListener("mouseenter", () => {
    closeButton.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
  });
  closeButton.addEventListener("mouseleave", () => {
    closeButton.style.backgroundColor = "transparent";
  });
  closeButton.addEventListener("click", () => toggleDetailedPanel(false));
  detailedPanelElement.appendChild(closeButton);

  // Add detailed panel to the app
  document.body.appendChild(detailedPanelElement);

  // Set up detailed panel event listener
  document.addEventListener("toggleDetailedPanel", ((
    e: CustomEvent<{ visible: boolean; fragmentIdMap?: any }>
  ) => {
    toggleDetailedPanel(e.detail.visible);
    if (e.detail.visible && e.detail.fragmentIdMap) {
      updateDetailedPanel({ fragmentIdMap: e.detail.fragmentIdMap });
    }
  }) as EventListener);

  // Function to export fragments
  async function exportFragments() {
    if (!fragments.groups.size) {
      console.warn("No fragments available to export");
      return;
    }
    try {
      const group = Array.from(fragments.groups.values())[0];
      const geometryData = fragments.export(group);
      const properties = group.getLocalProperties();

      const zip = new JSZip();
      zip.file("geometry.frag", geometryData);
      if (properties) {
        zip.file("properties.json", JSON.stringify(properties));
      }

      const content = await zip.generateAsync({ type: "blob" });
      const file = new File([content], "model_fragments.zip");
      const link = document.createElement("a");
      link.href = URL.createObjectURL(file);
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      link.remove();

      console.log("Fragments exported successfully");
    } catch (error) {
      console.error("Error exporting fragments:", error);
    }
  }

  // Create toolbar with all sections
  const toolbar = BUI.Component.create(() => {
    return BUI.html`
      <bim-toolbar>
        ${load(components)}
        ${camera(world)}
        ${selection(components, world)}
        <bim-toolbar-section label="Export" icon="solar:export-bold">
          <bim-button @click=${exportFragments} label="Export Fragments" icon="fluent:puzzle-cube-piece-20-filled" 
            tooltip-title="Export Fragments" 
            tooltip-text="Export the loaded model as fragments (geometry and properties).">
          </bim-button>
        </bim-toolbar-section>
      </bim-toolbar>
    `;
  });

  // Function to create clipping plane tab
  function createClippingPlaneTab() {
    return BUI.Component.create<BUI.Panel>(() => {
      return BUI.html`
      <bim-panel>
        <bim-panel-section label="Clipping Plane Controls" icon="mdi:content-cut">
          <bim-checkbox label="Clipper enabled" checked 
            @change="${({ target }: { target: BUI.Checkbox }) => {
              clippingPlaneManager.setEnabled(target.value);
            }}"
            tooltip-title="Enable Clipper"
            tooltip-text="Enable or disable the clipping plane feature">
          </bim-checkbox>
          
          <bim-checkbox label="Clipper visible" checked 
            @change="${({ target }: { target: BUI.Checkbox }) => {
              clippingPlaneManager.setVisible(target.value);
            }}"
            tooltip-title="Clipper Visibility"
            tooltip-text="Show or hide the clipping plane">
          </bim-checkbox>   
        
          <bim-color-input 
            label="Planes Color" color="#202932" 
            @input="${({ target }: { target: BUI.ColorInput }) => {
              clippingPlaneManager.setPlaneColor(target.color);
            }}"
            tooltip-title="Plane Color"
            tooltip-text="Set the color of the clipping plane">
          </bim-color-input>
          
          <bim-number-input 
            slider step="0.01" label="Planes opacity" value="0.2" min="0.1" max="1"
            @change="${({ target }: { target: BUI.NumberInput }) => {
              clippingPlaneManager.setPlaneOpacity(target.value);
            }}"
            tooltip-title="Plane Opacity"
            tooltip-text="Adjust the opacity of the clipping plane">
          </bim-number-input>
          
          <bim-number-input 
            slider step="0.1" label="Planes size" value="5" min="2" max="10"
            @change="${({ target }: { target: BUI.NumberInput }) => {
              clippingPlaneManager.setPlaneSize(target.value);
            }}"
            tooltip-title="Plane Size"
            tooltip-text="Adjust the size of the clipping plane">
          </bim-number-input>
          
          <bim-button 
            label="Delete all" 
            @click="${() => clippingPlaneManager.deleteAllClippingPlanes()}"
            tooltip-title="Delete All Planes"
            tooltip-text="Remove all clipping planes">  
          </bim-button>
        </bim-panel-section>
      </bim-panel>
    `;
    });
  }

  // Function to create measurement tab
  function createMeasurementTab() {
    return BUI.Component.create<BUI.Panel>(() => {
      return BUI.html`
      <bim-panel>
        <bim-panel-section label="Measurement Controls" icon="mdi:ruler">
          <bim-checkbox label="Length Measurement" 
            @change="${({ target }: { target: BUI.Checkbox }) => {
              measurementManager.setLengthMeasurementEnabled(target.value);
            }}"
            tooltip-title="Enable Length Measurement"
            tooltip-text="Enable or disable length measurement tool">
          </bim-checkbox>
          
          <bim-checkbox label="Edge Measurement" 
            @change="${({ target }: { target: BUI.Checkbox }) => {
              measurementManager.setEdgeMeasurementEnabled(target.value);
            }}"
            tooltip-title="Enable Edge Measurement"
            tooltip-text="Enable or disable edge measurement tool">
          </bim-checkbox>
          
          <bim-checkbox label="Volume Measurement" 
            @change="${({ target }: { target: BUI.Checkbox }) => {
              measurementManager.setVolumeMeasurementEnabled(target.value);
            }}"
            tooltip-title="Enable Volume Measurement"
            tooltip-text="Enable or disable volume measurement tool">
          </bim-checkbox>

          <bim-checkbox label="Area Measurement" 
            @change="${({ target }: { target: BUI.Checkbox }) => {
              measurementManager.setAreaMeasurementEnabled(target.value);
            }}"
            tooltip-title="Enable Area Measurement"
            tooltip-text="Hold Alt + double-click to start. Click to add points. Double-click to complete the area measurement.">
          </bim-checkbox>

          <bim-checkbox label="Angle Measurement" 
            @change="${({ target }: { target: BUI.Checkbox }) => {
              measurementManager.setAngleMeasurementEnabled(target.value);
            }}"
            tooltip-title="Enable Angle Measurement"
            tooltip-text="Hold Alt + Shift + double-click for first point, click for vertex, click for final point to measure angle.">
          </bim-checkbox>
        
          <bim-color-input 
            label="Length Measurement Color" color="#202932" 
            @input="${({ target }: { target: BUI.ColorInput }) => {
              measurementManager.setMeasurementColor(target.color);
            }}"
            tooltip-title="Length Measurement Color"
            tooltip-text="Set the color of length measurements">
          </bim-color-input>
          
          <bim-button 
            label="Delete all measurements" 
            @click="${() => measurementManager.deleteAllMeasurements()}"
            tooltip-title="Delete All Measurements"
            tooltip-text="Remove all measurements">  
          </bim-button>
        </bim-panel-section>
      </bim-panel>
    `;
    });
  }
  // Function to switch between tabs
  function switchTab(tabName: string) {
    const tabContent = document.getElementById("tabContent");
    if (!tabContent) {
      console.warn("Tab content container not found");
      return;
    }

    // Move variable declarations outside switch
    let showQuantitiesCheckbox: HTMLInputElement | null;
    let quantitiesTable: HTMLElement | null;

    tabContent.innerHTML = "";

    // Create and add the description dropdown with global font settings
    const descriptionDropdown = BUI.Component.create<BUI.Panel>(() => {
      return BUI.html`
      <bim-panel>
        <bim-panel-section label="How to Use" icon="mdi:information-outline">
          <bim-text class="description-text" style="font-size: ${currentFontSize}; line-height: ${currentLineHeight}; color: ${currentTextColor};">
            ${featureDescriptions[tabName as keyof typeof featureDescriptions] || "No description available."}
          </bim-text>
        </bim-panel-section>
      </bim-panel>
    `;
    });
    tabContent.appendChild(descriptionDropdown);

    // Add the tab-specific content based on selection
    switch (tabName) {
      case "project":
        tabContent.appendChild(projectInformationPanel);
        break;
      case "selection":
        tabContent.appendChild(selectionInformationPanel);
        break;
      case "classification":
        tabContent.appendChild(classificationPanel);
        break;
      case "advanced":
        tabContent.appendChild(advancedOptionsPanel);
        break;
      case "settings":
        tabContent.appendChild(settingsPanel);
        break;
      case "help":
        tabContent.appendChild(helpPanel);
        break;
      case "floorPlans":
        floorPlanManager.createUI(tabContent);
        break;
      case "clippingPlane":
        tabContent.appendChild(createClippingPlaneTab());
        break;
      case "measurement":
        // Reset quantities display when switching to measurement tab
        showQuantitiesCheckbox = document.getElementById(
          "show-quantities"
        ) as HTMLInputElement;
        if (showQuantitiesCheckbox?.checked) {
          showQuantitiesCheckbox.checked = false;
          quantitiesTable = document.getElementById(
            "quantities-table-container"
          );
          if (quantitiesTable) {
            quantitiesTable.style.display = "none";
          }
        }
        tabContent.appendChild(createMeasurementTab());
        break;
      case "dataVisualization":
        tabContent.appendChild(dataVisualizationPanel(components));
        break;
      case "bcf":
        tabContent.appendChild(bcfPanel);
        break;
      case "quantities": {
        measurementManager.volumeMeasurement.clear(); // Clear any visible volume measurements
        if (!document.getElementById("quantities-panel")) {
          if (quantitiesPanel) {
            quantitiesPanel.id = "quantities-panel";
            tabContent.appendChild(quantitiesPanel);
            const event = new CustomEvent("quantitiesPanelMounted");
            document.dispatchEvent(event);
          }
        } else {
          const existingPanel = document.getElementById("quantities-panel");
          if (existingPanel) {
            tabContent.appendChild(existingPanel);
          }
        }
        break;
      }
      default:
        console.warn(`Unknown tab: ${tabName}`);
        break;
    }
  }

  // Create left panel with grid-like tab arrangement
  const leftPanel = BUI.Component.create(() => {
    return BUI.html`
      <bim-panel>
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 5px; padding: 5px;">
          <bim-button @click=${() => switchTab("project")} style="height: 40px;" icon="ph:building-fill" label="Project" tooltip-title="Project Information" tooltip-text="View project details and structure"></bim-button>
          <bim-button @click=${() => switchTab("selection")} style="height: 40px;" icon="mdi:cursor-default-click-outline" label="Selection Inform" tooltip-title="Selection Information" tooltip-text="View details of selected elements"></bim-button>
          <bim-button @click=${() => switchTab("classification")} style="height: 40px;" icon="mdi:file-tree-outline" label="Classification" tooltip-title="Classification Tree" tooltip-text="View and manage model classifications"></bim-button>
          <bim-button @click=${() => switchTab("advanced")} style="height: 40px;" icon="mdi:tools" label="Advanced Options" tooltip-title="Advanced Options" tooltip-text="Configure advanced settings"></bim-button>
          <bim-button @click=${() => switchTab("settings")} style="height: 40px;" icon="solar:settings-bold" label="Settings" tooltip-title="Settings" tooltip-text="Adjust application settings"></bim-button>
          <bim-button @click=${() => switchTab("help")} style="height: 40px;" icon="material-symbols:help" label="Help" tooltip-title="Help" tooltip-text="Get assistance and information about the application"></bim-button>
          <bim-button @click=${() => switchTab("floorPlans")} style="height: 40px;" icon="mdi:floor-plan" label="Floor Plans" tooltip-title="Floor Plans" tooltip-text="View and navigate floor plans"></bim-button>
          <bim-button @click=${() => switchTab("clippingPlane")} style="height: 40px;" icon="mdi:content-cut" label="Clipping Plane" tooltip-title="Clipping Plane" tooltip-text="Control and manage clipping planes"></bim-button>
          <bim-button @click=${() => switchTab("measurement")} style="height: 40px;" icon="mdi:ruler" label="Measurement" tooltip-title="Measurement" tooltip-text="Access measurement tools"></bim-button>
          <bim-button @click=${() => switchTab("dataVisualization")} style="height: 40px;" icon="mdi:chart-bar" label="Data Viz" tooltip-title="Data Visualization" tooltip-text="Explore visual representations of your BIM data"></bim-button>
          <bim-button @click=${() => switchTab("bcf")} style="height: 40px;" icon="mdi:comment-text-outline" label="BCF" tooltip-title="BCF" tooltip-text="Manage Building Collaboration Format topics"></bim-button>
          <bim-button @click=${() => switchTab("quantities")} style="height: 40px;" icon="mdi:calculator" label="Quantities" tooltip-title="Quantities" tooltip-text="View and analyze quantities of selected building elements"></bim-button>
        </div>
        <div id="tabContent" style="height: calc(100% - 90px); overflow-y: auto;">
          ${projectInformationPanel}
        </div>
      </bim-panel>
    `;
  });

  // Update the app layout
  const app = document.getElementById("app") as BUI.Grid;
  app.layouts = {
    main: {
      template: `
        "leftPanel viewport" 1fr
        / 26rem 1fr
      `,
      elements: {
        leftPanel,
        viewport,
      },
    },
  };

  app.layout = "main";

  // Set up viewport grid layout
  viewportGrid.layouts = {
    main: {
      template: `
        "empty" 1fr
        "toolbar" auto
        /1fr
      `,
      elements: { toolbar },
    },
  };

  viewportGrid.layout = "main";

  // Set up performance monitoring
  const stats = new Stats();
  stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
  stats.dom.style.position = "absolute";
  stats.dom.style.top = "0px";
  stats.dom.style.left = "50%";
  stats.dom.style.transform = "translateX(-50%)";
  stats.dom.style.zIndex = "100";
  document.body.appendChild(stats.dom);

  // Update stats in animation loop
  function animate() {
    stats.begin();
    stats.end();
    requestAnimationFrame(animate);
  }
  animate();

  // Event handlers for measurements and clipping plane
  document.addEventListener("dblclick", (event) => {
    if (event.altKey && event.shiftKey) {
      measurementManager.createAngleMeasurement();
    } else if (event.shiftKey) {
      measurementManager.createEdgeMeasurement();
    } else if (event.ctrlKey) {
      clippingPlaneManager.createClippingPlane();
    } else if (event.altKey) {
      measurementManager.createAreaMeasurement();
    } else {
      measurementManager.createLengthMeasurement();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.code === "Delete" || event.code === "Backspace") {
      clippingPlaneManager.deleteClippingPlane();
      measurementManager.deleteMeasurement();
    }
  });

  // Update clipping edges when camera moves
  world.camera.controls.addEventListener("update", () => {
    clippingPlaneManager.updateEdges();
  });

  // Set highlighter for floor plan manager
  floorPlanManager.setHighlighter(highlighter);

  // Initialize quantities system
  await initializeQuantities();
  setupQuantitiesEventListeners();

  // Set up theme management
  const updateGlobalTextColor = (color: string) => {
    currentTextColor = color;
    const descriptionTexts = document.querySelectorAll(".description-text");
    descriptionTexts.forEach((text) => {
      if (text instanceof HTMLElement) {
        text.style.color = color;
      }
    });
  };

  // Initialize with current theme
  const currentTheme = document.documentElement.classList.contains(
    "bim-ui-dark"
  )
    ? "dark"
    : "light";
  updateGlobalTextColor(currentTheme === "dark" ? "white" : "black");

  console.log("BIM application initialized successfully");
}

// Add event listener for DOMContentLoaded
document.addEventListener("DOMContentLoaded", () => {
  initializeApp().catch((error) => {
    console.error("Failed to initialize BIM application:", error);
  });
});
