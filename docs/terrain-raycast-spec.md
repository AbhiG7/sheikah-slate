# Terrain Ray-Cast Identification: Implementation Spec

## 1. Why this approach

Camera-based depth estimation cannot work at 5-10 miles. Stereo error grows as
`dz = z^2 / (f * B) * dd`. With iPhone optics (f ~= 2989 px, B ~= 12 mm) the lens
pair holds 10% accuracy to **7.2 m**; at 5 miles the error is ~900 km. Reaching
10% at 8 miles would need lenses **21.5 m apart**. Monocular ML models (UniDepth,
Metric3D v2, Depth Anything V2) are trained on outdoor data bounded at ~80 m.
LiDAR reaches ~5 m.

So we invert the problem: **don't estimate depth, intersect a bearing with known
world geometry.** Depth comes from a terrain model that already knows the answer.
This is how PeakFinder and PeakVisor identify peaks at these ranges.

Reframing insight: at eye level the horizon is 3.1 miles. Anything visible at
5-10 miles must be tall enough to clear the curve (11 m at 8 mi, 18 m at 10 mi),
so every target in range is a large fixed feature already present in a database.

## 2. Verified foundations

Confirmed working before writing this spec:

| Item | Result |
|---|---|
| Endpoint `s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png` | HTTP 200, no API key |
| Terrarium decode `(R*256 + G + B/256) - 32768` | correct |
| Slippy tile math | correct |
| Mount Rainier decoded | 4388 m vs 4392 m truth, ~70 m position error |

Source data is ~30 m (SRTM/Copernicus blend). Zoom 12 gives 38.2 m/px at the
equator and ~26 m/px at 47 degrees N, matching source resolution. Going finer
than z13 adds no information.

## 3. File layout

```
src/lib/terrain/
  tileMath.ts        # lat/lon <-> slippy tile + sub-pixel, and inverse
  terrainTiles.ts    # fetch, decode, LRU + filesystem cache
  elevation.ts       # ElevationSampler: prefetch corridor, then sync bilinear sample
  rayMarch.ts        # the marcher (pure, synchronous, fully testable)
  curvature.ts       # earth curvature + atmospheric refraction
  types.ts
src/lib/poi/
  identify.ts        # hit point -> ranked candidate features
src/hooks/
  useDeviceAttitude.ts   # replaces useDevicePitch, roll-invariant
  useTerrainTarget.ts    # orchestrates: attitude + GPS -> TerrainHit
```

## 4. Core algorithms

### 4.1 Tile math

```
n = 2^z
x = floor((lon + 180) / 360 * n)
y = floor((1 - asinh(tan(latRad)) / PI) / 2 * n)
```

Sub-pixel offsets use the same expressions without the floor, times 256.
Inverse, for turning a hit back into coordinates:

```
lon = (x + px/256) / n * 360 - 180
lat = atan(sinh(PI * (1 - 2*(y + py/256)/n))) * 180/PI
```

### 4.2 Elevation sampling

Decode terrarium PNG to RGBA, then **bilinear interpolate** between the four
surrounding cells. Point sampling a 30 m grid at 10 km produces visible
stair-stepping in the horizon profile; bilinear removes it.

`ElevationSampler.prefetchCorridor(origin, bearing, maxDistance)` computes the
bounding box of the ray, fetches every covering tile, then `sample(lat, lon)`
is **synchronous**. This keeps the marcher a pure function with no awaits in
its loop, which is what makes it unit-testable.

A 30 km ray at z12 crosses roughly 2-6 tiles. Each decoded tile is 256 KB as
RGBA. Cache to disk with `expo-file-system`; pre-cache the surrounding ring on
app start so identification works offline.

### 4.3 Curvature and refraction

Both matter at these ranges and must not be skipped.

```
R_eff     = 6371000 * 1.15        # 1.15 = standard atmospheric refraction
drop(d)   = d^2 / (2 * R_eff)
rayAlt(d) = observerAlt + eyeHeight + d*tan(pitch) - drop(d)
```

At 8 miles the drop is ~11 m. Omitting it makes the app miss low targets and
overshoot into the sky.

### 4.4 Ray march

```
step(d) = clamp(d * 0.01, 30, 250)     # 30 m near, 250 m far

for d = step; d < maxDistance; d += step(d):
    p       = destinationPoint(origin, bearing, d)   # reuse lib/geo/haversine.ts
    terrain = sampler.sample(p)
    if terrain >= rayAlt(d):
        refine by binary search between dPrev and d (12 iters -> sub-metre)
        return hit
return { isSky: true }
```

Reuses the already-tested `destinationPoint` forward geodesic. Default
`maxDistance` 30 km. Early-exit when `rayAlt(d)` exceeds the regional maximum
elevation, since the ray can no longer hit anything.

Tradeoff to accept: a 250 m far-field step can tunnel through a knife-edge
ridge. At 10 km, 250 m subtends 1.4 degrees, comparable to compass error, so
this is not the dominant error term.

### 4.5 Roll-invariant pitch (replaces the current hook)

`useDevicePitch` currently uses `rotation.beta - 90`, which breaks when the
phone is rolled and returns nothing at all on web, where `DeviceMotion` emits
no `rotation` field.

Replace with a gravity-vector derivation. Low-pass `accelerationIncludingGravity`
with an EMA (alpha ~= 0.1) to isolate gravity, normalize, then:

```
pitch = asin(clamp(gz, -1, 1))     # gz = normalized gravity, device Z axis
```

Roll-invariant, and correct at both extremes: phone upright gives gz = 0 and
pitch 0; flat screen-up gives gz = -1 and pitch -90 degrees with the camera
facing down. `accelerationIncludingGravity` **is** emitted on web, so this
fixes the web pitch gap for free.

Sign convention differs across platforms (iOS historically inverts). Determine
empirically once and store the sign as a constant.

Heading continues to come from `Location.watchHeadingAsync` (CoreLocation
fused), which is more reliable than deriving it from the attitude matrix.

### 4.6 Observer elevation

Prefer the DEM sample at the observer's position plus 1.6 m eye height over
GPS altitude, which carries 10-30 m error and geoid/ellipsoid ambiguity. An
altitude error of 20 m over 12.9 km is only 0.089 degrees of angular error,
well under compass noise, so this is not critical, but the DEM value is more
consistent. Allow a manual override for when the user is on a building or tower.

### 4.7 POI identification

The hit gives coordinates, not a name. Size the search radius by the actual
uncertainty cone rather than a fixed value:

```
radius = distance * tan(headingAccuracyDeg)
```

`watchHeadingAsync` reports accuracy per reading; on iOS in degrees, on Android
as a 1/2/3 quality band. Handle both.

Query order:

1. Overpass (OpenStreetMap) for `natural=peak`, `man_made=tower`, named summits
2. `Location.reverseGeocodeAsync` as fallback, already a dependency

**Return ranked candidates, not one answer.** At 8 miles a 3 degree compass
error gives 675 m of lateral uncertainty. Asserting a single name would be
dishonest; showing the top 2-3 with distances is both truthful and more useful.

## 5. Buildings in towns and cities

A first-class requirement, not an edge case. This needs a different data source
and a different intersection test than terrain.

### 5.1 Why the terrain march alone fails here

Every global DEM in this class is **bare earth (DTM)**. Buildings are not in it.
Pointing at a skyscraper across a flat city produces a ray that sails over the
entire city and hits distant terrain or sky.

This includes Google's Elevation API, which is also bare-earth terrain, requires
a billed API key, and answers point queries over the network rather than serving
cacheable tiles. It is strictly worse than the free terrarium tiles already
validated here, and it does not solve buildings either. Google's building-aware
product is Photorealistic 3D Tiles, a textured glTF mesh built for rendering;
ray-querying that mesh on a phone is impractical.

### 5.2 Data source

**Do not use the Overpass API at runtime.** Tested during this spec: it returned
`Dispatcher_Client::request_read_and_idx::timeout` on both the main endpoint and
the kumi mirror, for queries as small as an 80 m radius. It is a shared community
service not intended for app traffic and is too unreliable for a tap-to-identify
feature.

Use **vector tiles carrying a building layer**, which mirrors the terrain tile
architecture already specified: spatially indexed, cacheable, offline-capable.

| Source | Coverage | Heights | Cost |
|---|---|---|---|
| Overture Maps | 2.6B buildings | estimated height + floor count where known | free, S3/Azure |
| OpenStreetMap via vector tiles | strong in towns/cities | `height`, `building:levels` | free |
| Microsoft Building Footprints | ~1.5B, global | mostly absent | free |
| Google Open Buildings 2.5D | Global South focus | ML-derived from Sentinel-2 | free |

Recommended: Overture, which conflates OSM as its highest-priority input, so
local manual mapping still wins. Decode Mapbox Vector Tiles with `@mapbox/vector-tile`
plus `pbf`, both pure JS and RN-compatible.

### 5.3 Building intersection

Not a heightfield march. A 3D ray against extruded polygons:

```
for each building polygon near the ray ground track:
    d_enter = 2D ray-polygon entry distance along the bearing
    if no intersection: skip
    baseAlt = terrainSampler.sample(entryPoint)      # reuse the DEM
    topAlt  = baseAlt + buildingHeight
    if baseAlt <= rayAlt(d_enter) <= topAlt:
        record facade hit at d_enter
take the nearest building hit
```

Run this **alongside** the terrain march and take whichever hit is nearer. That
single rule unifies hiking and city use with no mode switch: in the mountains
terrain wins, in a city the building wins.

### 5.4 Height fallbacks

Most buildings lack an explicit height, especially outside major metros. Cascade:

1. `height` tag in metres
2. `building:levels` * 3.0 m
3. Type default: house 6 m, apartments 15 m, commercial 10 m
4. Unknown: still return as a candidate, flagged lower confidence

Height matters less than it appears for the common case. When pointing roughly
level down a street, the first footprint the ground track crosses is usually the
target. Height matters mainly for seeing over a near building to a taller one behind.

### 5.5 Precision, and why candidates must be ranked

Buildings are far more demanding than mountains, because angular error converts
to a smaller absolute distance but buildings are small:

| Distance | Lateral error at +/-3 deg | Roughly |
|---|---|---|
| 200 m | 10 m | correct building or its neighbour |
| 500 m | 26 m | one to two buildings off |
| 1 km | 52 m | several buildings off |

So a single confident answer is not deliverable at typical compass accuracy.
**Return ranked candidates and let the user confirm.** This is honest, and the
confirmation tap is cheap.

Urban settings do have a strong accuracy upgrade available: ARKit's
`ARGeoTrackingConfiguration` visually localizes against Apple's Look Around
imagery and yields sub-degree heading. Its availability is limited to supported
cities, which is exactly where the buildings are. It needs native ARKit access,
so it is a config-plugin plus Swift module, not an Expo API. Treat as Phase D.

### 5.6 Visual recognition as a complement

For notable buildings there is a second route that skips geometry entirely:
recognise the building from the camera frame. This has the opposite failure
profile to ray-casting. It needs no heading precision at all, but only works for
buildings that are well photographed.

The two combine well: use the ray-cast to produce a short candidate list, then
use recognition or the user's tap to disambiguate. Worth prototyping after
Phase A rather than committing to up front.

## 6. Integration with existing code

- `PinSourceMode` gains `terrain_raycast`. The `pins.sourceMode` column is TEXT,
  so no DB migration is needed, only the TypeScript union.
- `aim_distance` is **kept** as a manual fallback for targets absent from both
  the DEM and the building data.
- Camera screen gains an "Identify" action that ray-casts along the reticle
  bearing and offers to save the result as a pin.
- Beam rendering, projection math, storage, and the side panel are unchanged.

## 7. Phasing

**Phase A, on-demand identification.** Tap to cast one ray at the reticle,
against terrain and buildings together, nearest hit wins. Returns ranked
candidates. Delivers the headline feature for both hiking and city use with no
continuous battery cost.

**Phase B, precomputed horizon panorama.** Cast a ray every 0.5 degrees across
360, cache per location. Labels become instant while panning, matching the
PeakFinder experience, and produces the silhouette Phase C needs.

**Phase C, horizon matching for heading auto-calibration.** Detect the skyline
in the camera frame, cross-correlate against the Phase B silhouette over a
+/-20 degree window, and take the peak as true heading. Largest accuracy win
available without extra hardware. Can cut heading error from +/-5 degrees to
under 1, shrinking lateral uncertainty at 8 miles from 1126 m to 225 m. Works
best against mountain skylines; urban silhouettes are harder.

**Phase D, ARKit geo-tracking for cities.** `ARGeoTrackingConfiguration` for
sub-degree heading where Apple supports it, which is the urban case Phase C
handles least well. Needs a native module, so it is deliberately last.

## 8. Testing

The marcher is a pure synchronous function over an injectable sampler, so most
of this is verifiable off-device with a synthetic elevation function:

- Curvature drop against known surveying values
- Flat sea-level DEM: hit distance matches the analytic horizon `3.86 * sqrt(h)` km
- Synthetic ridge at known distance and height: hit within one step size
- Sky case returns `isSky` rather than a false hit
- Bilinear interpolation against hand-computed values
- Tile math round-trip: lat/lon to tile to lat/lon
- Terrarium decode against the Mount Rainier fixture (4392 m ground truth)

Requires a device: compass accuracy, pitch sign convention, real-world alignment.

## 9. Known limitations

- **Lateral error scales with distance.** 225 m per degree of bearing error at
  8 miles. Phases C and D are the fixes.
- **Adjacent-building ambiguity.** At 500 m a 3 degree error spans one to two
  buildings, so ranked candidates plus a confirmation tap are required rather
  than optional.
- **Building height coverage is patchy** outside major metros, so the fallback
  cascade in 5.4 carries real weight.
- **Overpass is unusable at runtime.** Verified failing on both the main
  endpoint and a mirror. Vector tiles only.
- **Vegetation and data voids.** SRTM has voids in steep terrain; the blended
  product fills most but not all.
- **Network on first use** in a new area, until tiles are cached.

## 10. Sources

Stereo error model and the 40x-baseline heuristic: Luxonis stereo depth docs.
Monocular range limits: Survey on Monocular Metric Depth Estimation
(arXiv 2501.11841), Outdoor Monocular Depth Estimation review (arXiv 2205.01399),
FarSight (IROS 2018). Prior art at this range: PeakFinder, PeakVisor. Building
data: Overture Maps documentation. Compass accuracy: arXiv 2409.01242.
