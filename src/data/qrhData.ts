export interface QRHDataPoint {
  pitch: number;
  thrust?: number; // %N1
  vs?: number; // V/S
  kias?: number;
  mach?: number;
  shaded?: boolean;
}

export interface QRHTable {
  name: string;
  description: string;
  weights: number[]; // 150, 200, 250, 300, 350
  rows: {
    label: string; // Altitude or Flap Position
    value: number; // Numeric value for interpolation (Altitude in FT or Flap index)
    data: (QRHDataPoint | null)[]; // One for each weight
  }[];
}

export const CLIMB_TABLE: QRHTable = {
  name: "Climb",
  description: "Flaps Up, Set Max Climb Thrust",
  weights: [160, 210, 260, 310, 360],
  rows: [
    { label: "40000 (.82M)", value: 40000, data: [{ pitch: 4.5, vs: 2200, mach: 0.82 }, { pitch: 4.0, vs: 800, mach: 0.82, shaded: true }, null, null, null] },
    { label: "30000 (280 KIAS)", value: 30000, data: [{ pitch: 6.0, vs: 3300, kias: 280 }, { pitch: 5.0, vs: 2300, kias: 280 }, { pitch: 5.0, vs: 1600, kias: 280 }, { pitch: 4.5, vs: 1200, kias: 280, shaded: true}, { pitch: 4.0, vs: 800, kias: 280, shaded: true }] },
    { label: "20000 (270 KIAS)", value: 20000, data: [{ pitch: 9.0, vs: 4700, kias: 270 }, { pitch: 8.0, vs: 3400, kias: 270 }, { pitch: 7.5, vs: 2500, kias: 270 }, { pitch: 7.5, vs: 1900, kias: 270 }, { pitch: 7.0, vs: 1300, kias: 270, shaded: true }] },
    { label: "10000 (270 KIAS)", value: 10000, data: [{ pitch: 13.0, vs: 6200, kias: 270 }, { pitch: 10.5, vs: 4500, kias: 270 }, { pitch: 10.0, vs: 3500, kias: 270 }, { pitch: 9.5, vs: 2700, kias: 270}, { pitch: 9.0, vs: 2100, kias: 270, shaded: true }] },
    { label: "SEA LEVEL (270 KIAS)", value: 0, data: [{ pitch: 16.5, vs: 7200, kias: 270 }, { pitch: 13.5, vs: 5300, kias: 270 }, { pitch: 12.0, vs: 4100, kias: 270 }, { pitch: 11.5, vs: 3300, kias: 270}, { pitch: 11.0, vs: 2700, kias: 270, shaded: true }] },
  ]
};

export const CRUISE_TABLE: QRHTable = {
  name: "Cruise",
  description: "Flaps Up, Set Thrust for Level Flight",
  weights: [160, 210, 260, 310, 360],
  rows: [
    { label: "40000 (.82M)", value: 40000, data: [{ pitch: 2.0, thrust: 80.2, mach: 0.82 }, { pitch: 3.0, thrust: 84.8, mach: 0.82 }, null, null, null] },
    { label: "35000 (280 KIAS)", value: 35000, data: [{ pitch: 1.5, thrust: 77.7, kias: 280 }, { pitch: 2.0, thrust: 80.4, kias: 280 }, { pitch: 2.5, thrust: 84.1, kias: 280 }, { pitch: 3.5, thrust: 90.4, kias: 280, shaded: true }, null] },
    { label: "30000 (280 KIAS)", value: 30000, data: [{ pitch: 1.5, thrust: 73.5, kias: 280 }, { pitch: 2.0, thrust: 76.0, kias: 280 }, { pitch: 3.0, thrust: 79.8, kias: 280 }, { pitch: 3.0, thrust: 84.2, kias: 280, shaded: true }, { pitch: 3.0, thrust: 88.5, kias: 280, shaded: true }] },
    { label: "25000 (280 KIAS)", value: 25000, data: [{ pitch: 1.5, thrust: 69.6, kias: 280 }, { pitch: 2.5, thrust: 72.1, kias: 280 }, { pitch: 3.0, thrust: 75.2, kias: 280 }, { pitch: 3.5, thrust: 79.3, kias: 280, shaded: true }, { pitch: 3.5, thrust: 83.4, kias: 280, shaded: true }] },
    { label: "20000 (270 KIAS)", value: 20000, data: [{ pitch: 1.5, thrust: 64.7, kias: 270 }, { pitch: 2.5, thrust: 67.3, kias: 270 }, { pitch: 3.5, thrust: 70.5, kias: 270 }, { pitch: 4.0, thrust: 74.6, kias: 270, shaded: true }, { pitch: 4.0, thrust: 78.7, kias: 270, shaded: true }] },
    { label: "15000 (270 KIAS)", value: 15000, data: [{ pitch: 1.5, thrust: 60.9, kias: 270 }, { pitch: 2.5, thrust: 63.3, kias: 270 }, { pitch: 3.5, thrust: 66.4, kias: 270 }, { pitch: 4.5, thrust: 69.7, kias: 270}, { pitch: 4.5, thrust: 74.1, kias: 270, shaded: true }] },
  ]
};

export const DESCENT_TABLE: QRHTable = {
  name: "Descent",
  description: "Flaps Up, Set Idle Thrust",
  weights: [160, 210, 260, 310, 360],
  rows: [
    { label: "40000 (.82M)", value: 40000, data: [{ pitch: -1.5, vs: -2900, mach: 0.82 }, { pitch: -0.5, vs: -2600, mach: 0.82 }, null, null, null] },
    { label: "30000 (280 KIAS)", value: 30000, data: [{ pitch: -1.5, vs: -2400, kias: 280 }, { pitch: -0.5, vs: -2000, kias: 280 }, { pitch: 0.5, vs: -1900, kias: 280 }, { pitch: 0.5, vs: -2100, kias: 280, shaded: true }, { pitch: 0.5, vs: -2500, kias: 280, shaded: true }] },
    { label: "20000 (270 KIAS)", value: 20000, data: [{ pitch: -1.5, vs: -1900, kias: 270 }, { pitch: 0.0, vs: -1700, kias: 270 }, { pitch: 1.0, vs: -1600, kias: 270 }, { pitch: 2.0, vs: -1500, kias: 270}, { pitch: 1.5, vs: -1600, kias: 270, shaded: true }] },
    { label: "10000 (270 KIAS)", value: 10000, data: [{ pitch: -1.5, vs: -1700, kias: 270 }, { pitch: 0.0, vs: -1500, kias: 270 }, { pitch: 1.0, vs: -1400, kias: 270 }, { pitch: 2.0, vs: -1400, kias: 270}, { pitch: 2.5, vs: -1400, kias: 270, shaded: true }] },
    { label: "SEA LEVEL (270 KIAS)", value: 0, data: [{ pitch: -2.0, vs: -1600, kias: 270 }, { pitch: -0.5, vs: -1300, kias: 270 }, { pitch: 1.0, vs: -1200, kias: 270 }, { pitch: 2.0, vs: -1200, kias: 270}, { pitch: 2.5, vs: -1200, kias: 270, shaded: true }] },
  ]
};

export const HOLDING_TABLE: QRHTable = {
  name: "Holding",
  description: "Flaps Up, Set Thrust for Level Flight",
  weights: [160, 210, 260, 310, 360],
  rows: [
    { label: "10000", value: 10000, data: [{ pitch: 4.0, thrust: 50.4, kias: 199 }, { pitch: 5.0, thrust: 55.8, kias: 217 }, { pitch: 5.5, thrust: 60.8, kias: 233 }, { pitch: 5.5, thrust: 65.5, kias: 255}, { pitch: 5.5, thrust: 69.5, kias: 275}] },
    { label: "5000", value: 5000, data: [{ pitch: 4.0, thrust: 46.7, kias: 199 }, { pitch: 5.0, thrust: 52.3, kias: 217 }, { pitch: 5.5, thrust: 56.9, kias: 232 }, { pitch: 5.5, thrust: 61.3, kias: 253}, { pitch: 5.5, thrust: 65.4, kias: 273}] },
  ]
};

export const TERMINAL_TABLE: QRHTable = {
  name: "Terminal Area (5000 FT)",
  description: "Set Thrust for Level Flight",
  weights: [160, 210, 260, 310, 360],
  rows: [
    { label: "FLAPS UP, GEAR UP (VREF30+80)", value: 0, data: [{ pitch: 4.5, thrust: 46.9, kias: 201 }, { pitch: 5.5, thrust: 52.6, kias: 217 }, { pitch: 6.0, thrust: 57.4, kias: 232 }, { pitch: 6.0, thrust: 61.9, kias: 248}, { pitch: 6.5, thrust: 66.2, kias: 264}] },
    { label: "FLAPS 1, GEAR UP (VREF30+60)", value: 1, data: [{ pitch: 6.0, thrust: 47.7, kias: 181 }, { pitch: 7.0, thrust: 53.6, kias: 197 }, { pitch: 7.5, thrust: 58.7, kias: 212 }, { pitch: 7.5, thrust: 63.6, kias: 228}, { pitch: 8.0, thrust: 67.8, kias: 244}] },
    { label: "FLAPS 5, GEAR UP (VREF30+40)", value: 5, data: [{ pitch: 5.5, thrust: 48.3, kias: 161 }, { pitch: 6.0, thrust: 54.3, kias: 177 }, { pitch: 6.5, thrust: 59.8, kias: 192 }, { pitch: 6.5, thrust: 64.5, kias: 208}, { pitch: 6.5, thrust: 68.9, kias: 224}] },
    { label: "FLAPS 15, GEAR UP (VREF30+20)", value: 15, data: [{ pitch: 6.0, thrust: 49.2, kias: 141 }, { pitch: 6.5, thrust: 55.6, kias: 157 }, { pitch: 7.0, thrust: 61.5, kias: 172 }, { pitch: 7.0, thrust: 66.3, kias: 188}, { pitch: 7.0, thrust: 70.9, kias: 204}] },
    { label: "FLAPS 20, GEAR DOWN (VREF30+20)", value: 20, data: [{ pitch: 4.5, thrust: 54.9, kias: 141 }, { pitch: 5.0, thrust: 61.7, kias: 157 }, { pitch: 5.5, thrust: 67.8, kias: 172 }, { pitch: 5.5, thrust: 73.2, kias: 188}, { pitch: 5.5, thrust: 77.9, kias: 204}] },
  ]
};

export const APPROACH_TABLE: QRHTable = {
  name: "Final Approach (1500 FT)",
  description: "Gear Down, Set Thrust for 3° Glideslope",
  weights: [160, 210, 260, 310, 360],
  rows: [
    { label: "FLAPS 20, GEAR DOWN (VREF20+10)", value: 20, data: [{ pitch: 1.0, thrust: 37.7, kias: 144 }, { pitch: 1.0, thrust: 42.4, kias: 164 }, { pitch: 1.5, thrust: 46.8, kias: 181 }, { pitch: 1.5, thrust: 50.6, kias: 196 }, { pitch: 2.0, thrust: 53.7, kias: 208 }] },
    { label: "FLAPS 25, GEAR DOWN (VREF25+10)", value: 25, data: [{ pitch: 1.5, thrust: 47.6, kias: 135 }, { pitch: 1.5, thrust: 53.0, kias: 154 }, { pitch: 2.0, thrust: 57.5, kias: 170 }, { pitch: 2.0, thrust: 61.6, kias: 184 }, { pitch: 2.0, thrust: 64.5, kias: 195 }] },
    { label: "FLAPS 30, GEAR DOWN (VREF30+10)", value: 30, data: [{ pitch: 1.0, thrust: 52.5, kias: 131 }, { pitch: 1.0, thrust: 57.7, kias: 147 }, { pitch: 1.5, thrust: 62.6, kias: 162 }, { pitch: 1.0, thrust: 68.2, kias: 178 }, { pitch: 1.0, thrust: 73.3, kias: 194 }] },
  ]
};

export const GO_AROUND_TABLE: QRHTable = {
  name: "Go-Around",
  description: "Flaps 20, Gear Up, Set Go-Around Thrust",
  weights: [160, 210, 260, 310, 360],
  rows: [
    { label: "10000", value: 10000, data: [{ pitch: 20.5, vs: 4600, kias: 139 }, { pitch: 15.5, vs: 3500, kias: 157 }, { pitch: 13.0, vs: 2600, kias: 172 }, { pitch: 10.5, vs: 2100, kias: 189}, { pitch: 9.0, vs: 1600, kias: 204}] },
    { label: "5000", value: 5000, data: [{ pitch: 26.0, vs: 5700, kias: 139 }, { pitch: 19.5, vs: 4400, kias: 157 }, { pitch: 16.0, vs: 3400, kias: 172 }, { pitch: 13.0, vs: 2800, kias: 189}, { pitch: 11.0, vs: 2300, kias: 204}] },
    { label: "SEA LEVEL", value: 0, data: [{ pitch: 30.5, vs: 6500, kias: 141 }, { pitch: 23.0, vs: 5100, kias: 157 }, { pitch: 18.5, vs: 4100, kias: 172 }, { pitch: 15.5, vs: 3400, kias: 188}, { pitch: 13.0, vs: 2800, kias: 204}] },
  ]
};

export const PASSENGER_TABLES: QRHTable[] = [
  CLIMB_TABLE,
  CRUISE_TABLE,
  DESCENT_TABLE,
  HOLDING_TABLE,
  TERMINAL_TABLE,
  APPROACH_TABLE,
  GO_AROUND_TABLE
];

export const FREIGHTER_CLIMB_TABLE: QRHTable = {
  name: "Climb",
  description: "Flaps Up, Set Max Climb Thrust",
  weights: [150, 200, 250, 300, 350],
  rows: [
    { label: "40000 (.82M)", value: 40000, data: [{ pitch: 5.0, vs: 2500, mach: 0.82 }, { pitch: 4.5, vs: 1500, mach: 0.82 }, null, null, null] },
    { label: "30000 (280 KIAS)", value: 30000, data: [{ pitch: 6.5, vs: 3700, kias: 280 }, { pitch: 5.5, vs: 2600, kias: 280 }, { pitch: 5.5, vs: 1800, kias: 280 }, { pitch: 5.0, vs: 1300, kias: 280, shaded: true}, { pitch: 4.5, vs: 900, kias: 280, shaded: true }] },
    { label: "20000 (270 KIAS)", value: 20000, data: [{ pitch: 9.5, vs: 5000, kias: 270 }, { pitch: 8.5, vs: 3600, kias: 270 }, { pitch: 8.0, vs: 2700, kias: 270 }, { pitch: 7.5, vs: 2000, kias: 270, shaded: true }, { pitch: 7.5, vs: 1400, kias: 270, shaded: true }] },
    { label: "10000 (270 KIAS)", value: 10000, data: [{ pitch: 14.0, vs: 6700, kias: 270 }, { pitch: 11.5, vs: 4900, kias: 270 }, { pitch: 10.0, vs: 3700, kias: 270 }, { pitch: 9.5, vs: 2900, kias: 270}, { pitch: 9.5, vs: 2200, kias: 270  }] },
    { label: "SEA LEVEL (270 KIAS)", value: 0, data: [{ pitch: 17.5, vs: 7800, kias: 270 }, { pitch: 14.5, vs: 5700, kias: 270 }, { pitch: 12.5, vs: 4400, kias: 270 }, { pitch: 11.5, vs: 3500, kias: 270}, { pitch: 11.0, vs: 2800, kias: 270 }] },
  ]
};

export const FREIGHTER_CRUISE_TABLE: QRHTable = {
  name: "Cruise",
  description: "Flaps Up, Set Thrust for Level Flight",
  weights: [150, 200, 250, 300, 350],
  rows: [
    { label: "40000 (.82M)", value: 40000, data: [{ pitch: 2.0, thrust: 78.6, mach: 0.82 }, { pitch: 3.0, thrust: 83.2, mach: 0.82 }, null, null, null] },
    { label: "35000 (.82M)", value: 35000, data: [{ pitch: 1.5, thrust: 76.5, mach: 0.82 }, { pitch: 2.0, thrust: 78.9, mach: 0.82 }, { pitch: 3.0, thrust: 82.8, mach: 0.82 }, { pitch: 3.5, thrust: 88.0, mach: 0.82}, null] },
    { label: "30000 (280 KIAS)", value: 30000, data: [{ pitch: 1.5, thrust: 72.6, kias: 280 }, { pitch: 2.5, thrust: 74.7, kias: 280 }, { pitch: 3.0, thrust: 78.1, kias: 280 }, { pitch: 3.5, thrust: 82.4, kias: 280, shaded: true }, { pitch: 3.5, thrust: 87.3, kias: 280, shaded: true }] },
    { label: "25000 (280 KIAS)", value: 25000, data: [{ pitch: 1.5, thrust: 68.6, kias: 280 }, { pitch: 2.5, thrust: 70.7, kias: 280 }, { pitch: 3.5, thrust: 73.8, kias: 280 }, { pitch: 4.0, thrust: 77.7, kias: 280, shaded: true }, { pitch: 4.0, thrust: 82.3, kias: 280, shaded: true }] },
    { label: "20000 (270 KIAS)", value: 20000, data: [{ pitch: 2.0, thrust: 63.4, kias: 270 }, { pitch: 2.5, thrust: 65.8, kias: 270 }, { pitch: 3.5, thrust: 69.0, kias: 270 }, { pitch: 4.5, thrust: 72.8, kias: 270 }, { pitch: 5.5, thrust: 77.4, kias: 270, shaded: true }] },
    { label: "15000 (270 KIAS)", value: 15000, data: [{ pitch: 1.5, thrust: 59.6, kias: 270 }, { pitch: 2.5, thrust: 61.8, kias: 270 }, { pitch: 3.5, thrust: 65.0, kias: 270 }, { pitch: 4.5, thrust: 68.2, kias: 270 }, { pitch: 5.5, thrust: 72.5, kias: 270, shaded: true }] },
  ]
};

export const FREIGHTER_DESCENT_TABLE: QRHTable = {
  name: "Descent",
  description: "Flaps Up, Set Idle Thrust",
  weights: [150, 200, 250, 300, 350],
  rows: [
    { label: "40000 (.82M)", value: 40000, data: [{ pitch: -1.5, vs: -2900, mach: 0.82 }, { pitch: 0.0, vs: -2600, mach: 0.82 }, null, null, null] },
    { label: "30000 (280 KIAS)", value: 30000, data: [{ pitch: -1.5, vs: -2500, kias: 280 }, { pitch: -0.5, vs: -2000, kias: 280 }, { pitch: 0.5, vs: -1900, kias: 280 }, { pitch: 1.0, vs: -1900, kias: 280, shaded: true }, { pitch: 0.5, vs: -2400, kias: 280, shaded: true }] },
    { label: "20000 (270 KIAS)", value: 20000, data: [{ pitch: -1.0, vs: -1900, kias: 270 }, { pitch: 0.5, vs: -1600, kias: 270 }, { pitch: 1.5, vs: -1500, kias: 270 }, { pitch: 2.5, vs: -1400, kias: 270}, { pitch: 3.0, vs: -1400, kias: 270, shaded: true }] },
    { label: "10000 (270 KIAS)", value: 10000, data: [{ pitch: -1.5, vs: -1700, kias: 270 }, { pitch: 0.0, vs: -1400, kias: 270 }, { pitch: 1.0, vs: -1300, kias: 270 }, { pitch: 2.0, vs: -1300, kias: 270}, { pitch: 3.0, vs: -1300, kias: 270, shaded: true }] },
    { label: "SEA LEVEL (270 KIAS)", value: 0, data: [{ pitch: -2.0, vs: -1500, kias: 270 }, { pitch: -0.5, vs: -1300, kias: 270 }, { pitch: 1.0, vs: -1200, kias: 270 }, { pitch: 2.0, vs: -1200, kias: 270}, { pitch: 3.0, vs: -1200, kias: 270}] },
  ]
};

export const FREIGHTER_HOLDING_TABLE: QRHTable = {
  name: "Holding",
  description: "Flaps Up, Set Thrust for Level Flight",
  weights: [150, 200, 250, 300, 350],
  rows: [
    { label: "10000", value: 10000, data: [{ pitch: 3.0, thrust: 50.2, kias: 216 }, { pitch: 4.5, thrust: 54.4, kias: 216 }, { pitch: 5.5, thrust: 59.1, kias: 226 }, { pitch: 6.0, thrust: 63.9, kias: 244}, { pitch: 6.0, thrust: 68.2, kias: 262}] },
    { label: "5000", value: 5000, data: [{ pitch: 3.0, thrust: 46.6, kias: 216 }, { pitch: 4.5, thrust: 50.9, kias: 216 }, { pitch: 5.5, thrust: 55.4, kias: 226 }, { pitch: 6.0, thrust: 59.7, kias: 244}, { pitch: 6.0, thrust: 64.2, kias: 262}] },
  ]
};

export const FREIGHTER_TERMINAL_TABLE: QRHTable = {
  name: "Terminal Area (5000 FT)",
  description: "Set Thrust for Level Flight",
  weights: [150, 200, 250, 300, 350],
  rows: [
    { label: "FLAPS UP, GEAR UP (VREF30+80)", value: 0, data: [{ pitch: 3.5, thrust: 47.0, kias: 220 }, { pitch: 5.0, thrust: 51.5, kias: 220 }, { pitch: 6.0, thrust: 56.1, kias: 226 }, { pitch: 6.0, thrust: 60.7, kias: 244}, { pitch: 6.5, thrust: 65.0, kias: 262}] },
    { label: "FLAPS 1, GEAR UP (VREF30+60)", value: 1, data: [{ pitch: 4.5, thrust: 47.9, kias: 200 }, { pitch: 6.5, thrust: 52.4, kias: 200 }, { pitch: 7.5, thrust: 57.6, kias: 206 }, { pitch: 8.0, thrust: 62.6, kias: 224}, { pitch: 8.0, thrust: 66.8, kias: 242}] },
    { label: "FLAPS 5, GEAR UP (VREF30+40)", value: 5, data: [{ pitch: 3.5, thrust: 48.3, kias: 180 }, { pitch: 5.5, thrust: 53.0, kias: 180 }, { pitch: 6.5, thrust: 58.4, kias: 186 }, { pitch: 6.5, thrust: 63.4, kias: 204}, { pitch: 6.5, thrust: 67.7, kias: 222}] },
    { label: "FLAPS 15, GEAR UP (VREF30+20)", value: 15, data: [{ pitch: 3.5, thrust: 48.3, kias: 160 }, { pitch: 6.0, thrust: 54.0, kias: 160 }, { pitch: 7.5, thrust: 60.5, kias: 166 }, { pitch: 7.5, thrust: 65.3, kias: 184}, { pitch: 7.0, thrust: 69.8, kias: 202}] },
    { label: "FLAPS 20, GEAR DOWN (VREF30+20)", value: 20, data: [{ pitch: 2.0, thrust: 55.7, kias: 160 }, { pitch: 4.5, thrust: 60.5, kias: 160 }, { pitch: 6.0, thrust: 66.1, kias: 166 }, { pitch: 5.5, thrust: 71.7, kias: 184}, { pitch: 5.5, thrust: 76.6, kias: 202}] },
  ]
};

export const FREIGHTER_APPROACH_TABLE: QRHTable = {
  name: "Final Approach (1500 FT)",
  description: "Gear Down, Set Thrust for 3° Glideslope",
  weights: [150, 200, 250, 300, 350],
  rows: [
    { label: "FLAPS 20, GEAR DOWN (VREF20+10)", value: 20, data: [{ pitch: 0.0, thrust: 37.3, kias: 150 }, { pitch: 1.5, thrust: 40.5, kias: 157 }, { pitch: 2.0, thrust: 44.9, kias: 174 }, { pitch: 2.0, thrust: 49.0, kias: 189 }, { pitch: 2.5, thrust: 52.2, kias: 201 }] },
    { label: "FLAPS 25, GEAR DOWN (VREF25+10)", value: 25, data: [{ pitch: 0.0, thrust: 52.7, kias: 150 }, { pitch: 1.0, thrust: 50.5, kias: 150 }, { pitch: 1.5, thrust: 54.5, kias: 165 }, { pitch: 1.5, thrust: 58.9, kias: 180 }, { pitch: 2.0, thrust: 62.8, kias: 191 }] },
    { label: "FLAPS 30, GEAR DOWN (VREF30+10)", value: 30, data: [{ pitch: -1.0, thrust: 58.2, kias: 150 }, { pitch: 0.5, thrust: 57.4, kias: 150 }, { pitch: 1.0, thrust: 60.1, kias: 156 }, { pitch: 1.0, thrust: 65.3, kias: 174 }, { pitch: 1.0, thrust: 70.9, kias: 192, shaded: true }] },
  ]
};

export const FREIGHTER_GO_AROUND_TABLE: QRHTable = {
  name: "Go-Around",
  description: "Flaps 20, Gear Up, Set Go-Around Thrust",
  weights: [150, 200, 250, 300, 350],
  rows: [
    { label: "10000", value: 10000, data: [{ pitch: 22.0, vs: 5000, kias: 136 }, { pitch: 17.0, vs: 3600, kias: 151 }, { pitch: 14.0, vs: 2800, kias: 167 }, { pitch: 11.5, vs: 2200, kias: 185}, { pitch: 9.5, vs: 1700, kias: 203}] },
    { label: "5000", value: 5000, data: [{ pitch: 25.5, vs: 6500, kias: 149 }, { pitch: 21.0, vs: 4600, kias: 151 }, { pitch: 17.0, vs: 3600, kias: 167 }, { pitch: 14.0, vs: 2900, kias: 184}, { pitch: 11.5, vs: 2400, kias: 202}] },
    { label: "SEA LEVEL", value: 0, data: [{ pitch: 29.0, vs: 7700, kias: 160 }, { pitch: 23.5, vs: 5500, kias: 160 }, { pitch: 20.0, vs: 4200, kias: 166 }, { pitch: 16.5, vs: 3500, kias: 184}, { pitch: 13.5, vs: 3000, kias: 202}] },
  ]
};

export const FREIGHTER_TABLES: QRHTable[] = [
  FREIGHTER_CLIMB_TABLE,
  FREIGHTER_CRUISE_TABLE,
  FREIGHTER_DESCENT_TABLE,
  FREIGHTER_HOLDING_TABLE,
  FREIGHTER_TERMINAL_TABLE,
  FREIGHTER_APPROACH_TABLE,
  FREIGHTER_GO_AROUND_TABLE
];

export const ALL_TABLES = PASSENGER_TABLES;

