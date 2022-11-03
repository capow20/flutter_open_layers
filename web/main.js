import Map from 'ol/Map';
import View from 'ol/View';
import './style.css';
import TileLayer from 'ol/layer/Tile';
import Zoomify from 'ol/source/Zoomify';
import TileState from 'ol/TileState';
import Interaction from 'ol/interaction/Interaction';

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

  source.setTileLoadFunction(tileLoadProgress);

  map = new Map({
    controls: [],
    layers: [layer],
    target: 'map',
    view: new View({
      enableRotation: false,
      resolutions: layer.getSource().getTileGrid().getResolutions(),
      extent: extent,
      constrainOnlyCenter: true,
      minZoom: 1,
      zoom: 1,
    }),
  });
  map.getView().fit(extent);
}

function tileLoadProgress(tile, src) {
  var xhr = new XMLHttpRequest();
  xhr.onloadstart = function() {
      xhr.responseType = 'blob';
  }
  xhr.addEventListener('progress', function (evt) {
    window.flutter_inappwebview.callHandler('loadProgress', (evt.total/evt.loaded) * 100);
  });
  xhr.addEventListener('loadend', function (evt) {
    var data = this.response;
    if (data !== undefined) {
      tile.getImage().src = URL.createObjectURL(data);
      tile.getImage().onload = function() {
        URL.revokeObjectURL(this.src);
      }
    } else {
      tile.setState(TileState.ERROR);
    }
  });
  xhr.addEventListener('error', function () {
    console.log("ERROR GETTING SOURCE");
    tile.setState(TileState.ERROR);
  });
  xhr.open('GET', src);
  xhr.send();
}

function updateImageMap(url) {
  console.log(url);
  let source = new Zoomify({
      url: 'https://warm-mesa-43639.herokuapp.com/' + url,
      size: [imgWidth, imgHeight]
  });

  source.setTileLoadFunction(tileLoadProgress);

  let layer = new TileLayer({
      source: source
  });
  let view = new View({
    enableRotation: false,
    resolutions: layer.getSource().getTileGrid().getResolutions(),
    extent: extent,
    constrainOnlyCenter: true,
    minZoom: 1,
    zoom: 1,
  });

  const layers = [...map.getLayers().getArray()];
  layers.forEach((layer) => map.removeLayer(layer));

  map.setView(view);
  map.getLayers().getArray()[0] = layer;
  map.getView().fit(extent);
}



window.setupScene = setupScene;
window.updateImageMap = updateImageMap;