import * as turf from "@turf/turf";
import type { Lab } from "../../types/lab";
import type { Feature, LineString, Point, Polygon } from "geojson";

type PolygonType = "simple" | "concave" | "hole" | "multi";
type PointInPolygonClassification = "inside" | "outside" | "boundary";

const isPointOnPolygonBoundaryLine = (
  point: Feature<Point>,
  polygon: Feature<Polygon>
): boolean => {
  const lines = turf.polygonToLine(polygon);
  if (lines.type === "FeatureCollection") {
    return lines.features.some((line) => {
      // 型ガード: LineString のみ処理
      if (line.geometry.type === "LineString") {
        return turf.booleanPointOnLine(point, line as Feature<LineString>);
      }
      return false;
    });
  } else if (lines.geometry.type === "MultiLineString") {
    return lines.geometry.coordinates.some((lineCoords) => {
      const line = turf.lineString(lineCoords);
      return turf.booleanPointOnLine(point, line);
    });
  } else if (lines.geometry.type === "LineString") {
    // LineString の場合も処理
    return turf.booleanPointOnLine(point, lines as Feature<LineString>);
  }
  return false;
};

export const pointInPolygonLab: Lab = {
  uniqueId: "pointInPolygonLab",
  meta: {
    title: "ポリゴン内外判定",
    description: "点がポリゴンの内側、外側、または境界上にあるかを判定します。",
    initialViewState: {
      longitude: 0,
      latitude: 0,
      zoom: 4,
    },
  },
  state: {
    clickedCoords: null as [number, number] | null,
    polygonType: "simple" as PolygonType,
    ignoreBoundary: false,
  },
  compute: (state) => {
    const { clickedCoords, polygonType, ignoreBoundary } = state;
    if (clickedCoords) {
      // clickedCoords の周辺にポリゴンを描く
      let polygon;
      // booleanPointInPolygon を使う
      let isInside;
      let isOnLine;
      const point = turf.point(clickedCoords);
      if (polygonType === "simple") {
        polygon = turf.polygon([
          [
            [clickedCoords[0] - 1, clickedCoords[1] - 1],
            [clickedCoords[0] + 1, clickedCoords[1] - 1],
            [clickedCoords[0] + 1, clickedCoords[1] + 1],
            [clickedCoords[0] - 1, clickedCoords[1] + 1],
            [clickedCoords[0] - 1, clickedCoords[1] - 1],
          ],
        ]);
        isInside = turf.booleanPointInPolygon(point, polygon, {
          ignoreBoundary: ignoreBoundary,
        });
        isOnLine = isPointOnPolygonBoundaryLine(point, polygon);
      } else if (polygonType === "concave") {
        polygon = turf.polygon([
          [
            [clickedCoords[0] - 1, clickedCoords[1] - 1],
            [clickedCoords[0] + 0.5, clickedCoords[1]],
            [clickedCoords[0] + 1, clickedCoords[1] - 1],
            [clickedCoords[0] + 1, clickedCoords[1] + 1],
            [clickedCoords[0] - 1, clickedCoords[1] + 1],
            [clickedCoords[0] - 1, clickedCoords[1] - 1],
          ],
        ]);
        isInside = turf.booleanPointInPolygon(point, polygon, {
          ignoreBoundary: ignoreBoundary,
        });
        isOnLine = isPointOnPolygonBoundaryLine(point, polygon);
      } else if (polygonType === "hole") {
        polygon = turf.polygon([
          [
            [clickedCoords[0] - 1, clickedCoords[1] - 1],
            [clickedCoords[0] + 1, clickedCoords[1] - 1],
            [clickedCoords[0] + 1, clickedCoords[1] + 1],
            [clickedCoords[0] - 1, clickedCoords[1] + 1],
            [clickedCoords[0] - 1, clickedCoords[1] - 1],
          ],
          [
            [clickedCoords[0] - 0.5, clickedCoords[1] - 0.5],
            [clickedCoords[0] + 0.5, clickedCoords[1] - 0.5],
            [clickedCoords[0] + 0.5, clickedCoords[1] + 0.5],
            [clickedCoords[0] - 0.5, clickedCoords[1] + 0.5],
            [clickedCoords[0] - 0.5, clickedCoords[1] - 0.5],
          ],
        ]);
        isInside = turf.booleanPointInPolygon(point, polygon, {
          ignoreBoundary: ignoreBoundary,
        });
        isOnLine = isPointOnPolygonBoundaryLine(point, polygon);
      } else {
        polygon = turf.multiPolygon([
          [
            [
              [clickedCoords[0] - 2, clickedCoords[1] - 1],
              [clickedCoords[0] - 1, clickedCoords[1] - 1],
              [clickedCoords[0] - 1, clickedCoords[1] + 1],
              [clickedCoords[0] - 2, clickedCoords[1] + 1],
              [clickedCoords[0] - 2, clickedCoords[1] - 1],
            ],
          ],
          [
            [
              [clickedCoords[0] + 1, clickedCoords[1] - 1],
              [clickedCoords[0] + 2, clickedCoords[1] - 1],
              [clickedCoords[0] + 2, clickedCoords[1] + 1],
              [clickedCoords[0] + 1, clickedCoords[1] + 1],
              [clickedCoords[0] + 1, clickedCoords[1] - 1],
            ],
          ],
        ]);

        // MultiPolygon の場合は、各ポリゴンについて判定を行い、いずれかが内側であれば内側とする
        isInside = false;
        for (const singlePolygon of polygon.geometry.coordinates) {
          const poly = turf.polygon(singlePolygon);
          if (
            turf.booleanPointInPolygon(point, poly, {
              ignoreBoundary: ignoreBoundary,
            })
          ) {
            isInside = true;
            break;
          }
        }
        isOnLine = false;
        for (const singlePolygon of polygon.geometry.coordinates) {
          const poly = turf.polygon(singlePolygon);
          if (isPointOnPolygonBoundaryLine(point, poly)) {
            isOnLine = true;
            break;
          }
        }
      }

      polygon["properties"] = {
        isInside: isInside,
        isOnLine: isOnLine || false,
        classification: isOnLine
          ? "boundary"
          : isInside
          ? "inside"
          : ("outside" as PointInPolygonClassification),
        description: "Polygon for Point-In-Polygon Test",
      };
      return [
        {
          type: "FeatureCollection" as const,
          features: [point, polygon],
        },
      ];
    } else {
      return null;
    }
  },
  Panel: (state, computeResult, setNewState) => {
    const { clickedCoords, polygonType, ignoreBoundary } = state;
    const isInside =
      computeResult && Array.isArray(computeResult)
        ? computeResult[0]?.features[0].properties?.isInside
        : null;

    return (
      <div>
        <h2>ポリゴン内外判定</h2>
        <p>地図上で1点をクリックしてください。</p>
        <div>
          <label>
            ポリゴンの種類:
            <select
              value={polygonType}
              onChange={(e) =>
                setNewState?.({ polygonType: e.target.value as PolygonType })
              }
            >
              <option value="simple">単純ポリゴン</option>
              <option value="concave">凹ポリゴン</option>
              <option value="hole">穴あきポリゴン</option>
              <option value="multi">マルチポリゴン</option>
            </select>
          </label>
        </div>
        <div>
          <label>
            境界線上を内側とみなす:
            <input
              type="checkbox"
              checked={!ignoreBoundary}
              onChange={(e) =>
                setNewState?.({ ignoreBoundary: !e.target.checked })
              }
            />
          </label>
        </div>
        <div>
          クリック座標:{" "}
          {clickedCoords
            ? `[${clickedCoords[0].toFixed(6)}, ${clickedCoords[1].toFixed(6)}]`
            : "なし"}
        </div>
        {isInside !== null && <div>判定結果: {isInside ? "内側" : "外側"}</div>}
      </div>
    );
  },
};
