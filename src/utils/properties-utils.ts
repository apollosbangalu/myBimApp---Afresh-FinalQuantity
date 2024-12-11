// new code

/* eslint-disable prettier/prettier */
// src/utils/properties-utils.ts

import * as FRAGS from "@thatopen/fragments";

export class IfcPropertiesUtils {
  // Find an item by GUID
  static async findItemByGuid(model: FRAGS.FragmentsGroup, guid: string) {
    console.log(`Searching for item with GUID: ${guid}`);
    const ids = model.getAllPropertiesIDs();
    for (const id of ids) {
      const property = await model.getProperties(id);
      if (property && property.GlobalId?.value === guid) {
        console.log(`Found item with GUID: ${guid}`);
        return property;
      }
    }
    console.log(`Item with GUID ${guid} not found`);
    return null;
  }

  // Get quantity set quantities
  static async getQsetQuantities(
    model: FRAGS.FragmentsGroup,
    expressID: number,
    onQuantityFound?: (expressID: number) => void
  ): Promise<number[] | null> {
    console.log(`Getting quantity sets for expressID: ${expressID}`);
    const defaultCallback = () => {};
    const _onQuantityFound = onQuantityFound ?? defaultCallback;
    const pset = await model.getProperties(expressID);
    if (!pset || pset.type !== "IFCELEMENTQUANTITY") {
      console.log(`No quantity set found for expressID: ${expressID}`);
      return null;
    }

    const quantities = pset.Quantities ?? [{}];
    const qtos = quantities.map((prop: any) => {
      if (prop.value) _onQuantityFound(prop.value);
      return prop.value;
    });
    const filteredQtos = qtos.filter((prop: any) => prop !== null);
    console.log(
      `Found ${filteredQtos.length} quantities for expressID: ${expressID}`
    );
    return filteredQtos;
  }

  // Get quantity value
  static async getQuantityValue(
    model: FRAGS.FragmentsGroup,
    quantityID: number
  ) {
    console.log(`Getting quantity value for quantityID: ${quantityID}`);
    const quantity = await model.getProperties(quantityID);
    if (!quantity) {
      console.log(`No quantity found for quantityID: ${quantityID}`);
      return { key: null, value: null };
    }
    const key =
      Object.keys(quantity).find((key) => key.endsWith("Value")) ?? null;
    let value;
    if (key === null) {
      value = null;
    } else if (quantity[key] === undefined || quantity[key] === null) {
      value = null;
    } else {
      value = quantity[key].value as number;
    }

    console.log(
      `Quantity value for ${quantityID}: key = ${key}, value = ${value}`
    );
    return { key, value };
  }

  // Get element volume
  static async getElementVolume(
    model: FRAGS.FragmentsGroup,
    elementId: number
  ): Promise<number | null> {
    console.log(`Getting volume for element: ${elementId}`);
    const quantities = await this.getQsetQuantities(model, elementId);
    if (quantities) {
      for (const quantityId of quantities) {
        const { key, value } = await this.getQuantityValue(model, quantityId);
        if (key === "VolumeValue" && value !== null) {
          console.log(`Volume found for element ${elementId}: ${value}`);
          return value;
        }
      }
    }
    console.log(`No volume found for element ${elementId}`);
    return null;
  }

  // Get element area
  static async getElementArea(
    model: FRAGS.FragmentsGroup,
    elementId: number
  ): Promise<number | null> {
    console.log(`Getting area for element: ${elementId}`);
    const quantities = await this.getQsetQuantities(model, elementId);
    if (quantities) {
      for (const quantityId of quantities) {
        const { key, value } = await this.getQuantityValue(model, quantityId);
        if (key === "AreaValue" && value !== null) {
          console.log(`Area found for element ${elementId}: ${value}`);
          return value;
        }
      }
    }
    console.log(`No area found for element ${elementId}`);
    return null;
  }

  // Get element thickness
  static async getElementThickness(
    model: FRAGS.FragmentsGroup,
    elementId: number
  ): Promise<number | null> {
    console.log(`Getting thickness for element: ${elementId}`);
    const quantities = await this.getQsetQuantities(model, elementId);
    if (quantities) {
      for (const quantityId of quantities) {
        const { key, value } = await this.getQuantityValue(model, quantityId);
        if (key === "ThicknessValue" && value !== null) {
          console.log(`Thickness found for element ${elementId}: ${value}`);
          return value;
        }
      }
    }
    console.log(`No thickness found for element ${elementId}`);
    return null;
  }

  // Get element GUID
  static async getElementGuid(
    model: FRAGS.FragmentsGroup,
    elementId: number
  ): Promise<string> {
    console.log(`Getting GUID for element: ${elementId}`);
    const property = await model.getProperties(elementId);
    const guid = property?.GlobalId?.value ?? `Unknown-${elementId}`;
    console.log(`GUID for element ${elementId}: ${guid}`);
    return guid;
  }

  // Get element name
  static async getElementName(
    model: FRAGS.FragmentsGroup,
    elementId: number
  ): Promise<string> {
    console.log(`Getting name for element: ${elementId}`);
    const property = await model.getProperties(elementId);
    const name = property?.Name?.value ?? `Element-${elementId}`;
    console.log(`Name for element ${elementId}: ${name}`);
    return name;
  }

  // Get element material
  static async getElementMaterial(
    model: FRAGS.FragmentsGroup,
    elementId: number
  ): Promise<string> {
    console.log(`Getting material for element: ${elementId}`);
    const property = await model.getProperties(elementId);
    if (property?.HasAssociations) {
      for (const association of property.HasAssociations) {
        if (association.RelatingMaterial) {
          const material =
            association.RelatingMaterial.Name?.value ?? "Unknown";
          console.log(`Material for element ${elementId}: ${material}`);
          return material;
        }
      }
    }
    console.log(`No material found for element ${elementId}`);
    return "Unknown";
  }

  // Get all properties for an element
  static async getAllProperties(
    model: FRAGS.FragmentsGroup,
    elementId: number
  ): Promise<any> {
    console.log(`Getting all properties for element: ${elementId}`);
    const properties = await model.getProperties(elementId);
    console.log(`Properties for element ${elementId}:`, properties);
    return properties;
  }

  // Get specific property for an element
  static async getProperty(
    model: FRAGS.FragmentsGroup,
    elementId: number,
    propertyName: string
  ): Promise<any> {
    console.log(`Getting property '${propertyName}' for element: ${elementId}`);
    const properties = await this.getAllProperties(model, elementId);
    const propertyValue = properties?.[propertyName] ?? null;
    console.log(
      `Property '${propertyName}' for element ${elementId}:`,
      propertyValue
    );
    return propertyValue;
  }

  // Check if an element has a specific property
  static async hasProperty(
    model: FRAGS.FragmentsGroup,
    elementId: number,
    propertyName: string
  ): Promise<boolean> {
    console.log(
      `Checking if element ${elementId} has property: '${propertyName}'`
    );
    const properties = await this.getAllProperties(model, elementId);
    const hasProperty = propertyName in properties;
    console.log(
      `Element ${elementId} ${hasProperty ? "has" : "does not have"} property '${propertyName}'`
    );
    return hasProperty;
  }

  // Get all property sets for an element
  static async getPropertySets(
    model: FRAGS.FragmentsGroup,
    elementId: number
  ): Promise<any[]> {
    console.log(`Getting property sets for element: ${elementId}`);
    const properties = await this.getAllProperties(model, elementId);
    const propertySets = properties?.HasPropertySets ?? [];
    console.log(
      `Found ${propertySets.length} property sets for element ${elementId}`
    );
    return propertySets;
  }

  // Get a specific property set for an element
  static async getPropertySet(
    model: FRAGS.FragmentsGroup,
    elementId: number,
    propertySetName: string
  ): Promise<any | null> {
    console.log(
      `Getting property set '${propertySetName}' for element: ${elementId}`
    );
    const propertySets = await this.getPropertySets(model, elementId);
    const propertySet =
      propertySets.find((pset: any) => pset.Name?.value === propertySetName) ??
      null;
    console.log(
      `Property set '${propertySetName}' for element ${elementId}:`,
      propertySet
    );
    return propertySet;
  }

  // Get all quantity sets for an element
  static async getQuantitySets(
    model: FRAGS.FragmentsGroup,
    elementId: number
  ): Promise<any[]> {
    console.log(`Getting quantity sets for element: ${elementId}`);
    const properties = await this.getAllProperties(model, elementId);
    const quantitySets = properties?.HasQuantitySets ?? [];
    console.log(
      `Found ${quantitySets.length} quantity sets for element ${elementId}`
    );
    return quantitySets;
  }

  // Get a specific quantity set for an element
  static async getQuantitySet(
    model: FRAGS.FragmentsGroup,
    elementId: number,
    quantitySetName: string
  ): Promise<any | null> {
    console.log(
      `Getting quantity set '${quantitySetName}' for element: ${elementId}`
    );
    const quantitySets = await this.getQuantitySets(model, elementId);
    const quantitySet =
      quantitySets.find((qset: any) => qset.Name?.value === quantitySetName) ??
      null;
    console.log(
      `Quantity set '${quantitySetName}' for element ${elementId}:`,
      quantitySet
    );
    return quantitySet;
  }
}
