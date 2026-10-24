# Interactive dental anatomy

- `Untitled.blend`: original source, not modified by the export process.
- `dental-head.glb`: web derivative; 14 anatomical meshes with embedded textures
  and Draco geometry compression. Default Blender cube, camera and light excluded.
- `teeth.png`: original transparent dental-arch reference, displayed separately
  at its original aspect ratio.

Re-export using Blender:

```sh
/Applications/Blender.app/Contents/MacOS/Blender -b Model/Untitled.blend --python scripts/export_dental_model.py
```

Viewer: Google model-viewer 4.4.0 (Apache-2.0), vendored in js/vendor.
Draco decoding and default environment resources may be fetched by the viewer.
Preview through HTTP (e.g. http://127.0.0.1:8000/index.html), not file://.

Model attribution follows the existing project README: Head and Neck Anatomy
for Dentistry, University of Dundee, CAHID, https://sketchfab.com/anatomy_dundee,
CC BY 4.0 https://creativecommons.org/licenses/by/4.0/ . Web format adapted.
This is a reference anatomy model, not a reconstruction of the synthetic patient.
Rotation, zoom, pan and reset are implemented; tooth selection and clinical
simulation are not implemented.
