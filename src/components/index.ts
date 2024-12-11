// src/components/index.ts

// Export the BCF component
export * from "./BCF";

// Export other custom components
export { FloorPlanManager } from "./floorPlanManager";
export { ClippingPlaneManager } from "./ClippingPlaneManager";
export { MeasurementManager } from "./MeasurementManager";
export { DataVisualizationManager } from "./DataVisualizationManager";

// Export the new QuantitiesCalculator
export { QuantitiesCalculator } from "./QuantitiesCalculator";

// Export panel components
export { default as projectInformation } from "./Panels/ProjectInformation";
export { default as selectionInformation } from "./Panels/SelectionInformation";
export { default as settings } from "./Panels/Settings";
export { default as help } from "./Panels/Help";
export { default as advancedOptions } from "./Panels/AdvancedOptions";
export { default as classification } from "./Panels/Classification";
export { default as detailedEntityPropertyPanel } from "./Panels/DetailedEntityPropertyPanel";
export { default as dataVisualizationPanel } from "./Panels/DataVisualizationPanel";
export { createBCFPanel } from "./Panels/BCFPanel";

// Export the new QuantitiesPanel
export { createQuantitiesPanel } from "./Panels/QuantitiesPanel";

// Export toolbar sections
export { default as load } from "./Toolbars/Sections/Import";
export { default as camera } from "./Toolbars/Sections/Camera";
export { default as selection } from "./Toolbars/Sections/Selection";
