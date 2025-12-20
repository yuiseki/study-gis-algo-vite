import * as turf from "@turf/turf";

import type { Lab } from "../../types/lab";

export const greatCircleLab: Lab = {
  uniqueId: "greatCircleLab",
  meta: {
    title: "Great Circle",
    description: "2点間の Great Circle （大圏航路）を計算します。",
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
      const line = turf.lineString([
        clickedCoordsPrevious,
        clickedCoordsCurrent,
      ]);
      const greatCircleLine = turf.greatCircle(
        turf.point(clickedCoordsPrevious),
        turf.point(clickedCoordsCurrent),
        { npoints: 100 }
      );

      return [turf.featureCollection([line]), turf.featureCollection([greatCircleLine])];
    } else {
      return null;
    }
  },
  Panel: (state) => {
    const { clickedCoordsPrevious, clickedCoordsCurrent } = state;

    return (
      <div>
        <h2>Great Circle</h2>
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
      </div>
    );
  },
};
