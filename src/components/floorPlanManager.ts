// The code below has floor plan tabs and floor plan manager.
// src/components/floorPlanManager.ts

import * as THREE from "three";
import * as OBC from "@thatopen/components";
import * as OBCF from "@thatopen/components-front";
import * as BUI from "@thatopen/ui";

export class FloorPlanManager {
  private components: OBC.Components;
  private world: OBC.World;
  plans: OBCF.Plans;
  private edges: OBCF.ClipEdges;
  private defaultBackground: THREE.Color | THREE.Texture | null;
  private minGloss: number;
  private activeModelUuid: string | null = null;
  private highlighter: OBCF.Highlighter | null = null;

  constructor(components: OBC.Components, world: OBC.World) {
    this.components = components;
    this.world = world;
    this.plans = components.get(OBCF.Plans);
    this.edges = components.get(OBCF.ClipEdges);
    this.plans.world = world;
    this.defaultBackground = (world.scene.three as THREE.Scene).background;
    this.minGloss = (
      world.renderer as OBCF.PostproductionRenderer
    ).postproduction.customEffects.minGloss;
  }

  setHighlighter(highlighter: OBCF.Highlighter) {
    this.highlighter = highlighter;
  }

  async setupPlansAndStyles(model: any) {
    this.activeModelUuid = model.uuid;
    await this.plans.generate(model);
    this.setupStyles(model);
  }

  private setupStyles(model: any) {
    const classifier = this.components.get(OBC.Classifier);
    const fragments = this.components.get(OBC.FragmentsManager);

    classifier.byModel(model.uuid, model);
    classifier.byEntity(model);

    const modelItems = classifier.find({ models: [model.uuid] });
    const thickItems = classifier.find({
      models: [model.uuid],
      entities: ["IFCWALLSTANDARDCASE", "IFCWALL"],
    });
    const thinItems = classifier.find({
      models: [model.uuid],
      entities: ["IFCDOOR", "IFCWINDOW", "IFCPLATE", "IFCMEMBER"],
    });

    const grayFill = new THREE.MeshBasicMaterial({ color: "gray", side: 2 });
    const blackLine = new THREE.LineBasicMaterial({ color: "black" });
    const blackOutline = new THREE.MeshBasicMaterial({
      color: "black",
      opacity: 0.5,
      side: 2,
      transparent: true,
    });

    this.edges.styles.create(
      `thick_${model.uuid}`,
      new Set(),
      this.world,
      blackLine,
      grayFill,
      blackOutline,
    );

    for (const fragID in thickItems) {
      const foundFrag = fragments.list.get(fragID);
      if (!foundFrag) continue;
      const { mesh } = foundFrag;
      this.edges.styles.list[`thick_${model.uuid}`].fragments[fragID] = new Set(
        thickItems[fragID],
      );
      this.edges.styles.list[`thick_${model.uuid}`].meshes.add(mesh);
    }

    this.edges.styles.create(`thin_${model.uuid}`, new Set(), this.world);

    for (const fragID in thinItems) {
      const foundFrag = fragments.list.get(fragID);
      if (!foundFrag) continue;
      const { mesh } = foundFrag;
      this.edges.styles.list[`thin_${model.uuid}`].fragments[fragID] = new Set(
        thinItems[fragID],
      );
      this.edges.styles.list[`thin_${model.uuid}`].meshes.add(mesh);
    }

    this.edges.update(true);
  }

  createUI(container: HTMLElement) {
    const panel = BUI.Component.create<BUI.Panel>(() => {
      return BUI.html`
        <bim-panel active label="Floor Plans" class="options-menu">
          <bim-panel-section collapsed name="modelSelector" label="Select Model">
          </bim-panel-section>
          <bim-panel-section collapsed name="floorPlans" label="Plan list">
          </bim-panel-section>
        </bim-panel>
      `;
    });

    container.appendChild(panel);
    this.createModelSelector(
      panel.querySelector(
        "bim-panel-section[name='modelSelector']",
      ) as BUI.PanelSection,
    );
    this.createFloorPlanButtons(
      panel.querySelector(
        "bim-panel-section[name='floorPlans']",
      ) as BUI.PanelSection,
    );
  }

  private createModelSelector(panelSection: BUI.PanelSection) {
    const fragments = this.components.get(OBC.FragmentsManager);
    for (const [modelUuid, model] of fragments.groups) {
      const modelButton = BUI.Component.create<BUI.Button>(() => {
        return BUI.html`
          <bim-button label="${model.name || modelUuid}"
            @click="${() => this.selectModel(modelUuid)}"
            tooltip-title="Select Model"
            tooltip-text="Switch to this model's floor plans">
          </bim-button>
        `;
      });
      panelSection.appendChild(modelButton);
    }
  }

  private createFloorPlanButtons(panelSection: BUI.PanelSection) {
    const whiteColor = new THREE.Color("white");

    for (const plan of this.plans.list) {
      const planButton = BUI.Component.create<BUI.Button>(() => {
        return BUI.html`
          <bim-button checked label="${plan.name}"
            @click="${() => this.goToFloorPlan(plan.id, whiteColor)}"
            tooltip-title="Go to Floor Plan"
            tooltip-text="Switch to ${plan.name} floor plan view">
          </bim-button>
        `;
      });
      panelSection.appendChild(planButton);
    }

    const exitButton = BUI.Component.create<BUI.Button>(() => {
      return BUI.html`
        <bim-button checked label="Exit"
          @click="${() => this.exitFloorPlanMode()}"
          tooltip-title="Exit Floor Plan Mode"
          tooltip-text="Return to 3D view">
        </bim-button>
      `;
    });
    panelSection.appendChild(exitButton);
  }

  selectModel(modelUuid: string) {
    this.activeModelUuid = modelUuid;
    const fragments = this.components.get(OBC.FragmentsManager);
    const model = fragments.groups.get(modelUuid);
    if (model) {
      this.setupPlansAndStyles(model);
      this.createFloorPlanButtons(
        document.querySelector(
          "bim-panel-section[name='floorPlans']",
        ) as BUI.PanelSection,
      );
    }
  }

  goToFloorPlan(planId: string, whiteColor: THREE.Color) {
    if (!this.activeModelUuid || !this.highlighter) return;

    const classifier = this.components.get(OBC.Classifier);
    const cullers = this.components.get(OBC.Cullers);

    const modelItems = classifier.find({ models: [this.activeModelUuid] });

    (
      this.world.renderer as OBCF.PostproductionRenderer
    ).postproduction.customEffects.minGloss = 0.1;
    this.highlighter.backupColor = whiteColor;
    classifier.setColor(modelItems, whiteColor);
    (this.world.scene.three as THREE.Scene).background = whiteColor;
    this.plans.goTo(planId);

    for (const culler of cullers.list.values()) {
      if (culler.world === this.world) {
        culler.needsUpdate = true;
      }
    }
  }

  exitFloorPlanMode() {
    if (!this.activeModelUuid || !this.highlighter) return;

    const classifier = this.components.get(OBC.Classifier);
    const cullers = this.components.get(OBC.Cullers);

    const modelItems = classifier.find({ models: [this.activeModelUuid] });

    this.highlighter.backupColor = null;
    this.highlighter.clear();
    (
      this.world.renderer as OBCF.PostproductionRenderer
    ).postproduction.customEffects.minGloss = this.minGloss;
    classifier.resetColor(modelItems);
    (this.world.scene.three as THREE.Scene).background = this.defaultBackground;
    this.plans.exitPlanView();

    for (const culler of cullers.list.values()) {
      if (culler.world === this.world) {
        culler.needsUpdate = true;
      }
    }
  }
}
