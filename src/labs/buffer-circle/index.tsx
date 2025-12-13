import * as turf from "@turf/turf";
import type { Lab } from "../../types/lab";

export const bufferCircleLab: Lab = {
  uniqueId: "bufferCircleLab",
  meta: {
    title: "バッファ（円形）",
    description: "点の周りに円形のバッファを作成します。",
    initialViewState: {
      longitude: 0,
      latitude: 0,
      zoom: 4,
    },
  },
  state: {
    clickedCoords: null as [number, number] | null,
    radiusKm: 10,
    circleSteps: 64,
  },
  compute: (state) => {
    /*
    Turf.jsで触るべき関数（＝実装の核）
    
    1) turf.buffer（バッファ生成）
      実験：同じ中心点・同じ半径で、結果がどう変わるか観察
      学びの焦点：距離（km）が面（ポリゴン）になる／場所によって歪みが出る
      関連するアルゴリズム／考え方（名前だけ）
        Buffer (Offset curve)
        Minkowski sum（概念としてのバッファ）
        Geodesic vs Planar buffer（“測地線バッファ”と“平面バッファ”の対比）
    2) turf.circle（円の近似ポリゴン生成）
      steps（分割数）をスライダーで変えて、多角形近似の精度を体感
      学びの焦点：円は実装上は多角形／精度とコストのトレードオフ
      関連するアルゴリズム／考え方
        Polygonal approximation（円の多角形近似）
        Discretization / Sampling（離散化）
    3) turf.area（面積）
      buffer と circle の面積を比較
      緯度・半径・steps でどう変動するかを観察
      関連するアルゴリズム／考え方
        Spherical area（球面上の面積）
        (参考) Shoelace formula（平面多角形の面積：前後の学習に繋がります）
    */
    const { clickedCoords, radiusKm, circleSteps } = state;
    if (clickedCoords) {
      const point = turf.point(clickedCoords);
      const buffer = turf.buffer(point, radiusKm, { units: "kilometers" });
      const circle = turf.circle(clickedCoords, radiusKm, {
        steps: circleSteps,
        units: "kilometers",
      });
      const results = [];
      if (buffer) {
        const bufferArea = turf.area(buffer);
        buffer["properties"] = { description: "Buffer (Turf.js)", area: bufferArea };
        results.push({
          type: "FeatureCollection" as const,
          features: [buffer],
        });
      }
      if (circle) {
        const circleArea = turf.area(circle);
        circle["properties"] = { description: "Circle (Turf.js)", area: circleArea };
        results.push({
          type: "FeatureCollection" as const,
          features: [circle],
        });
      }
      return results;
    } else {
      return null;
    }
  },
  Panel: (state, computeResult, setNewState) => {
    const { clickedCoords, radiusKm, circleSteps } = state;
    const bufferArea = computeResult && Array.isArray(computeResult) ? computeResult[0].features[0].properties?.area : null;
    const circleArea = computeResult && Array.isArray(computeResult) ? computeResult[1].features[0].properties?.area : null;

    return (
      <div>
        <h2>バッファ（円形）実験パネル</h2>
        <div>
          <label>
            バッファ半径 (km):
            <input
              type="number"
              value={radiusKm}
              onChange={(e) => {
                setNewState?.({
                  ...state,
                  radiusKm: parseFloat(e.target.value),
                });
              }}
            />
          </label>
        </div>
        <div>
          <label>
            円の分割数 (steps):
            <input
              type="number"
              value={circleSteps}
              onChange={(e) => {
                setNewState?.({
                  ...state,
                  circleSteps: parseInt(e.target.value, 10),
                });
              }}
            />
          </label>
        </div>
        <div>
          <b>クリック座標:</b>{" "}
          {clickedCoords
            ? `[${clickedCoords[0].toFixed(6)}, ${clickedCoords[1].toFixed(6)}]`
            : "なし"}
        </div>
        {bufferArea !== null && circleArea !== null && (
          <div>
            <h3>面積比較</h3>
            <div>バッファ面積: {bufferArea.toFixed(2)} 平方メートル</div>
            <div>円面積: {circleArea.toFixed(2)} 平方メートル</div>
          </div>
        )}
      </div>
    );
  },
};
