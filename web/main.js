import Map from 'ol/Map';
import View from 'ol/View';
import './style.css';
import TileLayer from 'ol/layer/WebGLTile';
import Zoomify from 'ol/source/Zoomify';
import TileState from 'ol/TileState';


let map;
const imgWidth = 5192;
const imgHeight = 6489;
let currentUrl = "";
let extent = [0, -imgHeight, imgWidth,0];

function setupScene(url) {
  currentUrl = url;
  let source = new Zoomify({
    url: 'https://cors-anywhere-ey3dyle52q-uc.a.run.app/' + url,
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
      extent: extent,
      enableRotation: false,
      resolutions: source.getTileGrid().getResolutions(),
      constrainOnlyCenter: true,
      minZoom: 1,
      zoom: 2,
    }),
  });
  map.getView().fit(extent, {
    padding: [0,25,0,25],
  });
}

function tileLoadProgress(tile, src) {
  var xhr = new XMLHttpRequest();
  xhr.onloadstart = function() {
      xhr.responseType = 'blob';
  }
  xhr.addEventListener('progress', function (evt) {
    window.flutter_inappwebview.callHandler('loadProgress', (evt.loaded/evt.total) * 100.0);
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
  currentUrl = url;
  let curCenter = map.getView().getCenter();
  let curZoom = map.getView().getZoom();
  let source = new Zoomify({
      url: 'https://cors-anywhere-ey3dyle52q-uc.a.run.app/' + url,
      size: [imgWidth, imgHeight],
      crossOrigin: 'anonymous',
      zDirection: -1,
  });
  source.setTileLoadFunction(tileLoadProgress);

  let layer = new TileLayer({
    tileSize: 256,
    source: source,
  });
  let view = new View({
    extent: extent,
    enableRotation: false,
    resolutions: layer.getSource().getTileGrid().getResolutions(),
    constrainOnlyCenter: true,
    minZoom: 1,

  });

  // this is required to keep touch gestures working as ios webviews will continually consume touch events from flutter.
  // this resets those touch gestures by removing the html element that was consuming them and recreating it
  const mapElement = document.getElementById('map');
  mapElement.remove();

  let newMapElement = document.createElement('div');  
  newMapElement.setAttribute('id', 'map');
  document.body.insertAdjacentElement('afterbegin', newMapElement);

  map = new Map({
    controls: [],
    layers: [layer],
    target: 'map',
    view: new View({
      extent: extent,
      enableRotation: false,
      resolutions: source.getTileGrid().getResolutions(),
      constrainOnlyCenter: true,
      minZoom: 1,
    }),
  });

  map.setView(view);
  map.getLayers().getArray()[0] = layer;
  map.getView().fit(extent);
  map.getView().setZoom(curZoom);
  map.getView().setCenter(curCenter);
}

window.setupScene = setupScene;
window.updateImageMap = updateImageMap;
window.resetControls = resetControls;