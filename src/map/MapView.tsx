import {
  Layer,
  Map,
  Source,
  type MapLayerMouseEvent,
} from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";

export const MapView: React.FC<{
  resultGeoJSONs: GeoJSON.FeatureCollection[] | null;
  onMapClick?: (e: MapLayerMouseEvent) => void;
}> = ({ resultGeoJSONs, onMapClick }) => {
  return (
    <div style={{ width: "80vw", height: "80vh" }}>
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
          if (onMapClick) {
            onMapClick(e);
          }
        }}
      >
        {resultGeoJSONs &&
          resultGeoJSONs.map((resultGeoJSON, index) => (
            <Source key={index} type="geojson" data={resultGeoJSON}>
              <Layer
                id={`line-layer-${index}`}
                type="line"
                paint={{
                  "line-color": "#FF0000",
                  "line-width": 4,
                }}
              />
            </Source>
          ))}
      </Map>
    </div>
  );
};
