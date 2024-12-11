import * as OBC from "@thatopen/components";
import * as THREE from "three";
import JSZip from "jszip";
import { XMLParser } from "fast-xml-parser";
import { BCFTopic, BCFTopicsConfig, BCFVersion } from "./types";
import { Comment } from "./Comment";
import { Topic } from "./Topic";

/**
 * BCFTopics manages Building Collaboration Format (BCF) data in the engine.
 * It provides functionality for importing, exporting, and manipulating BCF data.
 */
export class BCFTopics extends OBC.Component {
  static uuid = "de977976-e4f6-4e4f-a01a-204727839802" as const;
  enabled = true;

  private static xmlParser = new XMLParser({
    allowBooleanAttributes: true,
    attributeNamePrefix: "",
    ignoreAttributes: false,
    ignoreDeclaration: true,
    parseAttributeValue: true,
    removeNSPrefix: true,
    trimValues: true,
  });

  config: Required<BCFTopicsConfig> = {
    author: "default@example.com",
    version: "2.1",
    types: new Set(["Issue", "Clash", "Remark"]),
    statuses: new Set(["Active", "In Progress", "Done", "In Review", "Closed"]),
    priorities: new Set(["Low", "Medium", "High"]),
    labels: new Set(),
    stages: new Set(),
    users: new Set(),
    includeSelectionTag: false,
    updateExtensionsOnImport: true,
    strict: false,
    includeAllExtensionsOnExport: true,
    fallbackVersionOnImport: "2.1",
    ignoreIncompleteTopicsOnImport: false,
  };

  readonly list = new OBC.DataMap<string, Topic>();

  readonly onSetup = new OBC.Event();
  isSetup = false;

  /**
   * Sets up the BCFTopics component with optional configuration.
   * @param config - Optional partial configuration to override defaults.
   */
  setup(config?: Partial<BCFTopicsConfig>) {
    if (this.isSetup) return;
    this.config = { ...this.config, ...config };
    this.isSetup = true;
    this.enabled = true;
    this.onSetup.trigger();
  }

  readonly onBCFImported = new OBC.Event<Topic[]>();

  /**
   * Creates a new BCFTopic instance and adds it to the list.
   * @param data - Optional partial BCFTopic object to initialize the new topic.
   * @returns The newly created BCFTopic instance.
   */
  create(data?: Partial<BCFTopic>): Topic {
    const topic = new Topic(this.components);
    if (data) {
      topic.set(data);
    }
    this.list.set(topic.guid, topic);
    return topic;
  }

  readonly onDisposed = new OBC.Event();

  /**
   * Disposes of the BCFTopics component and triggers the onDisposed event.
   */
  dispose() {
    this.list.dispose();
    this.onDisposed.trigger();
    this.onDisposed.reset();
  }

  /**
   * Retrieves the unique set of topic types used across all topics.
   */
  get usedTypes() {
    return new Set([...this.list].map(([_, topic]) => topic.type));
  }

  /**
   * Retrieves the unique set of topic statuses used across all topics.
   */
  get usedStatuses() {
    return new Set([...this.list].map(([_, topic]) => topic.status));
  }

  /**
   * Retrieves the unique set of topic priorities used across all topics.
   */
  get usedPriorities() {
    return new Set(
      [...this.list]
        .map(([_, topic]) => topic.priority)
        .filter((priority): priority is string => !!priority)
    );
  }

  /**
   * Retrieves the unique set of topic stages used across all topics.
   */
  get usedStages() {
    return new Set(
      [...this.list]
        .map(([_, topic]) => topic.stage)
        .filter((stage): stage is string => !!stage)
    );
  }

  /**
   * Retrieves the unique set of users associated with topics.
   */
  get usedUsers() {
    const users = new Set<string>();
    for (const [_, topic] of this.list) {
      users.add(topic.creationAuthor);
      if (topic.assignedTo) users.add(topic.assignedTo);
      if (topic.modifiedAuthor) users.add(topic.modifiedAuthor);
      for (const [_, comment] of topic.comments) {
        users.add(comment.author);
        if (comment.modifiedAuthor) users.add(comment.modifiedAuthor);
      }
    }
    return users;
  }

  /**
   * Retrieves the unique set of labels used across all topics.
   */
  get usedLabels() {
    const labels = new Set<string>();
    for (const [_, topic] of this.list) {
      for (const label of topic.labels) {
        labels.add(label);
      }
    }
    return labels;
  }

  /**
   * Updates the set of extensions based on the current topics.
   */
  updateExtensions() {
    for (const [_, topic] of this.list) {
      for (const label of topic.labels) this.config.labels.add(label);
      this.config.types.add(topic.type);
      if (topic.priority) this.config.priorities.add(topic.priority);
      if (topic.stage) this.config.stages.add(topic.stage);
      this.config.statuses.add(topic.status);
      this.config.users.add(topic.creationAuthor);
      if (topic.assignedTo) this.config.users.add(topic.assignedTo);
      if (topic.modifiedAuthor) this.config.users.add(topic.modifiedAuthor);
      for (const [_, comment] of topic.comments) {
        this.config.users.add(comment.author);
        if (comment.modifiedAuthor)
          this.config.users.add(comment.modifiedAuthor);
      }
    }
  }

  /**
   * Updates the references to viewpoints in the topics.
   */
  updateViewpointReferences() {
    const viewpoints = this.components.get(OBC.Viewpoints);
    for (const [_, topic] of this.list) {
      for (const viewpointID of topic.viewpoints) {
        const exists = viewpoints.list.has(viewpointID);
        if (!exists) topic.viewpoints.delete(viewpointID);
      }
    }
  }

  /**
   * Exports the given topics to a BCF (Building Collaboration Format) zip file.
   * @param topics - The topics to export. Defaults to all topics in the list.
   * @returns A promise that resolves to a Blob containing the exported BCF zip file.
   */
  async export(topics: Iterable<Topic> = this.list.values()): Promise<Blob> {
    const zip = new JSZip();
    zip.file(
      "bcf.version",
      `<?xml version="1.0" encoding="UTF-8"?>
    <Version VersionId="${this.config.version}" xsi:noNamespaceSchemaLocation="https://raw.githubusercontent.com/buildingSMART/BCF-XML/release_3_0/Schemas/version.xsd"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
    </Version>`
    );
    zip.file("bcf.extensions", this.serializeExtensions());
    const image = await fetch(
      "https://thatopen.github.io/engine_components/resources/favicon.ico"
    );
    const imgBlob = await image.blob();
    const viewpoints = this.components.get(OBC.Viewpoints);
    for (const topic of topics) {
      const topicFolder = zip.folder(topic.guid) as JSZip;
      topicFolder.file("markup.bcf", topic.serialize());
      for (const viewpointID of topic.viewpoints) {
        const viewpoint = viewpoints.list.get(viewpointID);
        if (!viewpoint) continue;
        topicFolder.file(`${viewpointID}.jpeg`, imgBlob, {
          binary: true,
        });
        topicFolder.file(`${viewpointID}.bcfv`, await viewpoint.serialize());
      }
    }
    const content = await zip.generateAsync({ type: "blob" });
    return content;
  }

  private serializeExtensions() {
    const createExtensionTag = (name: string, items: Set<string>) => {
      const itemTags = [...items]
        .map((item) => `<${name}>${item}</${name}>`)
        .join("\n");
      return items.size ? `<${name}s>\n${itemTags}\n</${name}s>` : "";
    };

    return `
      <?xml version="1.0" encoding="UTF-8"?>
      <Extensions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="extensions.xsd">
        ${createExtensionTag("TopicType", this.config.types)}
        ${createExtensionTag("TopicStatus", this.config.statuses)}
        ${createExtensionTag("Priority", this.config.priorities)}
        ${createExtensionTag("TopicLabel", this.config.labels)}
        ${createExtensionTag("Stage", this.config.stages)}
        ${createExtensionTag("User", this.config.users)}
      </Extensions>
    `;
  }

  /**
   * Loads BCF (Building Collaboration Format) data into the engine.
   * @param data - The BCF data to load.
   * @param world - The default world where the viewpoints are going to be created.
   * @returns A promise that resolves to an object containing the created viewpoints and topics.
   */
  async load(
    data: Uint8Array,
    world: OBC.World
  ): Promise<{ viewpoints: OBC.Viewpoint[]; topics: Topic[] }> {
    const {
      fallbackVersionOnImport,
      ignoreIncompleteTopicsOnImport,
      updateExtensionsOnImport,
    } = this.config;
    const zip = new JSZip();
    await zip.loadAsync(data);

    const files = Object.values(zip.files);

    // Get BCF Version from incoming data
    let version = fallbackVersionOnImport;
    const versionFile = files.find((file) => file.name.endsWith(".version"));
    if (versionFile) {
      const versionXML = await versionFile.async("string");
      const bcfVersion =
        BCFTopics.xmlParser.parse(versionXML).Version.VersionId;
      version = String(bcfVersion) as BCFVersion;
    }

    if (!(version && (version === "2.1" || version === "3"))) {
      throw new Error(`BCFTopics: ${version} is not supported.`);
    }

    // Get BCF Extensions file
    const extensionsFile = files.find((file) =>
      file.name.endsWith(".extensions")
    );

    if (updateExtensionsOnImport && extensionsFile) {
      const extensionsXML = await extensionsFile.async("string");
      this.importExtensions(extensionsXML);
    }

    // Process viewpoints
    const createdViewpoints: OBC.Viewpoint[] = [];
    const viewpointFiles = files.filter((file) => file.name.endsWith(".bcfv"));
    console.log(`Found ${viewpointFiles.length} viewpoint files`);
    for (const viewpointFile of viewpointFiles) {
      const xml = await viewpointFile.async("string");
      const visualizationInfo =
        BCFTopics.xmlParser.parse(xml).VisualizationInfo;
      if (!visualizationInfo) {
        console.warn("Missing VisualizationInfo in Viewpoint");
        continue;
      }

      const viewpoint = await this.createViewpointFromXML(
        visualizationInfo,
        world
      );
      if (viewpoint) {
        createdViewpoints.push(viewpoint);
        console.log(`Created viewpoint with GUID: ${viewpoint.guid}`);
      } else {
        console.warn(
          `Failed to create viewpoint from file: ${viewpointFile.name}`
        );
      }
    }

    // Process markup files
    const topics: Topic[] = [];
    const topicRelations: { [guid: string]: Set<string> } = {};
    const markupFiles = files.filter((file) => file.name.endsWith(".bcf"));
    console.log(`Found ${markupFiles.length} markup files`);
    for (const markupFile of markupFiles) {
      const xml = await markupFile.async("string");
      const markup = BCFTopics.xmlParser.parse(xml).Markup;
      const topic = this.createTopicFromMarkup(
        markup,
        version,
        ignoreIncompleteTopicsOnImport
      );
      if (topic) {
        topics.push(topic);
        console.log(`Created topic with GUID: ${topic.guid}`);

        // Create topic relations
        topicRelations[topic.guid] = new Set(
          this.getMarkupRelatedTopics(markup, version)
        );

        // Associate viewpoints with the topic
        const topicViewpoints = this.getMarkupViewpoints(markup, version);
        console.log(
          `Found ${topicViewpoints.length} viewpoints for topic ${topic.guid}`
        );
        for (const topicViewpoint of topicViewpoints) {
          if (topicViewpoint && topicViewpoint.Guid) {
            const viewpoint = createdViewpoints.find(
              (v) => v.guid === topicViewpoint.Guid
            );
            if (viewpoint) {
              topic.viewpoints.add(viewpoint.guid);
              console.log(
                `Associated viewpoint ${viewpoint.guid} with topic ${topic.guid}`
              );
            } else {
              console.warn(
                `Viewpoint ${topicViewpoint.Guid} not found for topic ${topic.guid}`
              );
            }
          }
        }
      }
    }

    // Set up topic relations
    for (const topicID in topicRelations) {
      const topic = this.list.get(topicID);
      if (!topic) continue;
      const relations = topicRelations[topicID];
      for (const guid of relations) {
        topic.relatedTopics.add(guid);
      }
    }

    this.onBCFImported.trigger(topics);
    return { viewpoints: createdViewpoints, topics };
  }

  private importExtensions(extensionsXML: string) {
    const extensions = BCFTopics.xmlParser.parse(extensionsXML).Extensions;
    if (!extensions) return;

    const updateSet = (
      configSet: Set<string>,
      extensionItems: string | string[]
    ) => {
      const items = Array.isArray(extensionItems)
        ? extensionItems
        : [extensionItems];
      items.forEach((item) => configSet.add(item));
    };

    if (extensions.TopicTypes)
      updateSet(this.config.types, extensions.TopicTypes.TopicType);
    if (extensions.TopicStatuses)
      updateSet(this.config.statuses, extensions.TopicStatuses.TopicStatus);
    if (extensions.Priorities)
      updateSet(this.config.priorities, extensions.Priorities.Priority);
    if (extensions.TopicLabels)
      updateSet(this.config.labels, extensions.TopicLabels.TopicLabel);
    if (extensions.Stages)
      updateSet(this.config.stages, extensions.Stages.Stage);
    if (extensions.Users) updateSet(this.config.users, extensions.Users.User);
  }

  private async createViewpointFromXML(
    visualizationInfo: any,
    world: OBC.World
  ): Promise<OBC.Viewpoint | null> {
    const {
      Guid,
      Components,
      OrthogonalCamera,
      PerspectiveCamera,
      ClippingPlanes,
    } = visualizationInfo;

    if (!Guid) {
      console.warn("Viewpoint is missing GUID");
      return null;
    }

    const viewpointData: {
      guid: string;
      camera?: OBC.ViewpointPerspectiveCamera | OBC.ViewpointOrthographicCamera;
    } = { guid: Guid };

    if (OrthogonalCamera || PerspectiveCamera) {
      const camera = OrthogonalCamera || PerspectiveCamera;
      viewpointData.camera = this.createViewpointCamera(camera);
    }

    const viewpoint = await this.components
      .get(OBC.Viewpoints)
      .create(world, viewpointData);

    if (Components) {
      // Process selection, visibility, and coloring
      if (Components.Selection && Components.Selection.Component) {
        const selectionComponents = Array.isArray(
          Components.Selection.Component
        )
          ? Components.Selection.Component.map((c: any) => c.IfcGuid)
          : [Components.Selection.Component.IfcGuid];
        selectionComponents.forEach((guid: string) =>
          viewpoint.selectionComponents.add(guid)
        );
      }

      if (Components.Visibility) {
        viewpoint.defaultVisibility = Components.Visibility.DefaultVisibility;
        let exceptionComponents: string[] = [];
        if (Components.Visibility.Exceptions) {
          if (Array.isArray(Components.Visibility.Exceptions.Component)) {
            exceptionComponents =
              Components.Visibility.Exceptions.Component.map(
                (c: any) => c.IfcGuid
              );
          } else if (Components.Visibility.Exceptions.Component) {
            exceptionComponents = [
              Components.Visibility.Exceptions.Component.IfcGuid,
            ];
          }
        }
        exceptionComponents.forEach((guid: string) =>
          viewpoint.exceptionComponents.add(guid)
        );
      }

      if (Components.Coloring) {
        this.processViewpointColoring(viewpoint, Components.Coloring);
      }
    }

    if (ClippingPlanes) {
      await this.processClippingPlanes(viewpoint, ClippingPlanes, world);
    }

    return viewpoint;
  }

  private createViewpointCamera(
    camera: any
  ): OBC.ViewpointPerspectiveCamera | OBC.ViewpointOrthographicCamera {
    const { CameraViewPoint, CameraDirection, CameraUpVector } = camera;

    const position = new THREE.Vector3(
      Number(CameraViewPoint.X),
      Number(CameraViewPoint.Z),
      Number(-CameraViewPoint.Y)
    );

    const direction = new THREE.Vector3(
      Number(CameraDirection.X),
      Number(CameraDirection.Z),
      Number(-CameraDirection.Y)
    );

    const up = new THREE.Vector3(
      Number(CameraUpVector.X),
      Number(CameraUpVector.Z),
      Number(-CameraUpVector.Y)
    );

    const baseCamera = {
      position: { x: position.x, y: position.y, z: position.z },
      direction: { x: direction.x, y: direction.y, z: direction.z },
      up: { x: up.x, y: up.y, z: up.z },
      aspectRatio: camera.AspectRatio || 1,
    };

    if ("ViewToWorldScale" in camera) {
      return {
        ...baseCamera,
        viewToWorldScale: camera.ViewToWorldScale,
      } as OBC.ViewpointOrthographicCamera;
    } else if ("FieldOfView" in camera) {
      return {
        ...baseCamera,
        fov: camera.FieldOfView,
      } as OBC.ViewpointPerspectiveCamera;
    }

    // Default to perspective camera if type can't be determined
    return {
      ...baseCamera,
      fov: 45, // Default FOV
    } as OBC.ViewpointPerspectiveCamera;
  }

  private processViewpointColoring(viewpoint: OBC.Viewpoint, coloring: any) {
    const colors = Array.isArray(coloring.Color)
      ? coloring.Color
      : [coloring.Color];
    for (const colorData of colors) {
      const { Color, Component } = colorData;
      const components = Array.isArray(Component) ? Component : [Component];
      const guids = components.map((component: any) => component.IfcGuid);
      viewpoint.componentColors.set(Color, guids);
    }
  }

  private async processClippingPlanes(
    viewpoint: OBC.Viewpoint,
    clippingPlanes: any,
    world: OBC.World
  ) {
    const clipper = this.components.get(OBC.Clipper);
    const planes = Array.isArray(clippingPlanes.ClippingPlane)
      ? clippingPlanes.ClippingPlane
      : [clippingPlanes.ClippingPlane];

    for (const plane of planes) {
      const { Location, Direction } = plane;
      if (!(Location && Direction)) continue;

      const location = new THREE.Vector3(Location.X, Location.Z, -Location.Y);
      const direction = new THREE.Vector3(
        Direction.X,
        -Direction.Z,
        Direction.Y
      );

      const clippingPlane = clipper.createFromNormalAndCoplanarPoint(
        world,
        direction,
        location
      );
      clippingPlane.visible = false;
      clippingPlane.enabled = false;
      viewpoint.clippingPlanes.add(clippingPlane);
    }
  }

  private createTopicFromMarkup(
    markup: any,
    version: BCFVersion,
    ignoreIncomplete: boolean
  ): Topic | null {
    const markupTopic = markup.Topic;
    const {
      Guid,
      TopicType,
      TopicStatus,
      Title,
      CreationDate,
      CreationAuthor,
    } = markupTopic;

    // Check for required data
    if (ignoreIncomplete) {
      if (
        !(
          Guid &&
          TopicType &&
          TopicStatus &&
          Title &&
          CreationDate &&
          CreationAuthor
        )
      ) {
        console.warn("Incomplete topic data, skipping import");
        return null;
      }
    }

    const topic = new Topic(this.components);
    topic.guid = Guid || topic.guid;
    topic.type = TopicType || topic.type;
    topic.status = TopicStatus || topic.status;
    topic.title = Title || topic.title;
    topic.creationDate = CreationDate
      ? new Date(CreationDate)
      : topic.creationDate;
    topic.creationAuthor = CreationAuthor || topic.creationAuthor;

    // Set optional data
    topic.serverAssignedId = markupTopic.ServerAssignedId;
    topic.priority = markupTopic.Priority;
    topic.index = markupTopic.Index;
    topic.modifiedDate = markupTopic.ModifiedDate
      ? new Date(markupTopic.ModifiedDate)
      : undefined;
    topic.modifiedAuthor = markupTopic.ModifiedAuthor;
    topic.dueDate = markupTopic.DueDate
      ? new Date(markupTopic.DueDate)
      : undefined;
    topic.assignedTo = markupTopic.AssignedTo;
    topic.description = markupTopic.Description;
    topic.stage = markupTopic.Stage;

    // Process labels
    const labels = this.getMarkupLabels(markup, version);
    for (const label of labels) topic.labels.add(label);

    // Process comments
    const comments = this.getMarkupComments(markup, version);
    for (const comment of comments) topic.comments.set(comment.guid, comment);

    // Process viewpoints
    const markupViewpoints = this.getMarkupViewpoints(markup, version);
    for (const markupViewpoint of markupViewpoints) {
      if (markupViewpoint && markupViewpoint.Guid) {
        const viewpoint = this.components
          .get(OBC.Viewpoints)
          .list.get(markupViewpoint.Guid);
        if (viewpoint) topic.viewpoints.add(viewpoint.guid);
      }
    }

    this.list.set(topic.guid, topic);
    return topic;
  }

  private getMarkupLabels(markup: any, version: BCFVersion): string[] {
    let data: any;
    if (version === "2.1") data = markup.Topic.Labels;
    if (version === "3") data = markup.Topic.Labels?.Label;
    if (!data) return [];
    return Array.isArray(data) ? data : [data];
  }

  private getMarkupComments(markup: any, version: BCFVersion): Comment[] {
    let data: any;
    if (version === "2.1") data = markup.Comment;
    if (version === "3") data = markup.Topic.Comments?.Comment;
    if (!data) return [];
    data = Array.isArray(data) ? data : [data];
    return data
      .map((commentData: any) => this.processMarkupComment(commentData))
      .filter(
        (comment: Comment | null): comment is Comment => comment !== null
      );
  }

  private processMarkupComment(markupComment: any): Comment | null {
    const {
      Guid,
      Date: CommentDate,
      Author,
      Comment: CommentText,
      Viewpoint,
    } = markupComment;

    if (!(Guid && CommentDate && Author && (CommentText || Viewpoint)))
      return null;

    const comment = new Comment(this.components, CommentText ?? "");
    comment.guid = Guid;
    comment.date = new Date(CommentDate);
    comment.author = Author;
    comment.viewpoint = Viewpoint?.Guid
      ? this.components.get(OBC.Viewpoints).list.get(Viewpoint.Guid)
      : undefined;
    comment.modifiedAuthor = markupComment.ModifiedAuthor;
    comment.modifiedDate = markupComment.ModifiedDate
      ? new Date(markupComment.ModifiedDate)
      : undefined;

    return comment;
  }

  private getMarkupViewpoints(markup: any, version: BCFVersion): any[] {
    let data: any;
    if (version === "2.1") data = markup.Viewpoints;
    if (version === "3") data = markup.Topic.Viewpoints?.ViewPoint;
    if (!data) return [];
    return Array.isArray(data) ? data : [data];
  }

  private getMarkupRelatedTopics(markup: any, version: BCFVersion): string[] {
    let data: any;
    if (version === "2.1") data = markup.Topic.RelatedTopic;
    if (version === "3") data = markup.Topic.RelatedTopics?.RelatedTopic;
    if (!data) return [];
    const topics: { Guid: string }[] = Array.isArray(data) ? data : [data];
    return topics.map((topic) => topic.Guid);
  }
}
