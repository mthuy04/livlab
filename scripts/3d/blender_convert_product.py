#!/usr/bin/env python3
"""
Deterministic FBX/OBJ/GLTF/GLB -> normalised GLB for LivLab Room Studio.

Run headless, never interactively:

    blender --background --python scripts/3d/blender_convert_product.py -- \
        --input  assets/3d/work/incoming/inax_ac-1017vrn_source.fbx \
        --output assets/3d/work/normalized/inax_ac-1017vrn_master.glb \
        --report assets/3d/work/reports/inax_ac-1017vrn.json \
        --brand INAX --sku AC-1017VRN \
        --width-mm 400 --depth-mm 805 --height-mm 588 \
        --placement FLOOR_TOILET --pivot BACK_CENTER_FLOOR

Blender is NOT used to open `.max`. It cannot. A `.max` file needs Autodesk
3ds Max, and the export out of it is a step a person performs — see
assets/3d/handoff/inax/INAX-3D-EXPORT-HANDOFF.md. This script starts where
that person's FBX lands.

THE RULE THE WHOLE FILE IS ARRANGED AROUND
------------------------------------------
The manufacturer's figures are the truth and the mesh is the thing being
judged. So this script may move, rotate and uniformly scale geometry — all
reversible, all recorded — and it may never reshape it. If width, depth and
height need different factors to match the spec, the mesh is a different shape
from the product and the answer is DIMENSION_MISMATCH, not three scale values.
A model that measures correctly because it was stretched is the most expensive
kind of wrong: nothing downstream can detect it.

Exit codes: 0 converted (QA still required), 1 failed, 2 bad invocation.
"""

import json
import math
import os
import sys
import hashlib
from datetime import datetime, timezone

try:
    import bpy
    import bmesh  # noqa: F401  (imported for availability check only)
    from mathutils import Vector
except ImportError:  # pragma: no cover - only happens outside Blender
    sys.stderr.write(
        "This script must run inside Blender:\n"
        "  blender --background --python scripts/3d/blender_convert_product.py -- ...\n"
    )
    sys.exit(2)


# --------------------------------------------------------------------------- #
# Contract shared with lib/room-studio/fbxIngestion.ts and roomGeometry.ts.
# Read off the engine, not assumed: RoomShell puts the floor at Y=0 and the
# back wall at -Z, so a product standing against it faces +Z.
# --------------------------------------------------------------------------- #
AXIS_UP = "+Y"
AXIS_FORWARD = "+Z"
WORLD_UNIT = "1 unit = 1 metre"

SUPPORTED_FORMATS = {".fbx", ".obj", ".gltf", ".glb"}

# §18 thresholds, the same numbers as DIMENSION_ERROR_* in product3dAsset.ts.
DIMENSION_PASS_PCT = 2.0
DIMENSION_REVIEW_PCT = 5.0

# §15: only powers of ten, because the only legitimate reason for a whole-model
# size difference is that someone wrote millimetres where we expect metres.
# 3.7x is not a unit, it is a different object.
UNIT_CANDIDATES = (0.001, 0.01, 0.1, 1.0, 10.0, 100.0, 1000.0)

# How far apart the three per-axis factors may be before the mesh is judged a
# different shape rather than a different unit.
AXIS_SPREAD_MAX_PCT = 2.0

NON_PRODUCT_TYPES = {"CAMERA", "LIGHT", "SPEAKER", "LIGHT_PROBE"}

# §13: names that mean "not the product". Matched case-insensitively against
# whole words so a real part called "lid_support" is never caught by "support".
NON_PRODUCT_NAME_HINTS = (
    "camera", "light", "lamp", "sun", "spot", "area_light",
    "backdrop", "background", "bg", "studio", "floor_plane", "groundplane",
    "reference", "ref_plane", "guide", "helper", "dummy", "gizmo", "locator",
    "annotation", "dimension_line", "dim_line", "measurement", "text", "watermark",
    "grid", "environment",
)


def log(message):
    print(f"[convert] {message}", flush=True)


# --------------------------------------------------------------------------- #
# arguments
# --------------------------------------------------------------------------- #

def parse_args(argv):
    if "--" in argv:
        argv = argv[argv.index("--") + 1:]
    else:
        argv = []

    args = {}
    key = None
    for token in argv:
        if token.startswith("--"):
            key = token[2:]
            args[key] = True
        elif key is not None:
            args[key] = token
            key = None
    return args


def require(args, name):
    value = args.get(name)
    if value in (None, True):
        sys.stderr.write(f"missing --{name}\n")
        sys.exit(2)
    return value


# --------------------------------------------------------------------------- #
# scene
# --------------------------------------------------------------------------- #

def reset_scene():
    """A conversion must not inherit anything from Blender's startup file."""
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.context.scene.unit_settings.system = "METRIC"
    bpy.context.scene.unit_settings.scale_length = 1.0


def import_source(path):
    ext = os.path.splitext(path)[1].lower()
    if ext not in SUPPORTED_FORMATS:
        return None, "UNSUPPORTED_INPUT_FORMAT"

    try:
        if ext == ".fbx":
            # Blender's FBX importer applies its own unit conversion and axis
            # guess. Both are switched off: this script decides scale from the
            # manufacturer's figures and orientation from the geometry, and an
            # importer quietly doing half the job first makes both undebuggable.
            bpy.ops.import_scene.fbx(
                filepath=path,
                use_manual_orientation=False,
                global_scale=1.0,
                use_custom_normals=True,
                use_image_search=True,
                ignore_leaf_bones=True,
                automatic_bone_orientation=True,
            )
        elif ext == ".obj":
            if hasattr(bpy.ops.wm, "obj_import"):
                bpy.ops.wm.obj_import(filepath=path, forward_axis="NEGATIVE_Z", up_axis="Y")
            else:
                bpy.ops.import_scene.obj(filepath=path)
        else:
            bpy.ops.import_scene.gltf(filepath=path)
    except Exception as err:  # noqa: BLE001 - report, never crash silently
        return None, f"IMPORT_FAILED: {type(err).__name__}: {err}"

    return list(bpy.context.scene.objects), None


def is_non_product(obj):
    """
    §13: cameras, lights, backdrops and annotations go; product parts stay.

    Deliberately conservative. A toilet legitimately contains a seat, a lid, a
    cistern, a flush button and visible fittings, and several of those have
    names that look like scene furniture if you match loosely. Anything this
    cannot classify is KEPT and flagged for a person, because deleting a real
    part is silent and unrecoverable while keeping a stray one is visible.
    """
    if obj.type in NON_PRODUCT_TYPES:
        return True, f"{obj.type.lower()} object"
    if obj.type != "MESH":
        return False, None

    name = obj.name.lower().replace("-", "_").replace(".", "_").replace(" ", "_")
    tokens = set(name.split("_"))
    for hint in NON_PRODUCT_NAME_HINTS:
        hint_tokens = set(hint.split("_"))
        if hint_tokens <= tokens:
            return True, f"name matches '{hint}'"
    return False, None


def clean_scene(objects, warnings):
    """Removes non-product objects. Returns the meshes that remain."""
    removed = []
    for obj in list(objects):
        if obj.name not in bpy.context.scene.objects:
            continue
        drop, reason = is_non_product(obj)
        if drop:
            removed.append({"name": obj.name, "type": obj.type, "reason": reason})
            bpy.data.objects.remove(obj, do_unlink=True)

    meshes = [o for o in bpy.context.scene.objects if o.type == "MESH"]

    # §25: zero-area and empty meshes carry nothing and distort the bbox.
    for obj in list(meshes):
        if len(obj.data.vertices) == 0:
            removed.append({"name": obj.name, "type": "MESH", "reason": "no vertices"})
            bpy.data.objects.remove(obj, do_unlink=True)
    meshes = [o for o in bpy.context.scene.objects if o.type == "MESH"]

    # Empties are removed only once nothing depends on them.
    for obj in list(bpy.context.scene.objects):
        if obj.type == "EMPTY" and not obj.children:
            removed.append({"name": obj.name, "type": "EMPTY", "reason": "childless empty"})
            bpy.data.objects.remove(obj, do_unlink=True)

    if len(meshes) > 24:
        warnings.append(
            f"MANY_MESHES: {len(meshes)} mesh objects survived cleanup — "
            "check the scene holds one product and not an assembly or a range."
        )
    return meshes, removed


# --------------------------------------------------------------------------- #
# measurement
# --------------------------------------------------------------------------- #

def world_bbox(meshes):
    """
    §14: the bounding box of PRODUCT geometry, in world space.

    Corners are taken through each object's world matrix, so a part that
    carries its size in a parent transform is measured at the size it is
    actually drawn — which is the number that has to match the spec sheet.
    """
    lo = Vector((math.inf, math.inf, math.inf))
    hi = Vector((-math.inf, -math.inf, -math.inf))
    for obj in meshes:
        for corner in obj.bound_box:
            world = obj.matrix_world @ Vector(corner)
            lo.x, lo.y, lo.z = min(lo.x, world.x), min(lo.y, world.y), min(lo.z, world.z)
            hi.x, hi.y, hi.z = max(hi.x, world.x), max(hi.y, world.y), max(hi.z, world.z)
    if not all(map(math.isfinite, (lo.x, lo.y, lo.z))):
        return None, None
    return lo, hi


def dims_of(lo, hi):
    return Vector((hi.x - lo.x, hi.y - lo.y, hi.z - lo.z))


def error_pct(actual, expected):
    if not expected:
        return None
    return abs(actual - expected) / expected * 100.0


# --------------------------------------------------------------------------- #
# §19 orientation
# --------------------------------------------------------------------------- #

def choose_orientation(dims, official_m, warnings):
    """
    Finds the yaw that lines the mesh up with Room Studio's convention.

    Only quarter turns about the vertical axis are considered, and only the
    footprint decides: a toilet is deeper than it is wide, so the axis that
    should become depth is the longer horizontal one. Height is never used to
    pick a rotation — a model lying on its side is a broken export, not a
    product to be stood up, and turning it upright here would hide that.

    `None` means it could not be decided, which becomes ORIENTATION_QA_REQUIRED
    rather than a guess.
    """
    want_w, want_d = official_m.x, official_m.z

    candidates = []
    for turns in (0, 1, 2, 3):
        # A quarter turn swaps the two horizontal extents.
        w, d = (dims.x, dims.z) if turns % 2 == 0 else (dims.z, dims.x)
        ew, ed = error_pct(w, want_w), error_pct(d, want_d)
        if ew is None or ed is None:
            continue
        candidates.append({"turns": turns, "width": w, "depth": d, "worst": max(ew, ed)})

    if not candidates:
        return None, "no official width/depth to orient against"

    candidates.sort(key=lambda c: c["worst"])
    best, second = candidates[0], candidates[1] if len(candidates) > 1 else None

    if best["worst"] > DIMENSION_REVIEW_PCT:
        return None, f"no rotation brings the footprint within {DIMENSION_REVIEW_PCT}%"

    # A near-square footprint fits two rotations equally well. The numbers
    # cannot tell them apart, so a person has to look at which end the cistern
    # is on. Saying so is the whole point.
    if second is not None and abs(second["worst"] - best["worst"]) < 0.5:
        warnings.append(
            "ORIENTATION_AMBIGUOUS: footprint is near-square, so rotation "
            f"{best['turns'] * 90}° and {second['turns'] * 90}° fit equally well. "
            "A person must confirm which way the product faces."
        )
        return None, "ambiguous footprint"

    return best["turns"], None


# --------------------------------------------------------------------------- #
# transforms
# --------------------------------------------------------------------------- #

def select_only(objects):
    bpy.ops.object.select_all(action="DESELECT")
    for obj in objects:
        obj.select_set(True)
    if objects:
        bpy.context.view_layer.objects.active = objects[0]


def apply_transforms(meshes):
    """§21: bake transforms so the runtime object has a clean root."""
    select_only(meshes)
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)


def scale_uniform(meshes, factor):
    select_only(meshes)
    bpy.ops.transform.resize(value=(factor, factor, factor))
    apply_transforms(meshes)


def rotate_quarter_turns(meshes, turns):
    if turns % 4 == 0:
        return
    select_only(meshes)
    bpy.ops.transform.rotate(value=math.radians(90 * turns), orient_axis="Y")
    apply_transforms(meshes)


def move_to_pivot(meshes, pivot):
    """
    §20: translate so the named anchor sits at the origin.

    BACK_CENTER_FLOOR means x at the horizontal centre, y on the floor, z at
    the rear face — the face that meets the wall. Derived from the bounding box
    after orientation, never from an authored origin, because the authored
    origin is exactly the thing that cannot be trusted.
    """
    lo, hi = world_bbox(meshes)
    if lo is None:
        return None

    centre_x = (lo.x + hi.x) / 2.0
    if pivot == "BACK_CENTER_FLOOR":
        anchor = Vector((centre_x, lo.y, lo.z))
    elif pivot == "BOTTOM_CENTER":
        anchor = Vector((centre_x, lo.y, (lo.z + hi.z) / 2.0))
    elif pivot == "CENTER":
        anchor = Vector((centre_x, (lo.y + hi.y) / 2.0, (lo.z + hi.z) / 2.0))
    else:
        return None

    select_only(meshes)
    bpy.ops.transform.translate(value=(-anchor.x, -anchor.y, -anchor.z))
    apply_transforms(meshes)
    return anchor


# --------------------------------------------------------------------------- #
# §22 materials
# --------------------------------------------------------------------------- #

def normalise_materials(meshes, warnings):
    """
    Keeps the manufacturer's appearance and fixes only what would misrepresent
    it in a PBR renderer.

    Explicitly NOT a restyle. Nothing here invents a finish, picks a brand
    colour or "improves" ceramic. It clears emission (a self-lit toilet), pulls
    full transparency back to opaque (an invisible one), and reports chrome that
    arrived as grey plastic rather than quietly making it shiny — guessing which
    grey was meant to be metal is how a plastic seat becomes chrome.
    """
    seen = {}
    for obj in meshes:
        for slot in obj.material_slots:
            mat = slot.material
            if mat is None or mat.name in seen:
                continue
            seen[mat.name] = mat

    report = []
    for name, mat in seen.items():
        entry = {"name": name, "changes": [], "flags": []}

        if not mat.use_nodes:
            entry["flags"].append("NO_NODES")
            report.append(entry)
            continue

        bsdf = next((n for n in mat.node_tree.nodes if n.type == "BSDF_PRINCIPLED"), None)
        if bsdf is None:
            entry["flags"].append("NOT_PRINCIPLED")
            report.append(entry)
            continue

        def socket(key):
            return bsdf.inputs.get(key)

        emission = socket("Emission Strength")
        if emission is not None and not emission.is_linked and emission.default_value > 0.0:
            emission.default_value = 0.0
            entry["changes"].append("emission -> 0")

        alpha = socket("Alpha")
        if alpha is not None and not alpha.is_linked and alpha.default_value < 0.98:
            entry["flags"].append(f"TRANSPARENT({alpha.default_value:.2f})")

        metallic = socket("Metallic")
        roughness = socket("Roughness")
        base = socket("Base Color")
        if metallic is not None and roughness is not None and base is not None:
            m = metallic.default_value if not metallic.is_linked else None
            r = roughness.default_value if not roughness.is_linked else None
            colour = tuple(base.default_value)[:3] if not base.is_linked else None

            if m is not None and r is not None and m > 0.5 and r < 0.1:
                entry["flags"].append("MIRROR_LIKE")
            if colour is not None and min(colour) > 0.97 and (m or 0) < 0.1:
                # Pure 1.0 white clips under any lighting and stops reading as
                # ceramic. Nudged, not recoloured.
                base.default_value = (0.94, 0.94, 0.93, 1.0)
                entry["changes"].append("blown-out white -> 0.94")
            if "chrome" in name.lower() and m is not None and m < 0.5:
                entry["flags"].append("CHROME_NOT_METALLIC")

        # §23: a texture the exporter referenced but did not ship.
        for node in mat.node_tree.nodes:
            if node.type == "TEX_IMAGE":
                img = node.image
                if img is None or (img.filepath and not img.has_data):
                    entry["flags"].append(f"MISSING_TEXTURE({img.name if img else 'unset'})")

        report.append(entry)

    for entry in report:
        for flag in entry["flags"]:
            warnings.append(f"MATERIAL_QA_REQUIRED: {entry['name']}: {flag}")

    return report


# --------------------------------------------------------------------------- #
# metrics + export
# --------------------------------------------------------------------------- #

def mesh_metrics(meshes):
    triangles = 0
    for obj in meshes:
        mesh = obj.data
        for poly in mesh.polygons:
            triangles += max(0, len(poly.vertices) - 2)
    materials = {s.material.name for o in meshes for s in o.material_slots if s.material}
    images = {
        n.image.name
        for o in meshes
        for s in o.material_slots
        if s.material and s.material.use_nodes
        for n in s.material.node_tree.nodes
        if n.type == "TEX_IMAGE" and n.image
    }
    return {
        "meshCount": len(meshes),
        "triangleCount": triangles,
        "materialCount": len(materials),
        "textureCount": len(images),
    }


def export_glb(path, meshes):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    select_only(meshes)
    bpy.ops.export_scene.gltf(
        filepath=path,
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_yup=True,          # glTF is Y-up, same as the room
        export_texcoords=True,
        export_normals=True,
        export_materials="EXPORT",
        export_image_format="AUTO",
        # §31: meshopt only. drei's loader decodes meshopt from a bundled
        # module; its Draco path fetches a decoder from an external CDN, which
        # is a network dependency Room Studio does not otherwise have.
        export_draco_mesh_compression_enable=False,
    )


def sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as handle:
        for chunk in iter(lambda: handle.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


# --------------------------------------------------------------------------- #

def main():
    args = parse_args(sys.argv)

    source = require(args, "input")
    output = require(args, "output")
    report_path = require(args, "report")
    brand = require(args, "brand")
    sku = require(args, "sku")
    placement = args.get("placement", "FLOOR_TOILET")
    pivot = args.get("pivot", "BACK_CENTER_FLOOR")

    official_mm = {
        "width": float(require(args, "width-mm")),
        "depth": float(require(args, "depth-mm")),
        "height": float(require(args, "height-mm")),
    }
    official_m = Vector((official_mm["width"] / 1000.0, official_mm["height"] / 1000.0, official_mm["depth"] / 1000.0))

    warnings = []
    failures = []
    report = {
        "schema": "livlab.3d.conversion/1",
        "convertedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "blenderVersion": bpy.app.version_string,
        "brand": brand,
        "sku": sku,
        "inputFile": source,
        "inputFormat": os.path.splitext(source)[1].lower().lstrip("."),
        "officialDimensionsMm": official_mm,
        "placement": placement,
        "pivot": pivot,
        "axisConvention": {"up": AXIS_UP, "forward": AXIS_FORWARD, "worldUnit": WORLD_UNIT},
        "status": "FAILED",
        "warnings": warnings,
        "failures": failures,
    }

    def finish(code):
        os.makedirs(os.path.dirname(report_path), exist_ok=True)
        with open(report_path, "w", encoding="utf-8") as handle:
            json.dump(report, handle, indent=2, ensure_ascii=False)
            handle.write("\n")
        log(f"report -> {report_path}")
        sys.exit(code)

    if not os.path.exists(source):
        failures.append("INPUT_NOT_FOUND")
        finish(1)

    report["sourceSha256"] = sha256(source)
    report["sourceSizeBytes"] = os.path.getsize(source)

    log(f"importing {source}")
    reset_scene()
    imported, err = import_source(source)
    if err:
        failures.append(err)
        finish(1)

    meshes, removed = clean_scene(imported, warnings)
    report["removedObjects"] = removed
    if not meshes:
        failures.append("NO_PRODUCT_GEOMETRY")
        finish(1)

    lo, hi = world_bbox(meshes)
    if lo is None:
        failures.append("BROKEN_GEOMETRY")
        finish(1)
    raw = dims_of(lo, hi)
    report["rawBBox"] = {"x": round(raw.x, 6), "y": round(raw.y, 6), "z": round(raw.z, 6)}
    log(f"raw bbox {raw.x:.4f} x {raw.y:.4f} x {raw.z:.4f}")

    # ----------------------------------------------------------- §15 §16 §17
    # The orientation is not known yet, so each candidate unit is scored
    # against the sorted extents: that comparison is rotation-independent, and
    # picking a unit from a mis-assigned axis is how a 805mm depth gets matched
    # to a 400mm width and the whole model comes out 2x small.
    want_sorted = sorted([official_m.x, official_m.y, official_m.z], reverse=True)
    raw_sorted = sorted([raw.x, raw.y, raw.z], reverse=True)

    scored = []
    for factor in UNIT_CANDIDATES:
        scaled = [v * factor for v in raw_sorted]
        errs = [error_pct(a, e) for a, e in zip(scaled, want_sorted)]
        if any(e is None for e in errs):
            continue
        scored.append({"factor": factor, "worst": max(errs), "errors": errs})
    scored.sort(key=lambda s: s["worst"])

    if not scored:
        failures.append("NO_SCALE_CANDIDATE")
        finish(1)

    best_scale = scored[0]
    report["scaleCandidates"] = [
        {"factor": s["factor"], "worstErrorPct": round(s["worst"], 3)} for s in scored[:4]
    ]
    report["detectedScaleFactor"] = best_scale["factor"]

    if best_scale["worst"] > DIMENSION_REVIEW_PCT:
        # §17: no single factor works. Before failing, say WHY — three factors
        # that differ is a shape problem, one that is simply far off is a
        # wrong-model problem, and the next person needs to know which.
        per_axis = [
            (official_m.x / raw.x) if raw.x else 0,
            (official_m.y / raw.y) if raw.y else 0,
            (official_m.z / raw.z) if raw.z else 0,
        ]
        usable = [f for f in per_axis if f > 0]
        spread = (max(usable) - min(usable)) / min(usable) * 100 if usable else 0
        report["perAxisFactors"] = [round(f, 6) for f in per_axis]
        report["axisFactorSpreadPct"] = round(spread, 3)
        if spread > AXIS_SPREAD_MAX_PCT:
            failures.append(
                f"DIMENSION_MISMATCH: axes need factors {per_axis[0]:.4f}/{per_axis[1]:.4f}/"
                f"{per_axis[2]:.4f} (spread {spread:.1f}%). The mesh is a different shape "
                "from the product; it is not a unit problem and must not be stretched."
            )
        else:
            failures.append(
                f"NO_UNIFORM_SCALE: best candidate {best_scale['factor']} still leaves "
                f"{best_scale['worst']:.1f}% error."
            )
        finish(1)

    if best_scale["factor"] != 1.0:
        log(f"scaling by {best_scale['factor']}")
        scale_uniform(meshes, best_scale["factor"])
    else:
        apply_transforms(meshes)

    lo, hi = world_bbox(meshes)
    scaled_dims = dims_of(lo, hi)

    # ------------------------------------------------------------------- §19
    turns, why = choose_orientation(scaled_dims, official_m, warnings)
    if turns is None:
        report["orientation"] = {"resolved": False, "reason": why}
        warnings.append(f"ORIENTATION_QA_REQUIRED: {why}")
    else:
        rotate_quarter_turns(meshes, turns)
        report["orientation"] = {
            "resolved": True,
            "yawDegrees": turns * 90,
            "up": AXIS_UP,
            "forward": AXIS_FORWARD,
        }

    # ------------------------------------------------------------------- §20
    anchor = move_to_pivot(meshes, pivot)
    if anchor is None:
        failures.append(f"UNKNOWN_PIVOT: {pivot}")
        finish(1)
    report["pivotApplied"] = {
        "preset": pivot,
        "translatedBy": [round(-anchor.x, 6), round(-anchor.y, 6), round(-anchor.z, 6)],
    }

    # --------------------------------------------------------------- §18 QA
    lo, hi = world_bbox(meshes)
    final = dims_of(lo, hi)
    actual_mm = {
        "width": final.x * 1000.0,
        "depth": final.z * 1000.0,
        "height": final.y * 1000.0,
    }
    errors = {k: error_pct(actual_mm[k], official_mm[k]) for k in ("width", "depth", "height")}
    worst = max(e for e in errors.values() if e is not None)

    report["normalizedBBox"] = {"x": round(final.x, 6), "y": round(final.y, 6), "z": round(final.z, 6)}
    report["normalizedDimensionsMm"] = {k: round(v, 2) for k, v in actual_mm.items()}
    report["dimensionErrorsPct"] = {k: round(v, 3) for k, v in errors.items() if v is not None}
    report["worstDimensionErrorPct"] = round(worst, 3)
    report["dimensionVerdict"] = (
        "PASS" if worst <= DIMENSION_PASS_PCT
        else "REVIEW" if worst <= DIMENSION_REVIEW_PCT
        else "FAIL"
    )

    # §20 check: after the pivot move the anchor must actually be at the origin.
    report["originCheck"] = {
        "minY": round(lo.y, 6),
        "minZ": round(lo.z, 6),
        "centreX": round((lo.x + hi.x) / 2.0, 6),
    }
    if pivot == "BACK_CENTER_FLOOR":
        if abs(lo.y) > 1e-4 or abs(lo.z) > 1e-4 or abs((lo.x + hi.x) / 2.0) > 1e-4:
            failures.append("PIVOT_NOT_APPLIED")

    if report["dimensionVerdict"] == "FAIL":
        failures.append(f"DIMENSION_FAIL: worst {worst:.2f}% > {DIMENSION_REVIEW_PCT}%")

    report["materials"] = normalise_materials(meshes, warnings)
    report.update(mesh_metrics(meshes))

    if failures:
        finish(1)

    log(f"exporting {output}")
    try:
        export_glb(output, meshes)
    except Exception as err:  # noqa: BLE001
        failures.append(f"EXPORT_FAILED: {type(err).__name__}: {err}")
        finish(1)

    report["outputGlb"] = output
    report["fileSizeBytes"] = os.path.getsize(output)
    report["outputSha256"] = sha256(output)

    # §37: the pipeline may assert only what it actually measured. Identity,
    # materials, orientation, pivot and performance are a person's call, and
    # proposing them here would turn a checklist into a rubber stamp.
    report["proposedQaFlags"] = {
        "dimensionsVerified": report["dimensionVerdict"] == "PASS",
        "scaleVerified": report["detectedScaleFactor"] in UNIT_CANDIDATES and worst <= DIMENSION_PASS_PCT,
    }
    report["manualQaRequired"] = [
        "identityVerified",
        "orientationVerified",
        "pivotVerified",
        "materialsVerified",
        "performanceVerified",
    ]

    # §36: never CONVERTED -> READY.
    report["status"] = "CONVERTED"
    report["nextLifecycleStatus"] = "QA_REQUIRED"

    log(
        f"done: {report['triangleCount']} tris, {report['fileSizeBytes']} bytes, "
        f"worst dimension error {worst:.3f}% ({report['dimensionVerdict']})"
    )
    finish(0)


if __name__ == "__main__":
    main()
