import * as turf from "@turf/turf";
import type { Feature, Polygon } from "geojson";

import type { Lab } from "../../types/lab";

type PolygonOperationType = "union" | "intersect" | "difference";

export const polygonsOpsLab: Lab = {
  uniqueId: "polygonsOpsLab",
  meta: {
    title: "ポリゴン演算",
    description: "ポリゴンの Union/Intersect/Difference について学びます。",
    initialViewState: {
      longitude: 0,
      latitude: 0,
      zoom: 4,
    },
  },
  state: {
    clickedCoordsFirst: null as [number, number] | null,
    clickedCoordsCurrent: null as [number, number] | null,
    polygonOperation: "union" as PolygonOperationType,
  },
  compute: (state) => {
    const { clickedCoordsFirst, clickedCoordsCurrent, polygonOperation } =
      state;
    if (clickedCoordsFirst) {
      const features: Feature<Polygon>[] = [];
      const size = 0.3; // ポリゴンのサイズ
      const offset = 0.4; // 中心からのオフセット
      // clickedCoordsFirst を中心にシンプルな四角形のポリゴンを描く
      const polygon1 = turf.polygon([
        [
          [
            clickedCoordsFirst[0] - size / 2 - offset,
            clickedCoordsFirst[1] - size / 2 + offset,
          ],
          [
            clickedCoordsFirst[0] + size / 2 - offset,
            clickedCoordsFirst[1] - size / 2 + offset,
          ],
          [
            clickedCoordsFirst[0] + size / 2 - offset,
            clickedCoordsFirst[1] + size / 2 + offset,
          ],
          [
            clickedCoordsFirst[0] - size / 2 - offset,
            clickedCoordsFirst[1] + size / 2 + offset,
          ],
          [
            clickedCoordsFirst[0] - size / 2 - offset,
            clickedCoordsFirst[1] - size / 2 + offset,
          ],
        ],
      ]);
      features.push(polygon1);

      // clickedCoordsCurrent を中心にシンプルな円形のポリゴンを描く
      const circle = turf.circle(clickedCoordsCurrent, size / 2, {
        steps: 64,
        units: "degrees",
      });
      features.push(circle);

      // 1つめのポリゴンと2つ目のポリゴンで、ポリゴン演算を実行する
      let resultPolygon: Feature<Polygon> | null = null;
      if (polygonOperation === "union") {
        resultPolygon = turf.union(
          turf.featureCollection([polygon1, circle])
        ) as Feature<Polygon>;
      } else if (polygonOperation === "intersect") {
        resultPolygon = turf.intersect(
          turf.featureCollection([polygon1, circle])
        ) as Feature<Polygon>;
      } else if (polygonOperation === "difference") {
        resultPolygon = turf.difference(
          turf.featureCollection([polygon1, circle])
        ) as Feature<Polygon>;
      }
      if (resultPolygon) {
        features.push(resultPolygon);
      }

      return [
        {
          type: "FeatureCollection",
          features: features,
        },
      ];
    }
    return null;
  },
  Panel: (state, computeResult, setNewState) => {
    const { clickedCoordsFirst, clickedCoordsCurrent, polygonOperation } =
      state;

    return (
      <div>
        <h2>ポリゴン演算</h2>
        <p>地図上で1点をクリックしてください。</p>
        <div>
          <select
            value={state.operation}
            onChange={(e) =>
              setNewState?.({
                ...state,
                polygonOperation: e.target.value as PolygonOperationType,
              })
            }
          >
            <option value="union" selected={polygonOperation === "union"}>
              Union
            </option>
            <option
              value="intersect"
              selected={polygonOperation === "intersect"}
            >
              Intersect
            </option>
            <option
              value="difference"
              selected={polygonOperation === "difference"}
            >
              Difference
            </option>
          </select>
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
        <div>
          <p>Union: 2つのポリゴンの和集合を返す。</p>
          <p>Intersect: 2つのポリゴンの共通部分を返す。</p>
          <p>
            Difference: 1つ目のポリゴンから2つ目のポリゴンを引いた部分を返す。
          </p>
        </div>
        <hr />
        <div>
          <p>
            turf.union, turf.intersect, turf.difference は polyclip-ts という
            npm package を使っている。
          </p>
          <p>
            <a
              href="https://www.npmjs.com/package/polyclip-ts"
              target="_blank"
              rel="noreferrer"
            >
              polyclip-ts package on NPM
            </a>
          </p>
          <p>
            <a
              href="https://github.com/luizbarboza/polyclip-ts"
              target="_blank"
              rel="noreferrer"
            >
              polyclip-ts package on GitHub
            </a>
          </p>
          <p>
            元論文：{" "}
            <a
              href="https://www.sciencedirect.com/science/article/abs/pii/S0965997813000379"
              target="_blank"
              rel="noreferrer"
            >
              A simple algorithm for Boolean operations on polygons
            </a>
          </p>
          <p>
            この論文の提案手法は、 Martinez-Rueda-Feito polygon clipping algorithm と呼ばれている。
          </p>
          <p>
            Bentley–Ottmann の plane sweep algorithm を高精度に改善した手法。
          </p>
        </div>
      </div>
    );
  },
};
