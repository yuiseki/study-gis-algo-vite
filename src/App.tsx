import { useState } from "react";
import "./App.css";
import { LabSelector } from "./ui/LabSelector";
import { distanceLab } from "./labs/distance";
import { MapView } from "./map/MapView";

function App() {
  const [selectedLab, setSelectedLab] = useState<string | null>(null);
  const [resultGeoJSON, setResultGeoJSON] =
    useState<GeoJSON.FeatureCollection | null>(null);

  return (
    <div>
      <h1>GIS Algorithm Study App</h1>
      <LabSelector
        onLabSelect={(labIndex) => {
          setSelectedLab(labIndex);
        }}
      />
      <div>
        <p>
          NOTE: <b>GeoJSON は原則 WGS84 (経度緯度、 10進度) である。</b>
          <b>MapLibre による表示は Web Mercator (EPSG:3857) である。</b>
        </p>
      </div>
      <div style={{ display: "flex" }}>
        <MapView
          resultGeoJSON={resultGeoJSON}
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
              setResultGeoJSON(computeResult);
            }
          }}
        />
        <div style={{ width: "30vw", padding: "10px" }}>
          {selectedLab === "distanceLab" && distanceLab.Panel ? (
            distanceLab.Panel(distanceLab.state, resultGeoJSON)
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
