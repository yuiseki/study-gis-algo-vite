import { Layer, Map, Source } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import "./App.css";
import { useState } from "react";
import * as turf from "@turf/turf";
import { MercatorCoordinate } from "maplibre-gl";

function App() {
  const [clickedCoordsPrevious, setClickedCoordsPrevious] = useState<
    [number, number] | null
  >(null);
  const [clickedCoordsCurrent, setClickedCoordsCurrent] = useState<
    [number, number] | null
  >(null);

  const distanceByTurf =
    clickedCoordsPrevious && clickedCoordsCurrent
      ? turf.distance(
          turf.point(clickedCoordsPrevious),
          turf.point(clickedCoordsCurrent),
          { units: "kilometers" }
        )
      : null;

  const clickedMercatorCoordsCurrent = clickedCoordsCurrent
    ? MercatorCoordinate.fromLngLat({
        lng: clickedCoordsCurrent[0],
        lat: clickedCoordsCurrent[1],
      })
    : null;

  const clickedMercatorCoordsPrevious = clickedCoordsPrevious
    ? MercatorCoordinate.fromLngLat({
        lng: clickedCoordsPrevious[0],
        lat: clickedCoordsPrevious[1],
      })
    : null;

  // 二点間の中間の MercatorCoordinate を作っておく
  const clickedMercatorCoordsMiddle =
    clickedMercatorCoordsCurrent && clickedMercatorCoordsPrevious
      ? new MercatorCoordinate(
          (clickedMercatorCoordsCurrent.x + clickedMercatorCoordsPrevious.x) /
            2,
          (clickedMercatorCoordsCurrent.y + clickedMercatorCoordsPrevious.y) / 2
        )
      : null;

  // 地球曲率を考慮しない距離計算（km）
  // MercatorCoordinate同士の差分（Δx, Δy）を取る
  // MercatorCoordinate.meterInMercatorCoordinateUnits() を使って二点間の中間の緯度の1メートルを得る
  const distanceByMercator =
    clickedMercatorCoordsCurrent &&
    clickedMercatorCoordsPrevious &&
    clickedMercatorCoordsMiddle
      ? (() => {
          const deltaX =
            clickedMercatorCoordsCurrent.x - clickedMercatorCoordsPrevious.x;
          const deltaY =
            clickedMercatorCoordsCurrent.y - clickedMercatorCoordsPrevious.y;
          const distanceInMercatorUnits = Math.sqrt(
            deltaX * deltaX + deltaY * deltaY
          );
          // 中間の緯度での1メートルあたりのMercatorCoordinate単位を取得
          const meterInMercatorUnits =
            clickedMercatorCoordsMiddle.meterInMercatorCoordinateUnits();
          const distanceInMeters =
            distanceInMercatorUnits / meterInMercatorUnits;
          return distanceInMeters / 1000; // キロメートルに変換
        })()
      : null;

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <Map
        initialViewState={{
          longitude: 0,
          latitude: 0,
          zoom: 4,
        }}
        hash={false}
        style={{ width: "100%", height: "100%" }}
        mapStyle={"https://tile.yuiseki.net/styles/osm-fiord/style.json"}
        onClick={(e) => {
          setClickedCoordsPrevious(clickedCoordsCurrent);
          setClickedCoordsCurrent([e.lngLat.lng, e.lngLat.lat]);
        }}
      >
        <div className="descriptionContainer">
          <p>
            <b>GeoJSON は原則 WGS84（経度・緯度、10進度）である。</b>
          </p>
          <p>
            <b>MapLibre による表示は Web Mercator（EPSG:3857）である。</b>
          </p>
        </div>
        <div className="coordsContainer">
          <div>
            {clickedCoordsPrevious ? (
              <div>
                Previous Clicked Coordinates (WGS84):
                <br />
                Longitude: {clickedCoordsPrevious[0].toFixed(4)}, Latitude:{" "}
                {clickedCoordsPrevious[1].toFixed(4)}
              </div>
            ) : (
              <div>No previous coordinates.</div>
            )}
          </div>
          <hr />
          <div>
            {clickedCoordsCurrent ? (
              <div>
                Current Clicked Coordinates (WGS84):
                <br />
                Longitude: {clickedCoordsCurrent[0].toFixed(4)}, Latitude:{" "}
                {clickedCoordsCurrent[1].toFixed(4)}
              </div>
            ) : (
              <div>Click on the map to get coordinates.</div>
            )}
          </div>
          <hr />
          <div>
            {distanceByMercator !== null ? (
              <div>
                Distance between points (calculated by Mercator coordinates):
                <br />
                {distanceByMercator.toFixed(4)} kilometers
              </div>
            ) : (
              <div>Distance will be shown when two points are selected.</div>
            )}
            <p>
              <b>Mercator 座標を使った距離計算は地球曲率を考慮していない。</b>
              <br />
              大まかな距離の大小のみを知りたいといった場合にしか使うべきではない。
            </p>
          </div>
          <hr />
          <div>
            {distanceByTurf !== null ? (
              <div>
                Distance between points (calculated by Turf.js):
                <br />
                {distanceByTurf.toFixed(4)} kilometers
              </div>
            ) : (
              <div>Distance will be shown when two points are selected.</div>
            )}
            <p>
              <b>turf.distance は Haversine formula を使っている。</b>
              <br />
              球面近似を使って地球曲率を考慮した距離の計算をしている。
              <br />
              ただし楕円体上の厳密な測地線距離ではないので注意。
            </p>
          </div>
        </div>
        {clickedCoordsPrevious && clickedCoordsCurrent && (
          <Source
            type="geojson"
            data={{
              type: "Feature",
              geometry: {
                type: "LineString",
                coordinates: [clickedCoordsPrevious, clickedCoordsCurrent],
              },
              properties: {},
            }}
          >
            <Layer
              id="line-layer"
              type="line"
              paint={{
                "line-color": "#FF0000",
                "line-width": 4,
              }}
            />
          </Source>
        )}
      </Map>
    </div>
  );
}

export default App;
