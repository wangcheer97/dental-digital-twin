document.addEventListener('DOMContentLoaded', () => {
    const viewer = document.getElementById('dental-model');
    const status = document.getElementById('model-status');
    const error = document.getElementById('model-error');
    const initialOrbit = viewer.getAttribute('camera-orbit');
    viewer.addEventListener('progress', event => {
        status.textContent = `Loading 3D model… ${Math.round(event.detail.totalProgress * 100)}%`;
    });
    viewer.addEventListener('load', () => {
        status.hidden = true;
        error.hidden = true;
    });
    viewer.addEventListener('error', () => {
        status.hidden = true;
        error.hidden = false;
    });
    document.getElementById('reset-model').addEventListener('click', () => {
        viewer.cameraOrbit = initialOrbit;
        viewer.cameraTarget = 'auto auto auto';
        viewer.fieldOfView = '30deg';
    });
});
