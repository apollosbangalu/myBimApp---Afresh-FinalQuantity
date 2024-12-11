// src/components/BCF/BCFDialog.ts

import * as OBC from "@thatopen/components";
import { Topic, BCFTopics } from "./index";

export class BCFDialog {
  private components: OBC.Components;
  private bcfTopics: BCFTopics;
  private dialogElement: HTMLElement;

  constructor(components: OBC.Components) {
    this.components = components;
    this.bcfTopics = this.components.get(BCFTopics);
    this.dialogElement = this.createDialogElement();
    document.body.appendChild(this.dialogElement);
    this.setupDraggableResizable();
  }

  // Create the dialog element with initial styles
  private createDialogElement(): HTMLElement {
    const dialog = document.createElement("div");
    dialog.id = "bcf-dialog";
    dialog.style.display = "none";
    dialog.style.position = "fixed";
    dialog.style.zIndex = "1000";
    dialog.style.left = "50%";
    dialog.style.top = "50%";
    dialog.style.transform = "translate(-50%, -50%)";
    dialog.style.backgroundColor = "var(--bim-ui_bg-base)";
    dialog.style.padding = "20px";
    dialog.style.borderRadius = "8px";
    dialog.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1)";
    dialog.style.minWidth = "300px";
    dialog.style.minHeight = "400px";
    dialog.style.resize = "both";
    dialog.style.overflow = "auto";
    return dialog;
  }

  // Set up draggable and resizable functionality
  private setupDraggableResizable(): void {
    let isDragging = false;
    let startX: number, startY: number;

    this.dialogElement.addEventListener("mousedown", (e: MouseEvent) => {
      if (e.target === this.dialogElement) {
        isDragging = true;
        startX = e.clientX - this.dialogElement.offsetLeft;
        startY = e.clientY - this.dialogElement.offsetTop;
      }
    });

    document.addEventListener("mousemove", (e: MouseEvent) => {
      if (isDragging) {
        const newX = e.clientX - startX;
        const newY = e.clientY - startY;
        this.dialogElement.style.left = `${newX}px`;
        this.dialogElement.style.top = `${newY}px`;
        this.dialogElement.style.transform = "none";
      }
    });

    document.addEventListener("mouseup", () => {
      isDragging = false;
    });
  }

  // Show the dialog with topic data or as a new topic form
  public show(topic?: Topic): void {
    this.dialogElement.innerHTML = this.createForm(topic);
    this.dialogElement.style.display = "block";
    this.setupEventListeners(topic);
  }

  // Create the form HTML for the dialog
  private createForm(topic?: Topic): string {
    return `
      <form id="bcf-topic-form" class="bcf-form">
        <div class="form-group">
          <label for="title">Title</label>
          <input type="text" id="title" name="title" value="${
            topic?.title || ""
          }" required>
        </div>
        <div class="form-group">
          <label for="type">Type</label>
          <select id="type" name="type" required>
            ${Array.from(this.bcfTopics.config.types)
              .map(
                (type) =>
                  `<option value="${type}" ${
                    topic?.type === type ? "selected" : ""
                  }>${type}</option>`
              )
              .join("")}
          </select>
        </div>
        <div class="form-group">
          <label for="status">Status</label>
          <select id="status" name="status" required>
            ${Array.from(this.bcfTopics.config.statuses)
              .map(
                (status) =>
                  `<option value="${status}" ${
                    topic?.status === status ? "selected" : ""
                  }>${status}</option>`
              )
              .join("")}
          </select>
        </div>
        <div class="form-group">
          <label for="priority">Priority</label>
          <select id="priority" name="priority">
            ${Array.from(this.bcfTopics.config.priorities)
              .map(
                (priority) =>
                  `<option value="${priority}" ${
                    topic?.priority === priority ? "selected" : ""
                  }>${priority}</option>`
              )
              .join("")}
          </select>
        </div>
        <div class="form-group">
          <label for="author">Author</label>
          <input type="text" id="author" name="author" value="${
            topic?.creationAuthor || this.bcfTopics.config.author
          }">
        </div>
        <div class="form-group">
          <label for="assignedTo">Assigned To</label>
          <input type="text" id="assignedTo" name="assignedTo" value="${
            topic?.assignedTo || ""
          }">
        </div>
        <div class="form-group">
          <label for="dueDate">Due Date</label>
          <input type="date" id="dueDate" name="dueDate" value="${
            topic?.dueDate?.toISOString().split("T")[0] || ""
          }">
        </div>
        <div class="form-group">
          <label for="description">Description</label>
          <textarea id="description" name="description" rows="4">${
            topic?.description || ""
          }</textarea>
        </div>
        <div class="form-actions">
          <button type="button" id="cancel-topic" title="Cancel changes and close the form">Cancel</button>
          <button type="submit" id="save-topic" title="Save the topic">Save</button>
        </div>
      </form>
    `;
  }

  // Set up event listeners for the form
  private setupEventListeners(topic?: Topic): void {
    const form = this.dialogElement.querySelector(
      "#bcf-topic-form"
    ) as HTMLFormElement;
    const cancelButton = this.dialogElement.querySelector(
      "#cancel-topic"
    ) as HTMLButtonElement;

    cancelButton.addEventListener("click", () => {
      this.dialogElement.style.display = "none";
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const topicData: Partial<Topic> = {
        title: formData.get("title") as string,
        type: formData.get("type") as string,
        status: formData.get("status") as string,
        priority: formData.get("priority") as string,
        assignedTo: formData.get("assignedTo") as string,
        creationAuthor: formData.get("author") as string,
        dueDate: formData.get("dueDate")
          ? new Date(formData.get("dueDate") as string)
          : undefined,
        description: formData.get("description") as string,
      };

      if (topic) {
        // Update existing topic
        topic.set(topicData);
      } else {
        // Create new topic
        this.bcfTopics.create(topicData);
      }

      this.dialogElement.style.display = "none";
      document.dispatchEvent(new CustomEvent("bcfTopicSaved"));
    });
  }
}
