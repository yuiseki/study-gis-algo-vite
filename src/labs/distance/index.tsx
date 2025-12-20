import { MercatorCoordinate } from "maplibre-gl";
import * as turf from "@turf/turf";

import type { Lab } from "../../types/lab";

export const distanceLab: Lab = {
  uniqueId: "distanceLab",
  meta: {
    title: "距離",
    description: "2点間の距離を計算します。",
    initialViewState: {
      longitude: 0,
      latitude: 0,
      zoom: 4,
    },
  },
  state: {
    clickedCoordsPrevious: null as [number, number] | null,
    clickedCoordsCurrent: null as [number, number] | null,
  },
  compute: (state) => {
    const { clickedCoordsPrevious, clickedCoordsCurrent } = state;
    if (clickedCoordsPrevious && clickedCoordsCurrent) {
      // メルカトル座標による距離計算
      const clickedMercatorCoordsPrevious = MercatorCoordinate.fromLngLat({
        lng: clickedCoordsPrevious[0],
        lat: clickedCoordsPrevious[1],
      });
      const clickedMercatorCoordsCurrent = MercatorCoordinate.fromLngLat({
        lng: clickedCoordsCurrent[0],
        lat: clickedCoordsCurrent[1],
      });
      // 中間のメルカトル座標を作成
      const clickedMercatorCoordsMiddle = new MercatorCoordinate(
        (clickedMercatorCoordsCurrent.x + clickedMercatorCoordsPrevious.x) / 2,
        (clickedMercatorCoordsCurrent.y + clickedMercatorCoordsPrevious.y) / 2
      );
      // 2点間の差分を計算
      const deltaX =
        clickedMercatorCoordsCurrent.x - clickedMercatorCoordsPrevious.x;
      const deltaY =
        clickedMercatorCoordsCurrent.y - clickedMercatorCoordsPrevious.y;
      const distanceInMercatorUnits = Math.sqrt(
        deltaX * deltaX + deltaY * deltaY
      );
      // 中間の緯度での1メートルあたりのメルカトル座標単位を取得
      const meterInMercatorUnits =
        clickedMercatorCoordsMiddle.meterInMercatorCoordinateUnits();
      const distanceByMercator =
        distanceInMercatorUnits / meterInMercatorUnits / 1000; // km

      // Turf.jsによる距離計算
      const distanceByTurf = turf.distance(
        turf.point(clickedCoordsPrevious),
        turf.point(clickedCoordsCurrent),
        { units: "kilometers" }
      );

      const distanceByTurfRhumb = turf.rhumbDistance(
        turf.point(clickedCoordsPrevious),
        turf.point(clickedCoordsCurrent),
        { units: "kilometers" }
      );

      return [
        {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              geometry: {
                type: "LineString",
                coordinates: [clickedCoordsPrevious, clickedCoordsCurrent],
              },
              properties: {
                distanceByMercator: distanceByMercator,
                distanceByTurf: distanceByTurf,
                distanceByTurfRhumb: distanceByTurfRhumb,
              },
            },
          ],
        },
      ];
    } else {
      return null;
    }
  },
  Panel: (state, computeResult) => {
    const { clickedCoordsPrevious, clickedCoordsCurrent } = state;

    const feature =
      computeResult && computeResult.length > 0
        ? computeResult[0]?.features[0]
        : null;
    const distanceByMercator = feature
      ? feature.properties?.distanceByMercator
      : null;
    const distanceByTurf = feature ? feature.properties?.distanceByTurf : null;
    const distanceByTurfRhumb = feature
      ? feature.properties?.distanceByTurfRhumb
      : null;

    return (
      <div>
        <h2>距離</h2>
        <p>地図上で2点をクリックしてください。</p>
        <div>
          <b>前回クリック座標:</b>{" "}
          {clickedCoordsPrevious
            ? `[${clickedCoordsPrevious[0].toFixed(
                6
              )}, ${clickedCoordsPrevious[1].toFixed(6)}]`
            : "なし"}
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
          {clickedCoordsCurrent ? (
            <div>
              現在のクリック座標 (WGS84):
              <br />
              Longitude: {clickedCoordsCurrent[0].toFixed(4)}, Latitude:{" "}
              {clickedCoordsCurrent[1].toFixed(4)}
            </div>
          ) : (
            <div>地図をクリックして座標を取得してください。</div>
          )}
        </div>
        <hr />
        <div>
          {distanceByMercator ? (
            <h3>
              メルカトル座標による2点間の距離:
              <br />
              {distanceByMercator.toFixed(4)} キロメートル
            </h3>
          ) : (
            <div>2点が選択されると距離が表示されます。</div>
          )}
          <p>
            <b>Mercator 座標を使った距離計算は地球曲率を考慮していない。</b>
            <br />
            緯度の差が大きい場合（南北に離れている場合）や大きく離れた地点間の距離計算には適していない。
          </p>
        </div>
        <hr />
        <div>
          {distanceByTurf ? (
            <h3>
              turf.distance による2点間の距離:
              <br />
              {distanceByTurf.toFixed(4)} キロメートル
            </h3>
          ) : (
            <div>2点が選択されると距離が表示されます。</div>
          )}
          <p>
            <b>turf.distance は Haversine formula を使っている。</b>
            <br />
            球面近似を使って地球曲率を考慮した距離の計算をしている。 <br />
            ただし楕円体上の厳密な測地線距離ではないので注意。
          </p>
        </div>
        <hr />
        <div>
          {distanceByTurfRhumb ? (
            <h3>
              turf.rhumbDistance による2点間の距離:
              <br />
              {distanceByTurfRhumb.toFixed(4)} キロメートル
            </h3>
          ) : (
            <div>2点が選択されると距離が表示されます。</div>
          )}
          <p>
            <b>turf.rhumbDistance は Rhumb line （等角航路）に基づく距離を計算している。</b>
            <br />
            等角航路は一定の方位角を保つ曲線であり、実際の最短距離（測地線）とは異なる。 <br />
            航海や航空のナビゲーションにおいて有用な場合がある。
          </p>
        </div>
      </div>
    );
  },
};
