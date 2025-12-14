import * as turf from "@turf/turf";
import type { Lab } from "../../types/lab";
import type {
  Feature,
  LineString,
  MultiPolygon,
  Point,
  Polygon,
} from "geojson";

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

const classifyPointInPolygon = (
  isInside: boolean,
  isOnLine: boolean,
  ignoreBoundary: boolean
): PointInPolygonClassification => {
  if (isOnLine) {
    return ignoreBoundary ? "outside" : "boundary";
  } else if (isInside) {
    return "inside";
  } else {
    return "outside";
  }
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
    clickedCoordsFirst: null as [number, number] | null,
    clickedCoordsCurrent: null as [number, number] | null,
    ignoreBoundary: false,
  },
  compute: (state) => {
    const { clickedCoordsFirst, clickedCoordsCurrent, ignoreBoundary } = state;
    if (clickedCoordsFirst && clickedCoordsCurrent) {
      // clickedCoordsFirst の東西南北に各種ポリゴンを描く
      // そして clickedCoordsCurrent が内側、外側、境界上のいずれにあるかを判定する
      const features: Feature<Polygon | MultiPolygon>[] = [];
      const pointCurrent = turf.point(clickedCoordsCurrent);
      const polygonTypeList: PolygonType[] = [
        "simple",
        "concave",
        "hole",
        "multi",
      ];

      for (const polygonType of polygonTypeList) {
        let centerOfPolygon: [number, number];
        let polygon: Feature<Polygon>;
        let isInside: boolean = false;
        let isOnLine: boolean = false;
        let classification: PointInPolygonClassification;
        if (polygonType === "simple") {
          // 単純ポリゴン (四角形)
          // clickedCoordsFirst の北を中心に配置する
          centerOfPolygon = [
            clickedCoordsFirst[0],
            clickedCoordsFirst[1] + 2.0,
          ];
          polygon = turf.polygon([
            [
              [centerOfPolygon[0] - 0.5, centerOfPolygon[1] - 0.5],
              [centerOfPolygon[0] + 0.5, centerOfPolygon[1] - 0.5],
              [centerOfPolygon[0] + 0.5, centerOfPolygon[1] + 0.5],
              [centerOfPolygon[0] - 0.5, centerOfPolygon[1] + 0.5],
              [centerOfPolygon[0] - 0.5, centerOfPolygon[1] - 0.5],
            ],
          ]);
          isInside = turf.booleanPointInPolygon(pointCurrent, polygon);
          isOnLine = isPointOnPolygonBoundaryLine(pointCurrent, polygon);
          classification = classifyPointInPolygon(
            isInside,
            isOnLine,
            ignoreBoundary
          );

          polygon["properties"] = {
            type: "simple",
            isInside: isInside,
            isOnLine: isOnLine,
            classification: classification,
          };
          features.push(polygon);
        } else if (polygonType === "concave") {
          // 凹ポリゴン
          // clickedCoordsFirst の東を中心に配置する
          centerOfPolygon = [
            clickedCoordsFirst[0] + 2.0,
            clickedCoordsFirst[1],
          ];
          polygon = turf.polygon([
            [
              [centerOfPolygon[0] - 0.5, centerOfPolygon[1] - 0.5],
              [centerOfPolygon[0] + 0.5, centerOfPolygon[1] - 0.5],
              [centerOfPolygon[0], centerOfPolygon[1]], // 凹部分
              [centerOfPolygon[0] + 0.5, centerOfPolygon[1] + 0.5],
              [centerOfPolygon[0] - 0.5, centerOfPolygon[1] + 0.5],
              [centerOfPolygon[0] - 0.5, centerOfPolygon[1] - 0.5],
            ],
          ]);
          isInside = turf.booleanPointInPolygon(pointCurrent, polygon);
          isOnLine = isPointOnPolygonBoundaryLine(pointCurrent, polygon);
          classification = classifyPointInPolygon(
            isInside,
            isOnLine,
            ignoreBoundary
          );

          polygon["properties"] = {
            type: "concave",
            isInside: isInside,
            isOnLine: isOnLine,
            classification: classification,
          };
          features.push(polygon);
        } else if (polygonType === "hole") {
          // 穴あきポリゴン
          // clickedCoordsFirst の南を中心に配置する
          centerOfPolygon = [
            clickedCoordsFirst[0],
            clickedCoordsFirst[1] - 2.0,
          ];
          polygon = turf.polygon([
            [
              [centerOfPolygon[0] - 0.5, centerOfPolygon[1] - 0.5],
              [centerOfPolygon[0] + 0.5, centerOfPolygon[1] - 0.5],
              [centerOfPolygon[0] + 0.5, centerOfPolygon[1] + 0.5],
              [centerOfPolygon[0] - 0.5, centerOfPolygon[1] + 0.5],
              [centerOfPolygon[0] - 0.5, centerOfPolygon[1] - 0.5],
            ],
            [
              // 穴
              [centerOfPolygon[0] - 0.2, centerOfPolygon[1] - 0.2],
              [centerOfPolygon[0] + 0.2, centerOfPolygon[1] - 0.2],
              [centerOfPolygon[0] + 0.2, centerOfPolygon[1] + 0.2],
              [centerOfPolygon[0] - 0.2, centerOfPolygon[1] + 0.2],
              [centerOfPolygon[0] - 0.2, centerOfPolygon[1] - 0.2],
            ],
          ]);
          isInside = turf.booleanPointInPolygon(pointCurrent, polygon);
          isOnLine = isPointOnPolygonBoundaryLine(pointCurrent, polygon);
          classification = classifyPointInPolygon(
            isInside,
            isOnLine,
            ignoreBoundary
          );

          polygon["properties"] = {
            type: "hole",
            isInside: isInside,
            isOnLine: isOnLine,
            classification: classification,
          };
          features.push(polygon);
        } else if (polygonType === "multi") {
          // マルチポリゴン (2つの四角形)
          // 離れた島が複数あるケースで、どれか一つに入っていれば inside になることを確認したいので、くっつけない
          // clickedCoordsFirst の西を中心に配置する
          centerOfPolygon = [
            clickedCoordsFirst[0] - 2.0,
            clickedCoordsFirst[1],
          ];
          const polygon1 = turf.polygon([
            [
              [centerOfPolygon[0] - 0.7, centerOfPolygon[1] - 0.7],
              [centerOfPolygon[0] - 0.1, centerOfPolygon[1] - 0.7],
              [centerOfPolygon[0] - 0.1, centerOfPolygon[1] - 0.1],
              [centerOfPolygon[0] - 0.7, centerOfPolygon[1] - 0.1],
              [centerOfPolygon[0] - 0.7, centerOfPolygon[1] - 0.7],
            ],
          ]);
          const polygon2 = turf.polygon([
            [
              [centerOfPolygon[0] + 0.1, centerOfPolygon[1] + 0.1],
              [centerOfPolygon[0] + 0.7, centerOfPolygon[1] + 0.1],
              [centerOfPolygon[0] + 0.7, centerOfPolygon[1] + 0.7],
              [centerOfPolygon[0] + 0.1, centerOfPolygon[1] + 0.7],
              [centerOfPolygon[0] + 0.1, centerOfPolygon[1] + 0.1],
            ],
          ]);
          const multiPolygon: Feature<MultiPolygon> = turf.multiPolygon([
            polygon1.geometry.coordinates,
            polygon2.geometry.coordinates,
          ]);

          multiPolygon.geometry.coordinates.some((polygonCoords) => {
            const poly = turf.polygon(polygonCoords);
            if (turf.booleanPointInPolygon(pointCurrent, poly)) {
              isInside = true;
              isOnLine = isPointOnPolygonBoundaryLine(pointCurrent, poly);
              return true; // 見つかったのでループ終了
            }
            return false; // 続行
          });
          classification = classifyPointInPolygon(
            isInside,
            isOnLine,
            ignoreBoundary
          );

          multiPolygon["properties"] = {
            type: "multi",
            isInside: isInside,
            isOnLine: isOnLine,
            classification: classification,
          };
          features.push(multiPolygon);
          continue; // multiPolygon は polygons に push したので次へ
        } else {
          continue;
        }
      }
      pointCurrent["properties"] = {
        isInside: features.some((feature) => {
          const prop = feature.properties as {
            isInside: boolean;
          };
          return prop.isInside;
        }),
        isOnLine: features.some((feature) => {
          const prop = feature.properties as {
            isOnLine: boolean;
          };
          return prop.isOnLine;
        }),
        classification: classifyPointInPolygon(
          features.some((feature) => {
            const prop = feature.properties as {
              isInside: boolean;
            };
            return prop.isInside;
          }),
          features.some((feature) => {
            const prop = feature.properties as {
              isOnLine: boolean;
            };
            return prop.isOnLine;
          }),
          ignoreBoundary
        ),
      };
      return [
        {
          type: "FeatureCollection" as const,
          features: [pointCurrent, ...features],
        },
      ];
    } else {
      return null;
    }
  },
  Panel: (state, computeResult, setNewState) => {
    const { clickedCoordsFirst, clickedCoordsCurrent, ignoreBoundary } = state;
    const classificationResult =
      computeResult && Array.isArray(computeResult)
        ? computeResult[0]?.features[0].properties?.classification
        : null;

    return (
      <div>
        <h2>ポリゴン内外判定</h2>
        <p>地図上で1点をクリックしてください。</p>
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
        <hr />
        <div>
          <p>北：単純ポリゴン</p>
          <p>東：凹ポリゴン</p>
          <p>南：穴あきポリゴン</p>
          <p>西：マルチポリゴン</p>
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
        {classificationResult && (
          <div>
            <h3>判定結果:</h3>
            <p>
              <b>
                {classificationResult === "inside"
                  ? "内側"
                  : classificationResult === "outside"
                  ? "外側"
                  : "境界線上"}
              </b>
            </p>
            <p>
              turf.booleanPointInPolygon は point-in-polygon-hao package
              を通じて Hao の point-in-polygon アルゴリズムを使用している。
            </p>
            <p>
              package:{" "}
              <a href="https://github.com/rowanwins/point-in-polygon-hao">
                point-in-polygon-hao package on GitHub
              </a>
            </p>
            <p>
              元論文：{" "}
              <a href="https://www.researchgate.net/publication/328261365_Optimal_Reliable_Point-in-Polygon_Test_and_Differential_Coding_Boolean_Operations_on_Polygons">
                Optimal Reliable Point-in-Polygon Test and Differential Coding
                Boolean Operations on Polygons
              </a>
            </p>
          </div>
        )}
      </div>
    );
  },
};
