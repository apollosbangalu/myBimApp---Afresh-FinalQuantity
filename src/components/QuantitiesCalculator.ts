/* eslint-disable prettier/prettier */
// src/components/QuantitiesCalculator.ts

import * as OBC from "@thatopen/components";
// import * as OBCF from "@thatopen/components-front";
import * as FRAGS from "@thatopen/fragments";
import * as THREE from "three"; // Added this import for geometry calculation

// Interface for quantity data of an element
interface QuantityData {
  guid: string;
  type: string | number;
  name: string;
  material: string;
  volume: number | null;
  area: number | null;
  thickness: number | null;
}

export class QuantitiesCalculator extends OBC.Component {
  static uuid = "ef28e868-19c4-4d18-9c69-0c8429e2da4b";

  enabled = true;
  private cache: Map<string, QuantityData> = new Map();

  constructor(components: OBC.Components) {
    super(components);
  }

  async calculateQuantities(fragmentIdMap: {
    [fragmentId: string]: Set<number>;
  }): Promise<QuantityData[]> {
    const quantities: QuantityData[] = [];
    console.log(
      "Starting quantity calculation for fragmentIdMap:",
      fragmentIdMap
    );
    const fragments = this.components.get(OBC.FragmentsManager);

    for (const [fragmentId, elementIds] of Object.entries(fragmentIdMap)) {
      console.log(
        `Processing fragment ${fragmentId} with ${elementIds.size} elements`
      );
      const fragment = fragments.list.get(fragmentId);
      if (!fragment) {
        console.warn(`Fragment ${fragmentId} not found, skipping`);
        continue;
      }

      const model = fragment.group;
      if (!model) {
        console.warn(`No group found for fragment ${fragmentId}, skipping`);
        continue;
      }

      for (const elementId of elementIds) {
        console.log(`Calculating quantities for element ${elementId}`);
        const cacheKey = `${fragmentId}-${elementId}`;
        let quantityData = this.cache.get(cacheKey);

        if (!quantityData) {
          try {
            const properties = await this.getElementProperties(
              model,
              elementId
            );
            console.log("Element properties:", properties);

            const volume = await this.calculateVolume(fragment, elementId);
            const area = await this.calculateArea(fragment, elementId);
            const thickness = await this.calculateThickness(
              fragment,
              elementId
            );

            console.log("Calculated quantities:", { volume, area, thickness });

            quantityData = {
              guid: properties.guid,
              type: properties.type,
              name: properties.name,
              material: properties.material,
              volume,
              area,
              thickness,
            };

            this.cache.set(cacheKey, quantityData);
          } catch (error) {
            console.warn(
              `Error calculating quantities for element ${elementId}:`,
              error
            );
            quantityData = {
              guid: `Error-${elementId}`,
              type: "Unknown",
              name: "Error",
              material: "Unknown",
              volume: null,
              area: null,
              thickness: null,
            };
          }
        } else {
          console.log(`Using cached data for element ${elementId}`);
        }

        quantities.push(quantityData);
      }
    }
    console.log(
      `Calculation complete. Total quantities calculated: ${quantities.length}`
    );
    return quantities;
  }

  private async getElementProperties(
    model: FRAGS.FragmentsGroup,
    elementId: number
  ): Promise<{
    guid: string;
    type: string | number;
    name: string;
    material: string;
  }> {
    const property = await model.getProperties(elementId);

    console.log("Raw properties:", property); // Log raw properties for debugging

    return {
      guid: property?.GlobalId?.value || `Unknown-${elementId}`,
      type: property?.type || property?.["Type Name"]?.value || "Unknown",
      name: property?.Name?.value || `Element-${elementId}`,
      material: property?.Material?.value || "Unknown",
    };
  }

  // New methods for volume, area, and thickness calculations

  private async calculateVolume(
    fragment: any,
    elementId: number
  ): Promise<number | null> {
    try {
      // Calculate volume without displaying it on the element
      const geometry = this.getGeometryForElement(fragment, elementId);
      if (!geometry) return null;

      geometry.computeBoundingBox();
      const boundingBox = geometry.boundingBox!;
      const size = new THREE.Vector3();
      boundingBox.getSize(size);
      const volume = size.x * size.y * size.z;
      return volume > 0 ? volume : null;
    } catch (error) {
      console.warn(
        `Unable to calculate volume for element ${elementId}:`,
        error
      );
      return null;
    }
  }

  private async calculateArea(
    fragment: any,
    elementId: number
  ): Promise<number | null> {
    try {
      const geometry = this.getGeometryForElement(fragment, elementId);
      if (!geometry) return null;

      const area = this.computeSurfaceArea(geometry);
      return area > 0 ? area : null;
    } catch (error) {
      console.warn(`Unable to calculate area for element ${elementId}:`, error);
      return null;
    }
  }

  private async calculateThickness(
    fragment: any,
    elementId: number
  ): Promise<number | null> {
    try {
      const geometry = this.getGeometryForElement(fragment, elementId);
      if (!geometry) return null;

      geometry.computeBoundingBox();
      const boundingBox = geometry.boundingBox!;
      const size = new THREE.Vector3();
      boundingBox.getSize(size);
      const thickness = Math.min(size.x, size.y, size.z);
      return thickness > 0 ? thickness : null;
    } catch (error) {
      console.warn(
        `Unable to calculate thickness for element ${elementId}:`,
        error
      );
      return null;
    }
  }

  private getGeometryForElement(
    fragment: any,
    elementId: number
  ): THREE.BufferGeometry | null {
    try {
      if (typeof fragment.getGeometry === "function") {
        return fragment.getGeometry(elementId);
      }
      if (fragment.geometry) {
        if (fragment.geometry instanceof THREE.BufferGeometry) {
          return fragment.geometry.clone();
        }
        if (fragment.geometry.attributes && fragment.geometry.index) {
          const newGeometry = new THREE.BufferGeometry();
          newGeometry.setAttribute(
            "position",
            fragment.geometry.attributes.position
          );
          newGeometry.setIndex(fragment.geometry.index);
          return newGeometry;
        }
      }
      if (fragment.mesh && fragment.mesh.geometry) {
        return fragment.mesh.geometry.clone();
      }
      throw new Error("Unable to access geometry");
    } catch (error) {
      console.warn(`Unable to get geometry for element ${elementId}:`, error);
      return null;
    }
  }

  private computeSurfaceArea(geometry: THREE.BufferGeometry): number {
    let area = 0;
    const positions = geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < positions.length; i += 9) {
      const triangle = new THREE.Triangle(
        new THREE.Vector3(positions[i], positions[i + 1], positions[i + 2]),
        new THREE.Vector3(positions[i + 3], positions[i + 4], positions[i + 5]),
        new THREE.Vector3(positions[i + 6], positions[i + 7], positions[i + 8])
      );
      area += triangle.getArea();
    }
    return area;
  }

  /**
   * Get all calculated quantities
   * @returns Array of all QuantityData in the cache
   */
  async getAllQuantities(): Promise<QuantityData[]> {
    return Array.from(this.cache.values());
  }

  /**
   * Get quantity data for a specific GUID
   * @param guid GUID of the element
   * @returns QuantityData for the specified GUID or undefined if not found
   */
  async getQuantityByGuid(guid: string): Promise<QuantityData | undefined> {
    for (const quantityData of this.cache.values()) {
      if (quantityData.guid === guid) {
        return quantityData;
      }
    }
    return undefined;
  }

  /**
   * Delete quantity data for a specific GUID
   * @param guid GUID of the element to delete
   */
  async deleteQuantity(guid: string): Promise<void> {
    for (const [key, value] of this.cache.entries()) {
      if (value.guid === guid) {
        this.cache.delete(key);
        break;
      }
    }
  }

  /**
   * Import quantity data
   * @param importedData Array of QuantityData to import
   */
  async importQuantities(importedData: QuantityData[]): Promise<void> {
    for (const data of importedData) {
      this.cache.set(data.guid, data);
    }
  }

  /**
   * Clear all cached quantity data
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Update quantity data for a specific GUID
   * @param guid GUID of the element to update
   * @param updatedData Partial QuantityData containing fields to update
   */
  async updateQuantity(
    guid: string,
    updatedData: Partial<QuantityData>
  ): Promise<void> {
    const existingData = await this.getQuantityByGuid(guid);
    if (existingData) {
      const updatedQuantityData = { ...existingData, ...updatedData };
      this.cache.set(guid, updatedQuantityData);
    }
  }

  /**
   * Get quantities for multiple GUIDs
   * @param guids Array of GUIDs to retrieve
   * @returns Array of QuantityData for the specified GUIDs
   */
  async getQuantitiesByGuids(guids: string[]): Promise<QuantityData[]> {
    const quantities: QuantityData[] = [];
    for (const guid of guids) {
      const quantityData = await this.getQuantityByGuid(guid);
      if (quantityData) {
        quantities.push(quantityData);
      }
    }
    return quantities;
  }

  /**
   * Check if quantity data exists for a given GUID
   * @param guid GUID to check
   * @returns Boolean indicating if quantity data exists
   */
  async quantityExists(guid: string): Promise<boolean> {
    return this.cache.has(guid);
  }

  /**
   * Get the total volume of all calculated quantities
   * @returns Total volume
   */
  async getTotalVolume(): Promise<number> {
    let totalVolume = 0;
    for (const quantityData of this.cache.values()) {
      if (quantityData.volume !== null) {
        totalVolume += quantityData.volume;
      }
    }
    return totalVolume;
  }

  /**
   * Get the total area of all calculated quantities
   * @returns Total area
   */
  async getTotalArea(): Promise<number> {
    let totalArea = 0;
    for (const quantityData of this.cache.values()) {
      if (quantityData.area !== null) {
        totalArea += quantityData.area;
      }
    }
    return totalArea;
  }

  /**
   * Get quantities by type
   * @param type Type of elements to retrieve
   * @returns Array of QuantityData for the specified type
   */
  async getQuantitiesByType(type: string | number): Promise<QuantityData[]> {
    return Array.from(this.cache.values()).filter(
      (quantityData) => quantityData.type === type
    );
  }

  /**
   * Get a summary of all quantities
   * @returns Object containing total count, volume, area, and type distribution
   */
  async getQuantitiesSummary(): Promise<{
    totalCount: number;
    totalVolume: number;
    totalArea: number;
    typeDistribution: { [type: string]: number };
  }> {
    let totalVolume = 0;
    let totalArea = 0;
    const typeDistribution: { [type: string]: number } = {};

    for (const quantityData of this.cache.values()) {
      if (quantityData.volume !== null) totalVolume += quantityData.volume;
      if (quantityData.area !== null) totalArea += quantityData.area;
      const typeKey = String(quantityData.type);
      typeDistribution[typeKey] = (typeDistribution[typeKey] || 0) + 1;
    }

    return {
      totalCount: this.cache.size,
      totalVolume,
      totalArea,
      typeDistribution,
    };
  }
}
