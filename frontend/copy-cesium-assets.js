const fs = require('fs-extra');
const path = require('path');

const cesiumSource = path.join(__dirname, 'node_modules', 'cesium', 'Build', 'Cesium');
const cesiumDest = path.join(__dirname, 'public', 'cesium');

async function copyCesiumAssets() {
    try {
        await fs.copy(cesiumSource, cesiumDest);
        console.log('Cesium assets copied successfully to public/cesium');
    } catch (err) {
        console.error('Error copying Cesium assets:', err);
        process.exit(1);
    }
}

copyCesiumAssets();
