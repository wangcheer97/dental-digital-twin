"""Run with Blender -b Model/Untitled.blend --python scripts/export_dental_model.py.
Exports a separate web asset without saving changes to the source .blend file.
"""
import bpy
from pathlib import Path
from mathutils import Vector
root = Path(bpy.data.filepath).parent
bpy.ops.object.select_all(action='DESELECT')
objects = [o for o in bpy.context.scene.objects if o.type == 'MESH' and o.name != 'Cube']
for obj in objects:
    obj.select_set(True)
points = [obj.matrix_world @ Vector(corner) for obj in objects for corner in obj.bound_box]
print('WORLD_BOUNDS', [min(p[i] for p in points) for i in range(3)], [max(p[i] for p in points) for i in range(3)])
bpy.ops.export_scene.gltf(
    filepath=str(root / 'dental-head.glb'), export_format='GLB',
    use_selection=True, export_animations=False, export_cameras=False,
    export_lights=False, export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
)
print('EXPORTED', (root / 'dental-head.glb').stat().st_size)
