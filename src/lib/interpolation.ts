import { QRHDataPoint, QRHTable } from "../data/qrhData";

export type InterpolationType = "EXACT" | "LINEAR_WEIGHT" | "LINEAR_ROW" | "BILINEAR" | "EXTRAPOLATED";

export interface InterpolationResult {
  result: QRHDataPoint;
  type: InterpolationType;
  weightIndices: [number, number];
  rowIndices: [number, number];
  weightWeights: [number, number];
  rowWeights: [number, number];
  isShaded: boolean;
}

export function interpolate(table: QRHTable, targetValue: number, targetWeight: number): InterpolationResult | null {
  // Find weight indices
  let w1 = -1, w2 = -1;
  let weightFactor = 0;
  let weightExtrapolated = false;
  const exactWeightIdx = table.weights.findIndex(w => Math.abs(targetWeight - w) < 0.001);

  if (exactWeightIdx !== -1) {
    w1 = exactWeightIdx;
    w2 = exactWeightIdx;
    weightFactor = 0;
  } else {
    for (let i = 0; i < table.weights.length - 1; i++) {
      if (targetWeight >= table.weights[i] && targetWeight <= table.weights[i + 1]) {
        w1 = i;
        w2 = i + 1;
        break;
      }
    }
    // Extrapolation for weight
    if (w1 === -1) {
      weightExtrapolated = true;
      if (targetWeight < table.weights[0]) {
        w1 = 0; w2 = 1;
      } else {
        w1 = table.weights.length - 2; w2 = table.weights.length - 1;
      }
    }
    weightFactor = (targetWeight - table.weights[w1]) / (table.weights[w2] - table.weights[w1]);
  }

  // Find row indices (Altitude or Flap)
  let r1 = -1, r2 = -1;
  let rowFactor = 0;
  let rowExtrapolated = false;
  const isDescending = table.rows[0].value > table.rows[table.rows.length - 1].value;
  const exactRowIdx = table.rows.findIndex(r => Math.abs(targetValue - r.value) < 0.001);

  if (exactRowIdx !== -1) {
    r1 = exactRowIdx;
    r2 = exactRowIdx;
    rowFactor = 0;
  } else {
    for (let i = 0; i < table.rows.length - 1; i++) {
      const v1 = table.rows[i].value;
      const v2 = table.rows[i + 1].value;
      if (isDescending) {
        if (targetValue <= v1 && targetValue >= v2) {
          r1 = i; r2 = i + 1;
          break;
        }
      } else {
        if (targetValue >= v1 && targetValue <= v2) {
          r1 = i; r2 = i + 1;
          break;
        }
      }
    }

    // Extrapolation for row
    if (r1 === -1) {
      rowExtrapolated = true;
      if (isDescending) {
        if (targetValue > table.rows[0].value) {
          r1 = 0; r2 = 1;
        } else {
          r1 = table.rows.length - 2; r2 = table.rows.length - 1;
        }
      } else {
        if (targetValue < table.rows[0].value) {
          r1 = 0; r2 = 1;
        } else {
          r1 = table.rows.length - 2; r2 = table.rows.length - 1;
        }
      }
    }
    rowFactor = (targetValue - table.rows[r1].value) / (table.rows[r2].value - table.rows[r1].value);
  }

  const isExactWeight = w1 === w2;
  const isExactRow = r1 === r2;

  // Helper to check if a point is shaded
  const checkShaded = (rowIdx: number, weightIdx: number) => {
    return table.rows[rowIdx]?.data[weightIdx]?.shaded ?? false;
  };

  if (isExactWeight && isExactRow) {
    const point = table.rows[r1].data[w1];
    if (point) {
      return {
        result: { ...point },
        type: weightExtrapolated || rowExtrapolated ? "EXTRAPOLATED" : "EXACT",
        weightIndices: [w1, w1],
        rowIndices: [r1, r1],
        weightWeights: [1, 0],
        rowWeights: [1, 0],
        isShaded: point.shaded ?? false
      };
    }
  }

  const p11 = table.rows[r1].data[w1];
  const p12 = table.rows[r1].data[w2];
  const r2_row = table.rows[r2];
  const p21 = r2_row.data[w1];
  const p22 = r2_row.data[w2];

  // Determine if the result is in a shaded area
  // If the interpolation is between shaded and non-shaded, we consider it shaded if the "shaded" weight is significant
  // or just if any of the points are shaded. Usually, shading is a hard boundary.
  // For simplicity, if the target weight is in a shaded range, it's shaded.
  const isShaded = (p11?.shaded && (1 - weightFactor) > 0.5) || (p12?.shaded && weightFactor > 0.5) || 
                   (p21?.shaded && (1 - weightFactor) > 0.5) || (p22?.shaded && weightFactor > 0.5);

  if (!p11 || !p12 || !p21 || !p22) {
    if (isExactWeight && p11 && p21) {
      const interpolateLinear = (v1: number, v2: number) => v1 + rowFactor * (v2 - v1);
      const res: QRHDataPoint = {
        pitch: Number(interpolateLinear(p11.pitch, p21.pitch).toFixed(1))
      };
      if (p11.thrust !== undefined && p21.thrust !== undefined) res.thrust = Number(interpolateLinear(p11.thrust, p21.thrust).toFixed(1));
      if (p11.vs !== undefined && p21.vs !== undefined) res.vs = Math.round(interpolateLinear(p11.vs, p21.vs));
      if (p11.kias !== undefined && p21.kias !== undefined) res.kias = Math.round(interpolateLinear(p11.kias, p21.kias));
      if (p11.mach !== undefined && p21.mach !== undefined) res.mach = Number(interpolateLinear(p11.mach, p21.mach).toFixed(3));
      return {
        result: res,
        type: weightExtrapolated || rowExtrapolated ? "EXTRAPOLATED" : "LINEAR_ROW",
        weightIndices: [w1, w1],
        rowIndices: [r1, r2],
        weightWeights: [1, 0],
        rowWeights: [1 - rowFactor, rowFactor],
        isShaded: (p11.shaded && (1 - rowFactor) > 0.5) || (p21.shaded && rowFactor > 0.5)
      };
    }
    if (isExactRow && p11 && p12) {
      const interpolateLinear = (v1: number, v2: number) => v1 + weightFactor * (v2 - v1);
      const res: QRHDataPoint = {
        pitch: Number(interpolateLinear(p11.pitch, p12.pitch).toFixed(1))
      };
      if (p11.thrust !== undefined && p12.thrust !== undefined) res.thrust = Number(interpolateLinear(p11.thrust, p12.thrust).toFixed(1));
      if (p11.vs !== undefined && p12.vs !== undefined) res.vs = Math.round(interpolateLinear(p11.vs, p12.vs));
      if (p11.kias !== undefined && p12.kias !== undefined) res.kias = Math.round(interpolateLinear(p11.kias, p12.kias));
      if (p11.mach !== undefined && p12.mach !== undefined) res.mach = Number(interpolateLinear(p11.mach, p12.mach).toFixed(3));
      return {
        result: res,
        type: weightExtrapolated || rowExtrapolated ? "EXTRAPOLATED" : "LINEAR_WEIGHT",
        weightIndices: [w1, w2],
        rowIndices: [r1, r1],
        weightWeights: [1 - weightFactor, weightFactor],
        rowWeights: [1, 0],
        isShaded: (p11.shaded && (1 - weightFactor) > 0.5) || (p12.shaded && weightFactor > 0.5)
      };
    }
    return null;
  }

  const interpolateValue = (v11: number, v12: number, v21: number, v22: number) => {
    const row1 = v11 + weightFactor * (v12 - v11);
    const row2 = v21 + weightFactor * (v22 - v21);
    return row1 + rowFactor * (row2 - row1);
  };

  const result: QRHDataPoint = {
    pitch: Number(interpolateValue(p11.pitch, p12.pitch, p21.pitch, p22.pitch).toFixed(1)),
  };

  if (p11.thrust !== undefined && p12.thrust !== undefined && p21.thrust !== undefined && p22.thrust !== undefined) {
    result.thrust = Number(interpolateValue(p11.thrust, p12.thrust, p21.thrust, p22.thrust).toFixed(1));
  }
  if (p11.vs !== undefined && p12.vs !== undefined && p21.vs !== undefined && p22.vs !== undefined) {
    result.vs = Math.round(interpolateValue(p11.vs, p12.vs, p21.vs, p22.vs));
  }
  if (p11.kias !== undefined && p12.kias !== undefined && p21.kias !== undefined && p22.kias !== undefined) {
    result.kias = Math.round(interpolateValue(p11.kias, p12.kias, p21.kias, p22.kias));
  }
  if (p11.mach !== undefined && p12.mach !== undefined && p21.mach !== undefined && p22.mach !== undefined) {
    result.mach = Number(interpolateValue(p11.mach, p12.mach, p21.mach, p22.mach).toFixed(3));
  }

  let type: InterpolationType = weightExtrapolated || rowExtrapolated ? "EXTRAPOLATED" : "BILINEAR";
  if (type !== "EXTRAPOLATED") {
    if (isExactWeight) type = "LINEAR_ROW";
    else if (isExactRow) type = "LINEAR_WEIGHT";
  }

  return {
    result,
    type,
    weightIndices: [w1, w2],
    rowIndices: [r1, r2],
    weightWeights: [1 - weightFactor, weightFactor],
    rowWeights: [1 - rowFactor, rowFactor],
    isShaded
  };
}
