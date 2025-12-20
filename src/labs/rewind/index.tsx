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
    applyRewind: false,
  },
  compute: (state) => {
    const { clickedCoordsCurrent, applyRewind } = state;
    if (clickedCoordsCurrent) {
      // clickedCoordsCurrentを中心に4つのポリゴンを描く
      // 意図的に CW/CCW を混在させる壊れたジオメトリを作成する
      // 北西：simple, 壊れていない（CCW）
      // 北東：simple, 壊れている（CW）
      // 南西：hole, 壊れていない（外周CCW、穴CW）
      // 南東：hole, 壊れている（外周CW、穴CCW）
      const features: Feature<Polygon>[] = [];
      const size = 0.3; // ポリゴンのサイズ
      const offset = 0.4; // 中心からのオフセット

      // 4つのパターンを作成
      const patterns: Array<{
        polygonType: PolygonType;
        isBroken: boolean;
        lonOffset: number;
        latOffset: number;
      }> = [
        {
          polygonType: "simple",
          isBroken: false,
          lonOffset: -offset,
          latOffset: offset,
        }, // 北西
        {
          polygonType: "simple",
          isBroken: true,
          lonOffset: offset,
          latOffset: offset,
        }, // 北東
        {
          polygonType: "hole",
          isBroken: false,
          lonOffset: -offset,
          latOffset: -offset,
        }, // 南西
        {
          polygonType: "hole",
          isBroken: true,
          lonOffset: offset,
          latOffset: -offset,
        }, // 南東
      ];

      patterns.forEach(({ polygonType, isBroken, lonOffset, latOffset }) => {
        const centerLon = clickedCoordsCurrent[0] + lonOffset;
        const centerLat = clickedCoordsCurrent[1] + latOffset;

        // 外周リングの座標を作成（正方形）
        // GeoJSON のポリゴンにおける外周は CCW（反時計回り）である必要がある
        const outerRingCCW: number[][] = [
          [centerLon - size / 2, centerLat - size / 2], // 左下
          [centerLon + size / 2, centerLat - size / 2], // 右下
          [centerLon + size / 2, centerLat + size / 2], // 右上
          [centerLon - size / 2, centerLat + size / 2], // 左上
          [centerLon - size / 2, centerLat - size / 2], // 閉じる
        ];

        // CW（時計回り）は座標順序を逆にする
        const outerRingCW = [...outerRingCCW].reverse();

        if (polygonType === "simple") {
          // simpleの場合：isBrokenならCW、正常ならCCW
          const outerRing = isBroken ? outerRingCW : outerRingCCW;
          const polygon = turf.polygon([outerRing]);
          polygon.properties = {
            type: "simple",
            isBroken: isBroken,
            label: isBroken ? "Simple (CW)" : "Simple (CCW)",
          };
          features.push(polygon);
        } else {
          // holeの場合：穴を持つポリゴン
          const holeSize = size * 0.4;

          // 内周リングの座標を作成（小さい正方形）
          // GeoJSON のポリゴンにおける内周（穴）は CW（時計回り）である必要がある
          const innerRingCW: number[][] = [
            [centerLon - holeSize / 2, centerLat - holeSize / 2], // 左下
            [centerLon - holeSize / 2, centerLat + holeSize / 2], // 左上
            [centerLon + holeSize / 2, centerLat + holeSize / 2], // 右上
            [centerLon + holeSize / 2, centerLat - holeSize / 2], // 右下
            [centerLon - holeSize / 2, centerLat - holeSize / 2], // 閉じる
          ];

          // CCW（反時計回り）は座標順序を逆にする
          const innerRingCCW = [...innerRingCW].reverse();

          // isBrokenの場合：外周CW、穴CCW（両方逆）
          // 正常の場合：外周CCW、穴CW
          const outerRing = isBroken ? outerRingCW : outerRingCCW;
          const innerRing = isBroken ? innerRingCCW : innerRingCW;

          const polygon = turf.polygon([outerRing, innerRing]);
          polygon.properties = {
            type: "hole",
            isBroken: isBroken,
            label: isBroken ? "Hole (CW/CCW)" : "Hole (CCW/CW)",
          };
          features.push(polygon);
        }
      });

      return [
        {
          type: "FeatureCollection",
          features: applyRewind
            ? features.map(
                (feature) => turf.rewind(feature) as Feature<Polygon>
              )
            : features,
        },
      ];
    }
    return null;
  },
  Panel: (state, computeResult, setNewState) => {
    const { clickedCoordsCurrent, applyRewind } = state;

    return (
      <div>
        <h2>CW/CCWとRewind</h2>
        <p>地図上で1点をクリックしてください。</p>
        <div>
          <label>
            Rewindを適用する:
            <input
              type="checkbox"
              checked={applyRewind}
              onChange={(e) =>
                setNewState?.({
                  applyRewind: e.target.checked,
                  clickedCoordsCurrent,
                })
              }
            />
          </label>
        </div>
        <hr />
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
          <p>北西：Simple, 壊れていない（CCW）</p>
          <p>北東：Simple, 壊れている（CW）</p>
          <p>南西：Hole, 壊れていない（外周CCW、穴CW）</p>
          <p>南東：Hole, 壊れている（外周CW、穴CCW）</p>
        </div>
        <hr />
        <div>
          <p>
            壊れているポリゴンでも MapLibre GL は表示できてしまうが、
            Point-In-Polygon などの演算で誤った結果を返す可能性がある。
          </p>
          <p>turf.rewind を使うと、 GeoJSON 仕様に準拠した向きに修正できる。</p>
        </div>
        <hr />
        <div>
          <p>
            turf.rewind と turf.booleanClockwise は Shoelace formula
            と代数的に同値な "別形" で、回転方向を判定している。
          </p>
          <p>
            (x2-x1)(y2+y1) の総和が正ならCW、負ならCCWという計算方法。
            <br />
            Shoelace formula よりも実装がシンプルで速いという StackOverflow
            での回答をそのまま採用。
          </p>
          <p>
            <ul>
              <li>packages/turf-rewind/index.ts</li>
              <li>packages/turf-boolean-clockwise/index.ts</li>
            </ul>
          </p>
        </div>
      </div>
    );
  },
};
