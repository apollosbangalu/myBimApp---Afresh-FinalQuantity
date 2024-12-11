// // src/components/MeasurementManager.ts

// import * as OBC from "@thatopen/components";
// import * as OBCF from "@thatopen/components-front";

// export class MeasurementManager {
//   private world: OBC.World;
//   public lengthMeasurement: OBCF.LengthMeasurement;
//   public volumeMeasurement: OBCF.VolumeMeasurement;
//   public edgeMeasurement: OBCF.EdgeMeasurement;

//   constructor(components: OBC.Components, world: OBC.World) {
//     this.world = world;
//     this.lengthMeasurement = components.get(OBCF.LengthMeasurement);
//     this.volumeMeasurement = components.get(OBCF.VolumeMeasurement);
//     this.edgeMeasurement = components.get(OBCF.EdgeMeasurement);
//     this.initMeasurements();
//   }

//   private initMeasurements() {
//     // Length Measurement setup
//     this.lengthMeasurement.world = this.world;
//     this.lengthMeasurement.enabled = false;
//     this.lengthMeasurement.snapDistance = 1;

//     // Volume Measurement setup
//     this.volumeMeasurement.world = this.world;
//     this.volumeMeasurement.enabled = false;

//     // Edge Measurement setup
//     this.edgeMeasurement.world = this.world;
//     this.edgeMeasurement.enabled = false;
//   }

//   public createLengthMeasurement() {
//     if (this.lengthMeasurement.enabled) {
//       this.lengthMeasurement.create();
//     }
//   }

//   public createEdgeMeasurement() {
//     if (this.edgeMeasurement.enabled) {
//       this.edgeMeasurement.create();
//     }
//   }

//   public deleteMeasurement() {
//     this.lengthMeasurement.delete();
//     this.edgeMeasurement.delete();
//     this.volumeMeasurement.clear();
//   }

//   public deleteAllMeasurements() {
//     this.lengthMeasurement.deleteAll();
//     this.edgeMeasurement.deleteAll();
//     this.volumeMeasurement.clear();
//   }

//   public setLengthMeasurementEnabled(enabled: boolean) {
//     this.lengthMeasurement.enabled = enabled;
//   }

//   public setVolumeMeasurementEnabled(enabled: boolean) {
//     this.volumeMeasurement.enabled = enabled;
//   }

//   public setEdgeMeasurementEnabled(enabled: boolean) {
//     this.edgeMeasurement.enabled = enabled;
//   }

//   public setLengthMeasurementVisible(visible: boolean) {
//     this.lengthMeasurement.visible = visible;
//   }

//   public setLengthMeasurementColor(color: string) {
//     this.lengthMeasurement.color.set(color);
//   }

//   public isVolumeMeasurementEnabled(): boolean {
//     return this.volumeMeasurement.enabled;
//   }

//   public getVolumeFromFragments(event: any) {
//     if (this.volumeMeasurement.enabled) {
//       return this.volumeMeasurement.getVolumeFromFragments(event);
//     }
//     return null;
//   }
// }

// src/components/MeasurementManager.ts

// src/components/MeasurementManager.ts

import * as OBC from "@thatopen/components";
import * as OBCF from "@thatopen/components-front";

export class MeasurementManager {
  private world: OBC.World;
  public lengthMeasurement: OBCF.LengthMeasurement;
  public volumeMeasurement: OBCF.VolumeMeasurement;
  public edgeMeasurement: OBCF.EdgeMeasurement;
  public areaMeasurement: OBCF.AreaMeasurement;
  public angleMeasurement: OBCF.AngleMeasurement;

  constructor(components: OBC.Components, world: OBC.World) {
    this.world = world;
    this.lengthMeasurement = components.get(OBCF.LengthMeasurement);
    this.volumeMeasurement = components.get(OBCF.VolumeMeasurement);
    this.edgeMeasurement = components.get(OBCF.EdgeMeasurement);
    this.areaMeasurement = components.get(OBCF.AreaMeasurement);
    this.angleMeasurement = components.get(OBCF.AngleMeasurement);
    this.initMeasurements();
  }

  private initMeasurements() {
    // Length Measurement setup
    this.lengthMeasurement.world = this.world;
    this.lengthMeasurement.enabled = false;
    this.lengthMeasurement.snapDistance = 1;

    // Volume Measurement setup
    this.volumeMeasurement.world = this.world;
    this.volumeMeasurement.enabled = false;

    // Edge Measurement setup
    this.edgeMeasurement.world = this.world;
    this.edgeMeasurement.enabled = false;

    // Area Measurement setup
    this.areaMeasurement.world = this.world;
    this.areaMeasurement.enabled = false;

    // Angle Measurement setup
    this.angleMeasurement.world = this.world;
    this.angleMeasurement.enabled = false;
  }

  // Creation methods
  public createLengthMeasurement() {
    if (this.lengthMeasurement.enabled) {
      this.lengthMeasurement.create();
    }
  }

  public createEdgeMeasurement() {
    if (this.edgeMeasurement.enabled) {
      this.edgeMeasurement.create();
    }
  }

  public createAreaMeasurement() {
    if (this.areaMeasurement.enabled) {
      this.areaMeasurement.create();
    }
  }

  public createAngleMeasurement() {
    if (this.angleMeasurement.enabled) {
      this.angleMeasurement.create();
    }
  }

  // Delete methods
  public deleteMeasurement() {
    this.lengthMeasurement.delete();
    this.edgeMeasurement.delete();
    this.volumeMeasurement.clear();
    this.areaMeasurement.delete();
    this.angleMeasurement.delete();
  }

  public deleteAllMeasurements() {
    this.lengthMeasurement.deleteAll();
    this.edgeMeasurement.deleteAll();
    this.volumeMeasurement.clear();
    this.areaMeasurement.deleteAll();
    this.angleMeasurement.deleteAll();
  }

  // Enable/Disable methods
  public setLengthMeasurementEnabled(enabled: boolean) {
    this.lengthMeasurement.enabled = enabled;
  }

  public setVolumeMeasurementEnabled(enabled: boolean) {
    this.volumeMeasurement.enabled = enabled;
  }

  public setEdgeMeasurementEnabled(enabled: boolean) {
    this.edgeMeasurement.enabled = enabled;
  }

  public setAreaMeasurementEnabled(enabled: boolean) {
    this.areaMeasurement.enabled = enabled;
  }

  public setAngleMeasurementEnabled(enabled: boolean) {
    this.angleMeasurement.enabled = enabled;
  }

  // Style methods - only for supported measurement types
  public setMeasurementColor(color: string) {
    // Only set color for LengthMeasurement as it's confirmed to support it
    if (this.lengthMeasurement && this.lengthMeasurement.color) {
      this.lengthMeasurement.color.set(color);
    }
  }

  // State check methods
  public isVolumeMeasurementEnabled(): boolean {
    return this.volumeMeasurement.enabled;
  }

  public getVolumeFromFragments(event: any) {
    if (this.volumeMeasurement.enabled) {
      return this.volumeMeasurement.getVolumeFromFragments(event);
    }
    return null;
  }

  // Reset all measurements
  public reset() {
    this.deleteAllMeasurements();
    this.lengthMeasurement.enabled = false;
    this.edgeMeasurement.enabled = false;
    this.volumeMeasurement.enabled = false;
    this.areaMeasurement.enabled = false;
    this.angleMeasurement.enabled = false;
  }
}
