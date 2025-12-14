import * as turf from "@turf/turf";
import type { Lab } from "../../types/lab";

export const bufferCircleLab: Lab = {
  uniqueId: "bufferCircleLab",
  meta: {
    title: "バッファ vs 円",
    description: "点の周りに円形のバッファを作成します。",
    initialViewState: {
      longitude: 0,
      latitude: 0,
      zoom: 4,
    },
  },
  state: {
    clickedCoords: null as [number, number] | null,
    radiusKm: 1000,
    circleSteps: 6,
  },
  compute: (state) => {
    const { clickedCoords, radiusKm, circleSteps } = state;
    if (clickedCoords) {
      const point = turf.point(clickedCoords);
      const buffer = turf.buffer(point, radiusKm, {
        steps: circleSteps,
        units: "kilometers",
      });
      const circle = turf.circle(clickedCoords, radiusKm, {
        steps: circleSteps,
        units: "kilometers",
      });
      const results = [];
      if (buffer) {
        const bufferArea = turf.area(buffer);
        buffer["properties"] = {
          description: "Buffer (Turf.js)",
          area: bufferArea,
        };
        results.push({
          type: "FeatureCollection" as const,
          features: [buffer],
        });
      }
      if (circle) {
        const circleArea = turf.area(circle);
        circle["properties"] = {
          description: "Circle (Turf.js)",
          area: circleArea,
        };
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
    const bufferArea =
      computeResult && Array.isArray(computeResult)
        ? computeResult[0]?.features[0].properties?.area
        : null;
    const circleArea =
      computeResult && Array.isArray(computeResult)
        ? computeResult[1]?.features[0].properties?.area
        : null;

    return (
      <div>
        <h2>バッファ vs 円</h2>
        <div>
          <label>
            半径 (km):
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
        {bufferArea && circleArea && (
          <div>
            <h3>面積比較</h3>
            <div>
              <h3>
                バッファ面積:
                <br />
                {bufferArea.toFixed(2)} 平方メートル
              </h3>
              <p>
                Turf.js の buffer は D3.js の geoAzimuthalEquidistant
                投影法を使用しており、
                正距方位図法でのバッファを計算している（Planar buffer）。
              </p>
            </div>
            <hr />
            <div>
              <h3>
                円面積:
                <br />
                {circleArea.toFixed(2)} 平方メートル
              </h3>
              <p>
                Turf.js の circle
                は指定した分割数で円周上の点列をサンプルして多角形として構成しており、
                分割数が小さいと円を荒く近似した内接多角形になり buffer
                よりも面積が小さくなる。
              </p>
            </div>
            <hr />
            <div>
              <b>※いずれも 楕円体上の厳密な測地線演算ではない</b>
            </div>
          </div>
        )}
      </div>
    );
  },
};
