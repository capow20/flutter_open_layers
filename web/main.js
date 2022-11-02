import Map from 'ol/Map';
import View from 'ol/View';
import './style.css';
import TileLayer from 'ol/layer/Tile';
import Zoomify from 'ol/source/Zoomify';
import {Control, FullScreen } from 'ol/control';

const imgWidth = 6132;
const imgHeight = 8176;

let extent = [0, -imgHeight, imgWidth, 0];

let zoomifyUrlOne = 'assets/tiled_one/';

let source = new Zoomify({
  url: zoomifyUrlOne,
  size: [imgWidth, imgHeight],
  crossOrigin: 'anonymous',
  zDirection: -1,
});

let layer = new TileLayer({
  tileSize: 256,
  source: source,
});

const map = new Map({
  controls: [
    new FullScreen(),
    new Control({element: _buildInfoButton()})
  ],
  layers: [layer],
  target: 'map',
  view: new View({
    resolutions: layer.getSource().getTileGrid().getResolutions(),
    extent: extent,
    constrainOnlyCenter: true,
  }),
});
map.getView().fit(extent);


//this method is for debug buttons to swap layers while running in web
function _buildInfoButton() {
  let buttonOne = document.createElement('button');
  buttonOne.innerHTML = '<span>One</span>';
  buttonOne.id = 'layer-one-button';
  buttonOne.style = 'margin: 10px; color: white; padding-top: 2px; padding-bottom: 2px: padding-left: 5px; padding-right: 5px;'
  let buttonTwo = document.createElement('button');
  buttonTwo.innerHTML = '<span>Two</span>';
  buttonTwo.id = 'layer-two-button';
  buttonTwo.style="margin: 10px;";
  let buttonThree = document.createElement('button');
  buttonThree.innerHTML = '<span>Three</span>';
  buttonThree.id = 'layer-three-button';
  buttonThree.style="margin: 10px;";
  let zoomButton = document.createElement('button');
  zoomButton.innerHTML = '<span>Log Zoom</span>';
  zoomButton.id = 'layer-theee-button';
  zoomButton.style="margin: 10px;";

  let title = document.createElement('div');
  title.className = 'image-title-element';
  title.id = 'image-title-element';

  let element = document.createElement('div');
  element.id = 'button-container';
  element.appendChild(buttonOne);
  element.appendChild(buttonTwo);
  element.appendChild(buttonThree);
  element.appendChild(zoomButton);
  element.appendChild(title);

  buttonOne.addEventListener('click', () => {
    updateImageMap(zoomifyUrlOne);
  }, false);
  buttonTwo.addEventListener('click', () => {
   updateImageMap(zoomifyUrlTwo);
  }, false);
  buttonThree.addEventListener('click', () => {
    updateImageMap(zoomifyUrlThree);
  }, false);

  zoomButton.addEventListener('click', () => {
    console.log(map.getView().getZoom());
  }, false);

  return element;
}

function updateImageMap(url) {
  let source = new Zoomify({
      url: url,
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

/* import './style.css';
import {Map, View} from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';

const map = new Map({
  target: 'map',
  layers: [
    new TileLayer({
      source: new OSM()
    })
  ],
  view: new View({
    center: [0, 0],
    zoom: 2
  })
});
 */