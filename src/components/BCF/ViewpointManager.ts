// src/components/BCF/ViewpointManager.ts

import * as OBC from "@thatopen/components";
import * as OBCF from "@thatopen/components-front";
import { Viewpoints, Viewpoint } from "@thatopen/components";
import { BCFTopics, Topic } from "./index";
import * as FRAGS from "@thatopen/fragments";

export class ViewpointManager {
  private components: OBC.Components;
  private viewpoints: Viewpoints;
  private bcfTopics: BCFTopics;

  constructor(components: OBC.Components) {
    this.components = components;
    this.viewpoints = this.components.get(Viewpoints);
    this.bcfTopics = this.components.get(BCFTopics);
  }

  /**
   * Creates a new viewpoint for the current view and associates it with a BCF topic.
   * @param topic - The BCF topic to associate the viewpoint with.
   * @returns The created Viewpoint instance.
   */
  createViewpoint(topic: Topic): Viewpoint {
    // Get the current world
    const worlds = this.components.get(OBC.Worlds);
    const worldKeys = Array.from(worlds.list.keys());
    if (worldKeys.length === 0) {
      throw new Error("No worlds found");
    }
    const world = worlds.list.get(worldKeys[0]); // Get the first available world

    if (!world) {
      throw new Error("World not found");
    }

    // Create a new viewpoint
    const viewpoint = this.viewpoints.create(world);

    // Update the camera to current view
    viewpoint.updateCamera();

    // If there are selected elements, add them to the viewpoint
    const selectedFragments = this.getSelectedFragments();
    if (Object.keys(selectedFragments).length > 0) {
      viewpoint.addComponentsFromMap(selectedFragments);
    }

    // Associate the viewpoint with the BCF topic
    topic.viewpoints.add(viewpoint.guid);

    console.log(
      `Created viewpoint with GUID: ${viewpoint.guid} for topic: ${topic.guid}`
    );
    return viewpoint;
  }

  /**
   * Applies a viewpoint to the current view.
   * @param viewpoint - The viewpoint to apply.
   */
  applyViewpoint(viewpoint: Viewpoint): void {
    console.log(`Applying viewpoint: ${viewpoint.guid}`);
    viewpoint.go().catch((error) => {
      console.error(`Error applying viewpoint: ${error.message}`);
    });
  }

  /**
   * Updates an existing viewpoint with the current view.
   * @param viewpoint - The viewpoint to update.
   */
  updateViewpoint(viewpoint: Viewpoint): void {
    // Update the camera to current view
    viewpoint.updateCamera();

    // Update selected elements
    const selectedFragments = this.getSelectedFragments();
    viewpoint.selectionComponents.clear();
    if (Object.keys(selectedFragments).length > 0) {
      viewpoint.addComponentsFromMap(selectedFragments);
    }

    console.log(`Updated viewpoint: ${viewpoint.guid}`);
  }

  /**
   * Deletes a viewpoint and removes its association with BCF topics.
   * @param viewpoint - The viewpoint to delete.
   */
  deleteViewpoint(viewpoint: Viewpoint): void {
    // Remove the viewpoint from all associated topics
    for (const topic of this.bcfTopics.list.values()) {
      topic.viewpoints.delete(viewpoint.guid);
    }

    // Remove the viewpoint from the viewpoints list
    this.viewpoints.list.delete(viewpoint.guid);
    console.log(`Deleted viewpoint: ${viewpoint.guid}`);
  }

  /**
   * Gets the currently selected fragments.
   * @returns An object mapping fragment IDs to sets of selected element IDs.
   */
  private getSelectedFragments(): FRAGS.FragmentIdMap {
    const selectedFragments: FRAGS.FragmentIdMap = {};

    // Get the current selection from the highlighter
    const highlighter = this.components.get(OBCF.Highlighter);
    const selection = highlighter.selection.select;

    // Convert the selection to the required format
    for (const fragmentId in selection) {
      selectedFragments[fragmentId] = new Set(selection[fragmentId]);
    }

    return selectedFragments;
  }
}
