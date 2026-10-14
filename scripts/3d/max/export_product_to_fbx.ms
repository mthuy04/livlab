/*
================================================================================
LivLab — export an official manufacturer .max scene to FBX
================================================================================

Run this ONCE, in Autodesk 3ds Max on Windows, for one product. It produces the
FBX that LivLab's own pipeline then normalises and converts to GLB.

    1. Open 3ds Max
    2. Scripting > Run Script...  ->  this file
    3. Or paste into the MAXScript Listener and press Enter

By default it exports the scene that is ALREADY OPEN. To let it open the file
itself, set SOURCE_MAX below.

--------------------------------------------------------------------------------
WHAT THIS SCRIPT IS FOR, AND WHAT IT IS NOT FOR
--------------------------------------------------------------------------------

It is a geometry handoff. It removes the things that are not the product —
cameras, lights, backdrops, reference planes, annotation — and exports what is
left, at the size the manufacturer modelled it.

It deliberately does NOT:

    * rescale anything to "look right"
    * move or re-centre the product
    * change the pivot
    * rotate the product "the right way up"
    * merge, weld, decimate or clean up meshes
    * touch materials in any way

Every one of those is done later, by LivLab, from the manufacturer's published
dimensions. Doing them here would destroy the only evidence that the geometry
is the correct size: a model corrected by eye always passes a size check,
because the check is the mesh against the spec sheet and the mesh has been
edited to match.

If something looks wrong when you open the file — missing textures, an obviously
wrong scale, several products in one scene — please say so rather than fixing
it. That information is the useful part.
================================================================================
*/

(
    -- ===================== EDIT THESE TWO LINES IF NEEDED =====================

    -- Leave as "" to export the scene that is currently open.
    -- Otherwise the full path to the manufacturer's .max file, e.g.
    --   "C:\\livlab\\AC-1017VRN.max"
    global SOURCE_MAX = ""

    -- Where to write the FBX. The filename matters: LivLab matches it to a SKU
    -- by exact name, and an unrecognised name is left unprocessed rather than
    -- guessed at.
    global OUTPUT_FBX = "C:\\livlab\\inax_ac-1017vrn_source.fbx"

    -- =========================================================================

    local logLines = #()
    fn say s = (
        append logLines s
        format "%\n" s
    )

    say "LivLab MAX -> FBX export"
    say ("3ds Max: " + (maxVersion())[1] as string)

    -- ------------------------------------------------------------- open file
    if SOURCE_MAX != "" then (
        if not (doesFileExist SOURCE_MAX) then (
            messageBox ("Không thấy file:\n" + SOURCE_MAX) title:"LivLab export"
            return false
        )
        say ("opening " + SOURCE_MAX)
        loadMaxFile SOURCE_MAX quiet:true
    ) else (
        say "using the scene that is already open"
    )

    -- ------------------------------------------------- remove what is not the
    -- product. Cameras and lights are unambiguous. Helpers are removed only
    -- when nothing is linked to them, because a helper with children may be
    -- holding part of the product's hierarchy together.

    local removed = 0

    for o in (cameras as array) do ( delete o; removed += 1 )
    for o in (lights as array) do ( delete o; removed += 1 )
    say ("removed " + removed as string + " cameras/lights")

    local helpersRemoved = 0
    for o in (helpers as array) do (
        if o != undefined and (o.children.count == 0) then (
            delete o
            helpersRemoved += 1
        )
    )
    say ("removed " + helpersRemoved as string + " childless helpers")

    -- Shapes (splines) are construction curves, not renderable product surface.
    local shapesRemoved = 0
    for o in (shapes as array) do (
        if o != undefined and (o.children.count == 0) then (
            delete o
            shapesRemoved += 1
        )
    )
    say ("removed " + shapesRemoved as string + " spline shapes")

    -- Objects whose NAME says they are scene furniture. Conservative on
    -- purpose: a real part called "seat_support" must survive, so matching is
    -- on obvious whole words only, and anything uncertain is kept.
    local junkWords = #("backdrop", "background", "bg_plane", "floorplane", \
                        "ground_plane", "reference", "ref_plane", "grid", \
                        "watermark", "annotation", "dimension_line", "logo_text")
    local namedRemoved = 0
    for o in (geometry as array) do (
        if o == undefined do continue
        local lower = toLower o.name
        for w in junkWords do (
            if (findString lower w) != undefined and o.children.count == 0 then (
                say ("  removing by name: " + o.name)
                delete o
                namedRemoved += 1
                exit
            )
        )
    )
    say ("removed " + namedRemoved as string + " named non-product objects")

    -- ------------------------------------------------------- what is left
    local productMeshes = for o in (geometry as array) where o != undefined collect o
    if productMeshes.count == 0 then (
        messageBox "Không còn mesh nào sau khi dọn cảnh. Không export." title:"LivLab export"
        return false
    )
    say ("product meshes: " + productMeshes.count as string)
    for o in productMeshes do say ("  " + o.name)

    -- Scene bounding box, reported so the size can be sanity-checked against
    -- the manufacturer's figures before anyone converts anything.
    local bbMin = [1e9, 1e9, 1e9]
    local bbMax = [-1e9, -1e9, -1e9]
    for o in productMeshes do (
        local bb = nodeGetBoundingBox o (matrix3 1)
        bbMin = [amin bbMin.x bb[1].x, amin bbMin.y bb[1].y, amin bbMin.z bb[1].z]
        bbMax = [amax bbMax.x bb[2].x, amax bbMax.y bb[2].y, amax bbMax.z bb[2].z]
    )
    local size = bbMax - bbMin
    say ("scene units: " + (units.SystemType as string))
    say ("bounding box (scene units): " + size.x as string + " x " + \
         size.y as string + " x " + size.z as string)

    -- ------------------------------------------------------- FBX parameters
    --
    -- Two conversions ARE applied, both uniform and both recorded: units to
    -- millimetres and up-axis to Y. They are stated rather than left to the
    -- importer to guess, which is the one ambiguity that makes an otherwise
    -- correct model come out a thousand times too large.
    --
    -- Everything else is off. No animation, no cameras, no lights, and nothing
    -- that would alter geometry.

    pluginManager.loadClass FBXEXP

    FBXExporterSetParam "ResetExport"
    FBXExporterSetParam "Animation" false
    FBXExporterSetParam "Cameras" false
    FBXExporterSetParam "Lights" false
    FBXExporterSetParam "Shape" false
    FBXExporterSetParam "Skin" false
    FBXExporterSetParam "Preserveinstances" true
    FBXExporterSetParam "SmoothingGroups" true
    FBXExporterSetParam "NormalsPerPoly" false
    FBXExporterSetParam "TangentSpaceExport" true
    FBXExporterSetParam "EmbedTextures" true
    FBXExporterSetParam "ConvertUnit" #mm
    FBXExporterSetParam "UpAxis" #y
    FBXExporterSetParam "GeomAsBone" false
    FBXExporterSetParam "ASCII" false
    FBXExporterSetParam "FileVersion" "FBX201800"

    say "FBX: binary, units mm, up axis +Y, textures embedded, no animation"

    -- --------------------------------------------------------------- export
    local outDir = getFilenamePath OUTPUT_FBX
    if not (doesFileExist outDir) then makeDir outDir all:true

    select productMeshes
    local ok = exportFile OUTPUT_FBX #noPrompt selectedOnly:true using:FBXEXP

    if ok then (
        say ("WROTE " + OUTPUT_FBX)
        -- A sidecar log beside the FBX, so whoever receives it can see what was
        -- removed and what the scene measured without re-opening 3ds Max.
        local logPath = (getFilenamePath OUTPUT_FBX) + \
                        (getFilenameFile OUTPUT_FBX) + "_export_log.txt"
        local f = createFile logPath
        for line in logLines do format "%\n" line to:f
        close f
        messageBox ("Xong.\n\nFBX: " + OUTPUT_FBX + "\nLog: " + logPath + \
                    "\n\nGửi cả hai file về cho LivLab.") title:"LivLab export"
    ) else (
        messageBox ("Export thất bại:\n" + OUTPUT_FBX) title:"LivLab export"
    )

    ok
)
