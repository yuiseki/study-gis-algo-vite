import { useState } from "react";
import "./App.css";
import { LabSelector } from "./ui/LabSelector";
import { MapView } from "./map/MapView";
import { distanceLab } from "./labs/distance";
import { bufferCircleLab } from "./labs/buffer-circle";
import { pointInPolygonLab } from "./labs/point-in-polygon";
import { rewindLab } from "./labs/rewind";

function App() {
  const [selectedLab, setSelectedLab] = useState<string | null>(null);
  const [resultGeoJSONs, setResultGeoJSONs] = useState<
    GeoJSON.FeatureCollection[] | null
  >(null);

  return (
    <div style={{
      padding: "10px",
    }}>
      <h1>GIS Algorithm Study App</h1>
      <div>
        <p>
          NOTE: <b>GeoJSON は原則 WGS84 (EPSG:4326、経度緯度、 10進度) である。</b>
          <b>MapLibre による表示は Web Mercator (EPSG:3857) である。</b>
        </p>
      </div>
      <hr />
      <LabSelector
        selectedLabId={selectedLab || undefined}
        onLabSelect={(labIndex) => {
          setSelectedLab(labIndex);
        }}
      />
      <div style={{ display: "flex" }}>
        <MapView
          resultGeoJSONs={resultGeoJSONs}
          onMapClick={(e) => {
            if (selectedLab === "distanceLab") {
              const coords = [e.lngLat.lng, e.lngLat.lat];
              distanceLab.state = distanceLab.state || {
                clickedCoordsPrevious: null,
                clickedCoordsCurrent: null,
              };
              const prevCoords = distanceLab.state.clickedCoordsCurrent;
              distanceLab.state.clickedCoordsPrevious = prevCoords;
              distanceLab.state.clickedCoordsCurrent = coords;

              const computeResult = distanceLab.compute(distanceLab.state);
              setResultGeoJSONs(computeResult);
            } else if (selectedLab === "bufferCircleLab") {
              const coords = [e.lngLat.lng, e.lngLat.lat];
              bufferCircleLab.state = bufferCircleLab.state || {
                clickedCoords: null,
              };
              bufferCircleLab.state.clickedCoords = coords;

              const computeResult = bufferCircleLab.compute(
                bufferCircleLab.state
              );
              setResultGeoJSONs(computeResult);
            } else if (selectedLab === "pointInPolygonLab") {
              const coords = [e.lngLat.lng, e.lngLat.lat];
              pointInPolygonLab.state = pointInPolygonLab.state || {
                clickedCoordsFirst: null,
                clickedCoordsCurrent: null,
                ignoreBoundary: true,
              };
              if (!pointInPolygonLab.state.clickedCoordsFirst) {
                pointInPolygonLab.state.clickedCoordsFirst = coords;
              } else {
                pointInPolygonLab.state.clickedCoordsCurrent = coords;
              }

              const computeResult = pointInPolygonLab.compute(
                pointInPolygonLab.state
              );
              setResultGeoJSONs(computeResult);
            } else if (selectedLab === "rewindLab") {
              const coords = [e.lngLat.lng, e.lngLat.lat];
              rewindLab.state = rewindLab.state || {
                clickedCoordsCurrent: null,
                applyRewind: true,
              };
              rewindLab.state.clickedCoordsCurrent = coords;

              const computeResult = rewindLab.compute(
                rewindLab.state
              );
              setResultGeoJSONs(computeResult);
            }
          }}
        />
        <div style={{ width: "30vw", padding: "10px" }}>
          {selectedLab === "distanceLab" && distanceLab.Panel ? (
            distanceLab.Panel(distanceLab.state, resultGeoJSONs)
          ) : selectedLab === "bufferCircleLab" && bufferCircleLab.Panel ? (
            bufferCircleLab.Panel(
              bufferCircleLab.state,
              resultGeoJSONs,
              (newState) => {
                bufferCircleLab.state = newState;
                const computeResult = bufferCircleLab.compute(
                  bufferCircleLab.state
                );
                setResultGeoJSONs(computeResult);
              }
            )
          ) : selectedLab === "pointInPolygonLab" && pointInPolygonLab.Panel ? (
            pointInPolygonLab.Panel(
              pointInPolygonLab.state,
              resultGeoJSONs,
              (newState) => {
                pointInPolygonLab.state = newState;
                const computeResult = pointInPolygonLab.compute(
                  pointInPolygonLab.state
                );
                setResultGeoJSONs(computeResult);
              }
            )
          ) : selectedLab === "rewindLab" && rewindLab.Panel ? (
            rewindLab.Panel(
              rewindLab.state,
              resultGeoJSONs,
              (newState) => {
                rewindLab.state = newState;
                const computeResult = rewindLab.compute(
                  rewindLab.state
                );
                setResultGeoJSONs(computeResult);
              }
            )
          ) : (
            <div>
              <h2>ようこそ</h2>
              <p>上のタブから実験を選択してください。</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
