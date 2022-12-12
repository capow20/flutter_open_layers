import Map from 'ol/Map';
import View from 'ol/View';
import './style.css';
import TileLayer from 'ol/layer/Tile';
import Zoomify from 'ol/source/Zoomify';
import TileState from 'ol/TileState';
import { transform, useGeographic } from 'ol/proj';


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

  map.on('click', function(evt){
    console.log(transform(evt.coordinate, 'EPSG:3857', 'EPSG:4326'));
    console.log(map.getView().getZoom());
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

function updateImageMap(url, replace = true, lat, long, zoom) {
  let source = new Zoomify({
      url:  'https://cors-anywhere-ey3dyle52q-uc.a.run.app/' + url,
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

  resetControls(layer, view, replace);
  console.log(`Lat: ${lat}, Long: ${long}, Zoom: ${zoom}`);
  if(lat != null && long != null && zoom != null) animateTo(lat,long,zoom);

  currentUrl = url;
}

function resetControls(layer, view, replace) {
  let curCenter = map.getView().getCenter();
  let curZoom = map.getView().getZoom();

  let currentSource = new Zoomify({
    url:  currentUrl,
    size: [imgWidth, imgHeight],
    crossOrigin: 'anonymous',
    zDirection: -1,
  });
  let currentLayer = new TileLayer({
    tileSize: 256,
    source: currentSource,
  });

  const mapElement = document.getElementById('map');
  mapElement.remove();

  let newMapElement = document.createElement('div');  
  newMapElement.setAttribute('id', 'map');
  document.body.append(newMapElement);

  var layers;
  if(replace == true) layers = [layer];
  else layers = [currentLayer, layer];

  map = new Map({
    controls: [],
    target: 'map',
    layers: layers,
  });
  map.setView(view);
  map.getView().fit(extent);
  map.getView().setZoom(curZoom);
  map.getView().setCenter(curCenter); 
  map.getView().fit(extent, {
    padding: [0,25,0,25],
  });
  //this is for debugging to find the correct coordinates for focus points
  map.on('click', function(evt){
    console.log(transform(evt.coordinate, 'EPSG:3857', 'EPSG:4326'));
    console.log(map.getView().getZoom());
  });
}

function animateTo(lat, long, zoom) {
  //remove this line if debugging to find focus point coordinates
  //it will give crazy numbers after animating for the first time without reloading page
  useGeographic();
  map.getView().animate({center: [lat, long]}, {zoom: zoom});
}

window.setupScene = setupScene;
window.updateImageMap = updateImageMap;
window.animateTo = animateTo;