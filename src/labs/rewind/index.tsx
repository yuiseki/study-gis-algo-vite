import * as turf from "@turf/turf";
import type { Feature, Polygon } from "geojson";

import type { Lab } from "../../types/lab";

type PolygonType = "simple" | "hole";

export const rewindLab: Lab = {
  uniqueId: "rewindLab",
  meta: {
    title: "CW/CCWとRewind",
    description: "GeoJSONの線分の向きとRewindについて学びます。",
    initialViewState: {
      longitude: 0,
      latitude: 0,
      zoom: 4,
    },
  },
  state: {
    clickedCoordsCurrent: null as [number, number] | null,
    applyRewind: true,
  },
  compute: (state) => {
    const { clickedCoordsCurrent, applyRewind } = state;
    if (clickedCoordsCurrent) {
      // clickedCoordsFirst の北と南に各種ポリゴンを描く
      // 意図的に CW/CCW を混在させる壊れたジオメトリを作成する
      // 北西：simple, 壊れていない
      // 北東：simple, 壊れている
      // 南西：hole, 壊れていない
      // 南東：hole, 壊れている
      const polygonTypeList: PolygonType[] = ["simple", "hole"];
      const features: Feature<Polygon>[] = [];

      polygonTypeList.forEach((polygonType, i) => {
        const isBroken = i === 1;
        const latitudeOffset = i === 0 ? 0.5 : -0.5;

        const createPolygonCoordinates = (
          polygonType: PolygonType,
          isBroken: boolean
        ): Feature<Polygon> => {
          // 外周リングの座標を作成
          // GeoJSON のポリゴンにおける外周は CCW（反時計回り）である必要がある
          const outerRing: number[][] = isBroken
            ? [
                [clickedCoordsCurrent[0], clickedCoordsCurrent[1] + latitudeOffset],
                [
                  clickedCoordsCurrent[0],
                  clickedCoordsCurrent[1] + latitudeOffset,
                ],
                [
                  clickedCoordsCurrent[0],
                  clickedCoordsCurrent[1] + latitudeOffset,
                ],
                [
                  clickedCoordsCurrent[0],
                  clickedCoordsCurrent[1] + latitudeOffset,
                ],
                [clickedCoordsCurrent[0], clickedCoordsCurrent[1] + latitudeOffset],
              ]
            : [
                [clickedCoordsCurrent[0], clickedCoordsCurrent[1] + latitudeOffset],
                [
                  clickedCoordsCurrent[0],
                  clickedCoordsCurrent[1] + latitudeOffset,
                ],
                [
                  clickedCoordsCurrent[0],
                  clickedCoordsCurrent[1] + latitudeOffset,
                ],
                [
                  clickedCoordsCurrent[0],
                  clickedCoordsCurrent[1] + latitudeOffset,
                ],
                [clickedCoordsCurrent[0], clickedCoordsCurrent[1] + latitudeOffset],
              ];

          if (polygonType === "simple") {
            const polygon = turf.polygon([outerRing]);
            polygon["properties"] = {
              type: "simple",
              isBroken: isBroken,
            };
            return polygon;
          } else {
            // 内周リングの座標を作成
            // GeoJSON のポリゴンにおける内周は CW（時計回り）である必要がある
            const innerRing: number[][] = isBroken
              ? [
                  [
                    clickedCoordsCurrent[0] / 2,
                    clickedCoordsCurrent[1] + latitudeOffset + 0.1,
                  ],
                  [
                    clickedCoordsCurrent[0] / 2 + 0.1,
                    clickedCoordsCurrent[1] + latitudeOffset + 0.1,
                  ],
                  [
                    clickedCoordsCurrent[0] / 2 + 0.1,
                    clickedCoordsCurrent[1] + latitudeOffset - 0.1,
                  ],
                  [
                    clickedCoordsCurrent[0] / 2,
                    clickedCoordsCurrent[1] + latitudeOffset - 0.1,
                  ],
                  [
                    clickedCoordsCurrent[0] / 2,
                    clickedCoordsCurrent[1] + latitudeOffset + 0.1,
                  ],
                ]
              : [
                  [
                    clickedCoordsCurrent[0] / 2,
                    clickedCoordsCurrent[1] + latitudeOffset + 0.1,
                  ],
                  [
                    clickedCoordsCurrent[0] / 2 + 0.1,
                    clickedCoordsCurrent[1] + latitudeOffset + 0.1,
                  ],
                  [
                    clickedCoordsCurrent[0] / 2 + 0.1,
                    clickedCoordsCurrent[1] + latitudeOffset - 0.1,
                  ],
                  [
                    clickedCoordsCurrent[0] / 2,
                    clickedCoordsCurrent[1] + latitudeOffset - 0.1,
                  ],
                  [
                    clickedCoordsCurrent[0] / 2,
                    clickedCoordsCurrent[1] + latitudeOffset + 0.1,
                  ],
                ];
            const polygon = turf.polygon([outerRing, innerRing]);
            polygon["properties"] = {
              type: "hole",
              isBroken: isBroken,
            };
            return polygon;
          }
        };

        const feature = createPolygonCoordinates(polygonType, isBroken);

        features.push(feature);
      });

      return [{
        type: "FeatureCollection",
        features: applyRewind
          ? features.map((feature) => turf.rewind(feature) as Feature<Polygon>)
          : features,
      }];
    }
    return null;
  },
  Panel: (state, computeResult, setNewState) => {
    const { clickedCoordsFirst, clickedCoordsCurrent, applyRewind } = state;

    return (
      <div>
        <h2>距離</h2>
        <p>地図上で1点をクリックしてください。</p>
        <div>
          <label>
            Rewindを適用する:
            <input
              type="checkbox"
              checked={!applyRewind}
              onChange={(e) =>
                setNewState?.({ applyRewind: !e.target.checked })
              }
            />
          </label>
        </div>
        <hr />
        <div>
          初回クリック座標:{" "}
          {clickedCoordsFirst
            ? `[${clickedCoordsFirst[0].toFixed(
                6
              )}, ${clickedCoordsFirst[1].toFixed(6)}]`
            : "なし"}
        </div>
        <div>
          今回クリック座標:{" "}
          {clickedCoordsCurrent
            ? `[${clickedCoordsCurrent[0].toFixed(
                6
              )}, ${clickedCoordsCurrent[1].toFixed(6)}]`
            : "なし"}
        </div>
        <hr />
      </div>
    );
  },
};
