import * as OBC from "@thatopen/components";
import { BCFTopics } from "./BCFTopics";
import { BCFTopic } from "./types";
import { Comment } from "./Comment";

/**
 * Represents a BCF (Building Collaboration Format) Topic.
 */
export class Topic implements BCFTopic {
  // Default values for a BCF Topic
  static default: Omit<BCFTopic, "guid" | "creationDate" | "creationAuthor"> = {
    title: "BCF Topic",
    type: "Issue",
    status: "Active",
    labels: new Set(),
  };

  guid = OBC.UUID.create();
  title = Topic.default.title;
  creationDate = new Date();
  creationAuthor = "";
  readonly viewpoints = new OBC.DataSet<string>();
  readonly relatedTopics = new OBC.DataSet<string>();
  readonly comments = new OBC.DataMap<string, Comment>();
  customData: Record<string, any> = {};
  description?: string;
  serverAssignedId?: string;
  dueDate?: Date;
  modifiedAuthor?: string;
  modifiedDate?: Date;
  index?: number;

  private _type = Topic.default.type;
  private _status = Topic.default.status;
  private _priority?: string;
  private _stage?: string;
  private _assignedTo?: string;
  private _labels = Topic.default.labels;
  private _components: OBC.Components;

  /**
   * Creates a new Topic instance.
   * @param components - The OBC Components instance.
   */
  constructor(components: OBC.Components) {
    this._components = components;
    const manager = components.get(BCFTopics);
    this.creationAuthor = manager.config.author;
    // Prevent the topic from referencing itself
    this.relatedTopics.guard = (guid) => guid !== this.guid;
  }

  /**
   * Gets the topic type.
   */
  get type() {
    return this._type;
  }

  /**
   * Sets the topic type.
   * @param value - The new type value.
   */
  set type(value: string) {
    const manager = this._components.get(BCFTopics);
    const { strict, types } = manager.config;
    const valid = strict ? types.has(value) : true;
    if (!valid) return;
    this._type = value;
  }

  /**
   * Gets the topic status.
   */
  get status() {
    return this._status;
  }

  /**
   * Sets the topic status.
   * @param value - The new status value.
   */
  set status(value: string) {
    const manager = this._components.get(BCFTopics);
    const { strict, statuses } = manager.config;
    const valid = strict ? statuses.has(value) : true;
    if (!valid) return;
    this._status = value;
  }

  /**
   * Gets the topic priority.
   */
  get priority() {
    return this._priority;
  }

  /**
   * Sets the topic priority.
   * @param value - The new priority value.
   */
  set priority(value: string | undefined) {
    const manager = this._components.get(BCFTopics);
    if (value) {
      const { strict, priorities } = manager.config;
      const valid = strict ? priorities.has(value) : true;
      if (!valid) return;
      this._priority = value;
    } else {
      this._priority = value;
    }
  }

  /**
   * Gets the topic stage.
   */
  get stage() {
    return this._stage;
  }

  /**
   * Sets the topic stage.
   * @param value - The new stage value.
   */
  set stage(value: string | undefined) {
    const manager = this._components.get(BCFTopics);
    if (value) {
      const { strict, stages } = manager.config;
      const valid = strict ? stages.has(value) : true;
      if (!valid) return;
      this._stage = value;
    } else {
      this._stage = value;
    }
  }

  /**
   * Gets the assigned user.
   */
  get assignedTo() {
    return this._assignedTo;
  }

  /**
   * Sets the assigned user.
   * @param value - The new assigned user.
   */
  set assignedTo(value: string | undefined) {
    const manager = this._components.get(BCFTopics);
    if (value) {
      const { strict, users } = manager.config;
      const valid = strict ? users.has(value) : true;
      if (!valid) return;
      this._assignedTo = value;
    } else {
      this._assignedTo = value;
    }
  }

  /**
   * Gets the topic labels.
   */
  get labels() {
    return this._labels;
  }

  /**
   * Sets the topic labels.
   * @param value - The new set of labels.
   */
  set labels(value: Set<string>) {
    const manager = this._components.get(BCFTopics);
    const { strict, labels } = manager.config;
    if (strict) {
      const _value = new Set<string>();
      for (const label of value) {
        const valid = strict ? labels.has(label) : true;
        if (!valid) continue;
        _value.add(label);
      }
      this._labels = _value;
    } else {
      this._labels = value;
    }
  }

  /**
   * Sets properties of the BCF Topic based on the provided data.
   * @param data - An object containing the properties to be updated.
   * @returns The updated topic
   */
  set(data: Partial<BCFTopic>) {
    for (const key in data) {
      if (key === "guid") continue;
      const value = (data as any)[key];
      if (key in this) (this as any)[key] = value;
    }
    const manager = this._components.get(BCFTopics);
    manager.list.set(this.guid, this);
    return this;
  }

  /**
   * Creates a new comment associated with the current topic.
   * @param text - The text content of the comment.
   * @param viewpoint - Optional viewpoint associated with the comment.
   * @returns The newly created comment.
   */
  createComment(text: string, viewpoint?: OBC.Viewpoint) {
    const comment = new Comment(this._components, text);
    comment.viewpoint = viewpoint;
    comment.topic = this;
    this.comments.set(comment.guid, comment);
    return comment;
  }

  /**
   * Serializes the BCF Topic instance into an XML string representation.
   * @returns A string representing the XML serialization of the BCF Topic.
   */
  serialize() {
    const manager = this._components.get(BCFTopics);
    const version = manager.config.version;

    // Helper functions to create XML tags
    const createTag = (name: string, value?: string) =>
      value ? `<${name}>${value}</${name}>` : "";
    const createDateTag = (name: string, date?: Date) =>
      date ? `<${name}>${date.toISOString()}</${name}>` : "";

    // Create XML content
    const content = `
      <?xml version="1.0" encoding="UTF-8"?>
      <Markup>
        <Topic Guid="${this.guid}" TopicType="${this.type}" TopicStatus="${
      this.status
    }" ${
      this.serverAssignedId ? `ServerAssignedId="${this.serverAssignedId}"` : ""
    }>
          ${createTag("Title", this.title)}
          ${createDateTag("CreationDate", this.creationDate)}
          ${createTag("CreationAuthor", this.creationAuthor)}
          ${createTag("Priority", this.priority)}
          ${
            this.index !== undefined && version === "2.1"
              ? createTag("Index", this.index.toString())
              : ""
          }
          ${createDateTag("ModifiedDate", this.modifiedDate)}
          ${createTag("ModifiedAuthor", this.modifiedAuthor)}
          ${createDateTag("DueDate", this.dueDate)}
          ${createTag("AssignedTo", this.assignedTo)}
          ${createTag("Description", this.description)}
          ${createTag("Stage", this.stage)}
          ${this.serializeLabels(version)}
          ${this.serializeRelatedTopics(version)}
          ${version === "3" ? this.serializeComments() : ""}
          ${version === "3" ? this.serializeViewpoints() : ""}
        </Topic>
        ${version === "2.1" ? this.serializeComments() : ""}
        ${version === "2.1" ? this.serializeViewpoints() : ""}
      </Markup>
    `;

    return content.trim();
  }

  /**
   * Serializes the labels of the topic.
   * @param version - The BCF version.
   * @returns The serialized labels XML string.
   */
  private serializeLabels(version: string) {
    const labelTag = version === "3" ? "Label" : "Labels";
    const labels = [...this.labels]
      .map((label) => `<${labelTag}>${label}</${labelTag}>`)
      .join("\n");
    return version === "3" ? `<Labels>${labels}</Labels>` : labels;
  }

  /**
   * Serializes the related topics of the topic.
   * @param version - The BCF version.
   * @returns The serialized related topics XML string.
   */
  private serializeRelatedTopics(version: string) {
    const topics = [...this.relatedTopics]
      .map((guid) => `<RelatedTopic Guid="${guid}" />`)
      .join("\n");
    return version === "3"
      ? `<RelatedTopics>${topics}</RelatedTopics>`
      : topics;
  }

  /**
   * Serializes the comments of the topic.
   * @returns The serialized comments XML string.
   */
  private serializeComments() {
    const comments = [...this.comments.values()]
      .map((comment) => comment.serialize())
      .join("\n");
    return `<Comments>${comments}</Comments>`;
  }

  /**
   * Serializes the viewpoints of the topic.
   * @returns The serialized viewpoints XML string.
   */
  private serializeViewpoints() {
    const viewpoints = this._components.get(OBC.Viewpoints);
    const viewpointTags = [...this.viewpoints]
      .map((viewpointId) => {
        const viewpoint = viewpoints.list.get(viewpointId);
        if (!viewpoint) return "";
        return `
        <ViewPoint Guid="${viewpoint.guid}">
          <Viewpoint>${viewpoint.guid}.bcfv</Viewpoint>
          <Snapshot>${viewpoint.guid}.png</Snapshot>
        </ViewPoint>
      `;
      })
      .join("\n");
    return `<Viewpoints>${viewpointTags}</Viewpoints>`;
  }
}
