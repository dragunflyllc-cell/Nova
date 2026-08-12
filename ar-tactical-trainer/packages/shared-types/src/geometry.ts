/** Right-handed, meters, matching Unity world space (x right, y up, z forward). */
export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

/** A placement is either a raw world position (open-ground drills) or a
 * reference to a persistent AR anchor captured during a facility scan
 * (`Scanning/FacilityScanner.cs`), so targets stay put across sessions in
 * the same building. Exactly one of the two must be set. */
export type SpatialAnchor =
  | { kind: "world"; position: Vec3; rotationYDeg: number }
  | { kind: "facilityAnchor"; anchorId: string; offset: Vec3; rotationYDeg: number };
