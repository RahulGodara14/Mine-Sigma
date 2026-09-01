const fs = require('fs-extra');
const path = require('path');

const cesiumSource = path.join(__dirname, 'node_modules', 'cesium', 'Build', 'Cesium');
const cesiumDest = path.join(__dirname, 'public', 'cesium');

async function copyCesiumAssets() {
    try {
        const subdirs = ['Workers', 'ThirdParty', 'Assets', 'Widgets'];
        for (const dir of subdirs) {
            const src = path.join(cesiumSource, dir);
            const dst = path.join(cesiumDest, dir);
            if (await fs.pathExists(src)) {
                await fs.copy(src, dst);
            }
        }
        // Remove standalone bundles that exceed Vercel's 4.5MB limit
        const oversized = [
            path.join(cesiumDest, 'Cesium.js'),
            path.join(cesiumDest, 'index.js'),
            path.join(cesiumDest, 'index.cjs')
        ];
        for (const file of oversized) {
            if (await fs.pathExists(file)) {
                await fs.remove(file);
            }
        }
        console.log('Cesium assets copied successfully to public/cesium (excluding oversized bundles)');
    } catch (err) {
        console.error('Error copying Cesium assets:', err);
        process.exit(1);
    }
}

copyCesiumAssets();
