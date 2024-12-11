// Define the supported BCF versions
export type BCFVersion = "2.1" | "3";

/**
 * Interface representing a BCF Topic
 */
export interface BCFTopic {
  guid: string;
  serverAssignedId?: string;
  type: string;
  status: string;
  title: string;
  priority?: string;
  index?: number;
  labels: Set<string>;
  creationDate: Date;
  creationAuthor: string;
  modifiedDate?: Date;
  modifiedAuthor?: string;
  dueDate?: Date;
  assignedTo?: string;
  description?: string;
  stage?: string;
}

/**
 * Configuration settings for managing BCF topics
 */
export interface BCFTopicsConfig {
  // The BCF version used during export
  version: BCFVersion;

  // The email of the user creating topics using this component
  author: string;

  // The set of allowed topic types
  types: Set<string>;

  // The set of allowed topic statuses
  statuses: Set<string>;

  // The set of allowed topic priorities
  priorities: Set<string>;

  // The set of allowed topic labels
  labels: Set<string>;

  // The set of allowed topic stages
  stages: Set<string>;

  // The set of allowed topic users
  users: Set<string>;

  // Whether to include the AuthoringSoftwareId in the viewpoint components during export
  includeSelectionTag: boolean;

  // Updates the types, statuses, users, etc., after importing an external BCF
  updateExtensionsOnImport: boolean;

  // Only allow to use the extensions (types, statuses, etc.) defined in the config when setting the corresponding data in a topic
  strict: boolean;

  // If true, export the extensions (types, status, etc.) based on topics data
  includeAllExtensionsOnExport: boolean;

  // Version to be used when importing if no bcf.version file is present in the incoming data
  fallbackVersionOnImport: BCFVersion | null;

  // If true, do not import a topic with missing information (guid, type, status, title, creationDate or creationAuthor)
  ignoreIncompleteTopicsOnImport: boolean;
}

/**
 * Interface representing a BCF Comment
 */
export interface BCFComment {
  guid: string;
  date: Date;
  author: string;
  comment: string;
  viewpointGuid?: string;
  modifiedDate?: Date;
  modifiedAuthor?: string;
}

/**
 * Interface representing a BCF Viewpoint
 */
export interface BCFViewpoint {
  guid: string;
  viewpoint: string;
  snapshot: string;
}

/**
 * Interface representing a BCF Component Selection
 */
export interface BCFComponentSelection {
  component: string;
  originatingSystem?: string;
  authoringToolId?: string;
}

/**
 * Interface representing BCF Component Visibility
 */
export interface BCFComponentVisibility {
  defaultVisibility?: boolean;
  exceptions?: BCFComponentSelection[];
  viewSetupHints?: {
    spacesVisible?: boolean;
    spaceBoundariesVisible?: boolean;
    openingsVisible?: boolean;
  };
}

/**
 * Interface representing a BCF Orthogonal Camera
 */
export interface BCFOrthogonalCamera {
  cameraViewPoint: [number, number, number];
  cameraDirection: [number, number, number];
  cameraUpVector: [number, number, number];
  viewToWorldScale: number;
}

/**
 * Interface representing a BCF Perspective Camera
 */
export interface BCFPerspectiveCamera {
  cameraViewPoint: [number, number, number];
  cameraDirection: [number, number, number];
  cameraUpVector: [number, number, number];
  fieldOfView: number;
}

/**
 * Interface representing a BCF Clipping Plane
 */
export interface BCFClippingPlane {
  location: [number, number, number];
  direction: [number, number, number];
}

/**
 * Interface representing a BCF Line
 */
export interface BCFLine {
  startPoint: [number, number, number];
  endPoint: [number, number, number];
}

/**
 * Interface representing a BCF Component
 */
export interface BCFComponent {
  ifcGuid?: string;
  originatingSystem?: string;
  authoringToolId?: string;
}

/**
 * Interface representing a BCF Component Color
 */
export interface BCFComponentColor {
  color: string;
  components: BCFComponent[];
}
