// src/components/BCF/BCFTopicTable.ts

import * as OBC from "@thatopen/components";
import { BCFTopics, Topic } from "./index";
import { ViewpointManager } from "./ViewpointManager";

export class BCFTopicTable {
  private components: OBC.Components;
  private bcfTopics: BCFTopics;
  private container: HTMLDivElement;
  private viewpointManager: ViewpointManager;

  constructor(components: OBC.Components) {
    this.components = components;
    this.bcfTopics = this.components.get(BCFTopics);
    this.container = this.createContainer();
    this.viewpointManager = new ViewpointManager(components);
    this.setupEventListeners();
    this.setupDraggableResizable();
    this.toggle(false); // Hide the table by default
  }

  // Create the container for the topic table
  private createContainer(): HTMLDivElement {
    const container = document.createElement("div");
    container.id = "bcf-topic-list-panel";
    container.className = "bcf-draggable bcf-resizable";
    container.style.position = "fixed";
    container.style.top = "50%";
    container.style.left = "50%";
    container.style.transform = "translate(-50%, -50%)";
    container.style.width = "90%";
    container.style.maxWidth = "1200px";
    container.style.height = "auto";
    container.style.maxHeight = "80vh";
    container.style.overflow = "auto";
    document.body.appendChild(container);
    return container;
  }

  // Set up draggable and resizable functionality
  private setupDraggableResizable(): void {
    // Implement draggable functionality
    let isDragging = false;
    let startX: number, startY: number;

    const header = document.createElement("div");
    header.className = "bcf-panel-header";
    header.textContent = "BCF Topics";
    this.container.insertBefore(header, this.container.firstChild);

    header.addEventListener("mousedown", (e: MouseEvent) => {
      isDragging = true;
      startX = e.clientX - this.container.offsetLeft;
      startY = e.clientY - this.container.offsetTop;
    });

    document.addEventListener("mousemove", (e: MouseEvent) => {
      if (isDragging) {
        const newX = e.clientX - startX;
        const newY = e.clientY - startY;
        this.container.style.left = `${newX}px`;
        this.container.style.top = `${newY}px`;
        this.container.style.transform = "none";
      }
    });

    document.addEventListener("mouseup", () => {
      isDragging = false;
    });

    // Implement resizable functionality
    const resizer = document.createElement("div");
    resizer.className = "bcf-resizer";
    this.container.appendChild(resizer);

    let isResizing = false;

    resizer.addEventListener("mousedown", (e: MouseEvent) => {
      isResizing = true;
      e.preventDefault();
    });

    document.addEventListener("mousemove", (e: MouseEvent) => {
      if (isResizing) {
        const newWidth = e.clientX - this.container.offsetLeft;
        const newHeight = e.clientY - this.container.offsetTop;
        this.container.style.width = `${newWidth}px`;
        this.container.style.height = `${newHeight}px`;
      }
    });

    document.addEventListener("mouseup", () => {
      isResizing = false;
    });
  }

  // Render the topic table
  public render(): HTMLElement {
    this.update();
    return this.container;
  }

  // Update the topic table content
  public update(): void {
    let tableContainer = this.container.querySelector("#bcf-topic-list-table");
    if (!tableContainer) {
      tableContainer = document.createElement("div");
      tableContainer.id = "bcf-topic-list-table";
      this.container.appendChild(tableContainer);
    }

    const topics = Array.from(this.bcfTopics.list.values());

    tableContainer.innerHTML = `
      <table class="bcf-topic-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Title</th>
            <th>Type</th>
            <th>Status</th>
            <th>Priority</th>
            <th>Author</th>
            <th>Assigned To</th>
            <th>Creation Date</th>
            <th>Due Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${topics
            .map((topic, index) => this.renderTopicRow(topic, index))
            .join("")}
        </tbody>
      </table>
    `;
  }

  // Render a single topic row
  private renderTopicRow(topic: Topic, index: number): string {
    const viewpointsCount = topic.viewpoints.size;
    return `
      <tr>
        <td>${index + 1}</td>
        <td>${topic.title || ""}</td>
        <td>${topic.type || ""}</td>
        <td>${topic.status || ""}</td>
        <td>${topic.priority || ""}</td>
        <td>${topic.creationAuthor || ""}</td>
        <td>${topic.assignedTo || ""}</td>
        <td>${topic.creationDate?.toLocaleDateString() || ""}</td>
        <td>${topic.dueDate?.toLocaleDateString() || ""}</td>
        <td class="bcf-action-buttons">
          <button class="see-more-topic" data-topic-id="${
            topic.guid
          }" title="See more details about this topic">See More</button>
          <button class="edit-topic" data-topic-id="${
            topic.guid
          }" title="Edit this topic">Edit</button>
          <button class="delete-topic" data-topic-id="${
            topic.guid
          }" title="Delete this topic">Delete</button>
          <button class="view-viewpoints" data-topic-id="${
            topic.guid
          }" title="View and manage viewpoints">Viewpoints (${viewpointsCount})</button>
        </td>
      </tr>
    `;
  }

  // Toggle the visibility of the topic table
  public toggle(visible: boolean): void {
    this.container.style.display = visible ? "block" : "none";
    if (visible) {
      this.update();
    }
  }

  // Set up event listeners for the topic table
  private setupEventListeners(): void {
    this.container.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains("edit-topic")) {
        const topicId = target.getAttribute("data-topic-id");
        if (topicId) {
          const topic = this.bcfTopics.list.get(topicId);
          if (topic) {
            const event = new CustomEvent("bcfEditTopic", {
              detail: { topic },
              bubbles: true,
              composed: true,
            });
            this.container.dispatchEvent(event);
          }
        }
      } else if (target.classList.contains("delete-topic")) {
        const topicId = target.getAttribute("data-topic-id");
        if (topicId && confirm("Are you sure you want to delete this topic?")) {
          this.bcfTopics.list.delete(topicId);
          this.update();
        }
      } else if (target.classList.contains("see-more-topic")) {
        const topicId = target.getAttribute("data-topic-id");
        if (topicId) {
          const topic = this.bcfTopics.list.get(topicId);
          if (topic) {
            this.showTopicDetails(topic);
          }
        }
      } else if (target.classList.contains("view-viewpoints")) {
        const topicId = target.getAttribute("data-topic-id");
        if (topicId) {
          const topic = this.bcfTopics.list.get(topicId);
          if (topic) {
            this.showTopicDetails(topic);
          }
        }
      }
    });

    document.addEventListener("bcfTopicSaved", () => {
      this.update();
    });
  }

  // Show detailed topic information in a modal
  private showTopicDetails(topic: Topic): void {
    const modal = document.createElement("div");
    modal.className = "bcf-modal bcf-draggable bcf-resizable";
    modal.innerHTML = `
      <div class="bcf-modal-header">Topic Details</div>
      <div class="bcf-modal-content">
        <h2>${topic.title}</h2>
        <div class="bcf-modal-grid">
          <div class="bcf-modal-item"><strong>Type:</strong> ${topic.type}</div>
          <div class="bcf-modal-item"><strong>Status:</strong> ${
            topic.status
          }</div>
          <div class="bcf-modal-item"><strong>Priority:</strong> ${
            topic.priority
          }</div>
          <div class="bcf-modal-item"><strong>Author:</strong> ${
            topic.creationAuthor
          }</div>
          <div class="bcf-modal-item"><strong>Assigned To:</strong> ${
            topic.assignedTo
          }</div>
          <div class="bcf-modal-item"><strong>Creation Date:</strong> ${topic.creationDate?.toLocaleDateString()}</div>
          <div class="bcf-modal-item"><strong>Due Date:</strong> ${topic.dueDate?.toLocaleDateString()}</div>
        </div>
        <div class="bcf-modal-description">
          <strong>Description:</strong>
          <p>${topic.description}</p>
        </div>
        <div class="bcf-modal-viewpoints">
          <strong>Viewpoints:</strong>
          <ul id="viewpoints-list">
            ${Array.from(topic.viewpoints)
              .map(
                (viewpointId) => `
              <li>
                ${viewpointId}
                <button class="apply-viewpoint" data-viewpoint-id="${viewpointId}" title="Apply this viewpoint">Apply</button>
                <button class="delete-viewpoint" data-viewpoint-id="${viewpointId}" title="Delete this viewpoint">Delete</button>
              </li>
            `
              )
              .join("")}
          </ul>
          <button class="create-viewpoint" data-topic-id="${
            topic.guid
          }" title="Create a new viewpoint for this topic">Create Viewpoint</button>
        </div>
        <button id="close-modal" title="Close the details modal">Close</button>
      </div>
    `;

    document.body.appendChild(modal);

    const closeButton = modal.querySelector("#close-modal");
    closeButton?.addEventListener("click", () => {
      document.body.removeChild(modal);
    });

    // Add event listeners for viewpoint actions
    modal.querySelectorAll(".apply-viewpoint").forEach((button) => {
      button.addEventListener("click", (e) => {
        const viewpointId = (e.target as HTMLElement).getAttribute(
          "data-viewpoint-id"
        );
        if (viewpointId) {
          const viewpoint = this.components
            .get(OBC.Viewpoints)
            .list.get(viewpointId);
          if (viewpoint) {
            this.viewpointManager.applyViewpoint(viewpoint);
          }
        }
      });
    });

    modal.querySelectorAll(".delete-viewpoint").forEach((button) => {
      button.addEventListener("click", (e) => {
        const viewpointId = (e.target as HTMLElement).getAttribute(
          "data-viewpoint-id"
        );
        if (viewpointId) {
          const viewpoint = this.components
            .get(OBC.Viewpoints)
            .list.get(viewpointId);
          if (viewpoint) {
            this.viewpointManager.deleteViewpoint(viewpoint);
            topic.viewpoints.delete(viewpointId);
            (e.target as HTMLElement).closest("li")?.remove();
          }
        }
      });
    });

    const createViewpointButton = modal.querySelector(".create-viewpoint");
    createViewpointButton?.addEventListener("click", () => {
      const newViewpoint = this.viewpointManager.createViewpoint(topic);
      const viewpointsList = modal.querySelector("#viewpoints-list");
      if (viewpointsList) {
        const newViewpointItem = document.createElement("li");
        newViewpointItem.innerHTML = `
          ${newViewpoint.guid}
          <button class="apply-viewpoint" data-viewpoint-id="${newViewpoint.guid}" title="Apply this viewpoint">Apply</button>
          <button class="delete-viewpoint" data-viewpoint-id="${newViewpoint.guid}" title="Delete this viewpoint">Delete</button>
        `;
        viewpointsList.appendChild(newViewpointItem);
      }
    });

    this.setupDraggableResizableModal(modal);
  }

  private setupDraggableResizableModal(modal: HTMLElement): void {
    // Implement draggable functionality for modal
    let isDragging = false;
    let startX: number, startY: number;

    const headerElement = modal.querySelector(
      ".bcf-modal-header"
    ) as HTMLElement;
    if (!headerElement) {
      console.warn("Modal header not found for draggable functionality");
      return;
    }

    headerElement.addEventListener("mousedown", (e: MouseEvent) => {
      isDragging = true;
      startX = e.clientX - modal.offsetLeft;
      startY = e.clientY - modal.offsetTop;
    });

    document.addEventListener("mousemove", (e: MouseEvent) => {
      if (isDragging) {
        const newX = e.clientX - startX;
        const newY = e.clientY - startY;
        modal.style.left = `${newX}px`;
        modal.style.top = `${newY}px`;
      }
    });

    document.addEventListener("mouseup", () => {
      isDragging = false;
    });

    // Implement resizable functionality for modal
    const resizer = document.createElement("div");
    resizer.className = "bcf-resizer";
    modal.appendChild(resizer);

    let isResizing = false;

    resizer.addEventListener("mousedown", (e: MouseEvent) => {
      isResizing = true;
      e.preventDefault();
    });

    document.addEventListener("mousemove", (e: MouseEvent) => {
      if (isResizing) {
        const newWidth = e.clientX - modal.offsetLeft;
        const newHeight = e.clientY - modal.offsetTop;
        modal.style.width = `${newWidth}px`;
        modal.style.height = `${newHeight}px`;
      }
    });

    document.addEventListener("mouseup", () => {
      isResizing = false;
    });
  }
}
