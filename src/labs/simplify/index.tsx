import * as turf from "@turf/turf";
import type { Feature, Polygon } from "geojson";

import type { Lab } from "../../types/lab";

export const simplifyLab: Lab = {
  uniqueId: "simplifyLab",
  meta: {
    title: "簡略化",
    description: "RDPによってラインの簡略化を行います。",
    initialViewState: {
      longitude: 70,
      latitude: 33,
      zoom: 4,
    },
  },
  state: {
    clickedCoordsCurrent: null as [number, number] | null,
    showSimplifiedOnly: false,
  },
  compute: (state) => {
    const { clickedCoordsCurrent, showSimplifiedOnly } = state;
    if (clickedCoordsCurrent) {
      const points = [];
      const centerLon = clickedCoordsCurrent[0];
      const centerLat = clickedCoordsCurrent[1];
      const numPoints = 100;
      const radius = 5;

      for (let i = 0; i < numPoints; i++) {
        const angle = (i / numPoints) * Math.PI * 4; // 2回転させてジグザグにする
        const r = radius * (0.5 + 0.5 * Math.sin(5 * angle)); // 半径を変化させてジグザグにする
        const lon = centerLon + radius * Math.cos(angle);
        const lat = centerLat + radius * Math.sin(angle);
        points.push([lon, lat]);
      }

      const line = turf.lineString(points);
      const polygons = turf.buffer(line, 0.1, {
        units: "degrees",
      }) as Feature<Polygon>;

      const simplifiedLine = turf.simplify(polygons, {
        tolerance: 0.5,
        highQuality: false,
      });

      if (showSimplifiedOnly) {
        return [turf.featureCollection([simplifiedLine])];
      } else {
        return [polygons, turf.featureCollection([simplifiedLine])];
      }
    } else {
      return null;
    }
  },
  Panel: (state, computeResult, setNewState) => {
    const { clickedCoordsCurrent, showSimplifiedOnly } = state;

    return (
      <div>
        <h2>簡略化</h2>
        <p>地図上で1点をクリックしてください。</p>
        <div>
          <label>
            <input
              type="checkbox"
              checked={showSimplifiedOnly}
              onChange={(e) =>
                setNewState?.({
                  ...state,
                  showSimplifiedOnly: e.target.checked,
                })
              }
            />
            簡略化したラインのみ表示する
          </label>
        </div>
        <div>
          <b>今回クリック座標:</b>{" "}
          {clickedCoordsCurrent
            ? `[${clickedCoordsCurrent[0].toFixed(
                6
              )}, ${clickedCoordsCurrent[1].toFixed(6)}]`
            : "なし"}
        </div>
        <hr />
        <div>
          <p>
            turf.simplify は、 simplify-js によってジオメトリを簡略化する。
            simplify-js は Ramer-Douglas-Peucker (RDP) アルゴリズムによる
            ラインの簡略化を実装している。
          </p>
        </div>
        <hr />
      </div>
    );
  },
};
