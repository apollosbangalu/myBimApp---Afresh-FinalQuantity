// src/global.d.ts
// This file is used to declare global variables and types that can be used in the project.

declare global {
  interface EventListener {
    (evt: Event): void;
  }
}

declare global {
  interface Window {
    quantitiesClickListenerAdded?: boolean;
  }
}

export {};
