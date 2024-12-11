// src/components/ClippingPlaneManager.ts

import * as OBC from "@thatopen/components";
import * as OBCF from "@thatopen/components-front";
import * as THREE from "three";

export class ClippingPlaneManager {
  //private components: OBC.Components;
  private world: OBC.World;
  private clipper: OBC.Clipper;
  private edges: OBCF.ClipEdges;

  constructor(components: OBC.Components, world: OBC.World) {
    //this.components = components;
    this.world = world;
    this.clipper = components.get(OBC.Clipper);
    this.edges = components.get(OBCF.ClipEdges);

    // Initialize clipper
    this.clipper.enabled = true;
    this.clipper.Type = OBCF.EdgesPlane;
  }

  // Create a new clipping plane
  public createClippingPlane() {
    if (this.clipper.enabled) {
      this.clipper.create(this.world);
    }
  }

  // Delete the last created clipping plane
  public deleteClippingPlane() {
    if (this.clipper.enabled) {
      this.clipper.delete(this.world);
    }
  }

  // Delete all clipping planes
  public deleteAllClippingPlanes() {
    this.clipper.deleteAll();
  }

  // Set up clipping styles for a model
  public setupStyles(model: any) {
    //const fragments = this.components.get(OBC.FragmentsManager);
    const blueFill = new THREE.MeshBasicMaterial({ color: "lightblue", side: 2 });
    const blueLine = new THREE.LineBasicMaterial({ color: "blue" });
    const blueOutline = new THREE.MeshBasicMaterial({
      color: "blue",
      opacity: 0.5,
      side: 2,
      transparent: true,
    });

    this.edges.styles.create(
      `Blue_${model.uuid}`,
      new Set(model.items.map((item: any) => item.mesh)),
      this.world,
      blueLine,
      blueFill,
      blueOutline
    );

    const salmonFill = new THREE.MeshBasicMaterial({ color: "salmon", side: 2 });
    const redLine = new THREE.LineBasicMaterial({ color: "red" });
    const redOutline = new THREE.MeshBasicMaterial({
      color: "red",
      opacity: 0.5,
      side: 2,
      transparent: true,
    });

    this.edges.styles.create(
      `Red_${model.uuid}`,
      new Set(model.items.map((item: any) => item.mesh)),
      this.world,
      redLine,
      salmonFill,
      redOutline
    );
  }

  // Enable or disable the clipper
  public setEnabled(enabled: boolean) {
    this.clipper.enabled = enabled;
    this.edges.visible = enabled;
  }

  // Set the visibility of the clipper
  public setVisible(visible: boolean) {
    this.clipper.visible = visible;
  }

  // Set the color of the clipping plane
  public setPlaneColor(color: string) {
    this.clipper.material.color.set(color);
  }

  // Set the opacity of the clipping plane
  public setPlaneOpacity(opacity: number) {
    this.clipper.material.opacity = opacity;
  }

  // Set the size of the clipping plane
  public setPlaneSize(size: number) {
    this.clipper.size = size;
  }

  // Update the clipping edges
  public updateEdges() {
    this.edges.update(true);
  }
}



