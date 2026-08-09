export interface Facility {
  id: string;
  orgId: string;
  name: string;
  createdAt: string;
}

/** Result of an on-device scan (`Scanning/FacilityScanner.cs`). `meshAssetUrl`
 * points at the uploaded mesh (glTF); `anchors` are the named, persistent
 * points a scenario's `TargetPlacement`s can reference so target locations
 * survive across sessions in the same building. */
export interface ScanLayout {
  id: string;
  facilityId: string;
  meshAssetUrl: string;
  anchors: { anchorId: string; label: string; position: import("./geometry.js").Vec3 }[];
  capturedAt: string;
  capturedByOperatorId: string;
}
