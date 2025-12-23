// style-expression-api.ts
// A stable wrapper for Mapbox GL JS / MapLibre GL JS style expressions and filters

import type { Feature } from "geojson";
import type {
  featureFilter as FeatureFilterFactoryType,
  ValidationError,
} from "@maplibre/maplibre-gl-style-spec";
import { featureFilter as defaultFeatureFilter } from "@maplibre/maplibre-gl-style-spec";

/** Global evaluation properties available to style expressions. */
export interface GlobalProps {
  zoom?: number;
  now?: number;
  pitch?: number;
  bearing?: number;
}

/** Canonical tile position, rarely needed. */
export interface Canonical {
  x: number;
  y: number;
  z: number;
}

/** Which rendering engine we detected */
export type EngineKind = "mapbox-legacy" | "maplibre-old" | "maplibre-new";

/** A unified compiled filter type */
export interface CompiledFilter {
  test: (
    feature: Feature,
    globals?: GlobalProps,
    featureState?: any,
    canonical?: Canonical
  ) => boolean;
  needGeometry: boolean;
}

/** Detect which engine signature we are running under */
export function detectEngine(
  featureFilterFactory: typeof defaultFeatureFilter = defaultFeatureFilter
): EngineKind {
  const compiled = featureFilterFactory(["==", ["get", "__probe__"], 0]);
  if (typeof compiled === "function") return "mapbox-legacy";

  const fn: any = (compiled as any)?.filter;
  if (typeof fn !== "function") throw new Error("Unknown filter shape");

  const src = Function.prototype.toString.call(fn);
  const firstParam =
    (src.match(/^[^(]*\(([^),\s]+)/)?.[1] || "").trim().toLowerCase();

  if (firstParam === "feature") return "maplibre-old";
  if (firstParam === "globalproperties") return "maplibre-new";

  throw new Error("Unrecognized filter parameter order");
}

/** Compile a filter into a unified callable */
export function compileFilter(
  expr: any,
  featureFilterFactory: typeof defaultFeatureFilter = defaultFeatureFilter
): CompiledFilter {
  const compiled: any = featureFilterFactory(expr);

  // Mapbox GL JS ≤ v1.x — featureFilter returns a function(feature, zoom?, featureState?)
  if (typeof compiled === "function") {
    return {
      test: (f, g, s) => compiled(f, g?.zoom, s),
      needGeometry: false,
    };
  }

  const fn: any = compiled?.filter;
  if (typeof fn !== "function") {
    throw new Error("Unrecognized compiled filter object");
  }

  const src = Function.prototype.toString.call(fn);
  const firstParam =
    (src.match(/^[^(]*\(([^),\s]+)/)?.[1] || "").trim().toLowerCase();

  if (firstParam === "feature") {
    // MapLibre v2.x
    return {
      test: (f, g, s, c) => fn(f, g, s, c),
      needGeometry: !!compiled.needGeometry,
    };
  } else if (firstParam === "globalproperties") {
    // MapLibre v3.x+
    return {
      test: (f, g, _s, c) => fn(g, f, c),
      needGeometry: !!compiled.needGeometry,
    };
  }

  throw new Error("Unrecognized filter parameter order");
}

/** Evaluate a compiled filter with a consistent signature */
export function evaluateFilter(
  cf: CompiledFilter,
  args: {
    feature: Feature;
    globals?: GlobalProps;
    featureState?: any;
    canonical?: Canonical;
  }
): boolean {
  return cf.test(args.feature, args.globals, args.featureState, args.canonical);
}

/** Create the correct globalProperties object from map or explicit numbers */
export function makeGlobals(input: {
  map?: any;
  zoom?: number;
  now?: number;
  pitch?: number;
  bearing?: number;
}): GlobalProps {
  return {
    zoom: input.zoom ?? input.map?.getZoom?.(),
    now: input.now,
    pitch: input.pitch ?? input.map?.getPitch?.(),
    bearing: input.bearing ?? input.map?.getBearing?.(),
  };
}

/** Optional: stub for expression compilation (extend later if needed) */
export type CompiledExpression = (
  globals?: GlobalProps,
  feature?: Feature,
  featureState?: any,
  canonical?: Canonical
) => any;

/** Optional: run-time validator passthrough */
export interface ValidationResult {
  errors: ValidationError[];
}

/** Placeholder validation wrapper */
export function validateExpression(
  _expr: any
): ValidationResult {
  return { errors: [] }; // extend with real validation if you need
}
