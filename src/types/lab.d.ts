/* eslint-disable @typescript-eslint/no-explicit-any */

import type { JSX } from "react";
import type { FeatureCollection } from "geojson";

// Panel：右ペインUI（パラメータ操作と結果表示）
export type Lab = {
  uniqueId: string;
  meta: {
    title: string;
    description: string;
    initialViewState: {
      longitude: number;
      latitude: number;
      zoom: number;
      pitch?: number;
      bearing?: number;
    };
  };
  state: any;
  compute: (state: any) => FeatureCollection | FeatureCollection[] | null;
  Panel?: (
    state: any,
    computeResult: FeatureCollection | FeatureCollection[] | null,
    setNewState?: (newState: any) => void,
  ) => JSX.Element;
};
