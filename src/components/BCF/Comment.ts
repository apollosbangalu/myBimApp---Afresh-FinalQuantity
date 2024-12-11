import * as OBC from "@thatopen/components";
import { BCFTopics } from "./BCFTopics";
import { Topic } from "./Topic";

/**
 * Represents a comment in a BCF Topic.
 */
export class Comment {
  // Comment properties
  guid = OBC.UUID.create();
  date = new Date();
  author: string;
  viewpoint?: OBC.Viewpoint;
  modifiedAuthor?: string;
  modifiedDate?: Date;
  topic?: Topic;

  private _components: OBC.Components;
  private _comment: string = "";

  /**
   * Constructs a new BCF Topic Comment instance.
   * @param components - The Components instance.
   * @param text - The initial comment text.
   */
  constructor(components: OBC.Components, text: string) {
    this._components = components;
    this._comment = text; // Set the comment to the private property
    const manager = this._components.get(BCFTopics);
    this.author = manager.config.author;
  }

  /**
   * Sets the comment text and updates the modified date and author.
   * @param value - The new comment text.
   */
  set comment(value: string) {
    const manager = this._components.get(BCFTopics);
    this._comment = value;
    this.modifiedDate = new Date();
    this.modifiedAuthor = manager.config.author;
    this.topic?.comments.set(this.guid, this);
  }

  /**
   * Gets the comment text.
   * @returns The comment text.
   */
  get comment() {
    return this._comment;
  }

  /**
   * Serializes the Comment instance into a BCF compliant XML string.
   * @returns A string representing the Comment in BCF XML format.
   */
  serialize(): string {
    // Helper function to create XML tags
    const createTag = (name: string, value?: string) =>
      value ? `<${name}>${value}</${name}>` : "";

    // Create XML content
    const content = `
      <Comment Guid="${this.guid}">
        ${createTag("Date", this.date.toISOString())}
        ${createTag("Author", this.author)}
        ${createTag("Comment", this.comment)}
        ${this.viewpoint ? `<Viewpoint Guid="${this.viewpoint.guid}"/>` : ""}
        ${createTag("ModifiedAuthor", this.modifiedAuthor)}
        ${
          this.modifiedDate
            ? createTag("ModifiedDate", this.modifiedDate.toISOString())
            : ""
        }
      </Comment>
    `;

    return content.trim();
  }

  /**
   * Creates a Comment instance from XML data.
   * @param components - The OBC Components instance.
   * @param xmlData - The XML data representing the comment.
   * @returns A new Comment instance.
   */
  static fromXML(components: OBC.Components, xmlData: any): Comment {
    const comment = new Comment(components, xmlData.Comment || "");
    comment.guid = xmlData.Guid || OBC.UUID.create();
    comment.date = new Date(xmlData.Date);
    comment.author = xmlData.Author;

    if (xmlData.Viewpoint) {
      const viewpoints = components.get(OBC.Viewpoints);
      comment.viewpoint = viewpoints.list.get(xmlData.Viewpoint.Guid);
    }

    comment.modifiedAuthor = xmlData.ModifiedAuthor;
    comment.modifiedDate = xmlData.ModifiedDate
      ? new Date(xmlData.ModifiedDate)
      : undefined;

    return comment;
  }

  /**
   * Updates the comment with new data.
   * @param data - Partial data to update the comment.
   */
  update(data: Partial<Comment>) {
    Object.assign(this, data);
    this.modifiedDate = new Date();
    const manager = this._components.get(BCFTopics);
    this.modifiedAuthor = manager.config.author;
    this.topic?.comments.set(this.guid, this);
  }

  /**
   * Clones the current Comment instance.
   * @returns A new Comment instance with the same properties as the current one.
   */
  clone(): Comment {
    const clonedComment = new Comment(this._components, this._comment);
    clonedComment.guid = this.guid;
    clonedComment.date = new Date(this.date);
    clonedComment.author = this.author;
    clonedComment.viewpoint = this.viewpoint;
    clonedComment.modifiedAuthor = this.modifiedAuthor;
    clonedComment.modifiedDate = this.modifiedDate
      ? new Date(this.modifiedDate)
      : undefined;
    clonedComment.topic = this.topic;
    return clonedComment;
  }

  /**
   * Compares this Comment instance with another one.
   * @param other - The other Comment instance to compare with.
   * @returns True if the comments are equal, false otherwise.
   */
  equals(other: Comment): boolean {
    return (
      this.guid === other.guid &&
      this.date.getTime() === other.date.getTime() &&
      this.author === other.author &&
      this._comment === other._comment &&
      this.viewpoint?.guid === other.viewpoint?.guid &&
      this.modifiedAuthor === other.modifiedAuthor &&
      this.modifiedDate?.getTime() === other.modifiedDate?.getTime() &&
      this.topic?.guid === other.topic?.guid
    );
  }

  /**
   * Creates a string representation of the Comment.
   * @returns A string representation of the Comment.
   */
  toString(): string {
    return `Comment(guid: ${this.guid}, author: ${
      this.author
    }, date: ${this.date.toISOString()})`;
  }

  /**
   * Attaches a viewpoint to the comment.
   * @param viewpoint - The viewpoint to attach.
   */
  attachViewpoint(viewpoint: OBC.Viewpoint): void {
    this.viewpoint = viewpoint;
    this.update({ viewpoint });
  }

  /**
   * Detaches the current viewpoint from the comment.
   */
  detachViewpoint(): void {
    this.viewpoint = undefined;
    this.update({ viewpoint: undefined });
  }

  /**
   * Checks if the comment has a viewpoint attached.
   * @returns True if the comment has a viewpoint, false otherwise.
   */
  hasViewpoint(): boolean {
    return this.viewpoint !== undefined;
  }

  /**
   * Gets the creation date of the comment formatted as a string.
   * @param format - Optional date format string.
   * @returns The formatted date string.
   */
  getFormattedDate(format?: string): string {
    if (format) {
      // Implement custom date formatting logic here
      return this.date.toLocaleString();
    }
    return this.date.toLocaleString();
  }

  /**
   * Gets the modification date of the comment formatted as a string.
   * @param format - Optional date format string.
   * @returns The formatted date string, or undefined if the comment hasn't been modified.
   */
  getFormattedModifiedDate(format?: string): string | undefined {
    if (!this.modifiedDate) return undefined;
    if (format) {
      // Implement custom date formatting logic here
      return this.modifiedDate.toLocaleString();
    }
    return this.modifiedDate.toLocaleString();
  }

  /**
   * Checks if the comment has been modified.
   * @returns True if the comment has been modified, false otherwise.
   */
  isModified(): boolean {
    return this.modifiedDate !== undefined;
  }

  /**
   * Gets the duration since the comment was created.
   * @returns A string representing the duration since the comment was created.
   */
  getTimeSinceCreation(): string {
    const now = new Date();
    const diffInSeconds = Math.floor(
      (now.getTime() - this.date.getTime()) / 1000
    );

    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
    if (diffInSeconds < 3600)
      return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  }
}
