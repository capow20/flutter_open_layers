import Map from 'ol/Map';
import View from 'ol/View';
import './style.css';
import TileLayer from 'ol/layer/Tile';
import Zoomify from 'ol/source/Zoomify';
import { getCenter } from 'ol/extent';

let map;
const imgWidth = 6132;
const imgHeight = 8176;
let extent = [0, -imgHeight, imgWidth, 0];
function setupScene(url) {
  let source = new Zoomify({
    url: 'https://warm-mesa-43639.herokuapp.com/' + url,
    size: [imgWidth, imgHeight],
    crossOrigin: 'anonymous',
    zDirection: -1,
  });

  let layer = new TileLayer({
    tileSize: 256,
    source: source,
  });

  map = new Map({
    controls: [],
    layers: [layer],
    target: 'map',
    view: new View({
      resolutions: layer.getSource().getTileGrid().getResolutions(),
      extent: extent,
      constrainOnlyCenter: true,
    }),
  });
  map.getView().fit(extent);
}

function updateImageMap(url) {
  console.log(url);
  let source = new Zoomify({
      url: url,//'https://warm-mesa-43639.herokuapp.com/' + url,
      size: [imgWidth, imgHeight]
  });

  let layer = new TileLayer({
      source: source
  });
  let view = new View({
    resolutions: layer.getSource().getTileGrid().getResolutions(),
    extent: extent,
    constrainOnlyCenter: true,
  });
  map.setView(view);
  map.getLayers().getArray()[0] = layer;
  map.getView().fit(extent);
}



window.setupScene = setupScene;
window.updateImageMap = updateImageMap;