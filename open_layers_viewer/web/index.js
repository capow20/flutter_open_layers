(function polyfill() {
  const relList = document.createElement("link").relList;
  if (relList && relList.supports && relList.supports("modulepreload")) {
    return;
  }
  for (const link of document.querySelectorAll('link[rel="modulepreload"]')) {
    processPreload(link);
  }
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== "childList") {
        continue;
      }
      for (const node of mutation.addedNodes) {
        if (node.tagName === "LINK" && node.rel === "modulepreload")
          processPreload(node);
      }
    }
  }).observe(document, { childList: true, subtree: true });
  function getFetchOpts(script) {
    const fetchOpts = {};
    if (script.integrity)
      fetchOpts.integrity = script.integrity;
    if (script.referrerpolicy)
      fetchOpts.referrerPolicy = script.referrerpolicy;
    if (script.crossorigin === "use-credentials")
      fetchOpts.credentials = "include";
    else if (script.crossorigin === "anonymous")
      fetchOpts.credentials = "omit";
    else
      fetchOpts.credentials = "same-origin";
    return fetchOpts;
  }
  function processPreload(link) {
    if (link.ep)
      return;
    link.ep = true;
    const fetchOpts = getFetchOpts(link);
    fetch(link.href, fetchOpts);
  }
})();
class BaseEvent {
  constructor(type) {
    this.propagationStopped;
    this.defaultPrevented;
    this.type = type;
    this.target = null;
  }
  preventDefault() {
    this.defaultPrevented = true;
  }
  stopPropagation() {
    this.propagationStopped = true;
  }
}
const Event = BaseEvent;
const ObjectEventType = {
  PROPERTYCHANGE: "propertychange"
};
class Disposable {
  constructor() {
    this.disposed = false;
  }
  dispose() {
    if (!this.disposed) {
      this.disposed = true;
      this.disposeInternal();
    }
  }
  disposeInternal() {
  }
}
const Disposable$1 = Disposable;
function numberSafeCompareFunction(a, b) {
  return a > b ? 1 : a < b ? -1 : 0;
}
function linearFindNearest(arr, target, direction) {
  const n = arr.length;
  if (arr[0] <= target) {
    return 0;
  } else if (target <= arr[n - 1]) {
    return n - 1;
  } else {
    let i;
    if (direction > 0) {
      for (i = 1; i < n; ++i) {
        if (arr[i] < target) {
          return i - 1;
        }
      }
    } else if (direction < 0) {
      for (i = 1; i < n; ++i) {
        if (arr[i] <= target) {
          return i;
        }
      }
    } else {
      for (i = 1; i < n; ++i) {
        if (arr[i] == target) {
          return i;
        } else if (arr[i] < target) {
          if (typeof direction === "function") {
            if (direction(target, arr[i - 1], arr[i]) > 0) {
              return i - 1;
            } else {
              return i;
            }
          } else if (arr[i - 1] - target < target - arr[i]) {
            return i - 1;
          } else {
            return i;
          }
        }
      }
    }
    return n - 1;
  }
}
function extend$1(arr, data) {
  const extension = Array.isArray(data) ? data : [data];
  const length = extension.length;
  for (let i = 0; i < length; i++) {
    arr[arr.length] = extension[i];
  }
}
function equals$2(arr1, arr2) {
  const len1 = arr1.length;
  if (len1 !== arr2.length) {
    return false;
  }
  for (let i = 0; i < len1; i++) {
    if (arr1[i] !== arr2[i]) {
      return false;
    }
  }
  return true;
}
function isSorted(arr, func, strict) {
  const compare = func || numberSafeCompareFunction;
  return arr.every(function(currentVal, index) {
    if (index === 0) {
      return true;
    }
    const res = compare(arr[index - 1], currentVal);
    return !(res > 0 || strict && res === 0);
  });
}
function TRUE() {
  return true;
}
function FALSE() {
  return false;
}
function VOID() {
}
function memoizeOne(fn) {
  let called = false;
  let lastResult;
  let lastArgs;
  let lastThis;
  return function() {
    const nextArgs = Array.prototype.slice.call(arguments);
    if (!called || this !== lastThis || !equals$2(nextArgs, lastArgs)) {
      called = true;
      lastThis = this;
      lastArgs = nextArgs;
      lastResult = fn.apply(this, arguments);
    }
    return lastResult;
  };
}
function clear(object) {
  for (const property in object) {
    delete object[property];
  }
}
function isEmpty$1(object) {
  let property;
  for (property in object) {
    return false;
  }
  return !property;
}
class Target extends Disposable$1 {
  constructor(target) {
    super();
    this.eventTarget_ = target;
    this.pendingRemovals_ = null;
    this.dispatching_ = null;
    this.listeners_ = null;
  }
  addEventListener(type, listener) {
    if (!type || !listener) {
      return;
    }
    const listeners = this.listeners_ || (this.listeners_ = {});
    const listenersForType = listeners[type] || (listeners[type] = []);
    if (!listenersForType.includes(listener)) {
      listenersForType.push(listener);
    }
  }
  dispatchEvent(event) {
    const isString = typeof event === "string";
    const type = isString ? event : event.type;
    const listeners = this.listeners_ && this.listeners_[type];
    if (!listeners) {
      return;
    }
    const evt = isString ? new Event(event) : event;
    if (!evt.target) {
      evt.target = this.eventTarget_ || this;
    }
    const dispatching = this.dispatching_ || (this.dispatching_ = {});
    const pendingRemovals = this.pendingRemovals_ || (this.pendingRemovals_ = {});
    if (!(type in dispatching)) {
      dispatching[type] = 0;
      pendingRemovals[type] = 0;
    }
    ++dispatching[type];
    let propagate;
    for (let i = 0, ii = listeners.length; i < ii; ++i) {
      if ("handleEvent" in listeners[i]) {
        propagate = listeners[i].handleEvent(evt);
      } else {
        propagate = listeners[i].call(this, evt);
      }
      if (propagate === false || evt.propagationStopped) {
        propagate = false;
        break;
      }
    }
    if (--dispatching[type] === 0) {
      let pr = pendingRemovals[type];
      delete pendingRemovals[type];
      while (pr--) {
        this.removeEventListener(type, VOID);
      }
      delete dispatching[type];
    }
    return propagate;
  }
  disposeInternal() {
    this.listeners_ && clear(this.listeners_);
  }
  getListeners(type) {
    return this.listeners_ && this.listeners_[type] || void 0;
  }
  hasListener(type) {
    if (!this.listeners_) {
      return false;
    }
    return type ? type in this.listeners_ : Object.keys(this.listeners_).length > 0;
  }
  removeEventListener(type, listener) {
    const listeners = this.listeners_ && this.listeners_[type];
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index !== -1) {
        if (this.pendingRemovals_ && type in this.pendingRemovals_) {
          listeners[index] = VOID;
          ++this.pendingRemovals_[type];
        } else {
          listeners.splice(index, 1);
          if (listeners.length === 0) {
            delete this.listeners_[type];
          }
        }
      }
    }
  }
}
const EventTarget = Target;
const EventType = {
  CHANGE: "change",
  ERROR: "error",
  BLUR: "blur",
  CLEAR: "clear",
  CONTEXTMENU: "contextmenu",
  CLICK: "click",
  DBLCLICK: "dblclick",
  DRAGENTER: "dragenter",
  DRAGOVER: "dragover",
  DROP: "drop",
  FOCUS: "focus",
  KEYDOWN: "keydown",
  KEYPRESS: "keypress",
  LOAD: "load",
  RESIZE: "resize",
  TOUCHMOVE: "touchmove",
  WHEEL: "wheel"
};
function listen(target, type, listener, thisArg, once) {
  if (thisArg && thisArg !== target) {
    listener = listener.bind(thisArg);
  }
  if (once) {
    const originalListener = listener;
    listener = function() {
      target.removeEventListener(type, listener);
      originalListener.apply(this, arguments);
    };
  }
  const eventsKey = {
    target,
    type,
    listener
  };
  target.addEventListener(type, listener);
  return eventsKey;
}
function listenOnce(target, type, listener, thisArg) {
  return listen(target, type, listener, thisArg, true);
}
function unlistenByKey(key) {
  if (key && key.target) {
    key.target.removeEventListener(key.type, key.listener);
    clear(key);
  }
}
class Observable extends EventTarget {
  constructor() {
    super();
    this.on = this.onInternal;
    this.once = this.onceInternal;
    this.un = this.unInternal;
    this.revision_ = 0;
  }
  changed() {
    ++this.revision_;
    this.dispatchEvent(EventType.CHANGE);
  }
  getRevision() {
    return this.revision_;
  }
  onInternal(type, listener) {
    if (Array.isArray(type)) {
      const len = type.length;
      const keys = new Array(len);
      for (let i = 0; i < len; ++i) {
        keys[i] = listen(this, type[i], listener);
      }
      return keys;
    } else {
      return listen(this, type, listener);
    }
  }
  onceInternal(type, listener) {
    let key;
    if (Array.isArray(type)) {
      const len = type.length;
      key = new Array(len);
      for (let i = 0; i < len; ++i) {
        key[i] = listenOnce(this, type[i], listener);
      }
    } else {
      key = listenOnce(this, type, listener);
    }
    listener.ol_key = key;
    return key;
  }
  unInternal(type, listener) {
    const key = listener.ol_key;
    if (key) {
      unByKey(key);
    } else if (Array.isArray(type)) {
      for (let i = 0, ii = type.length; i < ii; ++i) {
        this.removeEventListener(type[i], listener);
      }
    } else {
      this.removeEventListener(type, listener);
    }
  }
}
Observable.prototype.on;
Observable.prototype.once;
Observable.prototype.un;
function unByKey(key) {
  if (Array.isArray(key)) {
    for (let i = 0, ii = key.length; i < ii; ++i) {
      unlistenByKey(key[i]);
    }
  } else {
    unlistenByKey(key);
  }
}
const Observable$1 = Observable;
function abstract() {
  throw new Error("Unimplemented abstract method.");
}
let uidCounter_ = 0;
function getUid(obj) {
  return obj.ol_uid || (obj.ol_uid = String(++uidCounter_));
}
class ObjectEvent extends Event {
  constructor(type, key, oldValue) {
    super(type);
    this.key = key;
    this.oldValue = oldValue;
  }
}
class BaseObject extends Observable$1 {
  constructor(values) {
    super();
    this.on;
    this.once;
    this.un;
    getUid(this);
    this.values_ = null;
    if (values !== void 0) {
      this.setProperties(values);
    }
  }
  get(key) {
    let value;
    if (this.values_ && this.values_.hasOwnProperty(key)) {
      value = this.values_[key];
    }
    return value;
  }
  getKeys() {
    return this.values_ && Object.keys(this.values_) || [];
  }
  getProperties() {
    return this.values_ && Object.assign({}, this.values_) || {};
  }
  hasProperties() {
    return !!this.values_;
  }
  notify(key, oldValue) {
    let eventType;
    eventType = `change:${key}`;
    if (this.hasListener(eventType)) {
      this.dispatchEvent(new ObjectEvent(eventType, key, oldValue));
    }
    eventType = ObjectEventType.PROPERTYCHANGE;
    if (this.hasListener(eventType)) {
      this.dispatchEvent(new ObjectEvent(eventType, key, oldValue));
    }
  }
  addChangeListener(key, listener) {
    this.addEventListener(`change:${key}`, listener);
  }
  removeChangeListener(key, listener) {
    this.removeEventListener(`change:${key}`, listener);
  }
  set(key, value, silent) {
    const values = this.values_ || (this.values_ = {});
    if (silent) {
      values[key] = value;
    } else {
      const oldValue = values[key];
      values[key] = value;
      if (oldValue !== value) {
        this.notify(key, oldValue);
      }
    }
  }
  setProperties(values, silent) {
    for (const key in values) {
      this.set(key, values[key], silent);
    }
  }
  applyProperties(source) {
    if (!source.values_) {
      return;
    }
    Object.assign(this.values_ || (this.values_ = {}), source.values_);
  }
  unset(key, silent) {
    if (this.values_ && key in this.values_) {
      const oldValue = this.values_[key];
      delete this.values_[key];
      if (isEmpty$1(this.values_)) {
        this.values_ = null;
      }
      if (!silent) {
        this.notify(key, oldValue);
      }
    }
  }
}
const BaseObject$1 = BaseObject;
const messages = {
  1: "The view center is not defined",
  2: "The view resolution is not defined",
  3: "The view rotation is not defined",
  4: "`image` and `src` cannot be provided at the same time",
  5: "`imgSize` must be set when `image` is provided",
  7: "`format` must be set when `url` is set",
  8: "Unknown `serverType` configured",
  9: "`url` must be configured or set using `#setUrl()`",
  10: "The default `geometryFunction` can only handle `Point` geometries",
  11: "`options.featureTypes` must be an Array",
  12: "`options.geometryName` must also be provided when `options.bbox` is set",
  13: "Invalid corner",
  14: "Invalid color",
  15: "Tried to get a value for a key that does not exist in the cache",
  16: "Tried to set a value for a key that is used already",
  17: "`resolutions` must be sorted in descending order",
  18: "Either `origin` or `origins` must be configured, never both",
  19: "Number of `tileSizes` and `resolutions` must be equal",
  20: "Number of `origins` and `resolutions` must be equal",
  22: "Either `tileSize` or `tileSizes` must be configured, never both",
  24: "Invalid extent or geometry provided as `geometry`",
  25: "Cannot fit empty extent provided as `geometry`",
  26: "Features must have an id set",
  27: "Features must have an id set",
  28: '`renderMode` must be `"hybrid"` or `"vector"`',
  30: "The passed `feature` was already added to the source",
  31: "Tried to enqueue an `element` that was already added to the queue",
  32: "Transformation matrix cannot be inverted",
  33: "Invalid units",
  34: "Invalid geometry layout",
  36: "Unknown SRS type",
  37: "Unknown geometry type found",
  38: "`styleMapValue` has an unknown type",
  39: "Unknown geometry type",
  40: "Expected `feature` to have a geometry",
  41: "Expected an `ol/style/Style` or an array of `ol/style/Style.js`",
  42: "Question unknown, the answer is 42",
  43: "Expected `layers` to be an array or a `Collection`",
  47: "Expected `controls` to be an array or an `ol/Collection`",
  48: "Expected `interactions` to be an array or an `ol/Collection`",
  49: "Expected `overlays` to be an array or an `ol/Collection`",
  50: "`options.featureTypes` should be an Array",
  51: "Either `url` or `tileJSON` options must be provided",
  52: "Unknown `serverType` configured",
  53: "Unknown `tierSizeCalculation` configured",
  55: "The {-y} placeholder requires a tile grid with extent",
  56: "mapBrowserEvent must originate from a pointer event",
  57: "At least 2 conditions are required",
  59: "Invalid command found in the PBF",
  60: "Missing or invalid `size`",
  61: "Cannot determine IIIF Image API version from provided image information JSON",
  62: "A `WebGLArrayBuffer` must either be of type `ELEMENT_ARRAY_BUFFER` or `ARRAY_BUFFER`",
  64: "Layer opacity must be a number",
  66: "`forEachFeatureAtCoordinate` cannot be used on a WebGL layer if the hit detection logic has not been enabled. This is done by providing adequate shaders using the `hitVertexShader` and `hitFragmentShader` properties of `WebGLPointsLayerRenderer`",
  67: "A layer can only be added to the map once. Use either `layer.setMap()` or `map.addLayer()`, not both",
  68: "A VectorTile source can only be rendered if it has a projection compatible with the view projection"
};
class AssertionError extends Error {
  constructor(code) {
    const message = messages[code];
    super(message);
    this.code = code;
    this.name = "AssertionError";
    this.message = message;
  }
}
const AssertionError$1 = AssertionError;
const CollectionEventType = {
  ADD: "add",
  REMOVE: "remove"
};
const Property$1 = {
  LENGTH: "length"
};
class CollectionEvent extends Event {
  constructor(type, element, index) {
    super(type);
    this.element = element;
    this.index = index;
  }
}
class Collection extends BaseObject$1 {
  constructor(array, options) {
    super();
    this.on;
    this.once;
    this.un;
    options = options || {};
    this.unique_ = !!options.unique;
    this.array_ = array ? array : [];
    if (this.unique_) {
      for (let i = 0, ii = this.array_.length; i < ii; ++i) {
        this.assertUnique_(this.array_[i], i);
      }
    }
    this.updateLength_();
  }
  clear() {
    while (this.getLength() > 0) {
      this.pop();
    }
  }
  extend(arr) {
    for (let i = 0, ii = arr.length; i < ii; ++i) {
      this.push(arr[i]);
    }
    return this;
  }
  forEach(f) {
    const array = this.array_;
    for (let i = 0, ii = array.length; i < ii; ++i) {
      f(array[i], i, array);
    }
  }
  getArray() {
    return this.array_;
  }
  item(index) {
    return this.array_[index];
  }
  getLength() {
    return this.get(Property$1.LENGTH);
  }
  insertAt(index, elem) {
    if (index < 0 || index > this.getLength()) {
      throw new Error("Index out of bounds: " + index);
    }
    if (this.unique_) {
      this.assertUnique_(elem);
    }
    this.array_.splice(index, 0, elem);
    this.updateLength_();
    this.dispatchEvent(
      new CollectionEvent(CollectionEventType.ADD, elem, index)
    );
  }
  pop() {
    return this.removeAt(this.getLength() - 1);
  }
  push(elem) {
    if (this.unique_) {
      this.assertUnique_(elem);
    }
    const n = this.getLength();
    this.insertAt(n, elem);
    return this.getLength();
  }
  remove(elem) {
    const arr = this.array_;
    for (let i = 0, ii = arr.length; i < ii; ++i) {
      if (arr[i] === elem) {
        return this.removeAt(i);
      }
    }
    return void 0;
  }
  removeAt(index) {
    if (index < 0 || index >= this.getLength()) {
      return void 0;
    }
    const prev = this.array_[index];
    this.array_.splice(index, 1);
    this.updateLength_();
    this.dispatchEvent(
      new CollectionEvent(CollectionEventType.REMOVE, prev, index)
    );
    return prev;
  }
  setAt(index, elem) {
    const n = this.getLength();
    if (index >= n) {
      this.insertAt(index, elem);
      return;
    }
    if (index < 0) {
      throw new Error("Index out of bounds: " + index);
    }
    if (this.unique_) {
      this.assertUnique_(elem, index);
    }
    const prev = this.array_[index];
    this.array_[index] = elem;
    this.dispatchEvent(
      new CollectionEvent(CollectionEventType.REMOVE, prev, index)
    );
    this.dispatchEvent(
      new CollectionEvent(CollectionEventType.ADD, elem, index)
    );
  }
  updateLength_() {
    this.set(Property$1.LENGTH, this.array_.length);
  }
  assertUnique_(elem, except) {
    for (let i = 0, ii = this.array_.length; i < ii; ++i) {
      if (this.array_[i] === elem && i !== except) {
        throw new AssertionError$1(58);
      }
    }
  }
}
const Collection$1 = Collection;
const ua = typeof navigator !== "undefined" && typeof navigator.userAgent !== "undefined" ? navigator.userAgent.toLowerCase() : "";
const FIREFOX = ua.includes("firefox");
const SAFARI = ua.includes("safari") && !ua.includes("chrom");
const SAFARI_BUG_237906 = SAFARI && (ua.includes("version/15.4") || /cpu (os|iphone os) 15_4 like mac os x/.test(ua));
const WEBKIT = ua.includes("webkit") && !ua.includes("edge");
const MAC = ua.includes("macintosh");
const DEVICE_PIXEL_RATIO = typeof devicePixelRatio !== "undefined" ? devicePixelRatio : 1;
const WORKER_OFFSCREEN_CANVAS = typeof WorkerGlobalScope !== "undefined" && typeof OffscreenCanvas !== "undefined" && self instanceof WorkerGlobalScope;
const IMAGE_DECODE = typeof Image !== "undefined" && Image.prototype.decode;
const PASSIVE_EVENT_LISTENERS = function() {
  let passive = false;
  try {
    const options = Object.defineProperty({}, "passive", {
      get: function() {
        passive = true;
      }
    });
    window.addEventListener("_", null, options);
    window.removeEventListener("_", null, options);
  } catch (error) {
  }
  return passive;
}();
function assert(assertion, errorCode) {
  if (!assertion) {
    throw new AssertionError$1(errorCode);
  }
}
const tmp_ = new Array(6);
function create$1() {
  return [1, 0, 0, 1, 0, 0];
}
function reset(transform2) {
  return set(transform2, 1, 0, 0, 1, 0, 0);
}
function multiply(transform1, transform2) {
  const a1 = transform1[0];
  const b1 = transform1[1];
  const c1 = transform1[2];
  const d1 = transform1[3];
  const e1 = transform1[4];
  const f1 = transform1[5];
  const a2 = transform2[0];
  const b2 = transform2[1];
  const c2 = transform2[2];
  const d2 = transform2[3];
  const e2 = transform2[4];
  const f2 = transform2[5];
  transform1[0] = a1 * a2 + c1 * b2;
  transform1[1] = b1 * a2 + d1 * b2;
  transform1[2] = a1 * c2 + c1 * d2;
  transform1[3] = b1 * c2 + d1 * d2;
  transform1[4] = a1 * e2 + c1 * f2 + e1;
  transform1[5] = b1 * e2 + d1 * f2 + f1;
  return transform1;
}
function set(transform2, a, b, c, d, e, f) {
  transform2[0] = a;
  transform2[1] = b;
  transform2[2] = c;
  transform2[3] = d;
  transform2[4] = e;
  transform2[5] = f;
  return transform2;
}
function apply(transform2, coordinate) {
  const x = coordinate[0];
  const y = coordinate[1];
  coordinate[0] = transform2[0] * x + transform2[2] * y + transform2[4];
  coordinate[1] = transform2[1] * x + transform2[3] * y + transform2[5];
  return coordinate;
}
function rotate$2(transform2, angle) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return multiply(transform2, set(tmp_, cos, sin, -sin, cos, 0, 0));
}
function scale$3(transform2, x, y) {
  return multiply(transform2, set(tmp_, x, 0, 0, y, 0, 0));
}
function translate$1(transform2, dx, dy) {
  return multiply(transform2, set(tmp_, 1, 0, 0, 1, dx, dy));
}
function compose(transform2, dx1, dy1, sx, sy, angle, dx2, dy2) {
  const sin = Math.sin(angle);
  const cos = Math.cos(angle);
  transform2[0] = sx * cos;
  transform2[1] = sy * sin;
  transform2[2] = -sx * sin;
  transform2[3] = sy * cos;
  transform2[4] = dx2 * sx * cos - dy2 * sx * sin + dx1;
  transform2[5] = dx2 * sy * sin + dy2 * sy * cos + dy1;
  return transform2;
}
function makeInverse(target, source) {
  const det = determinant(source);
  assert(det !== 0, 32);
  const a = source[0];
  const b = source[1];
  const c = source[2];
  const d = source[3];
  const e = source[4];
  const f = source[5];
  target[0] = d / det;
  target[1] = -b / det;
  target[2] = -c / det;
  target[3] = a / det;
  target[4] = (c * f - d * e) / det;
  target[5] = -(a * f - b * e) / det;
  return target;
}
function determinant(mat) {
  return mat[0] * mat[3] - mat[1] * mat[2];
}
let transformStringDiv;
function toString$1(mat) {
  const transformString = "matrix(" + mat.join(", ") + ")";
  if (WORKER_OFFSCREEN_CANVAS) {
    return transformString;
  }
  const node = transformStringDiv || (transformStringDiv = document.createElement("div"));
  node.style.transform = transformString;
  return node.style.transform;
}
const Relationship = {
  UNKNOWN: 0,
  INTERSECTING: 1,
  ABOVE: 2,
  RIGHT: 4,
  BELOW: 8,
  LEFT: 16
};
function boundingExtent(coordinates2) {
  const extent2 = createEmpty();
  for (let i = 0, ii = coordinates2.length; i < ii; ++i) {
    extendCoordinate(extent2, coordinates2[i]);
  }
  return extent2;
}
function clone(extent2, dest) {
  if (dest) {
    dest[0] = extent2[0];
    dest[1] = extent2[1];
    dest[2] = extent2[2];
    dest[3] = extent2[3];
    return dest;
  } else {
    return extent2.slice();
  }
}
function closestSquaredDistanceXY(extent2, x, y) {
  let dx, dy;
  if (x < extent2[0]) {
    dx = extent2[0] - x;
  } else if (extent2[2] < x) {
    dx = x - extent2[2];
  } else {
    dx = 0;
  }
  if (y < extent2[1]) {
    dy = extent2[1] - y;
  } else if (extent2[3] < y) {
    dy = y - extent2[3];
  } else {
    dy = 0;
  }
  return dx * dx + dy * dy;
}
function containsCoordinate(extent2, coordinate) {
  return containsXY(extent2, coordinate[0], coordinate[1]);
}
function containsExtent(extent1, extent2) {
  return extent1[0] <= extent2[0] && extent2[2] <= extent1[2] && extent1[1] <= extent2[1] && extent2[3] <= extent1[3];
}
function containsXY(extent2, x, y) {
  return extent2[0] <= x && x <= extent2[2] && extent2[1] <= y && y <= extent2[3];
}
function coordinateRelationship(extent2, coordinate) {
  const minX = extent2[0];
  const minY = extent2[1];
  const maxX = extent2[2];
  const maxY = extent2[3];
  const x = coordinate[0];
  const y = coordinate[1];
  let relationship = Relationship.UNKNOWN;
  if (x < minX) {
    relationship = relationship | Relationship.LEFT;
  } else if (x > maxX) {
    relationship = relationship | Relationship.RIGHT;
  }
  if (y < minY) {
    relationship = relationship | Relationship.BELOW;
  } else if (y > maxY) {
    relationship = relationship | Relationship.ABOVE;
  }
  if (relationship === Relationship.UNKNOWN) {
    relationship = Relationship.INTERSECTING;
  }
  return relationship;
}
function createEmpty() {
  return [Infinity, Infinity, -Infinity, -Infinity];
}
function createOrUpdate$2(minX, minY, maxX, maxY, dest) {
  if (dest) {
    dest[0] = minX;
    dest[1] = minY;
    dest[2] = maxX;
    dest[3] = maxY;
    return dest;
  } else {
    return [minX, minY, maxX, maxY];
  }
}
function createOrUpdateEmpty(dest) {
  return createOrUpdate$2(Infinity, Infinity, -Infinity, -Infinity, dest);
}
function createOrUpdateFromCoordinate(coordinate, dest) {
  const x = coordinate[0];
  const y = coordinate[1];
  return createOrUpdate$2(x, y, x, y, dest);
}
function createOrUpdateFromFlatCoordinates(flatCoordinates, offset, end, stride, dest) {
  const extent2 = createOrUpdateEmpty(dest);
  return extendFlatCoordinates(extent2, flatCoordinates, offset, end, stride);
}
function equals$1(extent1, extent2) {
  return extent1[0] == extent2[0] && extent1[2] == extent2[2] && extent1[1] == extent2[1] && extent1[3] == extent2[3];
}
function extend(extent1, extent2) {
  if (extent2[0] < extent1[0]) {
    extent1[0] = extent2[0];
  }
  if (extent2[2] > extent1[2]) {
    extent1[2] = extent2[2];
  }
  if (extent2[1] < extent1[1]) {
    extent1[1] = extent2[1];
  }
  if (extent2[3] > extent1[3]) {
    extent1[3] = extent2[3];
  }
  return extent1;
}
function extendCoordinate(extent2, coordinate) {
  if (coordinate[0] < extent2[0]) {
    extent2[0] = coordinate[0];
  }
  if (coordinate[0] > extent2[2]) {
    extent2[2] = coordinate[0];
  }
  if (coordinate[1] < extent2[1]) {
    extent2[1] = coordinate[1];
  }
  if (coordinate[1] > extent2[3]) {
    extent2[3] = coordinate[1];
  }
}
function extendFlatCoordinates(extent2, flatCoordinates, offset, end, stride) {
  for (; offset < end; offset += stride) {
    extendXY(extent2, flatCoordinates[offset], flatCoordinates[offset + 1]);
  }
  return extent2;
}
function extendXY(extent2, x, y) {
  extent2[0] = Math.min(extent2[0], x);
  extent2[1] = Math.min(extent2[1], y);
  extent2[2] = Math.max(extent2[2], x);
  extent2[3] = Math.max(extent2[3], y);
}
function forEachCorner(extent2, callback) {
  let val;
  val = callback(getBottomLeft(extent2));
  if (val) {
    return val;
  }
  val = callback(getBottomRight(extent2));
  if (val) {
    return val;
  }
  val = callback(getTopRight(extent2));
  if (val) {
    return val;
  }
  val = callback(getTopLeft(extent2));
  if (val) {
    return val;
  }
  return false;
}
function getArea(extent2) {
  let area = 0;
  if (!isEmpty(extent2)) {
    area = getWidth(extent2) * getHeight(extent2);
  }
  return area;
}
function getBottomLeft(extent2) {
  return [extent2[0], extent2[1]];
}
function getBottomRight(extent2) {
  return [extent2[2], extent2[1]];
}
function getCenter(extent2) {
  return [(extent2[0] + extent2[2]) / 2, (extent2[1] + extent2[3]) / 2];
}
function getCorner(extent2, corner) {
  let coordinate;
  if (corner === "bottom-left") {
    coordinate = getBottomLeft(extent2);
  } else if (corner === "bottom-right") {
    coordinate = getBottomRight(extent2);
  } else if (corner === "top-left") {
    coordinate = getTopLeft(extent2);
  } else if (corner === "top-right") {
    coordinate = getTopRight(extent2);
  } else {
    assert(false, 13);
  }
  return coordinate;
}
function getForViewAndSize(center, resolution, rotation, size, dest) {
  const [x0, y0, x1, y1, x2, y2, x3, y3] = getRotatedViewport(
    center,
    resolution,
    rotation,
    size
  );
  return createOrUpdate$2(
    Math.min(x0, x1, x2, x3),
    Math.min(y0, y1, y2, y3),
    Math.max(x0, x1, x2, x3),
    Math.max(y0, y1, y2, y3),
    dest
  );
}
function getRotatedViewport(center, resolution, rotation, size) {
  const dx = resolution * size[0] / 2;
  const dy = resolution * size[1] / 2;
  const cosRotation = Math.cos(rotation);
  const sinRotation = Math.sin(rotation);
  const xCos = dx * cosRotation;
  const xSin = dx * sinRotation;
  const yCos = dy * cosRotation;
  const ySin = dy * sinRotation;
  const x = center[0];
  const y = center[1];
  return [
    x - xCos + ySin,
    y - xSin - yCos,
    x - xCos - ySin,
    y - xSin + yCos,
    x + xCos - ySin,
    y + xSin + yCos,
    x + xCos + ySin,
    y + xSin - yCos,
    x - xCos + ySin,
    y - xSin - yCos
  ];
}
function getHeight(extent2) {
  return extent2[3] - extent2[1];
}
function getIntersection(extent1, extent2, dest) {
  const intersection = dest ? dest : createEmpty();
  if (intersects(extent1, extent2)) {
    if (extent1[0] > extent2[0]) {
      intersection[0] = extent1[0];
    } else {
      intersection[0] = extent2[0];
    }
    if (extent1[1] > extent2[1]) {
      intersection[1] = extent1[1];
    } else {
      intersection[1] = extent2[1];
    }
    if (extent1[2] < extent2[2]) {
      intersection[2] = extent1[2];
    } else {
      intersection[2] = extent2[2];
    }
    if (extent1[3] < extent2[3]) {
      intersection[3] = extent1[3];
    } else {
      intersection[3] = extent2[3];
    }
  } else {
    createOrUpdateEmpty(intersection);
  }
  return intersection;
}
function getTopLeft(extent2) {
  return [extent2[0], extent2[3]];
}
function getTopRight(extent2) {
  return [extent2[2], extent2[3]];
}
function getWidth(extent2) {
  return extent2[2] - extent2[0];
}
function intersects(extent1, extent2) {
  return extent1[0] <= extent2[2] && extent1[2] >= extent2[0] && extent1[1] <= extent2[3] && extent1[3] >= extent2[1];
}
function isEmpty(extent2) {
  return extent2[2] < extent2[0] || extent2[3] < extent2[1];
}
function returnOrUpdate(extent2, dest) {
  if (dest) {
    dest[0] = extent2[0];
    dest[1] = extent2[1];
    dest[2] = extent2[2];
    dest[3] = extent2[3];
    return dest;
  } else {
    return extent2;
  }
}
function intersectsSegment(extent2, start, end) {
  let intersects2 = false;
  const startRel = coordinateRelationship(extent2, start);
  const endRel = coordinateRelationship(extent2, end);
  if (startRel === Relationship.INTERSECTING || endRel === Relationship.INTERSECTING) {
    intersects2 = true;
  } else {
    const minX = extent2[0];
    const minY = extent2[1];
    const maxX = extent2[2];
    const maxY = extent2[3];
    const startX = start[0];
    const startY = start[1];
    const endX = end[0];
    const endY = end[1];
    const slope = (endY - startY) / (endX - startX);
    let x, y;
    if (!!(endRel & Relationship.ABOVE) && !(startRel & Relationship.ABOVE)) {
      x = endX - (endY - maxY) / slope;
      intersects2 = x >= minX && x <= maxX;
    }
    if (!intersects2 && !!(endRel & Relationship.RIGHT) && !(startRel & Relationship.RIGHT)) {
      y = endY - (endX - maxX) * slope;
      intersects2 = y >= minY && y <= maxY;
    }
    if (!intersects2 && !!(endRel & Relationship.BELOW) && !(startRel & Relationship.BELOW)) {
      x = endX - (endY - minY) / slope;
      intersects2 = x >= minX && x <= maxX;
    }
    if (!intersects2 && !!(endRel & Relationship.LEFT) && !(startRel & Relationship.LEFT)) {
      y = endY - (endX - minX) * slope;
      intersects2 = y >= minY && y <= maxY;
    }
  }
  return intersects2;
}
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
function squaredSegmentDistance(x, y, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  if (dx !== 0 || dy !== 0) {
    const t = ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy);
    if (t > 1) {
      x1 = x2;
      y1 = y2;
    } else if (t > 0) {
      x1 += dx * t;
      y1 += dy * t;
    }
  }
  return squaredDistance(x, y, x1, y1);
}
function squaredDistance(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return dx * dx + dy * dy;
}
function solveLinearSystem(mat) {
  const n = mat.length;
  for (let i = 0; i < n; i++) {
    let maxRow = i;
    let maxEl = Math.abs(mat[i][i]);
    for (let r = i + 1; r < n; r++) {
      const absValue = Math.abs(mat[r][i]);
      if (absValue > maxEl) {
        maxEl = absValue;
        maxRow = r;
      }
    }
    if (maxEl === 0) {
      return null;
    }
    const tmp = mat[maxRow];
    mat[maxRow] = mat[i];
    mat[i] = tmp;
    for (let j = i + 1; j < n; j++) {
      const coef = -mat[j][i] / mat[i][i];
      for (let k = i; k < n + 1; k++) {
        if (i == k) {
          mat[j][k] = 0;
        } else {
          mat[j][k] += coef * mat[i][k];
        }
      }
    }
  }
  const x = new Array(n);
  for (let l = n - 1; l >= 0; l--) {
    x[l] = mat[l][n] / mat[l][l];
    for (let m = l - 1; m >= 0; m--) {
      mat[m][n] -= mat[m][l] * x[l];
    }
  }
  return x;
}
function toRadians(angleInDegrees) {
  return angleInDegrees * Math.PI / 180;
}
function modulo(a, b) {
  const r = a % b;
  return r * b < 0 ? r + b : r;
}
function lerp(a, b, x) {
  return a + x * (b - a);
}
function toFixed(n, decimals) {
  const factor = Math.pow(10, decimals);
  return Math.round(n * factor) / factor;
}
function floor(n, decimals) {
  return Math.floor(toFixed(n, decimals));
}
function ceil(n, decimals) {
  return Math.ceil(toFixed(n, decimals));
}
const HEX_COLOR_RE_ = /^#([a-f0-9]{3}|[a-f0-9]{4}(?:[a-f0-9]{2}){0,2})$/i;
const NAMED_COLOR_RE_ = /^([a-z]*)$|^hsla?\(.*\)$/i;
function asString(color) {
  if (typeof color === "string") {
    return color;
  } else {
    return toString(color);
  }
}
function fromNamed(color) {
  const el = document.createElement("div");
  el.style.color = color;
  if (el.style.color !== "") {
    document.body.appendChild(el);
    const rgb = getComputedStyle(el).color;
    document.body.removeChild(el);
    return rgb;
  } else {
    return "";
  }
}
const fromString = function() {
  const MAX_CACHE_SIZE = 1024;
  const cache2 = {};
  let cacheSize = 0;
  return function(s) {
    let color;
    if (cache2.hasOwnProperty(s)) {
      color = cache2[s];
    } else {
      if (cacheSize >= MAX_CACHE_SIZE) {
        let i = 0;
        for (const key in cache2) {
          if ((i++ & 3) === 0) {
            delete cache2[key];
            --cacheSize;
          }
        }
      }
      color = fromStringInternal_(s);
      cache2[s] = color;
      ++cacheSize;
    }
    return color;
  };
}();
function asArray(color) {
  if (Array.isArray(color)) {
    return color;
  } else {
    return fromString(color);
  }
}
function fromStringInternal_(s) {
  let r, g, b, a, color;
  if (NAMED_COLOR_RE_.exec(s)) {
    s = fromNamed(s);
  }
  if (HEX_COLOR_RE_.exec(s)) {
    const n = s.length - 1;
    let d;
    if (n <= 4) {
      d = 1;
    } else {
      d = 2;
    }
    const hasAlpha = n === 4 || n === 8;
    r = parseInt(s.substr(1 + 0 * d, d), 16);
    g = parseInt(s.substr(1 + 1 * d, d), 16);
    b = parseInt(s.substr(1 + 2 * d, d), 16);
    if (hasAlpha) {
      a = parseInt(s.substr(1 + 3 * d, d), 16);
    } else {
      a = 255;
    }
    if (d == 1) {
      r = (r << 4) + r;
      g = (g << 4) + g;
      b = (b << 4) + b;
      if (hasAlpha) {
        a = (a << 4) + a;
      }
    }
    color = [r, g, b, a / 255];
  } else if (s.startsWith("rgba(")) {
    color = s.slice(5, -1).split(",").map(Number);
    normalize(color);
  } else if (s.startsWith("rgb(")) {
    color = s.slice(4, -1).split(",").map(Number);
    color.push(1);
    normalize(color);
  } else {
    assert(false, 14);
  }
  return color;
}
function normalize(color) {
  color[0] = clamp(color[0] + 0.5 | 0, 0, 255);
  color[1] = clamp(color[1] + 0.5 | 0, 0, 255);
  color[2] = clamp(color[2] + 0.5 | 0, 0, 255);
  color[3] = clamp(color[3], 0, 1);
  return color;
}
function toString(color) {
  let r = color[0];
  if (r != (r | 0)) {
    r = r + 0.5 | 0;
  }
  let g = color[1];
  if (g != (g | 0)) {
    g = g + 0.5 | 0;
  }
  let b = color[2];
  if (b != (b | 0)) {
    b = b + 0.5 | 0;
  }
  const a = color[3] === void 0 ? 1 : Math.round(color[3] * 100) / 100;
  return "rgba(" + r + "," + g + "," + b + "," + a + ")";
}
function isStringColor(s) {
  if (NAMED_COLOR_RE_.test(s)) {
    s = fromNamed(s);
  }
  return HEX_COLOR_RE_.test(s) || s.startsWith("rgba(") || s.startsWith("rgb(");
}
class IconImageCache {
  constructor() {
    this.cache_ = {};
    this.cacheSize_ = 0;
    this.maxCacheSize_ = 32;
  }
  clear() {
    this.cache_ = {};
    this.cacheSize_ = 0;
  }
  canExpireCache() {
    return this.cacheSize_ > this.maxCacheSize_;
  }
  expire() {
    if (this.canExpireCache()) {
      let i = 0;
      for (const key in this.cache_) {
        const iconImage = this.cache_[key];
        if ((i++ & 3) === 0 && !iconImage.hasListener()) {
          delete this.cache_[key];
          --this.cacheSize_;
        }
      }
    }
  }
  get(src, crossOrigin, color) {
    const key = getKey$1(src, crossOrigin, color);
    return key in this.cache_ ? this.cache_[key] : null;
  }
  set(src, crossOrigin, color, iconImage) {
    const key = getKey$1(src, crossOrigin, color);
    this.cache_[key] = iconImage;
    ++this.cacheSize_;
  }
  setSize(maxCacheSize) {
    this.maxCacheSize_ = maxCacheSize;
    this.expire();
  }
}
function getKey$1(src, crossOrigin, color) {
  const colorString = color ? asString(color) : "null";
  return crossOrigin + ":" + src + ":" + colorString;
}
const shared = new IconImageCache();
const LayerProperty = {
  OPACITY: "opacity",
  VISIBLE: "visible",
  EXTENT: "extent",
  Z_INDEX: "zIndex",
  MAX_RESOLUTION: "maxResolution",
  MIN_RESOLUTION: "minResolution",
  MAX_ZOOM: "maxZoom",
  MIN_ZOOM: "minZoom",
  SOURCE: "source",
  MAP: "map"
};
class BaseLayer extends BaseObject$1 {
  constructor(options) {
    super();
    this.on;
    this.once;
    this.un;
    this.background_ = options.background;
    const properties = Object.assign({}, options);
    if (typeof options.properties === "object") {
      delete properties.properties;
      Object.assign(properties, options.properties);
    }
    properties[LayerProperty.OPACITY] = options.opacity !== void 0 ? options.opacity : 1;
    assert(typeof properties[LayerProperty.OPACITY] === "number", 64);
    properties[LayerProperty.VISIBLE] = options.visible !== void 0 ? options.visible : true;
    properties[LayerProperty.Z_INDEX] = options.zIndex;
    properties[LayerProperty.MAX_RESOLUTION] = options.maxResolution !== void 0 ? options.maxResolution : Infinity;
    properties[LayerProperty.MIN_RESOLUTION] = options.minResolution !== void 0 ? options.minResolution : 0;
    properties[LayerProperty.MIN_ZOOM] = options.minZoom !== void 0 ? options.minZoom : -Infinity;
    properties[LayerProperty.MAX_ZOOM] = options.maxZoom !== void 0 ? options.maxZoom : Infinity;
    this.className_ = properties.className !== void 0 ? properties.className : "ol-layer";
    delete properties.className;
    this.setProperties(properties);
    this.state_ = null;
  }
  getBackground() {
    return this.background_;
  }
  getClassName() {
    return this.className_;
  }
  getLayerState(managed) {
    const state = this.state_ || {
      layer: this,
      managed: managed === void 0 ? true : managed
    };
    const zIndex = this.getZIndex();
    state.opacity = clamp(Math.round(this.getOpacity() * 100) / 100, 0, 1);
    state.visible = this.getVisible();
    state.extent = this.getExtent();
    state.zIndex = zIndex === void 0 && !state.managed ? Infinity : zIndex;
    state.maxResolution = this.getMaxResolution();
    state.minResolution = Math.max(this.getMinResolution(), 0);
    state.minZoom = this.getMinZoom();
    state.maxZoom = this.getMaxZoom();
    this.state_ = state;
    return state;
  }
  getLayersArray(array) {
    return abstract();
  }
  getLayerStatesArray(states) {
    return abstract();
  }
  getExtent() {
    return this.get(LayerProperty.EXTENT);
  }
  getMaxResolution() {
    return this.get(LayerProperty.MAX_RESOLUTION);
  }
  getMinResolution() {
    return this.get(LayerProperty.MIN_RESOLUTION);
  }
  getMinZoom() {
    return this.get(LayerProperty.MIN_ZOOM);
  }
  getMaxZoom() {
    return this.get(LayerProperty.MAX_ZOOM);
  }
  getOpacity() {
    return this.get(LayerProperty.OPACITY);
  }
  getSourceState() {
    return abstract();
  }
  getVisible() {
    return this.get(LayerProperty.VISIBLE);
  }
  getZIndex() {
    return this.get(LayerProperty.Z_INDEX);
  }
  setBackground(background) {
    this.background_ = background;
    this.changed();
  }
  setExtent(extent2) {
    this.set(LayerProperty.EXTENT, extent2);
  }
  setMaxResolution(maxResolution) {
    this.set(LayerProperty.MAX_RESOLUTION, maxResolution);
  }
  setMinResolution(minResolution) {
    this.set(LayerProperty.MIN_RESOLUTION, minResolution);
  }
  setMaxZoom(maxZoom) {
    this.set(LayerProperty.MAX_ZOOM, maxZoom);
  }
  setMinZoom(minZoom) {
    this.set(LayerProperty.MIN_ZOOM, minZoom);
  }
  setOpacity(opacity) {
    assert(typeof opacity === "number", 64);
    this.set(LayerProperty.OPACITY, opacity);
  }
  setVisible(visible) {
    this.set(LayerProperty.VISIBLE, visible);
  }
  setZIndex(zindex) {
    this.set(LayerProperty.Z_INDEX, zindex);
  }
  disposeInternal() {
    if (this.state_) {
      this.state_.layer = null;
      this.state_ = null;
    }
    super.disposeInternal();
  }
}
const BaseLayer$1 = BaseLayer;
const RenderEventType = {
  PRERENDER: "prerender",
  POSTRENDER: "postrender",
  PRECOMPOSE: "precompose",
  POSTCOMPOSE: "postcompose",
  RENDERCOMPLETE: "rendercomplete"
};
class Layer extends BaseLayer$1 {
  constructor(options) {
    const baseOptions = Object.assign({}, options);
    delete baseOptions.source;
    super(baseOptions);
    this.on;
    this.once;
    this.un;
    this.mapPrecomposeKey_ = null;
    this.mapRenderKey_ = null;
    this.sourceChangeKey_ = null;
    this.renderer_ = null;
    this.rendered = false;
    if (options.render) {
      this.render = options.render;
    }
    if (options.map) {
      this.setMap(options.map);
    }
    this.addChangeListener(
      LayerProperty.SOURCE,
      this.handleSourcePropertyChange_
    );
    const source = options.source ? options.source : null;
    this.setSource(source);
  }
  getLayersArray(array) {
    array = array ? array : [];
    array.push(this);
    return array;
  }
  getLayerStatesArray(states) {
    states = states ? states : [];
    states.push(this.getLayerState());
    return states;
  }
  getSource() {
    return this.get(LayerProperty.SOURCE) || null;
  }
  getRenderSource() {
    return this.getSource();
  }
  getSourceState() {
    const source = this.getSource();
    return !source ? "undefined" : source.getState();
  }
  handleSourceChange_() {
    this.changed();
  }
  handleSourcePropertyChange_() {
    if (this.sourceChangeKey_) {
      unlistenByKey(this.sourceChangeKey_);
      this.sourceChangeKey_ = null;
    }
    const source = this.getSource();
    if (source) {
      this.sourceChangeKey_ = listen(
        source,
        EventType.CHANGE,
        this.handleSourceChange_,
        this
      );
    }
    this.changed();
  }
  getFeatures(pixel) {
    if (!this.renderer_) {
      return new Promise((resolve) => resolve([]));
    }
    return this.renderer_.getFeatures(pixel);
  }
  getData(pixel) {
    if (!this.renderer_ || !this.rendered) {
      return null;
    }
    return this.renderer_.getData(pixel);
  }
  render(frameState, target) {
    const layerRenderer = this.getRenderer();
    if (layerRenderer.prepareFrame(frameState)) {
      this.rendered = true;
      return layerRenderer.renderFrame(frameState, target);
    }
  }
  unrender() {
    this.rendered = false;
  }
  setMapInternal(map2) {
    if (!map2) {
      this.unrender();
    }
    this.set(LayerProperty.MAP, map2);
  }
  getMapInternal() {
    return this.get(LayerProperty.MAP);
  }
  setMap(map2) {
    if (this.mapPrecomposeKey_) {
      unlistenByKey(this.mapPrecomposeKey_);
      this.mapPrecomposeKey_ = null;
    }
    if (!map2) {
      this.changed();
    }
    if (this.mapRenderKey_) {
      unlistenByKey(this.mapRenderKey_);
      this.mapRenderKey_ = null;
    }
    if (map2) {
      this.mapPrecomposeKey_ = listen(
        map2,
        RenderEventType.PRECOMPOSE,
        function(evt) {
          const renderEvent = evt;
          const layerStatesArray = renderEvent.frameState.layerStatesArray;
          const layerState = this.getLayerState(false);
          assert(
            !layerStatesArray.some(function(arrayLayerState) {
              return arrayLayerState.layer === layerState.layer;
            }),
            67
          );
          layerStatesArray.push(layerState);
        },
        this
      );
      this.mapRenderKey_ = listen(this, EventType.CHANGE, map2.render, map2);
      this.changed();
    }
  }
  setSource(source) {
    this.set(LayerProperty.SOURCE, source);
  }
  getRenderer() {
    if (!this.renderer_) {
      this.renderer_ = this.createRenderer();
    }
    return this.renderer_;
  }
  hasRenderer() {
    return !!this.renderer_;
  }
  createRenderer() {
    return null;
  }
  disposeInternal() {
    if (this.renderer_) {
      this.renderer_.dispose();
      delete this.renderer_;
    }
    this.setSource(null);
    super.disposeInternal();
  }
}
function inView(layerState, viewState) {
  if (!layerState.visible) {
    return false;
  }
  const resolution = viewState.resolution;
  if (resolution < layerState.minResolution || resolution >= layerState.maxResolution) {
    return false;
  }
  const zoom = viewState.zoom;
  return zoom > layerState.minZoom && zoom <= layerState.maxZoom;
}
const Layer$1 = Layer;
function add$2(coordinate, delta) {
  coordinate[0] += +delta[0];
  coordinate[1] += +delta[1];
  return coordinate;
}
function equals(coordinate1, coordinate2) {
  let equals2 = true;
  for (let i = coordinate1.length - 1; i >= 0; --i) {
    if (coordinate1[i] != coordinate2[i]) {
      equals2 = false;
      break;
    }
  }
  return equals2;
}
function rotate$1(coordinate, angle) {
  const cosAngle = Math.cos(angle);
  const sinAngle = Math.sin(angle);
  const x = coordinate[0] * cosAngle - coordinate[1] * sinAngle;
  const y = coordinate[1] * cosAngle + coordinate[0] * sinAngle;
  coordinate[0] = x;
  coordinate[1] = y;
  return coordinate;
}
function scale$2(coordinate, scale2) {
  coordinate[0] *= scale2;
  coordinate[1] *= scale2;
  return coordinate;
}
function wrapX$1(coordinate, projection) {
  if (projection.canWrapX()) {
    const worldWidth = getWidth(projection.getExtent());
    const worldsAway = getWorldsAway(coordinate, projection, worldWidth);
    if (worldsAway) {
      coordinate[0] -= worldsAway * worldWidth;
    }
  }
  return coordinate;
}
function getWorldsAway(coordinate, projection, sourceExtentWidth) {
  const projectionExtent = projection.getExtent();
  let worldsAway = 0;
  if (projection.canWrapX() && (coordinate[0] < projectionExtent[0] || coordinate[0] > projectionExtent[2])) {
    sourceExtentWidth = sourceExtentWidth || getWidth(projectionExtent);
    worldsAway = Math.floor(
      (coordinate[0] - projectionExtent[0]) / sourceExtentWidth
    );
  }
  return worldsAway;
}
class MapRenderer extends Disposable$1 {
  constructor(map2) {
    super();
    this.map_ = map2;
  }
  dispatchRenderEvent(type, frameState) {
    abstract();
  }
  calculateMatrices2D(frameState) {
    const viewState = frameState.viewState;
    const coordinateToPixelTransform = frameState.coordinateToPixelTransform;
    const pixelToCoordinateTransform = frameState.pixelToCoordinateTransform;
    compose(
      coordinateToPixelTransform,
      frameState.size[0] / 2,
      frameState.size[1] / 2,
      1 / viewState.resolution,
      -1 / viewState.resolution,
      -viewState.rotation,
      -viewState.center[0],
      -viewState.center[1]
    );
    makeInverse(pixelToCoordinateTransform, coordinateToPixelTransform);
  }
  forEachFeatureAtCoordinate(coordinate, frameState, hitTolerance, checkWrapped, callback, thisArg, layerFilter, thisArg2) {
    let result;
    const viewState = frameState.viewState;
    function forEachFeatureAtCoordinate(managed, feature, layer, geometry) {
      return callback.call(thisArg, feature, managed ? layer : null, geometry);
    }
    const projection = viewState.projection;
    const translatedCoordinate = wrapX$1(coordinate.slice(), projection);
    const offsets = [[0, 0]];
    if (projection.canWrapX() && checkWrapped) {
      const projectionExtent = projection.getExtent();
      const worldWidth = getWidth(projectionExtent);
      offsets.push([-worldWidth, 0], [worldWidth, 0]);
    }
    const layerStates = frameState.layerStatesArray;
    const numLayers = layerStates.length;
    const matches = [];
    const tmpCoord = [];
    for (let i = 0; i < offsets.length; i++) {
      for (let j = numLayers - 1; j >= 0; --j) {
        const layerState = layerStates[j];
        const layer = layerState.layer;
        if (layer.hasRenderer() && inView(layerState, viewState) && layerFilter.call(thisArg2, layer)) {
          const layerRenderer = layer.getRenderer();
          const source = layer.getSource();
          if (layerRenderer && source) {
            const coordinates2 = source.getWrapX() ? translatedCoordinate : coordinate;
            const callback2 = forEachFeatureAtCoordinate.bind(
              null,
              layerState.managed
            );
            tmpCoord[0] = coordinates2[0] + offsets[i][0];
            tmpCoord[1] = coordinates2[1] + offsets[i][1];
            result = layerRenderer.forEachFeatureAtCoordinate(
              tmpCoord,
              frameState,
              hitTolerance,
              callback2,
              matches
            );
          }
          if (result) {
            return result;
          }
        }
      }
    }
    if (matches.length === 0) {
      return void 0;
    }
    const order = 1 / matches.length;
    matches.forEach((m, i) => m.distanceSq += i * order);
    matches.sort((a, b) => a.distanceSq - b.distanceSq);
    matches.some((m) => {
      return result = m.callback(m.feature, m.layer, m.geometry);
    });
    return result;
  }
  hasFeatureAtCoordinate(coordinate, frameState, hitTolerance, checkWrapped, layerFilter, thisArg) {
    const hasFeature = this.forEachFeatureAtCoordinate(
      coordinate,
      frameState,
      hitTolerance,
      checkWrapped,
      TRUE,
      this,
      layerFilter,
      thisArg
    );
    return hasFeature !== void 0;
  }
  getMap() {
    return this.map_;
  }
  renderFrame(frameState) {
    abstract();
  }
  scheduleExpireIconCache(frameState) {
    if (shared.canExpireCache()) {
      frameState.postRenderFunctions.push(expireIconCache);
    }
  }
}
function expireIconCache(map2, frameState) {
  shared.expire();
}
const MapRenderer$1 = MapRenderer;
class RenderEvent extends Event {
  constructor(type, inversePixelTransform, frameState, context2) {
    super(type);
    this.inversePixelTransform = inversePixelTransform;
    this.frameState = frameState;
    this.context = context2;
  }
}
const RenderEvent$1 = RenderEvent;
const CLASS_HIDDEN = "ol-hidden";
const CLASS_UNSELECTABLE = "ol-unselectable";
const CLASS_CONTROL = "ol-control";
const CLASS_COLLAPSED = "ol-collapsed";
function createCanvasContext2D(width, height, canvasPool2, settings) {
  let canvas;
  if (canvasPool2 && canvasPool2.length) {
    canvas = canvasPool2.shift();
  } else if (WORKER_OFFSCREEN_CANVAS) {
    canvas = new OffscreenCanvas(width || 300, height || 300);
  } else {
    canvas = document.createElement("canvas");
  }
  if (width) {
    canvas.width = width;
  }
  if (height) {
    canvas.height = height;
  }
  return canvas.getContext("2d", settings);
}
function releaseCanvas$1(context2) {
  const canvas = context2.canvas;
  canvas.width = 1;
  canvas.height = 1;
  context2.clearRect(0, 0, 1, 1);
}
function replaceNode(newNode, oldNode) {
  const parent = oldNode.parentNode;
  if (parent) {
    parent.replaceChild(newNode, oldNode);
  }
}
function removeNode(node) {
  return node && node.parentNode ? node.parentNode.removeChild(node) : null;
}
function removeChildren(node) {
  while (node.lastChild) {
    node.removeChild(node.lastChild);
  }
}
function replaceChildren(node, children) {
  const oldChildren = node.childNodes;
  for (let i = 0; true; ++i) {
    const oldChild = oldChildren[i];
    const newChild = children[i];
    if (!oldChild && !newChild) {
      break;
    }
    if (oldChild === newChild) {
      continue;
    }
    if (!oldChild) {
      node.appendChild(newChild);
      continue;
    }
    if (!newChild) {
      node.removeChild(oldChild);
      --i;
      continue;
    }
    node.insertBefore(newChild, oldChild);
  }
}
const checkedFonts = new BaseObject$1();
class CompositeMapRenderer extends MapRenderer$1 {
  constructor(map2) {
    super(map2);
    this.fontChangeListenerKey_ = listen(
      checkedFonts,
      ObjectEventType.PROPERTYCHANGE,
      map2.redrawText.bind(map2)
    );
    this.element_ = document.createElement("div");
    const style2 = this.element_.style;
    style2.position = "absolute";
    style2.width = "100%";
    style2.height = "100%";
    style2.zIndex = "0";
    this.element_.className = CLASS_UNSELECTABLE + " ol-layers";
    const container = map2.getViewport();
    container.insertBefore(this.element_, container.firstChild || null);
    this.children_ = [];
    this.renderedVisible_ = true;
  }
  dispatchRenderEvent(type, frameState) {
    const map2 = this.getMap();
    if (map2.hasListener(type)) {
      const event = new RenderEvent$1(type, void 0, frameState);
      map2.dispatchEvent(event);
    }
  }
  disposeInternal() {
    unlistenByKey(this.fontChangeListenerKey_);
    this.element_.parentNode.removeChild(this.element_);
    super.disposeInternal();
  }
  renderFrame(frameState) {
    if (!frameState) {
      if (this.renderedVisible_) {
        this.element_.style.display = "none";
        this.renderedVisible_ = false;
      }
      return;
    }
    this.calculateMatrices2D(frameState);
    this.dispatchRenderEvent(RenderEventType.PRECOMPOSE, frameState);
    const layerStatesArray = frameState.layerStatesArray.sort(function(a, b) {
      return a.zIndex - b.zIndex;
    });
    const viewState = frameState.viewState;
    this.children_.length = 0;
    const declutterLayers = [];
    let previousElement = null;
    for (let i = 0, ii = layerStatesArray.length; i < ii; ++i) {
      const layerState = layerStatesArray[i];
      frameState.layerIndex = i;
      const layer = layerState.layer;
      const sourceState = layer.getSourceState();
      if (!inView(layerState, viewState) || sourceState != "ready" && sourceState != "undefined") {
        layer.unrender();
        continue;
      }
      const element = layer.render(frameState, previousElement);
      if (!element) {
        continue;
      }
      if (element !== previousElement) {
        this.children_.push(element);
        previousElement = element;
      }
      if ("getDeclutter" in layer) {
        declutterLayers.push(
          layer
        );
      }
    }
    for (let i = declutterLayers.length - 1; i >= 0; --i) {
      declutterLayers[i].renderDeclutter(frameState);
    }
    replaceChildren(this.element_, this.children_);
    this.dispatchRenderEvent(RenderEventType.POSTCOMPOSE, frameState);
    if (!this.renderedVisible_) {
      this.element_.style.display = "";
      this.renderedVisible_ = true;
    }
    this.scheduleExpireIconCache(frameState);
  }
}
const CompositeMapRenderer$1 = CompositeMapRenderer;
class GroupEvent extends Event {
  constructor(type, layer) {
    super(type);
    this.layer = layer;
  }
}
const Property = {
  LAYERS: "layers"
};
class LayerGroup extends BaseLayer$1 {
  constructor(options) {
    options = options || {};
    const baseOptions = Object.assign({}, options);
    delete baseOptions.layers;
    let layers = options.layers;
    super(baseOptions);
    this.on;
    this.once;
    this.un;
    this.layersListenerKeys_ = [];
    this.listenerKeys_ = {};
    this.addChangeListener(Property.LAYERS, this.handleLayersChanged_);
    if (layers) {
      if (Array.isArray(layers)) {
        layers = new Collection$1(layers.slice(), { unique: true });
      } else {
        assert(typeof layers.getArray === "function", 43);
      }
    } else {
      layers = new Collection$1(void 0, { unique: true });
    }
    this.setLayers(layers);
  }
  handleLayerChange_() {
    this.changed();
  }
  handleLayersChanged_() {
    this.layersListenerKeys_.forEach(unlistenByKey);
    this.layersListenerKeys_.length = 0;
    const layers = this.getLayers();
    this.layersListenerKeys_.push(
      listen(layers, CollectionEventType.ADD, this.handleLayersAdd_, this),
      listen(layers, CollectionEventType.REMOVE, this.handleLayersRemove_, this)
    );
    for (const id in this.listenerKeys_) {
      this.listenerKeys_[id].forEach(unlistenByKey);
    }
    clear(this.listenerKeys_);
    const layersArray = layers.getArray();
    for (let i = 0, ii = layersArray.length; i < ii; i++) {
      const layer = layersArray[i];
      this.registerLayerListeners_(layer);
      this.dispatchEvent(new GroupEvent("addlayer", layer));
    }
    this.changed();
  }
  registerLayerListeners_(layer) {
    const listenerKeys = [
      listen(
        layer,
        ObjectEventType.PROPERTYCHANGE,
        this.handleLayerChange_,
        this
      ),
      listen(layer, EventType.CHANGE, this.handleLayerChange_, this)
    ];
    if (layer instanceof LayerGroup) {
      listenerKeys.push(
        listen(layer, "addlayer", this.handleLayerGroupAdd_, this),
        listen(layer, "removelayer", this.handleLayerGroupRemove_, this)
      );
    }
    this.listenerKeys_[getUid(layer)] = listenerKeys;
  }
  handleLayerGroupAdd_(event) {
    this.dispatchEvent(new GroupEvent("addlayer", event.layer));
  }
  handleLayerGroupRemove_(event) {
    this.dispatchEvent(new GroupEvent("removelayer", event.layer));
  }
  handleLayersAdd_(collectionEvent) {
    const layer = collectionEvent.element;
    this.registerLayerListeners_(layer);
    this.dispatchEvent(new GroupEvent("addlayer", layer));
    this.changed();
  }
  handleLayersRemove_(collectionEvent) {
    const layer = collectionEvent.element;
    const key = getUid(layer);
    this.listenerKeys_[key].forEach(unlistenByKey);
    delete this.listenerKeys_[key];
    this.dispatchEvent(new GroupEvent("removelayer", layer));
    this.changed();
  }
  getLayers() {
    return this.get(Property.LAYERS);
  }
  setLayers(layers) {
    const collection = this.getLayers();
    if (collection) {
      const currentLayers = collection.getArray();
      for (let i = 0, ii = currentLayers.length; i < ii; ++i) {
        this.dispatchEvent(new GroupEvent("removelayer", currentLayers[i]));
      }
    }
    this.set(Property.LAYERS, layers);
  }
  getLayersArray(array) {
    array = array !== void 0 ? array : [];
    this.getLayers().forEach(function(layer) {
      layer.getLayersArray(array);
    });
    return array;
  }
  getLayerStatesArray(dest) {
    const states = dest !== void 0 ? dest : [];
    const pos = states.length;
    this.getLayers().forEach(function(layer) {
      layer.getLayerStatesArray(states);
    });
    const ownLayerState = this.getLayerState();
    let defaultZIndex = ownLayerState.zIndex;
    if (!dest && ownLayerState.zIndex === void 0) {
      defaultZIndex = 0;
    }
    for (let i = pos, ii = states.length; i < ii; i++) {
      const layerState = states[i];
      layerState.opacity *= ownLayerState.opacity;
      layerState.visible = layerState.visible && ownLayerState.visible;
      layerState.maxResolution = Math.min(
        layerState.maxResolution,
        ownLayerState.maxResolution
      );
      layerState.minResolution = Math.max(
        layerState.minResolution,
        ownLayerState.minResolution
      );
      layerState.minZoom = Math.max(layerState.minZoom, ownLayerState.minZoom);
      layerState.maxZoom = Math.min(layerState.maxZoom, ownLayerState.maxZoom);
      if (ownLayerState.extent !== void 0) {
        if (layerState.extent !== void 0) {
          layerState.extent = getIntersection(
            layerState.extent,
            ownLayerState.extent
          );
        } else {
          layerState.extent = ownLayerState.extent;
        }
      }
      if (layerState.zIndex === void 0) {
        layerState.zIndex = defaultZIndex;
      }
    }
    return states;
  }
  getSourceState() {
    return "ready";
  }
}
const LayerGroup$1 = LayerGroup;
class MapEvent extends Event {
  constructor(type, map2, frameState) {
    super(type);
    this.map = map2;
    this.frameState = frameState !== void 0 ? frameState : null;
  }
}
const MapEvent$1 = MapEvent;
class MapBrowserEvent extends MapEvent$1 {
  constructor(type, map2, originalEvent, dragging, frameState, activePointers) {
    super(type, map2, frameState);
    this.originalEvent = originalEvent;
    this.pixel_ = null;
    this.coordinate_ = null;
    this.dragging = dragging !== void 0 ? dragging : false;
    this.activePointers = activePointers;
  }
  get pixel() {
    if (!this.pixel_) {
      this.pixel_ = this.map.getEventPixel(this.originalEvent);
    }
    return this.pixel_;
  }
  set pixel(pixel) {
    this.pixel_ = pixel;
  }
  get coordinate() {
    if (!this.coordinate_) {
      this.coordinate_ = this.map.getCoordinateFromPixel(this.pixel);
    }
    return this.coordinate_;
  }
  set coordinate(coordinate) {
    this.coordinate_ = coordinate;
  }
  preventDefault() {
    super.preventDefault();
    if ("preventDefault" in this.originalEvent) {
      this.originalEvent.preventDefault();
    }
  }
  stopPropagation() {
    super.stopPropagation();
    if ("stopPropagation" in this.originalEvent) {
      this.originalEvent.stopPropagation();
    }
  }
}
const MapBrowserEvent$1 = MapBrowserEvent;
const MapBrowserEventType = {
  SINGLECLICK: "singleclick",
  CLICK: EventType.CLICK,
  DBLCLICK: EventType.DBLCLICK,
  POINTERDRAG: "pointerdrag",
  POINTERMOVE: "pointermove",
  POINTERDOWN: "pointerdown",
  POINTERUP: "pointerup",
  POINTEROVER: "pointerover",
  POINTEROUT: "pointerout",
  POINTERENTER: "pointerenter",
  POINTERLEAVE: "pointerleave",
  POINTERCANCEL: "pointercancel"
};
const PointerEventType = {
  POINTERMOVE: "pointermove",
  POINTERDOWN: "pointerdown",
  POINTERUP: "pointerup",
  POINTEROVER: "pointerover",
  POINTEROUT: "pointerout",
  POINTERENTER: "pointerenter",
  POINTERLEAVE: "pointerleave",
  POINTERCANCEL: "pointercancel"
};
class MapBrowserEventHandler extends EventTarget {
  constructor(map2, moveTolerance) {
    super(map2);
    this.map_ = map2;
    this.clickTimeoutId_;
    this.emulateClicks_ = false;
    this.dragging_ = false;
    this.dragListenerKeys_ = [];
    this.moveTolerance_ = moveTolerance === void 0 ? 1 : moveTolerance;
    this.down_ = null;
    const element = this.map_.getViewport();
    this.activePointers_ = [];
    this.trackedTouches_ = {};
    this.element_ = element;
    this.pointerdownListenerKey_ = listen(
      element,
      PointerEventType.POINTERDOWN,
      this.handlePointerDown_,
      this
    );
    this.originalPointerMoveEvent_;
    this.relayedListenerKey_ = listen(
      element,
      PointerEventType.POINTERMOVE,
      this.relayMoveEvent_,
      this
    );
    this.boundHandleTouchMove_ = this.handleTouchMove_.bind(this);
    this.element_.addEventListener(
      EventType.TOUCHMOVE,
      this.boundHandleTouchMove_,
      PASSIVE_EVENT_LISTENERS ? { passive: false } : false
    );
  }
  emulateClick_(pointerEvent) {
    let newEvent = new MapBrowserEvent$1(
      MapBrowserEventType.CLICK,
      this.map_,
      pointerEvent
    );
    this.dispatchEvent(newEvent);
    if (this.clickTimeoutId_ !== void 0) {
      clearTimeout(this.clickTimeoutId_);
      this.clickTimeoutId_ = void 0;
      newEvent = new MapBrowserEvent$1(
        MapBrowserEventType.DBLCLICK,
        this.map_,
        pointerEvent
      );
      this.dispatchEvent(newEvent);
    } else {
      this.clickTimeoutId_ = setTimeout(
        function() {
          this.clickTimeoutId_ = void 0;
          const newEvent2 = new MapBrowserEvent$1(
            MapBrowserEventType.SINGLECLICK,
            this.map_,
            pointerEvent
          );
          this.dispatchEvent(newEvent2);
        }.bind(this),
        250
      );
    }
  }
  updateActivePointers_(pointerEvent) {
    const event = pointerEvent;
    const id = event.pointerId;
    if (event.type == MapBrowserEventType.POINTERUP || event.type == MapBrowserEventType.POINTERCANCEL) {
      delete this.trackedTouches_[id];
      for (const pointerId in this.trackedTouches_) {
        if (this.trackedTouches_[pointerId].target !== event.target) {
          delete this.trackedTouches_[pointerId];
          break;
        }
      }
    } else if (event.type == MapBrowserEventType.POINTERDOWN || event.type == MapBrowserEventType.POINTERMOVE) {
      this.trackedTouches_[id] = event;
    }
    this.activePointers_ = Object.values(this.trackedTouches_);
  }
  handlePointerUp_(pointerEvent) {
    this.updateActivePointers_(pointerEvent);
    const newEvent = new MapBrowserEvent$1(
      MapBrowserEventType.POINTERUP,
      this.map_,
      pointerEvent,
      void 0,
      void 0,
      this.activePointers_
    );
    this.dispatchEvent(newEvent);
    if (this.emulateClicks_ && !newEvent.defaultPrevented && !this.dragging_ && this.isMouseActionButton_(pointerEvent)) {
      this.emulateClick_(this.down_);
    }
    if (this.activePointers_.length === 0) {
      this.dragListenerKeys_.forEach(unlistenByKey);
      this.dragListenerKeys_.length = 0;
      this.dragging_ = false;
      this.down_ = null;
    }
  }
  isMouseActionButton_(pointerEvent) {
    return pointerEvent.button === 0;
  }
  handlePointerDown_(pointerEvent) {
    this.emulateClicks_ = this.activePointers_.length === 0;
    this.updateActivePointers_(pointerEvent);
    const newEvent = new MapBrowserEvent$1(
      MapBrowserEventType.POINTERDOWN,
      this.map_,
      pointerEvent,
      void 0,
      void 0,
      this.activePointers_
    );
    this.dispatchEvent(newEvent);
    this.down_ = {};
    for (const property in pointerEvent) {
      const value = pointerEvent[property];
      this.down_[property] = typeof value === "function" ? VOID : value;
    }
    if (this.dragListenerKeys_.length === 0) {
      const doc = this.map_.getOwnerDocument();
      this.dragListenerKeys_.push(
        listen(
          doc,
          MapBrowserEventType.POINTERMOVE,
          this.handlePointerMove_,
          this
        ),
        listen(doc, MapBrowserEventType.POINTERUP, this.handlePointerUp_, this),
        listen(
          this.element_,
          MapBrowserEventType.POINTERCANCEL,
          this.handlePointerUp_,
          this
        )
      );
      if (this.element_.getRootNode && this.element_.getRootNode() !== doc) {
        this.dragListenerKeys_.push(
          listen(
            this.element_.getRootNode(),
            MapBrowserEventType.POINTERUP,
            this.handlePointerUp_,
            this
          )
        );
      }
    }
  }
  handlePointerMove_(pointerEvent) {
    if (this.isMoving_(pointerEvent)) {
      this.updateActivePointers_(pointerEvent);
      this.dragging_ = true;
      const newEvent = new MapBrowserEvent$1(
        MapBrowserEventType.POINTERDRAG,
        this.map_,
        pointerEvent,
        this.dragging_,
        void 0,
        this.activePointers_
      );
      this.dispatchEvent(newEvent);
    }
  }
  relayMoveEvent_(pointerEvent) {
    this.originalPointerMoveEvent_ = pointerEvent;
    const dragging = !!(this.down_ && this.isMoving_(pointerEvent));
    this.dispatchEvent(
      new MapBrowserEvent$1(
        MapBrowserEventType.POINTERMOVE,
        this.map_,
        pointerEvent,
        dragging
      )
    );
  }
  handleTouchMove_(event) {
    const originalEvent = this.originalPointerMoveEvent_;
    if ((!originalEvent || originalEvent.defaultPrevented) && (typeof event.cancelable !== "boolean" || event.cancelable === true)) {
      event.preventDefault();
    }
  }
  isMoving_(pointerEvent) {
    return this.dragging_ || Math.abs(pointerEvent.clientX - this.down_.clientX) > this.moveTolerance_ || Math.abs(pointerEvent.clientY - this.down_.clientY) > this.moveTolerance_;
  }
  disposeInternal() {
    if (this.relayedListenerKey_) {
      unlistenByKey(this.relayedListenerKey_);
      this.relayedListenerKey_ = null;
    }
    this.element_.removeEventListener(
      EventType.TOUCHMOVE,
      this.boundHandleTouchMove_
    );
    if (this.pointerdownListenerKey_) {
      unlistenByKey(this.pointerdownListenerKey_);
      this.pointerdownListenerKey_ = null;
    }
    this.dragListenerKeys_.forEach(unlistenByKey);
    this.dragListenerKeys_.length = 0;
    this.element_ = null;
    super.disposeInternal();
  }
}
const MapBrowserEventHandler$1 = MapBrowserEventHandler;
const MapEventType = {
  POSTRENDER: "postrender",
  MOVESTART: "movestart",
  MOVEEND: "moveend",
  LOADSTART: "loadstart",
  LOADEND: "loadend"
};
const MapProperty = {
  LAYERGROUP: "layergroup",
  SIZE: "size",
  TARGET: "target",
  VIEW: "view"
};
const DROP = Infinity;
class PriorityQueue {
  constructor(priorityFunction, keyFunction) {
    this.priorityFunction_ = priorityFunction;
    this.keyFunction_ = keyFunction;
    this.elements_ = [];
    this.priorities_ = [];
    this.queuedElements_ = {};
  }
  clear() {
    this.elements_.length = 0;
    this.priorities_.length = 0;
    clear(this.queuedElements_);
  }
  dequeue() {
    const elements = this.elements_;
    const priorities = this.priorities_;
    const element = elements[0];
    if (elements.length == 1) {
      elements.length = 0;
      priorities.length = 0;
    } else {
      elements[0] = elements.pop();
      priorities[0] = priorities.pop();
      this.siftUp_(0);
    }
    const elementKey = this.keyFunction_(element);
    delete this.queuedElements_[elementKey];
    return element;
  }
  enqueue(element) {
    assert(!(this.keyFunction_(element) in this.queuedElements_), 31);
    const priority = this.priorityFunction_(element);
    if (priority != DROP) {
      this.elements_.push(element);
      this.priorities_.push(priority);
      this.queuedElements_[this.keyFunction_(element)] = true;
      this.siftDown_(0, this.elements_.length - 1);
      return true;
    }
    return false;
  }
  getCount() {
    return this.elements_.length;
  }
  getLeftChildIndex_(index) {
    return index * 2 + 1;
  }
  getRightChildIndex_(index) {
    return index * 2 + 2;
  }
  getParentIndex_(index) {
    return index - 1 >> 1;
  }
  heapify_() {
    let i;
    for (i = (this.elements_.length >> 1) - 1; i >= 0; i--) {
      this.siftUp_(i);
    }
  }
  isEmpty() {
    return this.elements_.length === 0;
  }
  isKeyQueued(key) {
    return key in this.queuedElements_;
  }
  isQueued(element) {
    return this.isKeyQueued(this.keyFunction_(element));
  }
  siftUp_(index) {
    const elements = this.elements_;
    const priorities = this.priorities_;
    const count = elements.length;
    const element = elements[index];
    const priority = priorities[index];
    const startIndex = index;
    while (index < count >> 1) {
      const lIndex = this.getLeftChildIndex_(index);
      const rIndex = this.getRightChildIndex_(index);
      const smallerChildIndex = rIndex < count && priorities[rIndex] < priorities[lIndex] ? rIndex : lIndex;
      elements[index] = elements[smallerChildIndex];
      priorities[index] = priorities[smallerChildIndex];
      index = smallerChildIndex;
    }
    elements[index] = element;
    priorities[index] = priority;
    this.siftDown_(startIndex, index);
  }
  siftDown_(startIndex, index) {
    const elements = this.elements_;
    const priorities = this.priorities_;
    const element = elements[index];
    const priority = priorities[index];
    while (index > startIndex) {
      const parentIndex = this.getParentIndex_(index);
      if (priorities[parentIndex] > priority) {
        elements[index] = elements[parentIndex];
        priorities[index] = priorities[parentIndex];
        index = parentIndex;
      } else {
        break;
      }
    }
    elements[index] = element;
    priorities[index] = priority;
  }
  reprioritize() {
    const priorityFunction = this.priorityFunction_;
    const elements = this.elements_;
    const priorities = this.priorities_;
    let index = 0;
    const n = elements.length;
    let element, i, priority;
    for (i = 0; i < n; ++i) {
      element = elements[i];
      priority = priorityFunction(element);
      if (priority == DROP) {
        delete this.queuedElements_[this.keyFunction_(element)];
      } else {
        priorities[index] = priority;
        elements[index++] = element;
      }
    }
    elements.length = index;
    priorities.length = index;
    this.heapify_();
  }
}
const PriorityQueue$1 = PriorityQueue;
const TileState = {
  IDLE: 0,
  LOADING: 1,
  LOADED: 2,
  ERROR: 3,
  EMPTY: 4
};
class TileQueue extends PriorityQueue$1 {
  constructor(tilePriorityFunction, tileChangeCallback) {
    super(
      function(element) {
        return tilePriorityFunction.apply(null, element);
      },
      function(element) {
        return element[0].getKey();
      }
    );
    this.boundHandleTileChange_ = this.handleTileChange.bind(this);
    this.tileChangeCallback_ = tileChangeCallback;
    this.tilesLoading_ = 0;
    this.tilesLoadingKeys_ = {};
  }
  enqueue(element) {
    const added = super.enqueue(element);
    if (added) {
      const tile = element[0];
      tile.addEventListener(EventType.CHANGE, this.boundHandleTileChange_);
    }
    return added;
  }
  getTilesLoading() {
    return this.tilesLoading_;
  }
  handleTileChange(event) {
    const tile = event.target;
    const state = tile.getState();
    if (state === TileState.LOADED || state === TileState.ERROR || state === TileState.EMPTY) {
      if (state !== TileState.ERROR) {
        tile.removeEventListener(EventType.CHANGE, this.boundHandleTileChange_);
      }
      const tileKey = tile.getKey();
      if (tileKey in this.tilesLoadingKeys_) {
        delete this.tilesLoadingKeys_[tileKey];
        --this.tilesLoading_;
      }
      this.tileChangeCallback_();
    }
  }
  loadMoreTiles(maxTotalLoading, maxNewLoads) {
    let newLoads = 0;
    let state, tile, tileKey;
    while (this.tilesLoading_ < maxTotalLoading && newLoads < maxNewLoads && this.getCount() > 0) {
      tile = this.dequeue()[0];
      tileKey = tile.getKey();
      state = tile.getState();
      if (state === TileState.IDLE && !(tileKey in this.tilesLoadingKeys_)) {
        this.tilesLoadingKeys_[tileKey] = true;
        ++this.tilesLoading_;
        ++newLoads;
        tile.load();
      }
    }
  }
}
const TileQueue$1 = TileQueue;
function getTilePriority(frameState, tile, tileSourceKey, tileCenter, tileResolution) {
  if (!frameState || !(tileSourceKey in frameState.wantedTiles)) {
    return DROP;
  }
  if (!frameState.wantedTiles[tileSourceKey][tile.getKey()]) {
    return DROP;
  }
  const center = frameState.viewState.center;
  const deltaX = tileCenter[0] - center[0];
  const deltaY = tileCenter[1] - center[1];
  return 65536 * Math.log(tileResolution) + Math.sqrt(deltaX * deltaX + deltaY * deltaY) / tileResolution;
}
const ViewHint = {
  ANIMATING: 0,
  INTERACTING: 1
};
const ViewProperty = {
  CENTER: "center",
  RESOLUTION: "resolution",
  ROTATION: "rotation"
};
const DEFAULT_MAX_ZOOM = 42;
const DEFAULT_TILE_SIZE = 256;
const METERS_PER_UNIT$1 = {
  "radians": 6370997 / (2 * Math.PI),
  "degrees": 2 * Math.PI * 6370997 / 360,
  "ft": 0.3048,
  "m": 1,
  "us-ft": 1200 / 3937
};
class Projection {
  constructor(options) {
    this.code_ = options.code;
    this.units_ = options.units;
    this.extent_ = options.extent !== void 0 ? options.extent : null;
    this.worldExtent_ = options.worldExtent !== void 0 ? options.worldExtent : null;
    this.axisOrientation_ = options.axisOrientation !== void 0 ? options.axisOrientation : "enu";
    this.global_ = options.global !== void 0 ? options.global : false;
    this.canWrapX_ = !!(this.global_ && this.extent_);
    this.getPointResolutionFunc_ = options.getPointResolution;
    this.defaultTileGrid_ = null;
    this.metersPerUnit_ = options.metersPerUnit;
  }
  canWrapX() {
    return this.canWrapX_;
  }
  getCode() {
    return this.code_;
  }
  getExtent() {
    return this.extent_;
  }
  getUnits() {
    return this.units_;
  }
  getMetersPerUnit() {
    return this.metersPerUnit_ || METERS_PER_UNIT$1[this.units_];
  }
  getWorldExtent() {
    return this.worldExtent_;
  }
  getAxisOrientation() {
    return this.axisOrientation_;
  }
  isGlobal() {
    return this.global_;
  }
  setGlobal(global) {
    this.global_ = global;
    this.canWrapX_ = !!(global && this.extent_);
  }
  getDefaultTileGrid() {
    return this.defaultTileGrid_;
  }
  setDefaultTileGrid(tileGrid) {
    this.defaultTileGrid_ = tileGrid;
  }
  setExtent(extent2) {
    this.extent_ = extent2;
    this.canWrapX_ = !!(this.global_ && extent2);
  }
  setWorldExtent(worldExtent) {
    this.worldExtent_ = worldExtent;
  }
  setGetPointResolution(func) {
    this.getPointResolutionFunc_ = func;
  }
  getPointResolutionFunc() {
    return this.getPointResolutionFunc_;
  }
}
const Projection$1 = Projection;
const RADIUS$1 = 6378137;
const HALF_SIZE = Math.PI * RADIUS$1;
const EXTENT$1 = [-HALF_SIZE, -HALF_SIZE, HALF_SIZE, HALF_SIZE];
const WORLD_EXTENT = [-180, -85, 180, 85];
const MAX_SAFE_Y = RADIUS$1 * Math.log(Math.tan(Math.PI / 2));
class EPSG3857Projection extends Projection$1 {
  constructor(code) {
    super({
      code,
      units: "m",
      extent: EXTENT$1,
      global: true,
      worldExtent: WORLD_EXTENT,
      getPointResolution: function(resolution, point) {
        return resolution / Math.cosh(point[1] / RADIUS$1);
      }
    });
  }
}
const PROJECTIONS$1 = [
  new EPSG3857Projection("EPSG:3857"),
  new EPSG3857Projection("EPSG:102100"),
  new EPSG3857Projection("EPSG:102113"),
  new EPSG3857Projection("EPSG:900913"),
  new EPSG3857Projection("http://www.opengis.net/def/crs/EPSG/0/3857"),
  new EPSG3857Projection("http://www.opengis.net/gml/srs/epsg.xml#3857")
];
function fromEPSG4326(input, output, dimension) {
  const length = input.length;
  dimension = dimension > 1 ? dimension : 2;
  if (output === void 0) {
    if (dimension > 2) {
      output = input.slice();
    } else {
      output = new Array(length);
    }
  }
  for (let i = 0; i < length; i += dimension) {
    output[i] = HALF_SIZE * input[i] / 180;
    let y = RADIUS$1 * Math.log(Math.tan(Math.PI * (+input[i + 1] + 90) / 360));
    if (y > MAX_SAFE_Y) {
      y = MAX_SAFE_Y;
    } else if (y < -MAX_SAFE_Y) {
      y = -MAX_SAFE_Y;
    }
    output[i + 1] = y;
  }
  return output;
}
function toEPSG4326(input, output, dimension) {
  const length = input.length;
  dimension = dimension > 1 ? dimension : 2;
  if (output === void 0) {
    if (dimension > 2) {
      output = input.slice();
    } else {
      output = new Array(length);
    }
  }
  for (let i = 0; i < length; i += dimension) {
    output[i] = 180 * input[i] / HALF_SIZE;
    output[i + 1] = 360 * Math.atan(Math.exp(input[i + 1] / RADIUS$1)) / Math.PI - 90;
  }
  return output;
}
const RADIUS = 6378137;
const EXTENT = [-180, -90, 180, 90];
const METERS_PER_UNIT = Math.PI * RADIUS / 180;
class EPSG4326Projection extends Projection$1 {
  constructor(code, axisOrientation) {
    super({
      code,
      units: "degrees",
      extent: EXTENT,
      axisOrientation,
      global: true,
      metersPerUnit: METERS_PER_UNIT,
      worldExtent: EXTENT
    });
  }
}
const PROJECTIONS = [
  new EPSG4326Projection("CRS:84"),
  new EPSG4326Projection("EPSG:4326", "neu"),
  new EPSG4326Projection("urn:ogc:def:crs:OGC:1.3:CRS84"),
  new EPSG4326Projection("urn:ogc:def:crs:OGC:2:84"),
  new EPSG4326Projection("http://www.opengis.net/def/crs/OGC/1.3/CRS84"),
  new EPSG4326Projection("http://www.opengis.net/gml/srs/epsg.xml#4326", "neu"),
  new EPSG4326Projection("http://www.opengis.net/def/crs/EPSG/0/4326", "neu")
];
let cache = {};
function get$2(code) {
  return cache[code] || cache[code.replace(/urn:(x-)?ogc:def:crs:EPSG:(.*:)?(\w+)$/, "EPSG:$3")] || null;
}
function add$1(code, projection) {
  cache[code] = projection;
}
let transforms = {};
function add(source, destination, transformFn) {
  const sourceCode = source.getCode();
  const destinationCode = destination.getCode();
  if (!(sourceCode in transforms)) {
    transforms[sourceCode] = {};
  }
  transforms[sourceCode][destinationCode] = transformFn;
}
function get$1(sourceCode, destinationCode) {
  let transform2;
  if (sourceCode in transforms && destinationCode in transforms[sourceCode]) {
    transform2 = transforms[sourceCode][destinationCode];
  }
  return transform2;
}
const DEFAULT_RADIUS = 63710088e-1;
function getDistance(c1, c2, radius) {
  radius = radius || DEFAULT_RADIUS;
  const lat1 = toRadians(c1[1]);
  const lat2 = toRadians(c2[1]);
  const deltaLatBy2 = (lat2 - lat1) / 2;
  const deltaLonBy2 = toRadians(c2[0] - c1[0]) / 2;
  const a = Math.sin(deltaLatBy2) * Math.sin(deltaLatBy2) + Math.sin(deltaLonBy2) * Math.sin(deltaLonBy2) * Math.cos(lat1) * Math.cos(lat2);
  return 2 * radius * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
let showCoordinateWarning = true;
function disableCoordinateWarning(disable2) {
  const hide = disable2 === void 0 ? true : disable2;
  showCoordinateWarning = !hide;
}
function cloneTransform(input, output, dimension) {
  if (output !== void 0) {
    for (let i = 0, ii = input.length; i < ii; ++i) {
      output[i] = input[i];
    }
    output = output;
  } else {
    output = input.slice();
  }
  return output;
}
function identityTransform(input, output, dimension) {
  if (output !== void 0 && input !== output) {
    for (let i = 0, ii = input.length; i < ii; ++i) {
      output[i] = input[i];
    }
    input = output;
  }
  return input;
}
function addProjection(projection) {
  add$1(projection.getCode(), projection);
  add(projection, projection, cloneTransform);
}
function addProjections(projections) {
  projections.forEach(addProjection);
}
function get(projectionLike) {
  return typeof projectionLike === "string" ? get$2(projectionLike) : projectionLike || null;
}
function getPointResolution(projection, resolution, point, units) {
  projection = get(projection);
  let pointResolution;
  const getter = projection.getPointResolutionFunc();
  if (getter) {
    pointResolution = getter(resolution, point);
    if (units && units !== projection.getUnits()) {
      const metersPerUnit = projection.getMetersPerUnit();
      if (metersPerUnit) {
        pointResolution = pointResolution * metersPerUnit / METERS_PER_UNIT$1[units];
      }
    }
  } else {
    const projUnits = projection.getUnits();
    if (projUnits == "degrees" && !units || units == "degrees") {
      pointResolution = resolution;
    } else {
      const toEPSG43262 = getTransformFromProjections(
        projection,
        get("EPSG:4326")
      );
      if (toEPSG43262 === identityTransform && projUnits !== "degrees") {
        pointResolution = resolution * projection.getMetersPerUnit();
      } else {
        let vertices = [
          point[0] - resolution / 2,
          point[1],
          point[0] + resolution / 2,
          point[1],
          point[0],
          point[1] - resolution / 2,
          point[0],
          point[1] + resolution / 2
        ];
        vertices = toEPSG43262(vertices, vertices, 2);
        const width = getDistance(vertices.slice(0, 2), vertices.slice(2, 4));
        const height = getDistance(vertices.slice(4, 6), vertices.slice(6, 8));
        pointResolution = (width + height) / 2;
      }
      const metersPerUnit = units ? METERS_PER_UNIT$1[units] : projection.getMetersPerUnit();
      if (metersPerUnit !== void 0) {
        pointResolution /= metersPerUnit;
      }
    }
  }
  return pointResolution;
}
function addEquivalentProjections(projections) {
  addProjections(projections);
  projections.forEach(function(source) {
    projections.forEach(function(destination) {
      if (source !== destination) {
        add(source, destination, cloneTransform);
      }
    });
  });
}
function addEquivalentTransforms(projections1, projections2, forwardTransform, inverseTransform) {
  projections1.forEach(function(projection1) {
    projections2.forEach(function(projection2) {
      add(projection1, projection2, forwardTransform);
      add(projection2, projection1, inverseTransform);
    });
  });
}
function createProjection(projection, defaultCode) {
  if (!projection) {
    return get(defaultCode);
  } else if (typeof projection === "string") {
    return get(projection);
  } else {
    return projection;
  }
}
function equivalent(projection1, projection2) {
  if (projection1 === projection2) {
    return true;
  }
  const equalUnits = projection1.getUnits() === projection2.getUnits();
  if (projection1.getCode() === projection2.getCode()) {
    return equalUnits;
  } else {
    const transformFunc = getTransformFromProjections(projection1, projection2);
    return transformFunc === cloneTransform && equalUnits;
  }
}
function getTransformFromProjections(sourceProjection, destinationProjection) {
  const sourceCode = sourceProjection.getCode();
  const destinationCode = destinationProjection.getCode();
  let transformFunc = get$1(sourceCode, destinationCode);
  if (!transformFunc) {
    transformFunc = identityTransform;
  }
  return transformFunc;
}
function getTransform(source, destination) {
  const sourceProjection = get(source);
  const destinationProjection = get(destination);
  return getTransformFromProjections(sourceProjection, destinationProjection);
}
function transform(coordinate, source, destination) {
  const transformFunc = getTransform(source, destination);
  return transformFunc(coordinate, void 0, coordinate.length);
}
function toUserCoordinate(coordinate, sourceProjection) {
  {
    return coordinate;
  }
}
function fromUserCoordinate(coordinate, destProjection) {
  {
    if (showCoordinateWarning && !equals(coordinate, [0, 0]) && coordinate[0] >= -180 && coordinate[0] <= 180 && coordinate[1] >= -90 && coordinate[1] <= 90) {
      showCoordinateWarning = false;
      console.warn(
        "Call useGeographic() from ol/proj once to work with [longitude, latitude] coordinates."
      );
    }
    return coordinate;
  }
}
function toUserExtent(extent2, sourceProjection) {
  {
    return extent2;
  }
}
function fromUserExtent(extent2, destProjection) {
  {
    return extent2;
  }
}
function addCommon() {
  addEquivalentProjections(PROJECTIONS$1);
  addEquivalentProjections(PROJECTIONS);
  addEquivalentTransforms(
    PROJECTIONS,
    PROJECTIONS$1,
    fromEPSG4326,
    toEPSG4326
  );
}
addCommon();
function createExtent(extent2, onlyCenter, smooth) {
  return function(center, resolution, size, isMoving, centerShift) {
    if (!center) {
      return void 0;
    }
    if (!resolution && !onlyCenter) {
      return center;
    }
    const viewWidth = onlyCenter ? 0 : size[0] * resolution;
    const viewHeight = onlyCenter ? 0 : size[1] * resolution;
    const shiftX = centerShift ? centerShift[0] : 0;
    const shiftY = centerShift ? centerShift[1] : 0;
    let minX = extent2[0] + viewWidth / 2 + shiftX;
    let maxX = extent2[2] - viewWidth / 2 + shiftX;
    let minY = extent2[1] + viewHeight / 2 + shiftY;
    let maxY = extent2[3] - viewHeight / 2 + shiftY;
    if (minX > maxX) {
      minX = (maxX + minX) / 2;
      maxX = minX;
    }
    if (minY > maxY) {
      minY = (maxY + minY) / 2;
      maxY = minY;
    }
    let x = clamp(center[0], minX, maxX);
    let y = clamp(center[1], minY, maxY);
    if (isMoving && smooth && resolution) {
      const ratio = 30 * resolution;
      x += -ratio * Math.log(1 + Math.max(0, minX - center[0]) / ratio) + ratio * Math.log(1 + Math.max(0, center[0] - maxX) / ratio);
      y += -ratio * Math.log(1 + Math.max(0, minY - center[1]) / ratio) + ratio * Math.log(1 + Math.max(0, center[1] - maxY) / ratio);
    }
    return [x, y];
  };
}
function none$1(center) {
  return center;
}
function getViewportClampedResolution(resolution, maxExtent, viewportSize, showFullExtent) {
  const xResolution = getWidth(maxExtent) / viewportSize[0];
  const yResolution = getHeight(maxExtent) / viewportSize[1];
  if (showFullExtent) {
    return Math.min(resolution, Math.max(xResolution, yResolution));
  }
  return Math.min(resolution, Math.min(xResolution, yResolution));
}
function getSmoothClampedResolution(resolution, maxResolution, minResolution) {
  let result = Math.min(resolution, maxResolution);
  const ratio = 50;
  result *= Math.log(1 + ratio * Math.max(0, resolution / maxResolution - 1)) / ratio + 1;
  if (minResolution) {
    result = Math.max(result, minResolution);
    result /= Math.log(1 + ratio * Math.max(0, minResolution / resolution - 1)) / ratio + 1;
  }
  return clamp(result, minResolution / 2, maxResolution * 2);
}
function createSnapToResolutions(resolutions, smooth, maxExtent, showFullExtent) {
  smooth = smooth !== void 0 ? smooth : true;
  return function(resolution, direction, size, isMoving) {
    if (resolution !== void 0) {
      const maxResolution = resolutions[0];
      const minResolution = resolutions[resolutions.length - 1];
      const cappedMaxRes = maxExtent ? getViewportClampedResolution(
        maxResolution,
        maxExtent,
        size,
        showFullExtent
      ) : maxResolution;
      if (isMoving) {
        if (!smooth) {
          return clamp(resolution, minResolution, cappedMaxRes);
        }
        return getSmoothClampedResolution(
          resolution,
          cappedMaxRes,
          minResolution
        );
      }
      const capped = Math.min(cappedMaxRes, resolution);
      const z = Math.floor(linearFindNearest(resolutions, capped, direction));
      if (resolutions[z] > cappedMaxRes && z < resolutions.length - 1) {
        return resolutions[z + 1];
      }
      return resolutions[z];
    } else {
      return void 0;
    }
  };
}
function createSnapToPower(power, maxResolution, minResolution, smooth, maxExtent, showFullExtent) {
  smooth = smooth !== void 0 ? smooth : true;
  minResolution = minResolution !== void 0 ? minResolution : 0;
  return function(resolution, direction, size, isMoving) {
    if (resolution !== void 0) {
      const cappedMaxRes = maxExtent ? getViewportClampedResolution(
        maxResolution,
        maxExtent,
        size,
        showFullExtent
      ) : maxResolution;
      if (isMoving) {
        if (!smooth) {
          return clamp(resolution, minResolution, cappedMaxRes);
        }
        return getSmoothClampedResolution(
          resolution,
          cappedMaxRes,
          minResolution
        );
      }
      const tolerance = 1e-9;
      const minZoomLevel = Math.ceil(
        Math.log(maxResolution / cappedMaxRes) / Math.log(power) - tolerance
      );
      const offset = -direction * (0.5 - tolerance) + 0.5;
      const capped = Math.min(cappedMaxRes, resolution);
      const cappedZoomLevel = Math.floor(
        Math.log(maxResolution / capped) / Math.log(power) + offset
      );
      const zoomLevel = Math.max(minZoomLevel, cappedZoomLevel);
      const newResolution = maxResolution / Math.pow(power, zoomLevel);
      return clamp(newResolution, minResolution, cappedMaxRes);
    } else {
      return void 0;
    }
  };
}
function createMinMaxResolution(maxResolution, minResolution, smooth, maxExtent, showFullExtent) {
  smooth = smooth !== void 0 ? smooth : true;
  return function(resolution, direction, size, isMoving) {
    if (resolution !== void 0) {
      const cappedMaxRes = maxExtent ? getViewportClampedResolution(
        maxResolution,
        maxExtent,
        size,
        showFullExtent
      ) : maxResolution;
      if (!smooth || !isMoving) {
        return clamp(resolution, minResolution, cappedMaxRes);
      }
      return getSmoothClampedResolution(
        resolution,
        cappedMaxRes,
        minResolution
      );
    } else {
      return void 0;
    }
  };
}
function disable(rotation) {
  if (rotation !== void 0) {
    return 0;
  } else {
    return void 0;
  }
}
function none(rotation) {
  if (rotation !== void 0) {
    return rotation;
  } else {
    return void 0;
  }
}
function createSnapToN(n) {
  const theta = 2 * Math.PI / n;
  return function(rotation, isMoving) {
    if (isMoving) {
      return rotation;
    }
    if (rotation !== void 0) {
      rotation = Math.floor(rotation / theta + 0.5) * theta;
      return rotation;
    } else {
      return void 0;
    }
  };
}
function createSnapToZero(tolerance) {
  tolerance = tolerance || toRadians(5);
  return function(rotation, isMoving) {
    if (isMoving) {
      return rotation;
    }
    if (rotation !== void 0) {
      if (Math.abs(rotation) <= tolerance) {
        return 0;
      } else {
        return rotation;
      }
    } else {
      return void 0;
    }
  };
}
function easeIn(t) {
  return Math.pow(t, 3);
}
function easeOut(t) {
  return 1 - easeIn(1 - t);
}
function inAndOut(t) {
  return 3 * t * t - 2 * t * t * t;
}
function linear(t) {
  return t;
}
function transform2D(flatCoordinates, offset, end, stride, transform2, dest) {
  dest = dest ? dest : [];
  let i = 0;
  for (let j = offset; j < end; j += stride) {
    const x = flatCoordinates[j];
    const y = flatCoordinates[j + 1];
    dest[i++] = transform2[0] * x + transform2[2] * y + transform2[4];
    dest[i++] = transform2[1] * x + transform2[3] * y + transform2[5];
  }
  if (dest && dest.length != i) {
    dest.length = i;
  }
  return dest;
}
function rotate(flatCoordinates, offset, end, stride, angle, anchor, dest) {
  dest = dest ? dest : [];
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const anchorX = anchor[0];
  const anchorY = anchor[1];
  let i = 0;
  for (let j = offset; j < end; j += stride) {
    const deltaX = flatCoordinates[j] - anchorX;
    const deltaY = flatCoordinates[j + 1] - anchorY;
    dest[i++] = anchorX + deltaX * cos - deltaY * sin;
    dest[i++] = anchorY + deltaX * sin + deltaY * cos;
    for (let k = j + 2; k < j + stride; ++k) {
      dest[i++] = flatCoordinates[k];
    }
  }
  if (dest && dest.length != i) {
    dest.length = i;
  }
  return dest;
}
function scale$1(flatCoordinates, offset, end, stride, sx, sy, anchor, dest) {
  dest = dest ? dest : [];
  const anchorX = anchor[0];
  const anchorY = anchor[1];
  let i = 0;
  for (let j = offset; j < end; j += stride) {
    const deltaX = flatCoordinates[j] - anchorX;
    const deltaY = flatCoordinates[j + 1] - anchorY;
    dest[i++] = anchorX + sx * deltaX;
    dest[i++] = anchorY + sy * deltaY;
    for (let k = j + 2; k < j + stride; ++k) {
      dest[i++] = flatCoordinates[k];
    }
  }
  if (dest && dest.length != i) {
    dest.length = i;
  }
  return dest;
}
function translate(flatCoordinates, offset, end, stride, deltaX, deltaY, dest) {
  dest = dest ? dest : [];
  let i = 0;
  for (let j = offset; j < end; j += stride) {
    dest[i++] = flatCoordinates[j] + deltaX;
    dest[i++] = flatCoordinates[j + 1] + deltaY;
    for (let k = j + 2; k < j + stride; ++k) {
      dest[i++] = flatCoordinates[k];
    }
  }
  if (dest && dest.length != i) {
    dest.length = i;
  }
  return dest;
}
const tmpTransform = create$1();
class Geometry extends BaseObject$1 {
  constructor() {
    super();
    this.extent_ = createEmpty();
    this.extentRevision_ = -1;
    this.simplifiedGeometryMaxMinSquaredTolerance = 0;
    this.simplifiedGeometryRevision = 0;
    this.simplifyTransformedInternal = memoizeOne(function(revision, squaredTolerance, transform2) {
      if (!transform2) {
        return this.getSimplifiedGeometry(squaredTolerance);
      }
      const clone2 = this.clone();
      clone2.applyTransform(transform2);
      return clone2.getSimplifiedGeometry(squaredTolerance);
    });
  }
  simplifyTransformed(squaredTolerance, transform2) {
    return this.simplifyTransformedInternal(
      this.getRevision(),
      squaredTolerance,
      transform2
    );
  }
  clone() {
    return abstract();
  }
  closestPointXY(x, y, closestPoint, minSquaredDistance) {
    return abstract();
  }
  containsXY(x, y) {
    const coord = this.getClosestPoint([x, y]);
    return coord[0] === x && coord[1] === y;
  }
  getClosestPoint(point, closestPoint) {
    closestPoint = closestPoint ? closestPoint : [NaN, NaN];
    this.closestPointXY(point[0], point[1], closestPoint, Infinity);
    return closestPoint;
  }
  intersectsCoordinate(coordinate) {
    return this.containsXY(coordinate[0], coordinate[1]);
  }
  computeExtent(extent2) {
    return abstract();
  }
  getExtent(extent2) {
    if (this.extentRevision_ != this.getRevision()) {
      const extent3 = this.computeExtent(this.extent_);
      if (isNaN(extent3[0]) || isNaN(extent3[1])) {
        createOrUpdateEmpty(extent3);
      }
      this.extentRevision_ = this.getRevision();
    }
    return returnOrUpdate(this.extent_, extent2);
  }
  rotate(angle, anchor) {
    abstract();
  }
  scale(sx, sy, anchor) {
    abstract();
  }
  simplify(tolerance) {
    return this.getSimplifiedGeometry(tolerance * tolerance);
  }
  getSimplifiedGeometry(squaredTolerance) {
    return abstract();
  }
  getType() {
    return abstract();
  }
  applyTransform(transformFn) {
    abstract();
  }
  intersectsExtent(extent2) {
    return abstract();
  }
  translate(deltaX, deltaY) {
    abstract();
  }
  transform(source, destination) {
    const sourceProj = get(source);
    const transformFn = sourceProj.getUnits() == "tile-pixels" ? function(inCoordinates, outCoordinates, stride) {
      const pixelExtent = sourceProj.getExtent();
      const projectedExtent = sourceProj.getWorldExtent();
      const scale2 = getHeight(projectedExtent) / getHeight(pixelExtent);
      compose(
        tmpTransform,
        projectedExtent[0],
        projectedExtent[3],
        scale2,
        -scale2,
        0,
        0,
        0
      );
      transform2D(
        inCoordinates,
        0,
        inCoordinates.length,
        stride,
        tmpTransform,
        outCoordinates
      );
      return getTransform(sourceProj, destination)(
        inCoordinates,
        outCoordinates,
        stride
      );
    } : getTransform(sourceProj, destination);
    this.applyTransform(transformFn);
    return this;
  }
}
const Geometry$1 = Geometry;
class SimpleGeometry extends Geometry$1 {
  constructor() {
    super();
    this.layout = "XY";
    this.stride = 2;
    this.flatCoordinates = null;
  }
  computeExtent(extent2) {
    return createOrUpdateFromFlatCoordinates(
      this.flatCoordinates,
      0,
      this.flatCoordinates.length,
      this.stride,
      extent2
    );
  }
  getCoordinates() {
    return abstract();
  }
  getFirstCoordinate() {
    return this.flatCoordinates.slice(0, this.stride);
  }
  getFlatCoordinates() {
    return this.flatCoordinates;
  }
  getLastCoordinate() {
    return this.flatCoordinates.slice(
      this.flatCoordinates.length - this.stride
    );
  }
  getLayout() {
    return this.layout;
  }
  getSimplifiedGeometry(squaredTolerance) {
    if (this.simplifiedGeometryRevision !== this.getRevision()) {
      this.simplifiedGeometryMaxMinSquaredTolerance = 0;
      this.simplifiedGeometryRevision = this.getRevision();
    }
    if (squaredTolerance < 0 || this.simplifiedGeometryMaxMinSquaredTolerance !== 0 && squaredTolerance <= this.simplifiedGeometryMaxMinSquaredTolerance) {
      return this;
    }
    const simplifiedGeometry = this.getSimplifiedGeometryInternal(squaredTolerance);
    const simplifiedFlatCoordinates = simplifiedGeometry.getFlatCoordinates();
    if (simplifiedFlatCoordinates.length < this.flatCoordinates.length) {
      return simplifiedGeometry;
    } else {
      this.simplifiedGeometryMaxMinSquaredTolerance = squaredTolerance;
      return this;
    }
  }
  getSimplifiedGeometryInternal(squaredTolerance) {
    return this;
  }
  getStride() {
    return this.stride;
  }
  setFlatCoordinates(layout, flatCoordinates) {
    this.stride = getStrideForLayout(layout);
    this.layout = layout;
    this.flatCoordinates = flatCoordinates;
  }
  setCoordinates(coordinates2, layout) {
    abstract();
  }
  setLayout(layout, coordinates2, nesting) {
    let stride;
    if (layout) {
      stride = getStrideForLayout(layout);
    } else {
      for (let i = 0; i < nesting; ++i) {
        if (coordinates2.length === 0) {
          this.layout = "XY";
          this.stride = 2;
          return;
        } else {
          coordinates2 = coordinates2[0];
        }
      }
      stride = coordinates2.length;
      layout = getLayoutForStride(stride);
    }
    this.layout = layout;
    this.stride = stride;
  }
  applyTransform(transformFn) {
    if (this.flatCoordinates) {
      transformFn(this.flatCoordinates, this.flatCoordinates, this.stride);
      this.changed();
    }
  }
  rotate(angle, anchor) {
    const flatCoordinates = this.getFlatCoordinates();
    if (flatCoordinates) {
      const stride = this.getStride();
      rotate(
        flatCoordinates,
        0,
        flatCoordinates.length,
        stride,
        angle,
        anchor,
        flatCoordinates
      );
      this.changed();
    }
  }
  scale(sx, sy, anchor) {
    if (sy === void 0) {
      sy = sx;
    }
    if (!anchor) {
      anchor = getCenter(this.getExtent());
    }
    const flatCoordinates = this.getFlatCoordinates();
    if (flatCoordinates) {
      const stride = this.getStride();
      scale$1(
        flatCoordinates,
        0,
        flatCoordinates.length,
        stride,
        sx,
        sy,
        anchor,
        flatCoordinates
      );
      this.changed();
    }
  }
  translate(deltaX, deltaY) {
    const flatCoordinates = this.getFlatCoordinates();
    if (flatCoordinates) {
      const stride = this.getStride();
      translate(
        flatCoordinates,
        0,
        flatCoordinates.length,
        stride,
        deltaX,
        deltaY,
        flatCoordinates
      );
      this.changed();
    }
  }
}
function getLayoutForStride(stride) {
  let layout;
  if (stride == 2) {
    layout = "XY";
  } else if (stride == 3) {
    layout = "XYZ";
  } else if (stride == 4) {
    layout = "XYZM";
  }
  return layout;
}
function getStrideForLayout(layout) {
  let stride;
  if (layout == "XY") {
    stride = 2;
  } else if (layout == "XYZ" || layout == "XYM") {
    stride = 3;
  } else if (layout == "XYZM") {
    stride = 4;
  }
  return stride;
}
const SimpleGeometry$1 = SimpleGeometry;
function assignClosest(flatCoordinates, offset1, offset2, stride, x, y, closestPoint) {
  const x1 = flatCoordinates[offset1];
  const y1 = flatCoordinates[offset1 + 1];
  const dx = flatCoordinates[offset2] - x1;
  const dy = flatCoordinates[offset2 + 1] - y1;
  let offset;
  if (dx === 0 && dy === 0) {
    offset = offset1;
  } else {
    const t = ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy);
    if (t > 1) {
      offset = offset2;
    } else if (t > 0) {
      for (let i = 0; i < stride; ++i) {
        closestPoint[i] = lerp(
          flatCoordinates[offset1 + i],
          flatCoordinates[offset2 + i],
          t
        );
      }
      closestPoint.length = stride;
      return;
    } else {
      offset = offset1;
    }
  }
  for (let i = 0; i < stride; ++i) {
    closestPoint[i] = flatCoordinates[offset + i];
  }
  closestPoint.length = stride;
}
function maxSquaredDelta(flatCoordinates, offset, end, stride, max) {
  let x1 = flatCoordinates[offset];
  let y1 = flatCoordinates[offset + 1];
  for (offset += stride; offset < end; offset += stride) {
    const x2 = flatCoordinates[offset];
    const y2 = flatCoordinates[offset + 1];
    const squaredDelta = squaredDistance(x1, y1, x2, y2);
    if (squaredDelta > max) {
      max = squaredDelta;
    }
    x1 = x2;
    y1 = y2;
  }
  return max;
}
function arrayMaxSquaredDelta(flatCoordinates, offset, ends, stride, max) {
  for (let i = 0, ii = ends.length; i < ii; ++i) {
    const end = ends[i];
    max = maxSquaredDelta(flatCoordinates, offset, end, stride, max);
    offset = end;
  }
  return max;
}
function assignClosestPoint(flatCoordinates, offset, end, stride, maxDelta, isRing, x, y, closestPoint, minSquaredDistance, tmpPoint) {
  if (offset == end) {
    return minSquaredDistance;
  }
  let i, squaredDistance$1;
  if (maxDelta === 0) {
    squaredDistance$1 = squaredDistance(
      x,
      y,
      flatCoordinates[offset],
      flatCoordinates[offset + 1]
    );
    if (squaredDistance$1 < minSquaredDistance) {
      for (i = 0; i < stride; ++i) {
        closestPoint[i] = flatCoordinates[offset + i];
      }
      closestPoint.length = stride;
      return squaredDistance$1;
    } else {
      return minSquaredDistance;
    }
  }
  tmpPoint = tmpPoint ? tmpPoint : [NaN, NaN];
  let index = offset + stride;
  while (index < end) {
    assignClosest(
      flatCoordinates,
      index - stride,
      index,
      stride,
      x,
      y,
      tmpPoint
    );
    squaredDistance$1 = squaredDistance(x, y, tmpPoint[0], tmpPoint[1]);
    if (squaredDistance$1 < minSquaredDistance) {
      minSquaredDistance = squaredDistance$1;
      for (i = 0; i < stride; ++i) {
        closestPoint[i] = tmpPoint[i];
      }
      closestPoint.length = stride;
      index += stride;
    } else {
      index += stride * Math.max(
        (Math.sqrt(squaredDistance$1) - Math.sqrt(minSquaredDistance)) / maxDelta | 0,
        1
      );
    }
  }
  if (isRing) {
    assignClosest(
      flatCoordinates,
      end - stride,
      offset,
      stride,
      x,
      y,
      tmpPoint
    );
    squaredDistance$1 = squaredDistance(x, y, tmpPoint[0], tmpPoint[1]);
    if (squaredDistance$1 < minSquaredDistance) {
      minSquaredDistance = squaredDistance$1;
      for (i = 0; i < stride; ++i) {
        closestPoint[i] = tmpPoint[i];
      }
      closestPoint.length = stride;
    }
  }
  return minSquaredDistance;
}
function assignClosestArrayPoint(flatCoordinates, offset, ends, stride, maxDelta, isRing, x, y, closestPoint, minSquaredDistance, tmpPoint) {
  tmpPoint = tmpPoint ? tmpPoint : [NaN, NaN];
  for (let i = 0, ii = ends.length; i < ii; ++i) {
    const end = ends[i];
    minSquaredDistance = assignClosestPoint(
      flatCoordinates,
      offset,
      end,
      stride,
      maxDelta,
      isRing,
      x,
      y,
      closestPoint,
      minSquaredDistance,
      tmpPoint
    );
    offset = end;
  }
  return minSquaredDistance;
}
function deflateCoordinate(flatCoordinates, offset, coordinate, stride) {
  for (let i = 0, ii = coordinate.length; i < ii; ++i) {
    flatCoordinates[offset++] = coordinate[i];
  }
  return offset;
}
function deflateCoordinates(flatCoordinates, offset, coordinates2, stride) {
  for (let i = 0, ii = coordinates2.length; i < ii; ++i) {
    const coordinate = coordinates2[i];
    for (let j = 0; j < stride; ++j) {
      flatCoordinates[offset++] = coordinate[j];
    }
  }
  return offset;
}
function deflateCoordinatesArray(flatCoordinates, offset, coordinatess, stride, ends) {
  ends = ends ? ends : [];
  let i = 0;
  for (let j = 0, jj = coordinatess.length; j < jj; ++j) {
    const end = deflateCoordinates(
      flatCoordinates,
      offset,
      coordinatess[j],
      stride
    );
    ends[i++] = end;
    offset = end;
  }
  ends.length = i;
  return ends;
}
function douglasPeucker(flatCoordinates, offset, end, stride, squaredTolerance, simplifiedFlatCoordinates, simplifiedOffset) {
  const n = (end - offset) / stride;
  if (n < 3) {
    for (; offset < end; offset += stride) {
      simplifiedFlatCoordinates[simplifiedOffset++] = flatCoordinates[offset];
      simplifiedFlatCoordinates[simplifiedOffset++] = flatCoordinates[offset + 1];
    }
    return simplifiedOffset;
  }
  const markers = new Array(n);
  markers[0] = 1;
  markers[n - 1] = 1;
  const stack = [offset, end - stride];
  let index = 0;
  while (stack.length > 0) {
    const last = stack.pop();
    const first = stack.pop();
    let maxSquaredDistance = 0;
    const x1 = flatCoordinates[first];
    const y1 = flatCoordinates[first + 1];
    const x2 = flatCoordinates[last];
    const y2 = flatCoordinates[last + 1];
    for (let i = first + stride; i < last; i += stride) {
      const x = flatCoordinates[i];
      const y = flatCoordinates[i + 1];
      const squaredDistance2 = squaredSegmentDistance(x, y, x1, y1, x2, y2);
      if (squaredDistance2 > maxSquaredDistance) {
        index = i;
        maxSquaredDistance = squaredDistance2;
      }
    }
    if (maxSquaredDistance > squaredTolerance) {
      markers[(index - offset) / stride] = 1;
      if (first + stride < index) {
        stack.push(first, index);
      }
      if (index + stride < last) {
        stack.push(index, last);
      }
    }
  }
  for (let i = 0; i < n; ++i) {
    if (markers[i]) {
      simplifiedFlatCoordinates[simplifiedOffset++] = flatCoordinates[offset + i * stride];
      simplifiedFlatCoordinates[simplifiedOffset++] = flatCoordinates[offset + i * stride + 1];
    }
  }
  return simplifiedOffset;
}
function snap(value, tolerance) {
  return tolerance * Math.round(value / tolerance);
}
function quantize(flatCoordinates, offset, end, stride, tolerance, simplifiedFlatCoordinates, simplifiedOffset) {
  if (offset == end) {
    return simplifiedOffset;
  }
  let x1 = snap(flatCoordinates[offset], tolerance);
  let y1 = snap(flatCoordinates[offset + 1], tolerance);
  offset += stride;
  simplifiedFlatCoordinates[simplifiedOffset++] = x1;
  simplifiedFlatCoordinates[simplifiedOffset++] = y1;
  let x2, y2;
  do {
    x2 = snap(flatCoordinates[offset], tolerance);
    y2 = snap(flatCoordinates[offset + 1], tolerance);
    offset += stride;
    if (offset == end) {
      simplifiedFlatCoordinates[simplifiedOffset++] = x2;
      simplifiedFlatCoordinates[simplifiedOffset++] = y2;
      return simplifiedOffset;
    }
  } while (x2 == x1 && y2 == y1);
  while (offset < end) {
    const x3 = snap(flatCoordinates[offset], tolerance);
    const y3 = snap(flatCoordinates[offset + 1], tolerance);
    offset += stride;
    if (x3 == x2 && y3 == y2) {
      continue;
    }
    const dx1 = x2 - x1;
    const dy1 = y2 - y1;
    const dx2 = x3 - x1;
    const dy2 = y3 - y1;
    if (dx1 * dy2 == dy1 * dx2 && (dx1 < 0 && dx2 < dx1 || dx1 == dx2 || dx1 > 0 && dx2 > dx1) && (dy1 < 0 && dy2 < dy1 || dy1 == dy2 || dy1 > 0 && dy2 > dy1)) {
      x2 = x3;
      y2 = y3;
      continue;
    }
    simplifiedFlatCoordinates[simplifiedOffset++] = x2;
    simplifiedFlatCoordinates[simplifiedOffset++] = y2;
    x1 = x2;
    y1 = y2;
    x2 = x3;
    y2 = y3;
  }
  simplifiedFlatCoordinates[simplifiedOffset++] = x2;
  simplifiedFlatCoordinates[simplifiedOffset++] = y2;
  return simplifiedOffset;
}
function quantizeArray(flatCoordinates, offset, ends, stride, tolerance, simplifiedFlatCoordinates, simplifiedOffset, simplifiedEnds) {
  for (let i = 0, ii = ends.length; i < ii; ++i) {
    const end = ends[i];
    simplifiedOffset = quantize(
      flatCoordinates,
      offset,
      end,
      stride,
      tolerance,
      simplifiedFlatCoordinates,
      simplifiedOffset
    );
    simplifiedEnds.push(simplifiedOffset);
    offset = end;
  }
  return simplifiedOffset;
}
function inflateCoordinates(flatCoordinates, offset, end, stride, coordinates2) {
  coordinates2 = coordinates2 !== void 0 ? coordinates2 : [];
  let i = 0;
  for (let j = offset; j < end; j += stride) {
    coordinates2[i++] = flatCoordinates.slice(j, j + stride);
  }
  coordinates2.length = i;
  return coordinates2;
}
function inflateCoordinatesArray(flatCoordinates, offset, ends, stride, coordinatess) {
  coordinatess = coordinatess !== void 0 ? coordinatess : [];
  let i = 0;
  for (let j = 0, jj = ends.length; j < jj; ++j) {
    const end = ends[j];
    coordinatess[i++] = inflateCoordinates(
      flatCoordinates,
      offset,
      end,
      stride,
      coordinatess[i]
    );
    offset = end;
  }
  coordinatess.length = i;
  return coordinatess;
}
function linearRing(flatCoordinates, offset, end, stride) {
  let twiceArea = 0;
  let x1 = flatCoordinates[end - stride];
  let y1 = flatCoordinates[end - stride + 1];
  for (; offset < end; offset += stride) {
    const x2 = flatCoordinates[offset];
    const y2 = flatCoordinates[offset + 1];
    twiceArea += y1 * x2 - x1 * y2;
    x1 = x2;
    y1 = y2;
  }
  return twiceArea / 2;
}
function linearRings(flatCoordinates, offset, ends, stride) {
  let area = 0;
  for (let i = 0, ii = ends.length; i < ii; ++i) {
    const end = ends[i];
    area += linearRing(flatCoordinates, offset, end, stride);
    offset = end;
  }
  return area;
}
class LinearRing extends SimpleGeometry$1 {
  constructor(coordinates2, layout) {
    super();
    this.maxDelta_ = -1;
    this.maxDeltaRevision_ = -1;
    if (layout !== void 0 && !Array.isArray(coordinates2[0])) {
      this.setFlatCoordinates(
        layout,
        coordinates2
      );
    } else {
      this.setCoordinates(
        coordinates2,
        layout
      );
    }
  }
  clone() {
    return new LinearRing(this.flatCoordinates.slice(), this.layout);
  }
  closestPointXY(x, y, closestPoint, minSquaredDistance) {
    if (minSquaredDistance < closestSquaredDistanceXY(this.getExtent(), x, y)) {
      return minSquaredDistance;
    }
    if (this.maxDeltaRevision_ != this.getRevision()) {
      this.maxDelta_ = Math.sqrt(
        maxSquaredDelta(
          this.flatCoordinates,
          0,
          this.flatCoordinates.length,
          this.stride,
          0
        )
      );
      this.maxDeltaRevision_ = this.getRevision();
    }
    return assignClosestPoint(
      this.flatCoordinates,
      0,
      this.flatCoordinates.length,
      this.stride,
      this.maxDelta_,
      true,
      x,
      y,
      closestPoint,
      minSquaredDistance
    );
  }
  getArea() {
    return linearRing(
      this.flatCoordinates,
      0,
      this.flatCoordinates.length,
      this.stride
    );
  }
  getCoordinates() {
    return inflateCoordinates(
      this.flatCoordinates,
      0,
      this.flatCoordinates.length,
      this.stride
    );
  }
  getSimplifiedGeometryInternal(squaredTolerance) {
    const simplifiedFlatCoordinates = [];
    simplifiedFlatCoordinates.length = douglasPeucker(
      this.flatCoordinates,
      0,
      this.flatCoordinates.length,
      this.stride,
      squaredTolerance,
      simplifiedFlatCoordinates,
      0
    );
    return new LinearRing(simplifiedFlatCoordinates, "XY");
  }
  getType() {
    return "LinearRing";
  }
  intersectsExtent(extent2) {
    return false;
  }
  setCoordinates(coordinates2, layout) {
    this.setLayout(layout, coordinates2, 1);
    if (!this.flatCoordinates) {
      this.flatCoordinates = [];
    }
    this.flatCoordinates.length = deflateCoordinates(
      this.flatCoordinates,
      0,
      coordinates2,
      this.stride
    );
    this.changed();
  }
}
const LinearRing$1 = LinearRing;
class Point extends SimpleGeometry$1 {
  constructor(coordinates2, layout) {
    super();
    this.setCoordinates(coordinates2, layout);
  }
  clone() {
    const point = new Point(this.flatCoordinates.slice(), this.layout);
    point.applyProperties(this);
    return point;
  }
  closestPointXY(x, y, closestPoint, minSquaredDistance) {
    const flatCoordinates = this.flatCoordinates;
    const squaredDistance$1 = squaredDistance(
      x,
      y,
      flatCoordinates[0],
      flatCoordinates[1]
    );
    if (squaredDistance$1 < minSquaredDistance) {
      const stride = this.stride;
      for (let i = 0; i < stride; ++i) {
        closestPoint[i] = flatCoordinates[i];
      }
      closestPoint.length = stride;
      return squaredDistance$1;
    } else {
      return minSquaredDistance;
    }
  }
  getCoordinates() {
    return !this.flatCoordinates ? [] : this.flatCoordinates.slice();
  }
  computeExtent(extent2) {
    return createOrUpdateFromCoordinate(this.flatCoordinates, extent2);
  }
  getType() {
    return "Point";
  }
  intersectsExtent(extent2) {
    return containsXY(extent2, this.flatCoordinates[0], this.flatCoordinates[1]);
  }
  setCoordinates(coordinates2, layout) {
    this.setLayout(layout, coordinates2, 0);
    if (!this.flatCoordinates) {
      this.flatCoordinates = [];
    }
    this.flatCoordinates.length = deflateCoordinate(
      this.flatCoordinates,
      0,
      coordinates2,
      this.stride
    );
    this.changed();
  }
}
const Point$1 = Point;
function linearRingContainsExtent(flatCoordinates, offset, end, stride, extent2) {
  const outside = forEachCorner(
    extent2,
    function(coordinate) {
      return !linearRingContainsXY(
        flatCoordinates,
        offset,
        end,
        stride,
        coordinate[0],
        coordinate[1]
      );
    }
  );
  return !outside;
}
function linearRingContainsXY(flatCoordinates, offset, end, stride, x, y) {
  let wn = 0;
  let x1 = flatCoordinates[end - stride];
  let y1 = flatCoordinates[end - stride + 1];
  for (; offset < end; offset += stride) {
    const x2 = flatCoordinates[offset];
    const y2 = flatCoordinates[offset + 1];
    if (y1 <= y) {
      if (y2 > y && (x2 - x1) * (y - y1) - (x - x1) * (y2 - y1) > 0) {
        wn++;
      }
    } else if (y2 <= y && (x2 - x1) * (y - y1) - (x - x1) * (y2 - y1) < 0) {
      wn--;
    }
    x1 = x2;
    y1 = y2;
  }
  return wn !== 0;
}
function linearRingsContainsXY(flatCoordinates, offset, ends, stride, x, y) {
  if (ends.length === 0) {
    return false;
  }
  if (!linearRingContainsXY(flatCoordinates, offset, ends[0], stride, x, y)) {
    return false;
  }
  for (let i = 1, ii = ends.length; i < ii; ++i) {
    if (linearRingContainsXY(flatCoordinates, ends[i - 1], ends[i], stride, x, y)) {
      return false;
    }
  }
  return true;
}
function getInteriorPointOfArray(flatCoordinates, offset, ends, stride, flatCenters, flatCentersOffset, dest) {
  let i, ii, x, x1, x2, y1, y2;
  const y = flatCenters[flatCentersOffset + 1];
  const intersections = [];
  for (let r = 0, rr = ends.length; r < rr; ++r) {
    const end = ends[r];
    x1 = flatCoordinates[end - stride];
    y1 = flatCoordinates[end - stride + 1];
    for (i = offset; i < end; i += stride) {
      x2 = flatCoordinates[i];
      y2 = flatCoordinates[i + 1];
      if (y <= y1 && y2 <= y || y1 <= y && y <= y2) {
        x = (y - y1) / (y2 - y1) * (x2 - x1) + x1;
        intersections.push(x);
      }
      x1 = x2;
      y1 = y2;
    }
  }
  let pointX = NaN;
  let maxSegmentLength = -Infinity;
  intersections.sort(numberSafeCompareFunction);
  x1 = intersections[0];
  for (i = 1, ii = intersections.length; i < ii; ++i) {
    x2 = intersections[i];
    const segmentLength = Math.abs(x2 - x1);
    if (segmentLength > maxSegmentLength) {
      x = (x1 + x2) / 2;
      if (linearRingsContainsXY(flatCoordinates, offset, ends, stride, x, y)) {
        pointX = x;
        maxSegmentLength = segmentLength;
      }
    }
    x1 = x2;
  }
  if (isNaN(pointX)) {
    pointX = flatCenters[flatCentersOffset];
  }
  if (dest) {
    dest.push(pointX, y, maxSegmentLength);
    return dest;
  } else {
    return [pointX, y, maxSegmentLength];
  }
}
function forEach(flatCoordinates, offset, end, stride, callback) {
  let ret;
  offset += stride;
  for (; offset < end; offset += stride) {
    ret = callback(
      flatCoordinates.slice(offset - stride, offset),
      flatCoordinates.slice(offset, offset + stride)
    );
    if (ret) {
      return ret;
    }
  }
  return false;
}
function intersectsLineString(flatCoordinates, offset, end, stride, extent2) {
  const coordinatesExtent = extendFlatCoordinates(
    createEmpty(),
    flatCoordinates,
    offset,
    end,
    stride
  );
  if (!intersects(extent2, coordinatesExtent)) {
    return false;
  }
  if (containsExtent(extent2, coordinatesExtent)) {
    return true;
  }
  if (coordinatesExtent[0] >= extent2[0] && coordinatesExtent[2] <= extent2[2]) {
    return true;
  }
  if (coordinatesExtent[1] >= extent2[1] && coordinatesExtent[3] <= extent2[3]) {
    return true;
  }
  return forEach(
    flatCoordinates,
    offset,
    end,
    stride,
    function(point1, point2) {
      return intersectsSegment(extent2, point1, point2);
    }
  );
}
function intersectsLinearRing(flatCoordinates, offset, end, stride, extent2) {
  if (intersectsLineString(flatCoordinates, offset, end, stride, extent2)) {
    return true;
  }
  if (linearRingContainsXY(
    flatCoordinates,
    offset,
    end,
    stride,
    extent2[0],
    extent2[1]
  )) {
    return true;
  }
  if (linearRingContainsXY(
    flatCoordinates,
    offset,
    end,
    stride,
    extent2[0],
    extent2[3]
  )) {
    return true;
  }
  if (linearRingContainsXY(
    flatCoordinates,
    offset,
    end,
    stride,
    extent2[2],
    extent2[1]
  )) {
    return true;
  }
  if (linearRingContainsXY(
    flatCoordinates,
    offset,
    end,
    stride,
    extent2[2],
    extent2[3]
  )) {
    return true;
  }
  return false;
}
function intersectsLinearRingArray(flatCoordinates, offset, ends, stride, extent2) {
  if (!intersectsLinearRing(flatCoordinates, offset, ends[0], stride, extent2)) {
    return false;
  }
  if (ends.length === 1) {
    return true;
  }
  for (let i = 1, ii = ends.length; i < ii; ++i) {
    if (linearRingContainsExtent(
      flatCoordinates,
      ends[i - 1],
      ends[i],
      stride,
      extent2
    )) {
      if (!intersectsLineString(
        flatCoordinates,
        ends[i - 1],
        ends[i],
        stride,
        extent2
      )) {
        return false;
      }
    }
  }
  return true;
}
function coordinates(flatCoordinates, offset, end, stride) {
  while (offset < end - stride) {
    for (let i = 0; i < stride; ++i) {
      const tmp = flatCoordinates[offset + i];
      flatCoordinates[offset + i] = flatCoordinates[end - stride + i];
      flatCoordinates[end - stride + i] = tmp;
    }
    offset += stride;
    end -= stride;
  }
}
function linearRingIsClockwise(flatCoordinates, offset, end, stride) {
  let edge = 0;
  let x1 = flatCoordinates[end - stride];
  let y1 = flatCoordinates[end - stride + 1];
  for (; offset < end; offset += stride) {
    const x2 = flatCoordinates[offset];
    const y2 = flatCoordinates[offset + 1];
    edge += (x2 - x1) * (y2 + y1);
    x1 = x2;
    y1 = y2;
  }
  return edge === 0 ? void 0 : edge > 0;
}
function linearRingsAreOriented(flatCoordinates, offset, ends, stride, right) {
  right = right !== void 0 ? right : false;
  for (let i = 0, ii = ends.length; i < ii; ++i) {
    const end = ends[i];
    const isClockwise = linearRingIsClockwise(
      flatCoordinates,
      offset,
      end,
      stride
    );
    if (i === 0) {
      if (right && isClockwise || !right && !isClockwise) {
        return false;
      }
    } else {
      if (right && !isClockwise || !right && isClockwise) {
        return false;
      }
    }
    offset = end;
  }
  return true;
}
function orientLinearRings(flatCoordinates, offset, ends, stride, right) {
  right = right !== void 0 ? right : false;
  for (let i = 0, ii = ends.length; i < ii; ++i) {
    const end = ends[i];
    const isClockwise = linearRingIsClockwise(
      flatCoordinates,
      offset,
      end,
      stride
    );
    const reverse = i === 0 ? right && isClockwise || !right && !isClockwise : right && !isClockwise || !right && isClockwise;
    if (reverse) {
      coordinates(flatCoordinates, offset, end, stride);
    }
    offset = end;
  }
  return offset;
}
class Polygon extends SimpleGeometry$1 {
  constructor(coordinates2, layout, ends) {
    super();
    this.ends_ = [];
    this.flatInteriorPointRevision_ = -1;
    this.flatInteriorPoint_ = null;
    this.maxDelta_ = -1;
    this.maxDeltaRevision_ = -1;
    this.orientedRevision_ = -1;
    this.orientedFlatCoordinates_ = null;
    if (layout !== void 0 && ends) {
      this.setFlatCoordinates(
        layout,
        coordinates2
      );
      this.ends_ = ends;
    } else {
      this.setCoordinates(
        coordinates2,
        layout
      );
    }
  }
  appendLinearRing(linearRing2) {
    if (!this.flatCoordinates) {
      this.flatCoordinates = linearRing2.getFlatCoordinates().slice();
    } else {
      extend$1(this.flatCoordinates, linearRing2.getFlatCoordinates());
    }
    this.ends_.push(this.flatCoordinates.length);
    this.changed();
  }
  clone() {
    const polygon = new Polygon(
      this.flatCoordinates.slice(),
      this.layout,
      this.ends_.slice()
    );
    polygon.applyProperties(this);
    return polygon;
  }
  closestPointXY(x, y, closestPoint, minSquaredDistance) {
    if (minSquaredDistance < closestSquaredDistanceXY(this.getExtent(), x, y)) {
      return minSquaredDistance;
    }
    if (this.maxDeltaRevision_ != this.getRevision()) {
      this.maxDelta_ = Math.sqrt(
        arrayMaxSquaredDelta(
          this.flatCoordinates,
          0,
          this.ends_,
          this.stride,
          0
        )
      );
      this.maxDeltaRevision_ = this.getRevision();
    }
    return assignClosestArrayPoint(
      this.flatCoordinates,
      0,
      this.ends_,
      this.stride,
      this.maxDelta_,
      true,
      x,
      y,
      closestPoint,
      minSquaredDistance
    );
  }
  containsXY(x, y) {
    return linearRingsContainsXY(
      this.getOrientedFlatCoordinates(),
      0,
      this.ends_,
      this.stride,
      x,
      y
    );
  }
  getArea() {
    return linearRings(
      this.getOrientedFlatCoordinates(),
      0,
      this.ends_,
      this.stride
    );
  }
  getCoordinates(right) {
    let flatCoordinates;
    if (right !== void 0) {
      flatCoordinates = this.getOrientedFlatCoordinates().slice();
      orientLinearRings(flatCoordinates, 0, this.ends_, this.stride, right);
    } else {
      flatCoordinates = this.flatCoordinates;
    }
    return inflateCoordinatesArray(flatCoordinates, 0, this.ends_, this.stride);
  }
  getEnds() {
    return this.ends_;
  }
  getFlatInteriorPoint() {
    if (this.flatInteriorPointRevision_ != this.getRevision()) {
      const flatCenter = getCenter(this.getExtent());
      this.flatInteriorPoint_ = getInteriorPointOfArray(
        this.getOrientedFlatCoordinates(),
        0,
        this.ends_,
        this.stride,
        flatCenter,
        0
      );
      this.flatInteriorPointRevision_ = this.getRevision();
    }
    return this.flatInteriorPoint_;
  }
  getInteriorPoint() {
    return new Point$1(this.getFlatInteriorPoint(), "XYM");
  }
  getLinearRingCount() {
    return this.ends_.length;
  }
  getLinearRing(index) {
    if (index < 0 || this.ends_.length <= index) {
      return null;
    }
    return new LinearRing$1(
      this.flatCoordinates.slice(
        index === 0 ? 0 : this.ends_[index - 1],
        this.ends_[index]
      ),
      this.layout
    );
  }
  getLinearRings() {
    const layout = this.layout;
    const flatCoordinates = this.flatCoordinates;
    const ends = this.ends_;
    const linearRings2 = [];
    let offset = 0;
    for (let i = 0, ii = ends.length; i < ii; ++i) {
      const end = ends[i];
      const linearRing2 = new LinearRing$1(
        flatCoordinates.slice(offset, end),
        layout
      );
      linearRings2.push(linearRing2);
      offset = end;
    }
    return linearRings2;
  }
  getOrientedFlatCoordinates() {
    if (this.orientedRevision_ != this.getRevision()) {
      const flatCoordinates = this.flatCoordinates;
      if (linearRingsAreOriented(flatCoordinates, 0, this.ends_, this.stride)) {
        this.orientedFlatCoordinates_ = flatCoordinates;
      } else {
        this.orientedFlatCoordinates_ = flatCoordinates.slice();
        this.orientedFlatCoordinates_.length = orientLinearRings(
          this.orientedFlatCoordinates_,
          0,
          this.ends_,
          this.stride
        );
      }
      this.orientedRevision_ = this.getRevision();
    }
    return this.orientedFlatCoordinates_;
  }
  getSimplifiedGeometryInternal(squaredTolerance) {
    const simplifiedFlatCoordinates = [];
    const simplifiedEnds = [];
    simplifiedFlatCoordinates.length = quantizeArray(
      this.flatCoordinates,
      0,
      this.ends_,
      this.stride,
      Math.sqrt(squaredTolerance),
      simplifiedFlatCoordinates,
      0,
      simplifiedEnds
    );
    return new Polygon(simplifiedFlatCoordinates, "XY", simplifiedEnds);
  }
  getType() {
    return "Polygon";
  }
  intersectsExtent(extent2) {
    return intersectsLinearRingArray(
      this.getOrientedFlatCoordinates(),
      0,
      this.ends_,
      this.stride,
      extent2
    );
  }
  setCoordinates(coordinates2, layout) {
    this.setLayout(layout, coordinates2, 2);
    if (!this.flatCoordinates) {
      this.flatCoordinates = [];
    }
    const ends = deflateCoordinatesArray(
      this.flatCoordinates,
      0,
      coordinates2,
      this.stride,
      this.ends_
    );
    this.flatCoordinates.length = ends.length === 0 ? 0 : ends[ends.length - 1];
    this.changed();
  }
}
function fromExtent(extent2) {
  const minX = extent2[0];
  const minY = extent2[1];
  const maxX = extent2[2];
  const maxY = extent2[3];
  const flatCoordinates = [
    minX,
    minY,
    minX,
    maxY,
    maxX,
    maxY,
    maxX,
    minY,
    minX,
    minY
  ];
  return new Polygon(flatCoordinates, "XY", [flatCoordinates.length]);
}
const DEFAULT_MIN_ZOOM = 0;
class View extends BaseObject$1 {
  constructor(options) {
    super();
    this.on;
    this.once;
    this.un;
    options = Object.assign({}, options);
    this.hints_ = [0, 0];
    this.animations_ = [];
    this.updateAnimationKey_;
    this.projection_ = createProjection(options.projection, "EPSG:3857");
    this.viewportSize_ = [100, 100];
    this.targetCenter_ = null;
    this.targetResolution_;
    this.targetRotation_;
    this.nextCenter_ = null;
    this.nextResolution_;
    this.nextRotation_;
    this.cancelAnchor_ = void 0;
    if (options.projection) {
      disableCoordinateWarning();
    }
    if (options.center) {
      options.center = fromUserCoordinate(options.center, this.projection_);
    }
    if (options.extent) {
      options.extent = fromUserExtent(options.extent, this.projection_);
    }
    this.applyOptions_(options);
  }
  applyOptions_(options) {
    const properties = Object.assign({}, options);
    for (const key in ViewProperty) {
      delete properties[key];
    }
    this.setProperties(properties, true);
    const resolutionConstraintInfo = createResolutionConstraint(options);
    this.maxResolution_ = resolutionConstraintInfo.maxResolution;
    this.minResolution_ = resolutionConstraintInfo.minResolution;
    this.zoomFactor_ = resolutionConstraintInfo.zoomFactor;
    this.resolutions_ = options.resolutions;
    this.padding_ = options.padding;
    this.minZoom_ = resolutionConstraintInfo.minZoom;
    const centerConstraint = createCenterConstraint(options);
    const resolutionConstraint = resolutionConstraintInfo.constraint;
    const rotationConstraint = createRotationConstraint(options);
    this.constraints_ = {
      center: centerConstraint,
      resolution: resolutionConstraint,
      rotation: rotationConstraint
    };
    this.setRotation(options.rotation !== void 0 ? options.rotation : 0);
    this.setCenterInternal(
      options.center !== void 0 ? options.center : null
    );
    if (options.resolution !== void 0) {
      this.setResolution(options.resolution);
    } else if (options.zoom !== void 0) {
      this.setZoom(options.zoom);
    }
  }
  get padding() {
    return this.padding_;
  }
  set padding(padding) {
    let oldPadding = this.padding_;
    this.padding_ = padding;
    const center = this.getCenter();
    if (center) {
      const newPadding = padding || [0, 0, 0, 0];
      oldPadding = oldPadding || [0, 0, 0, 0];
      const resolution = this.getResolution();
      const offsetX = resolution / 2 * (newPadding[3] - oldPadding[3] + oldPadding[1] - newPadding[1]);
      const offsetY = resolution / 2 * (newPadding[0] - oldPadding[0] + oldPadding[2] - newPadding[2]);
      this.setCenterInternal([center[0] + offsetX, center[1] - offsetY]);
    }
  }
  getUpdatedOptions_(newOptions) {
    const options = this.getProperties();
    if (options.resolution !== void 0) {
      options.resolution = this.getResolution();
    } else {
      options.zoom = this.getZoom();
    }
    options.center = this.getCenterInternal();
    options.rotation = this.getRotation();
    return Object.assign({}, options, newOptions);
  }
  animate(var_args) {
    if (this.isDef() && !this.getAnimating()) {
      this.resolveConstraints(0);
    }
    const args = new Array(arguments.length);
    for (let i = 0; i < args.length; ++i) {
      let options = arguments[i];
      if (options.center) {
        options = Object.assign({}, options);
        options.center = fromUserCoordinate(
          options.center,
          this.getProjection()
        );
      }
      if (options.anchor) {
        options = Object.assign({}, options);
        options.anchor = fromUserCoordinate(
          options.anchor,
          this.getProjection()
        );
      }
      args[i] = options;
    }
    this.animateInternal.apply(this, args);
  }
  animateInternal(var_args) {
    let animationCount = arguments.length;
    let callback;
    if (animationCount > 1 && typeof arguments[animationCount - 1] === "function") {
      callback = arguments[animationCount - 1];
      --animationCount;
    }
    let i = 0;
    for (; i < animationCount && !this.isDef(); ++i) {
      const state = arguments[i];
      if (state.center) {
        this.setCenterInternal(state.center);
      }
      if (state.zoom !== void 0) {
        this.setZoom(state.zoom);
      } else if (state.resolution) {
        this.setResolution(state.resolution);
      }
      if (state.rotation !== void 0) {
        this.setRotation(state.rotation);
      }
    }
    if (i === animationCount) {
      if (callback) {
        animationCallback(callback, true);
      }
      return;
    }
    let start = Date.now();
    let center = this.targetCenter_.slice();
    let resolution = this.targetResolution_;
    let rotation = this.targetRotation_;
    const series = [];
    for (; i < animationCount; ++i) {
      const options = arguments[i];
      const animation = {
        start,
        complete: false,
        anchor: options.anchor,
        duration: options.duration !== void 0 ? options.duration : 1e3,
        easing: options.easing || inAndOut,
        callback
      };
      if (options.center) {
        animation.sourceCenter = center;
        animation.targetCenter = options.center.slice();
        center = animation.targetCenter;
      }
      if (options.zoom !== void 0) {
        animation.sourceResolution = resolution;
        animation.targetResolution = this.getResolutionForZoom(options.zoom);
        resolution = animation.targetResolution;
      } else if (options.resolution) {
        animation.sourceResolution = resolution;
        animation.targetResolution = options.resolution;
        resolution = animation.targetResolution;
      }
      if (options.rotation !== void 0) {
        animation.sourceRotation = rotation;
        const delta = modulo(options.rotation - rotation + Math.PI, 2 * Math.PI) - Math.PI;
        animation.targetRotation = rotation + delta;
        rotation = animation.targetRotation;
      }
      if (isNoopAnimation(animation)) {
        animation.complete = true;
      } else {
        start += animation.duration;
      }
      series.push(animation);
    }
    this.animations_.push(series);
    this.setHint(ViewHint.ANIMATING, 1);
    this.updateAnimations_();
  }
  getAnimating() {
    return this.hints_[ViewHint.ANIMATING] > 0;
  }
  getInteracting() {
    return this.hints_[ViewHint.INTERACTING] > 0;
  }
  cancelAnimations() {
    this.setHint(ViewHint.ANIMATING, -this.hints_[ViewHint.ANIMATING]);
    let anchor;
    for (let i = 0, ii = this.animations_.length; i < ii; ++i) {
      const series = this.animations_[i];
      if (series[0].callback) {
        animationCallback(series[0].callback, false);
      }
      if (!anchor) {
        for (let j = 0, jj = series.length; j < jj; ++j) {
          const animation = series[j];
          if (!animation.complete) {
            anchor = animation.anchor;
            break;
          }
        }
      }
    }
    this.animations_.length = 0;
    this.cancelAnchor_ = anchor;
    this.nextCenter_ = null;
    this.nextResolution_ = NaN;
    this.nextRotation_ = NaN;
  }
  updateAnimations_() {
    if (this.updateAnimationKey_ !== void 0) {
      cancelAnimationFrame(this.updateAnimationKey_);
      this.updateAnimationKey_ = void 0;
    }
    if (!this.getAnimating()) {
      return;
    }
    const now = Date.now();
    let more = false;
    for (let i = this.animations_.length - 1; i >= 0; --i) {
      const series = this.animations_[i];
      let seriesComplete = true;
      for (let j = 0, jj = series.length; j < jj; ++j) {
        const animation = series[j];
        if (animation.complete) {
          continue;
        }
        const elapsed = now - animation.start;
        let fraction = animation.duration > 0 ? elapsed / animation.duration : 1;
        if (fraction >= 1) {
          animation.complete = true;
          fraction = 1;
        } else {
          seriesComplete = false;
        }
        const progress = animation.easing(fraction);
        if (animation.sourceCenter) {
          const x0 = animation.sourceCenter[0];
          const y0 = animation.sourceCenter[1];
          const x1 = animation.targetCenter[0];
          const y1 = animation.targetCenter[1];
          this.nextCenter_ = animation.targetCenter;
          const x = x0 + progress * (x1 - x0);
          const y = y0 + progress * (y1 - y0);
          this.targetCenter_ = [x, y];
        }
        if (animation.sourceResolution && animation.targetResolution) {
          const resolution = progress === 1 ? animation.targetResolution : animation.sourceResolution + progress * (animation.targetResolution - animation.sourceResolution);
          if (animation.anchor) {
            const size = this.getViewportSize_(this.getRotation());
            const constrainedResolution = this.constraints_.resolution(
              resolution,
              0,
              size,
              true
            );
            this.targetCenter_ = this.calculateCenterZoom(
              constrainedResolution,
              animation.anchor
            );
          }
          this.nextResolution_ = animation.targetResolution;
          this.targetResolution_ = resolution;
          this.applyTargetState_(true);
        }
        if (animation.sourceRotation !== void 0 && animation.targetRotation !== void 0) {
          const rotation = progress === 1 ? modulo(animation.targetRotation + Math.PI, 2 * Math.PI) - Math.PI : animation.sourceRotation + progress * (animation.targetRotation - animation.sourceRotation);
          if (animation.anchor) {
            const constrainedRotation = this.constraints_.rotation(
              rotation,
              true
            );
            this.targetCenter_ = this.calculateCenterRotate(
              constrainedRotation,
              animation.anchor
            );
          }
          this.nextRotation_ = animation.targetRotation;
          this.targetRotation_ = rotation;
        }
        this.applyTargetState_(true);
        more = true;
        if (!animation.complete) {
          break;
        }
      }
      if (seriesComplete) {
        this.animations_[i] = null;
        this.setHint(ViewHint.ANIMATING, -1);
        this.nextCenter_ = null;
        this.nextResolution_ = NaN;
        this.nextRotation_ = NaN;
        const callback = series[0].callback;
        if (callback) {
          animationCallback(callback, true);
        }
      }
    }
    this.animations_ = this.animations_.filter(Boolean);
    if (more && this.updateAnimationKey_ === void 0) {
      this.updateAnimationKey_ = requestAnimationFrame(
        this.updateAnimations_.bind(this)
      );
    }
  }
  calculateCenterRotate(rotation, anchor) {
    let center;
    const currentCenter = this.getCenterInternal();
    if (currentCenter !== void 0) {
      center = [currentCenter[0] - anchor[0], currentCenter[1] - anchor[1]];
      rotate$1(center, rotation - this.getRotation());
      add$2(center, anchor);
    }
    return center;
  }
  calculateCenterZoom(resolution, anchor) {
    let center;
    const currentCenter = this.getCenterInternal();
    const currentResolution = this.getResolution();
    if (currentCenter !== void 0 && currentResolution !== void 0) {
      const x = anchor[0] - resolution * (anchor[0] - currentCenter[0]) / currentResolution;
      const y = anchor[1] - resolution * (anchor[1] - currentCenter[1]) / currentResolution;
      center = [x, y];
    }
    return center;
  }
  getViewportSize_(rotation) {
    const size = this.viewportSize_;
    if (rotation) {
      const w = size[0];
      const h = size[1];
      return [
        Math.abs(w * Math.cos(rotation)) + Math.abs(h * Math.sin(rotation)),
        Math.abs(w * Math.sin(rotation)) + Math.abs(h * Math.cos(rotation))
      ];
    } else {
      return size;
    }
  }
  setViewportSize(size) {
    this.viewportSize_ = Array.isArray(size) ? size.slice() : [100, 100];
    if (!this.getAnimating()) {
      this.resolveConstraints(0);
    }
  }
  getCenter() {
    const center = this.getCenterInternal();
    if (!center) {
      return center;
    }
    return toUserCoordinate(center, this.getProjection());
  }
  getCenterInternal() {
    return this.get(ViewProperty.CENTER);
  }
  getConstraints() {
    return this.constraints_;
  }
  getConstrainResolution() {
    return this.get("constrainResolution");
  }
  getHints(hints) {
    if (hints !== void 0) {
      hints[0] = this.hints_[0];
      hints[1] = this.hints_[1];
      return hints;
    } else {
      return this.hints_.slice();
    }
  }
  calculateExtent(size) {
    const extent2 = this.calculateExtentInternal(size);
    return toUserExtent(extent2, this.getProjection());
  }
  calculateExtentInternal(size) {
    size = size || this.getViewportSizeMinusPadding_();
    const center = this.getCenterInternal();
    assert(center, 1);
    const resolution = this.getResolution();
    assert(resolution !== void 0, 2);
    const rotation = this.getRotation();
    assert(rotation !== void 0, 3);
    return getForViewAndSize(center, resolution, rotation, size);
  }
  getMaxResolution() {
    return this.maxResolution_;
  }
  getMinResolution() {
    return this.minResolution_;
  }
  getMaxZoom() {
    return this.getZoomForResolution(this.minResolution_);
  }
  setMaxZoom(zoom) {
    this.applyOptions_(this.getUpdatedOptions_({ maxZoom: zoom }));
  }
  getMinZoom() {
    return this.getZoomForResolution(this.maxResolution_);
  }
  setMinZoom(zoom) {
    this.applyOptions_(this.getUpdatedOptions_({ minZoom: zoom }));
  }
  setConstrainResolution(enabled) {
    this.applyOptions_(this.getUpdatedOptions_({ constrainResolution: enabled }));
  }
  getProjection() {
    return this.projection_;
  }
  getResolution() {
    return this.get(ViewProperty.RESOLUTION);
  }
  getResolutions() {
    return this.resolutions_;
  }
  getResolutionForExtent(extent2, size) {
    return this.getResolutionForExtentInternal(
      fromUserExtent(extent2, this.getProjection()),
      size
    );
  }
  getResolutionForExtentInternal(extent2, size) {
    size = size || this.getViewportSizeMinusPadding_();
    const xResolution = getWidth(extent2) / size[0];
    const yResolution = getHeight(extent2) / size[1];
    return Math.max(xResolution, yResolution);
  }
  getResolutionForValueFunction(power) {
    power = power || 2;
    const maxResolution = this.getConstrainedResolution(this.maxResolution_);
    const minResolution = this.minResolution_;
    const max = Math.log(maxResolution / minResolution) / Math.log(power);
    return function(value) {
      const resolution = maxResolution / Math.pow(power, value * max);
      return resolution;
    };
  }
  getRotation() {
    return this.get(ViewProperty.ROTATION);
  }
  getValueForResolutionFunction(power) {
    const logPower = Math.log(power || 2);
    const maxResolution = this.getConstrainedResolution(this.maxResolution_);
    const minResolution = this.minResolution_;
    const max = Math.log(maxResolution / minResolution) / logPower;
    return function(resolution) {
      const value = Math.log(maxResolution / resolution) / logPower / max;
      return value;
    };
  }
  getViewportSizeMinusPadding_(rotation) {
    let size = this.getViewportSize_(rotation);
    const padding = this.padding_;
    if (padding) {
      size = [
        size[0] - padding[1] - padding[3],
        size[1] - padding[0] - padding[2]
      ];
    }
    return size;
  }
  getState() {
    const projection = this.getProjection();
    const resolution = this.getResolution();
    const rotation = this.getRotation();
    let center = this.getCenterInternal();
    const padding = this.padding_;
    if (padding) {
      const reducedSize = this.getViewportSizeMinusPadding_();
      center = calculateCenterOn(
        center,
        this.getViewportSize_(),
        [reducedSize[0] / 2 + padding[3], reducedSize[1] / 2 + padding[0]],
        resolution,
        rotation
      );
    }
    return {
      center: center.slice(0),
      projection: projection !== void 0 ? projection : null,
      resolution,
      nextCenter: this.nextCenter_,
      nextResolution: this.nextResolution_,
      nextRotation: this.nextRotation_,
      rotation,
      zoom: this.getZoom()
    };
  }
  getZoom() {
    let zoom;
    const resolution = this.getResolution();
    if (resolution !== void 0) {
      zoom = this.getZoomForResolution(resolution);
    }
    return zoom;
  }
  getZoomForResolution(resolution) {
    let offset = this.minZoom_ || 0;
    let max, zoomFactor;
    if (this.resolutions_) {
      const nearest = linearFindNearest(this.resolutions_, resolution, 1);
      offset = nearest;
      max = this.resolutions_[nearest];
      if (nearest == this.resolutions_.length - 1) {
        zoomFactor = 2;
      } else {
        zoomFactor = max / this.resolutions_[nearest + 1];
      }
    } else {
      max = this.maxResolution_;
      zoomFactor = this.zoomFactor_;
    }
    return offset + Math.log(max / resolution) / Math.log(zoomFactor);
  }
  getResolutionForZoom(zoom) {
    if (this.resolutions_) {
      if (this.resolutions_.length <= 1) {
        return 0;
      }
      const baseLevel = clamp(
        Math.floor(zoom),
        0,
        this.resolutions_.length - 2
      );
      const zoomFactor = this.resolutions_[baseLevel] / this.resolutions_[baseLevel + 1];
      return this.resolutions_[baseLevel] / Math.pow(zoomFactor, clamp(zoom - baseLevel, 0, 1));
    } else {
      return this.maxResolution_ / Math.pow(this.zoomFactor_, zoom - this.minZoom_);
    }
  }
  fit(geometryOrExtent, options) {
    let geometry;
    assert(
      Array.isArray(geometryOrExtent) || typeof geometryOrExtent.getSimplifiedGeometry === "function",
      24
    );
    if (Array.isArray(geometryOrExtent)) {
      assert(!isEmpty(geometryOrExtent), 25);
      const extent2 = fromUserExtent(geometryOrExtent, this.getProjection());
      geometry = fromExtent(extent2);
    } else if (geometryOrExtent.getType() === "Circle") {
      const extent2 = fromUserExtent(
        geometryOrExtent.getExtent(),
        this.getProjection()
      );
      geometry = fromExtent(extent2);
      geometry.rotate(this.getRotation(), getCenter(extent2));
    } else {
      {
        geometry = geometryOrExtent;
      }
    }
    this.fitInternal(geometry, options);
  }
  rotatedExtentForGeometry(geometry) {
    const rotation = this.getRotation();
    const cosAngle = Math.cos(rotation);
    const sinAngle = Math.sin(-rotation);
    const coords = geometry.getFlatCoordinates();
    const stride = geometry.getStride();
    let minRotX = Infinity;
    let minRotY = Infinity;
    let maxRotX = -Infinity;
    let maxRotY = -Infinity;
    for (let i = 0, ii = coords.length; i < ii; i += stride) {
      const rotX = coords[i] * cosAngle - coords[i + 1] * sinAngle;
      const rotY = coords[i] * sinAngle + coords[i + 1] * cosAngle;
      minRotX = Math.min(minRotX, rotX);
      minRotY = Math.min(minRotY, rotY);
      maxRotX = Math.max(maxRotX, rotX);
      maxRotY = Math.max(maxRotY, rotY);
    }
    return [minRotX, minRotY, maxRotX, maxRotY];
  }
  fitInternal(geometry, options) {
    options = options || {};
    let size = options.size;
    if (!size) {
      size = this.getViewportSizeMinusPadding_();
    }
    const padding = options.padding !== void 0 ? options.padding : [0, 0, 0, 0];
    const nearest = options.nearest !== void 0 ? options.nearest : false;
    let minResolution;
    if (options.minResolution !== void 0) {
      minResolution = options.minResolution;
    } else if (options.maxZoom !== void 0) {
      minResolution = this.getResolutionForZoom(options.maxZoom);
    } else {
      minResolution = 0;
    }
    const rotatedExtent = this.rotatedExtentForGeometry(geometry);
    let resolution = this.getResolutionForExtentInternal(rotatedExtent, [
      size[0] - padding[1] - padding[3],
      size[1] - padding[0] - padding[2]
    ]);
    resolution = isNaN(resolution) ? minResolution : Math.max(resolution, minResolution);
    resolution = this.getConstrainedResolution(resolution, nearest ? 0 : 1);
    const rotation = this.getRotation();
    const sinAngle = Math.sin(rotation);
    const cosAngle = Math.cos(rotation);
    const centerRot = getCenter(rotatedExtent);
    centerRot[0] += (padding[1] - padding[3]) / 2 * resolution;
    centerRot[1] += (padding[0] - padding[2]) / 2 * resolution;
    const centerX = centerRot[0] * cosAngle - centerRot[1] * sinAngle;
    const centerY = centerRot[1] * cosAngle + centerRot[0] * sinAngle;
    const center = this.getConstrainedCenter([centerX, centerY], resolution);
    const callback = options.callback ? options.callback : VOID;
    if (options.duration !== void 0) {
      this.animateInternal(
        {
          resolution,
          center,
          duration: options.duration,
          easing: options.easing
        },
        callback
      );
    } else {
      this.targetResolution_ = resolution;
      this.targetCenter_ = center;
      this.applyTargetState_(false, true);
      animationCallback(callback, true);
    }
  }
  centerOn(coordinate, size, position) {
    this.centerOnInternal(
      fromUserCoordinate(coordinate, this.getProjection()),
      size,
      position
    );
  }
  centerOnInternal(coordinate, size, position) {
    this.setCenterInternal(
      calculateCenterOn(
        coordinate,
        size,
        position,
        this.getResolution(),
        this.getRotation()
      )
    );
  }
  calculateCenterShift(center, resolution, rotation, size) {
    let centerShift;
    const padding = this.padding_;
    if (padding && center) {
      const reducedSize = this.getViewportSizeMinusPadding_(-rotation);
      const shiftedCenter = calculateCenterOn(
        center,
        size,
        [reducedSize[0] / 2 + padding[3], reducedSize[1] / 2 + padding[0]],
        resolution,
        rotation
      );
      centerShift = [
        center[0] - shiftedCenter[0],
        center[1] - shiftedCenter[1]
      ];
    }
    return centerShift;
  }
  isDef() {
    return !!this.getCenterInternal() && this.getResolution() !== void 0;
  }
  adjustCenter(deltaCoordinates) {
    const center = toUserCoordinate(this.targetCenter_, this.getProjection());
    this.setCenter([
      center[0] + deltaCoordinates[0],
      center[1] + deltaCoordinates[1]
    ]);
  }
  adjustCenterInternal(deltaCoordinates) {
    const center = this.targetCenter_;
    this.setCenterInternal([
      center[0] + deltaCoordinates[0],
      center[1] + deltaCoordinates[1]
    ]);
  }
  adjustResolution(ratio, anchor) {
    anchor = anchor && fromUserCoordinate(anchor, this.getProjection());
    this.adjustResolutionInternal(ratio, anchor);
  }
  adjustResolutionInternal(ratio, anchor) {
    const isMoving = this.getAnimating() || this.getInteracting();
    const size = this.getViewportSize_(this.getRotation());
    const newResolution = this.constraints_.resolution(
      this.targetResolution_ * ratio,
      0,
      size,
      isMoving
    );
    if (anchor) {
      this.targetCenter_ = this.calculateCenterZoom(newResolution, anchor);
    }
    this.targetResolution_ *= ratio;
    this.applyTargetState_();
  }
  adjustZoom(delta, anchor) {
    this.adjustResolution(Math.pow(this.zoomFactor_, -delta), anchor);
  }
  adjustRotation(delta, anchor) {
    if (anchor) {
      anchor = fromUserCoordinate(anchor, this.getProjection());
    }
    this.adjustRotationInternal(delta, anchor);
  }
  adjustRotationInternal(delta, anchor) {
    const isMoving = this.getAnimating() || this.getInteracting();
    const newRotation = this.constraints_.rotation(
      this.targetRotation_ + delta,
      isMoving
    );
    if (anchor) {
      this.targetCenter_ = this.calculateCenterRotate(newRotation, anchor);
    }
    this.targetRotation_ += delta;
    this.applyTargetState_();
  }
  setCenter(center) {
    this.setCenterInternal(
      center ? fromUserCoordinate(center, this.getProjection()) : center
    );
  }
  setCenterInternal(center) {
    this.targetCenter_ = center;
    this.applyTargetState_();
  }
  setHint(hint, delta) {
    this.hints_[hint] += delta;
    this.changed();
    return this.hints_[hint];
  }
  setResolution(resolution) {
    this.targetResolution_ = resolution;
    this.applyTargetState_();
  }
  setRotation(rotation) {
    this.targetRotation_ = rotation;
    this.applyTargetState_();
  }
  setZoom(zoom) {
    this.setResolution(this.getResolutionForZoom(zoom));
  }
  applyTargetState_(doNotCancelAnims, forceMoving) {
    const isMoving = this.getAnimating() || this.getInteracting() || forceMoving;
    const newRotation = this.constraints_.rotation(
      this.targetRotation_,
      isMoving
    );
    const size = this.getViewportSize_(newRotation);
    const newResolution = this.constraints_.resolution(
      this.targetResolution_,
      0,
      size,
      isMoving
    );
    const newCenter = this.constraints_.center(
      this.targetCenter_,
      newResolution,
      size,
      isMoving,
      this.calculateCenterShift(
        this.targetCenter_,
        newResolution,
        newRotation,
        size
      )
    );
    if (this.get(ViewProperty.ROTATION) !== newRotation) {
      this.set(ViewProperty.ROTATION, newRotation);
    }
    if (this.get(ViewProperty.RESOLUTION) !== newResolution) {
      this.set(ViewProperty.RESOLUTION, newResolution);
      this.set("zoom", this.getZoom(), true);
    }
    if (!newCenter || !this.get(ViewProperty.CENTER) || !equals(this.get(ViewProperty.CENTER), newCenter)) {
      this.set(ViewProperty.CENTER, newCenter);
    }
    if (this.getAnimating() && !doNotCancelAnims) {
      this.cancelAnimations();
    }
    this.cancelAnchor_ = void 0;
  }
  resolveConstraints(duration, resolutionDirection, anchor) {
    duration = duration !== void 0 ? duration : 200;
    const direction = resolutionDirection || 0;
    const newRotation = this.constraints_.rotation(this.targetRotation_);
    const size = this.getViewportSize_(newRotation);
    const newResolution = this.constraints_.resolution(
      this.targetResolution_,
      direction,
      size
    );
    const newCenter = this.constraints_.center(
      this.targetCenter_,
      newResolution,
      size,
      false,
      this.calculateCenterShift(
        this.targetCenter_,
        newResolution,
        newRotation,
        size
      )
    );
    if (duration === 0 && !this.cancelAnchor_) {
      this.targetResolution_ = newResolution;
      this.targetRotation_ = newRotation;
      this.targetCenter_ = newCenter;
      this.applyTargetState_();
      return;
    }
    anchor = anchor || (duration === 0 ? this.cancelAnchor_ : void 0);
    this.cancelAnchor_ = void 0;
    if (this.getResolution() !== newResolution || this.getRotation() !== newRotation || !this.getCenterInternal() || !equals(this.getCenterInternal(), newCenter)) {
      if (this.getAnimating()) {
        this.cancelAnimations();
      }
      this.animateInternal({
        rotation: newRotation,
        center: newCenter,
        resolution: newResolution,
        duration,
        easing: easeOut,
        anchor
      });
    }
  }
  beginInteraction() {
    this.resolveConstraints(0);
    this.setHint(ViewHint.INTERACTING, 1);
  }
  endInteraction(duration, resolutionDirection, anchor) {
    anchor = anchor && fromUserCoordinate(anchor, this.getProjection());
    this.endInteractionInternal(duration, resolutionDirection, anchor);
  }
  endInteractionInternal(duration, resolutionDirection, anchor) {
    this.setHint(ViewHint.INTERACTING, -1);
    this.resolveConstraints(duration, resolutionDirection, anchor);
  }
  getConstrainedCenter(targetCenter, targetResolution) {
    const size = this.getViewportSize_(this.getRotation());
    return this.constraints_.center(
      targetCenter,
      targetResolution || this.getResolution(),
      size
    );
  }
  getConstrainedZoom(targetZoom, direction) {
    const targetRes = this.getResolutionForZoom(targetZoom);
    return this.getZoomForResolution(
      this.getConstrainedResolution(targetRes, direction)
    );
  }
  getConstrainedResolution(targetResolution, direction) {
    direction = direction || 0;
    const size = this.getViewportSize_(this.getRotation());
    return this.constraints_.resolution(targetResolution, direction, size);
  }
}
function animationCallback(callback, returnValue) {
  setTimeout(function() {
    callback(returnValue);
  }, 0);
}
function createCenterConstraint(options) {
  if (options.extent !== void 0) {
    const smooth = options.smoothExtentConstraint !== void 0 ? options.smoothExtentConstraint : true;
    return createExtent(options.extent, options.constrainOnlyCenter, smooth);
  }
  const projection = createProjection(options.projection, "EPSG:3857");
  if (options.multiWorld !== true && projection.isGlobal()) {
    const extent2 = projection.getExtent().slice();
    extent2[0] = -Infinity;
    extent2[2] = Infinity;
    return createExtent(extent2, false, false);
  }
  return none$1;
}
function createResolutionConstraint(options) {
  let resolutionConstraint;
  let maxResolution;
  let minResolution;
  const defaultMaxZoom = 28;
  const defaultZoomFactor = 2;
  let minZoom = options.minZoom !== void 0 ? options.minZoom : DEFAULT_MIN_ZOOM;
  let maxZoom = options.maxZoom !== void 0 ? options.maxZoom : defaultMaxZoom;
  const zoomFactor = options.zoomFactor !== void 0 ? options.zoomFactor : defaultZoomFactor;
  const multiWorld = options.multiWorld !== void 0 ? options.multiWorld : false;
  const smooth = options.smoothResolutionConstraint !== void 0 ? options.smoothResolutionConstraint : true;
  const showFullExtent = options.showFullExtent !== void 0 ? options.showFullExtent : false;
  const projection = createProjection(options.projection, "EPSG:3857");
  const projExtent = projection.getExtent();
  let constrainOnlyCenter = options.constrainOnlyCenter;
  let extent2 = options.extent;
  if (!multiWorld && !extent2 && projection.isGlobal()) {
    constrainOnlyCenter = false;
    extent2 = projExtent;
  }
  if (options.resolutions !== void 0) {
    const resolutions = options.resolutions;
    maxResolution = resolutions[minZoom];
    minResolution = resolutions[maxZoom] !== void 0 ? resolutions[maxZoom] : resolutions[resolutions.length - 1];
    if (options.constrainResolution) {
      resolutionConstraint = createSnapToResolutions(
        resolutions,
        smooth,
        !constrainOnlyCenter && extent2,
        showFullExtent
      );
    } else {
      resolutionConstraint = createMinMaxResolution(
        maxResolution,
        minResolution,
        smooth,
        !constrainOnlyCenter && extent2,
        showFullExtent
      );
    }
  } else {
    const size = !projExtent ? 360 * METERS_PER_UNIT$1.degrees / projection.getMetersPerUnit() : Math.max(getWidth(projExtent), getHeight(projExtent));
    const defaultMaxResolution = size / DEFAULT_TILE_SIZE / Math.pow(defaultZoomFactor, DEFAULT_MIN_ZOOM);
    const defaultMinResolution = defaultMaxResolution / Math.pow(defaultZoomFactor, defaultMaxZoom - DEFAULT_MIN_ZOOM);
    maxResolution = options.maxResolution;
    if (maxResolution !== void 0) {
      minZoom = 0;
    } else {
      maxResolution = defaultMaxResolution / Math.pow(zoomFactor, minZoom);
    }
    minResolution = options.minResolution;
    if (minResolution === void 0) {
      if (options.maxZoom !== void 0) {
        if (options.maxResolution !== void 0) {
          minResolution = maxResolution / Math.pow(zoomFactor, maxZoom);
        } else {
          minResolution = defaultMaxResolution / Math.pow(zoomFactor, maxZoom);
        }
      } else {
        minResolution = defaultMinResolution;
      }
    }
    maxZoom = minZoom + Math.floor(
      Math.log(maxResolution / minResolution) / Math.log(zoomFactor)
    );
    minResolution = maxResolution / Math.pow(zoomFactor, maxZoom - minZoom);
    if (options.constrainResolution) {
      resolutionConstraint = createSnapToPower(
        zoomFactor,
        maxResolution,
        minResolution,
        smooth,
        !constrainOnlyCenter && extent2,
        showFullExtent
      );
    } else {
      resolutionConstraint = createMinMaxResolution(
        maxResolution,
        minResolution,
        smooth,
        !constrainOnlyCenter && extent2,
        showFullExtent
      );
    }
  }
  return {
    constraint: resolutionConstraint,
    maxResolution,
    minResolution,
    minZoom,
    zoomFactor
  };
}
function createRotationConstraint(options) {
  const enableRotation = options.enableRotation !== void 0 ? options.enableRotation : true;
  if (enableRotation) {
    const constrainRotation = options.constrainRotation;
    if (constrainRotation === void 0 || constrainRotation === true) {
      return createSnapToZero();
    } else if (constrainRotation === false) {
      return none;
    } else if (typeof constrainRotation === "number") {
      return createSnapToN(constrainRotation);
    } else {
      return none;
    }
  } else {
    return disable;
  }
}
function isNoopAnimation(animation) {
  if (animation.sourceCenter && animation.targetCenter) {
    if (!equals(animation.sourceCenter, animation.targetCenter)) {
      return false;
    }
  }
  if (animation.sourceResolution !== animation.targetResolution) {
    return false;
  }
  if (animation.sourceRotation !== animation.targetRotation) {
    return false;
  }
  return true;
}
function calculateCenterOn(coordinate, size, position, resolution, rotation) {
  const cosAngle = Math.cos(-rotation);
  let sinAngle = Math.sin(-rotation);
  let rotX = coordinate[0] * cosAngle - coordinate[1] * sinAngle;
  let rotY = coordinate[1] * cosAngle + coordinate[0] * sinAngle;
  rotX += (size[0] / 2 - position[0]) * resolution;
  rotY += (position[1] - size[1] / 2) * resolution;
  sinAngle = -sinAngle;
  const centerX = rotX * cosAngle - rotY * sinAngle;
  const centerY = rotY * cosAngle + rotX * sinAngle;
  return [centerX, centerY];
}
const View$1 = View;
class Control extends BaseObject$1 {
  constructor(options) {
    super();
    const element = options.element;
    if (element && !options.target && !element.style.pointerEvents) {
      element.style.pointerEvents = "auto";
    }
    this.element = element ? element : null;
    this.target_ = null;
    this.map_ = null;
    this.listenerKeys = [];
    if (options.render) {
      this.render = options.render;
    }
    if (options.target) {
      this.setTarget(options.target);
    }
  }
  disposeInternal() {
    removeNode(this.element);
    super.disposeInternal();
  }
  getMap() {
    return this.map_;
  }
  setMap(map2) {
    if (this.map_) {
      removeNode(this.element);
    }
    for (let i = 0, ii = this.listenerKeys.length; i < ii; ++i) {
      unlistenByKey(this.listenerKeys[i]);
    }
    this.listenerKeys.length = 0;
    this.map_ = map2;
    if (map2) {
      const target = this.target_ ? this.target_ : map2.getOverlayContainerStopEvent();
      target.appendChild(this.element);
      if (this.render !== VOID) {
        this.listenerKeys.push(
          listen(map2, MapEventType.POSTRENDER, this.render, this)
        );
      }
      map2.render();
    }
  }
  render(mapEvent) {
  }
  setTarget(target) {
    this.target_ = typeof target === "string" ? document.getElementById(target) : target;
  }
}
const Control$1 = Control;
class Attribution extends Control$1 {
  constructor(options) {
    options = options ? options : {};
    super({
      element: document.createElement("div"),
      render: options.render,
      target: options.target
    });
    this.ulElement_ = document.createElement("ul");
    this.collapsed_ = options.collapsed !== void 0 ? options.collapsed : true;
    this.userCollapsed_ = this.collapsed_;
    this.overrideCollapsible_ = options.collapsible !== void 0;
    this.collapsible_ = options.collapsible !== void 0 ? options.collapsible : true;
    if (!this.collapsible_) {
      this.collapsed_ = false;
    }
    const className = options.className !== void 0 ? options.className : "ol-attribution";
    const tipLabel = options.tipLabel !== void 0 ? options.tipLabel : "Attributions";
    const expandClassName = options.expandClassName !== void 0 ? options.expandClassName : className + "-expand";
    const collapseLabel = options.collapseLabel !== void 0 ? options.collapseLabel : "\u203A";
    const collapseClassName = options.collapseClassName !== void 0 ? options.collapseClassName : className + "-collapse";
    if (typeof collapseLabel === "string") {
      this.collapseLabel_ = document.createElement("span");
      this.collapseLabel_.textContent = collapseLabel;
      this.collapseLabel_.className = collapseClassName;
    } else {
      this.collapseLabel_ = collapseLabel;
    }
    const label = options.label !== void 0 ? options.label : "i";
    if (typeof label === "string") {
      this.label_ = document.createElement("span");
      this.label_.textContent = label;
      this.label_.className = expandClassName;
    } else {
      this.label_ = label;
    }
    const activeLabel = this.collapsible_ && !this.collapsed_ ? this.collapseLabel_ : this.label_;
    this.toggleButton_ = document.createElement("button");
    this.toggleButton_.setAttribute("type", "button");
    this.toggleButton_.setAttribute("aria-expanded", String(!this.collapsed_));
    this.toggleButton_.title = tipLabel;
    this.toggleButton_.appendChild(activeLabel);
    this.toggleButton_.addEventListener(
      EventType.CLICK,
      this.handleClick_.bind(this),
      false
    );
    const cssClasses = className + " " + CLASS_UNSELECTABLE + " " + CLASS_CONTROL + (this.collapsed_ && this.collapsible_ ? " " + CLASS_COLLAPSED : "") + (this.collapsible_ ? "" : " ol-uncollapsible");
    const element = this.element;
    element.className = cssClasses;
    element.appendChild(this.toggleButton_);
    element.appendChild(this.ulElement_);
    this.renderedAttributions_ = [];
    this.renderedVisible_ = true;
  }
  collectSourceAttributions_(frameState) {
    const lookup = {};
    const visibleAttributions = [];
    let collapsible = true;
    const layerStatesArray = frameState.layerStatesArray;
    for (let i = 0, ii = layerStatesArray.length; i < ii; ++i) {
      const layerState = layerStatesArray[i];
      if (!inView(layerState, frameState.viewState)) {
        continue;
      }
      const source = layerState.layer.getSource();
      if (!source) {
        continue;
      }
      const attributionGetter = source.getAttributions();
      if (!attributionGetter) {
        continue;
      }
      const attributions = attributionGetter(frameState);
      if (!attributions) {
        continue;
      }
      collapsible = collapsible && source.getAttributionsCollapsible() !== false;
      if (Array.isArray(attributions)) {
        for (let j = 0, jj = attributions.length; j < jj; ++j) {
          if (!(attributions[j] in lookup)) {
            visibleAttributions.push(attributions[j]);
            lookup[attributions[j]] = true;
          }
        }
      } else {
        if (!(attributions in lookup)) {
          visibleAttributions.push(attributions);
          lookup[attributions] = true;
        }
      }
    }
    if (!this.overrideCollapsible_) {
      this.setCollapsible(collapsible);
    }
    return visibleAttributions;
  }
  updateElement_(frameState) {
    if (!frameState) {
      if (this.renderedVisible_) {
        this.element.style.display = "none";
        this.renderedVisible_ = false;
      }
      return;
    }
    const attributions = this.collectSourceAttributions_(frameState);
    const visible = attributions.length > 0;
    if (this.renderedVisible_ != visible) {
      this.element.style.display = visible ? "" : "none";
      this.renderedVisible_ = visible;
    }
    if (equals$2(attributions, this.renderedAttributions_)) {
      return;
    }
    removeChildren(this.ulElement_);
    for (let i = 0, ii = attributions.length; i < ii; ++i) {
      const element = document.createElement("li");
      element.innerHTML = attributions[i];
      this.ulElement_.appendChild(element);
    }
    this.renderedAttributions_ = attributions;
  }
  handleClick_(event) {
    event.preventDefault();
    this.handleToggle_();
    this.userCollapsed_ = this.collapsed_;
  }
  handleToggle_() {
    this.element.classList.toggle(CLASS_COLLAPSED);
    if (this.collapsed_) {
      replaceNode(this.collapseLabel_, this.label_);
    } else {
      replaceNode(this.label_, this.collapseLabel_);
    }
    this.collapsed_ = !this.collapsed_;
    this.toggleButton_.setAttribute("aria-expanded", String(!this.collapsed_));
  }
  getCollapsible() {
    return this.collapsible_;
  }
  setCollapsible(collapsible) {
    if (this.collapsible_ === collapsible) {
      return;
    }
    this.collapsible_ = collapsible;
    this.element.classList.toggle("ol-uncollapsible");
    if (this.userCollapsed_) {
      this.handleToggle_();
    }
  }
  setCollapsed(collapsed) {
    this.userCollapsed_ = collapsed;
    if (!this.collapsible_ || this.collapsed_ === collapsed) {
      return;
    }
    this.handleToggle_();
  }
  getCollapsed() {
    return this.collapsed_;
  }
  render(mapEvent) {
    this.updateElement_(mapEvent.frameState);
  }
}
const Attribution$1 = Attribution;
class Rotate extends Control$1 {
  constructor(options) {
    options = options ? options : {};
    super({
      element: document.createElement("div"),
      render: options.render,
      target: options.target
    });
    const className = options.className !== void 0 ? options.className : "ol-rotate";
    const label = options.label !== void 0 ? options.label : "\u21E7";
    const compassClassName = options.compassClassName !== void 0 ? options.compassClassName : "ol-compass";
    this.label_ = null;
    if (typeof label === "string") {
      this.label_ = document.createElement("span");
      this.label_.className = compassClassName;
      this.label_.textContent = label;
    } else {
      this.label_ = label;
      this.label_.classList.add(compassClassName);
    }
    const tipLabel = options.tipLabel ? options.tipLabel : "Reset rotation";
    const button = document.createElement("button");
    button.className = className + "-reset";
    button.setAttribute("type", "button");
    button.title = tipLabel;
    button.appendChild(this.label_);
    button.addEventListener(
      EventType.CLICK,
      this.handleClick_.bind(this),
      false
    );
    const cssClasses = className + " " + CLASS_UNSELECTABLE + " " + CLASS_CONTROL;
    const element = this.element;
    element.className = cssClasses;
    element.appendChild(button);
    this.callResetNorth_ = options.resetNorth ? options.resetNorth : void 0;
    this.duration_ = options.duration !== void 0 ? options.duration : 250;
    this.autoHide_ = options.autoHide !== void 0 ? options.autoHide : true;
    this.rotation_ = void 0;
    if (this.autoHide_) {
      this.element.classList.add(CLASS_HIDDEN);
    }
  }
  handleClick_(event) {
    event.preventDefault();
    if (this.callResetNorth_ !== void 0) {
      this.callResetNorth_();
    } else {
      this.resetNorth_();
    }
  }
  resetNorth_() {
    const map2 = this.getMap();
    const view = map2.getView();
    if (!view) {
      return;
    }
    const rotation = view.getRotation();
    if (rotation !== void 0) {
      if (this.duration_ > 0 && rotation % (2 * Math.PI) !== 0) {
        view.animate({
          rotation: 0,
          duration: this.duration_,
          easing: easeOut
        });
      } else {
        view.setRotation(0);
      }
    }
  }
  render(mapEvent) {
    const frameState = mapEvent.frameState;
    if (!frameState) {
      return;
    }
    const rotation = frameState.viewState.rotation;
    if (rotation != this.rotation_) {
      const transform2 = "rotate(" + rotation + "rad)";
      if (this.autoHide_) {
        const contains = this.element.classList.contains(CLASS_HIDDEN);
        if (!contains && rotation === 0) {
          this.element.classList.add(CLASS_HIDDEN);
        } else if (contains && rotation !== 0) {
          this.element.classList.remove(CLASS_HIDDEN);
        }
      }
      this.label_.style.transform = transform2;
    }
    this.rotation_ = rotation;
  }
}
const Rotate$1 = Rotate;
class Zoom extends Control$1 {
  constructor(options) {
    options = options ? options : {};
    super({
      element: document.createElement("div"),
      target: options.target
    });
    const className = options.className !== void 0 ? options.className : "ol-zoom";
    const delta = options.delta !== void 0 ? options.delta : 1;
    const zoomInClassName = options.zoomInClassName !== void 0 ? options.zoomInClassName : className + "-in";
    const zoomOutClassName = options.zoomOutClassName !== void 0 ? options.zoomOutClassName : className + "-out";
    const zoomInLabel = options.zoomInLabel !== void 0 ? options.zoomInLabel : "+";
    const zoomOutLabel = options.zoomOutLabel !== void 0 ? options.zoomOutLabel : "\u2013";
    const zoomInTipLabel = options.zoomInTipLabel !== void 0 ? options.zoomInTipLabel : "Zoom in";
    const zoomOutTipLabel = options.zoomOutTipLabel !== void 0 ? options.zoomOutTipLabel : "Zoom out";
    const inElement = document.createElement("button");
    inElement.className = zoomInClassName;
    inElement.setAttribute("type", "button");
    inElement.title = zoomInTipLabel;
    inElement.appendChild(
      typeof zoomInLabel === "string" ? document.createTextNode(zoomInLabel) : zoomInLabel
    );
    inElement.addEventListener(
      EventType.CLICK,
      this.handleClick_.bind(this, delta),
      false
    );
    const outElement = document.createElement("button");
    outElement.className = zoomOutClassName;
    outElement.setAttribute("type", "button");
    outElement.title = zoomOutTipLabel;
    outElement.appendChild(
      typeof zoomOutLabel === "string" ? document.createTextNode(zoomOutLabel) : zoomOutLabel
    );
    outElement.addEventListener(
      EventType.CLICK,
      this.handleClick_.bind(this, -delta),
      false
    );
    const cssClasses = className + " " + CLASS_UNSELECTABLE + " " + CLASS_CONTROL;
    const element = this.element;
    element.className = cssClasses;
    element.appendChild(inElement);
    element.appendChild(outElement);
    this.duration_ = options.duration !== void 0 ? options.duration : 250;
  }
  handleClick_(delta, event) {
    event.preventDefault();
    this.zoomByDelta_(delta);
  }
  zoomByDelta_(delta) {
    const map2 = this.getMap();
    const view = map2.getView();
    if (!view) {
      return;
    }
    const currentZoom = view.getZoom();
    if (currentZoom !== void 0) {
      const newZoom = view.getConstrainedZoom(currentZoom + delta);
      if (this.duration_ > 0) {
        if (view.getAnimating()) {
          view.cancelAnimations();
        }
        view.animate({
          zoom: newZoom,
          duration: this.duration_,
          easing: easeOut
        });
      } else {
        view.setZoom(newZoom);
      }
    }
  }
}
const Zoom$1 = Zoom;
function defaults$1(options) {
  options = options ? options : {};
  const controls = new Collection$1();
  const zoomControl = options.zoom !== void 0 ? options.zoom : true;
  if (zoomControl) {
    controls.push(new Zoom$1(options.zoomOptions));
  }
  const rotateControl = options.rotate !== void 0 ? options.rotate : true;
  if (rotateControl) {
    controls.push(new Rotate$1(options.rotateOptions));
  }
  const attributionControl = options.attribution !== void 0 ? options.attribution : true;
  if (attributionControl) {
    controls.push(new Attribution$1(options.attributionOptions));
  }
  return controls;
}
const InteractionProperty = {
  ACTIVE: "active"
};
class Interaction extends BaseObject$1 {
  constructor(options) {
    super();
    this.on;
    this.once;
    this.un;
    if (options && options.handleEvent) {
      this.handleEvent = options.handleEvent;
    }
    this.map_ = null;
    this.setActive(true);
  }
  getActive() {
    return this.get(InteractionProperty.ACTIVE);
  }
  getMap() {
    return this.map_;
  }
  handleEvent(mapBrowserEvent) {
    return true;
  }
  setActive(active) {
    this.set(InteractionProperty.ACTIVE, active);
  }
  setMap(map2) {
    this.map_ = map2;
  }
}
function pan(view, delta, duration) {
  const currentCenter = view.getCenterInternal();
  if (currentCenter) {
    const center = [currentCenter[0] + delta[0], currentCenter[1] + delta[1]];
    view.animateInternal({
      duration: duration !== void 0 ? duration : 250,
      easing: linear,
      center: view.getConstrainedCenter(center)
    });
  }
}
function zoomByDelta(view, delta, anchor, duration) {
  const currentZoom = view.getZoom();
  if (currentZoom === void 0) {
    return;
  }
  const newZoom = view.getConstrainedZoom(currentZoom + delta);
  const newResolution = view.getResolutionForZoom(newZoom);
  if (view.getAnimating()) {
    view.cancelAnimations();
  }
  view.animate({
    resolution: newResolution,
    anchor,
    duration: duration !== void 0 ? duration : 250,
    easing: easeOut
  });
}
const Interaction$1 = Interaction;
class DoubleClickZoom extends Interaction$1 {
  constructor(options) {
    super();
    options = options ? options : {};
    this.delta_ = options.delta ? options.delta : 1;
    this.duration_ = options.duration !== void 0 ? options.duration : 250;
  }
  handleEvent(mapBrowserEvent) {
    let stopEvent = false;
    if (mapBrowserEvent.type == MapBrowserEventType.DBLCLICK) {
      const browserEvent = mapBrowserEvent.originalEvent;
      const map2 = mapBrowserEvent.map;
      const anchor = mapBrowserEvent.coordinate;
      const delta = browserEvent.shiftKey ? -this.delta_ : this.delta_;
      const view = map2.getView();
      zoomByDelta(view, delta, anchor, this.duration_);
      browserEvent.preventDefault();
      stopEvent = true;
    }
    return !stopEvent;
  }
}
const DoubleClickZoom$1 = DoubleClickZoom;
class PointerInteraction extends Interaction$1 {
  constructor(options) {
    options = options ? options : {};
    super(
      options
    );
    if (options.handleDownEvent) {
      this.handleDownEvent = options.handleDownEvent;
    }
    if (options.handleDragEvent) {
      this.handleDragEvent = options.handleDragEvent;
    }
    if (options.handleMoveEvent) {
      this.handleMoveEvent = options.handleMoveEvent;
    }
    if (options.handleUpEvent) {
      this.handleUpEvent = options.handleUpEvent;
    }
    if (options.stopDown) {
      this.stopDown = options.stopDown;
    }
    this.handlingDownUpSequence = false;
    this.targetPointers = [];
  }
  getPointerCount() {
    return this.targetPointers.length;
  }
  handleDownEvent(mapBrowserEvent) {
    return false;
  }
  handleDragEvent(mapBrowserEvent) {
  }
  handleEvent(mapBrowserEvent) {
    if (!mapBrowserEvent.originalEvent) {
      return true;
    }
    let stopEvent = false;
    this.updateTrackedPointers_(mapBrowserEvent);
    if (this.handlingDownUpSequence) {
      if (mapBrowserEvent.type == MapBrowserEventType.POINTERDRAG) {
        this.handleDragEvent(mapBrowserEvent);
        mapBrowserEvent.originalEvent.preventDefault();
      } else if (mapBrowserEvent.type == MapBrowserEventType.POINTERUP) {
        const handledUp = this.handleUpEvent(mapBrowserEvent);
        this.handlingDownUpSequence = handledUp && this.targetPointers.length > 0;
      }
    } else {
      if (mapBrowserEvent.type == MapBrowserEventType.POINTERDOWN) {
        const handled = this.handleDownEvent(mapBrowserEvent);
        this.handlingDownUpSequence = handled;
        stopEvent = this.stopDown(handled);
      } else if (mapBrowserEvent.type == MapBrowserEventType.POINTERMOVE) {
        this.handleMoveEvent(mapBrowserEvent);
      }
    }
    return !stopEvent;
  }
  handleMoveEvent(mapBrowserEvent) {
  }
  handleUpEvent(mapBrowserEvent) {
    return false;
  }
  stopDown(handled) {
    return handled;
  }
  updateTrackedPointers_(mapBrowserEvent) {
    if (mapBrowserEvent.activePointers) {
      this.targetPointers = mapBrowserEvent.activePointers;
    }
  }
}
function centroid(pointerEvents) {
  const length = pointerEvents.length;
  let clientX = 0;
  let clientY = 0;
  for (let i = 0; i < length; i++) {
    clientX += pointerEvents[i].clientX;
    clientY += pointerEvents[i].clientY;
  }
  return [clientX / length, clientY / length];
}
const PointerInteraction$1 = PointerInteraction;
function all(var_args) {
  const conditions = arguments;
  return function(event) {
    let pass = true;
    for (let i = 0, ii = conditions.length; i < ii; ++i) {
      pass = pass && conditions[i](event);
      if (!pass) {
        break;
      }
    }
    return pass;
  };
}
const altShiftKeysOnly = function(mapBrowserEvent) {
  const originalEvent = mapBrowserEvent.originalEvent;
  return originalEvent.altKey && !(originalEvent.metaKey || originalEvent.ctrlKey) && originalEvent.shiftKey;
};
const focus = function(event) {
  const targetElement = event.map.getTargetElement();
  const activeElement = event.map.getOwnerDocument().activeElement;
  return targetElement.contains(activeElement);
};
const focusWithTabindex = function(event) {
  return event.map.getTargetElement().hasAttribute("tabindex") ? focus(event) : true;
};
const always = TRUE;
const mouseActionButton = function(mapBrowserEvent) {
  const originalEvent = mapBrowserEvent.originalEvent;
  return originalEvent.button == 0 && !(WEBKIT && MAC && originalEvent.ctrlKey);
};
const noModifierKeys = function(mapBrowserEvent) {
  const originalEvent = mapBrowserEvent.originalEvent;
  return !originalEvent.altKey && !(originalEvent.metaKey || originalEvent.ctrlKey) && !originalEvent.shiftKey;
};
const shiftKeyOnly = function(mapBrowserEvent) {
  const originalEvent = mapBrowserEvent.originalEvent;
  return !originalEvent.altKey && !(originalEvent.metaKey || originalEvent.ctrlKey) && originalEvent.shiftKey;
};
const targetNotEditable = function(mapBrowserEvent) {
  const originalEvent = mapBrowserEvent.originalEvent;
  const tagName = originalEvent.target.tagName;
  return tagName !== "INPUT" && tagName !== "SELECT" && tagName !== "TEXTAREA" && !originalEvent.target.isContentEditable;
};
const mouseOnly = function(mapBrowserEvent) {
  const pointerEvent = mapBrowserEvent.originalEvent;
  assert(pointerEvent !== void 0, 56);
  return pointerEvent.pointerType == "mouse";
};
const primaryAction = function(mapBrowserEvent) {
  const pointerEvent = mapBrowserEvent.originalEvent;
  assert(pointerEvent !== void 0, 56);
  return pointerEvent.isPrimary && pointerEvent.button === 0;
};
class DragPan extends PointerInteraction$1 {
  constructor(options) {
    super({
      stopDown: FALSE
    });
    options = options ? options : {};
    this.kinetic_ = options.kinetic;
    this.lastCentroid = null;
    this.lastPointersCount_;
    this.panning_ = false;
    const condition = options.condition ? options.condition : all(noModifierKeys, primaryAction);
    this.condition_ = options.onFocusOnly ? all(focusWithTabindex, condition) : condition;
    this.noKinetic_ = false;
  }
  handleDragEvent(mapBrowserEvent) {
    if (!this.panning_) {
      this.panning_ = true;
      this.getMap().getView().beginInteraction();
    }
    const targetPointers = this.targetPointers;
    const centroid$1 = centroid(targetPointers);
    if (targetPointers.length == this.lastPointersCount_) {
      if (this.kinetic_) {
        this.kinetic_.update(centroid$1[0], centroid$1[1]);
      }
      if (this.lastCentroid) {
        const delta = [
          this.lastCentroid[0] - centroid$1[0],
          centroid$1[1] - this.lastCentroid[1]
        ];
        const map2 = mapBrowserEvent.map;
        const view = map2.getView();
        scale$2(delta, view.getResolution());
        rotate$1(delta, view.getRotation());
        view.adjustCenterInternal(delta);
      }
    } else if (this.kinetic_) {
      this.kinetic_.begin();
    }
    this.lastCentroid = centroid$1;
    this.lastPointersCount_ = targetPointers.length;
    mapBrowserEvent.originalEvent.preventDefault();
  }
  handleUpEvent(mapBrowserEvent) {
    const map2 = mapBrowserEvent.map;
    const view = map2.getView();
    if (this.targetPointers.length === 0) {
      if (!this.noKinetic_ && this.kinetic_ && this.kinetic_.end()) {
        const distance = this.kinetic_.getDistance();
        const angle = this.kinetic_.getAngle();
        const center = view.getCenterInternal();
        const centerpx = map2.getPixelFromCoordinateInternal(center);
        const dest = map2.getCoordinateFromPixelInternal([
          centerpx[0] - distance * Math.cos(angle),
          centerpx[1] - distance * Math.sin(angle)
        ]);
        view.animateInternal({
          center: view.getConstrainedCenter(dest),
          duration: 500,
          easing: easeOut
        });
      }
      if (this.panning_) {
        this.panning_ = false;
        view.endInteraction();
      }
      return false;
    } else {
      if (this.kinetic_) {
        this.kinetic_.begin();
      }
      this.lastCentroid = null;
      return true;
    }
  }
  handleDownEvent(mapBrowserEvent) {
    if (this.targetPointers.length > 0 && this.condition_(mapBrowserEvent)) {
      const map2 = mapBrowserEvent.map;
      const view = map2.getView();
      this.lastCentroid = null;
      if (view.getAnimating()) {
        view.cancelAnimations();
      }
      if (this.kinetic_) {
        this.kinetic_.begin();
      }
      this.noKinetic_ = this.targetPointers.length > 1;
      return true;
    } else {
      return false;
    }
  }
}
const DragPan$1 = DragPan;
class DragRotate extends PointerInteraction$1 {
  constructor(options) {
    options = options ? options : {};
    super({
      stopDown: FALSE
    });
    this.condition_ = options.condition ? options.condition : altShiftKeysOnly;
    this.lastAngle_ = void 0;
    this.duration_ = options.duration !== void 0 ? options.duration : 250;
  }
  handleDragEvent(mapBrowserEvent) {
    if (!mouseOnly(mapBrowserEvent)) {
      return;
    }
    const map2 = mapBrowserEvent.map;
    const view = map2.getView();
    if (view.getConstraints().rotation === disable) {
      return;
    }
    const size = map2.getSize();
    const offset = mapBrowserEvent.pixel;
    const theta = Math.atan2(size[1] / 2 - offset[1], offset[0] - size[0] / 2);
    if (this.lastAngle_ !== void 0) {
      const delta = theta - this.lastAngle_;
      view.adjustRotationInternal(-delta);
    }
    this.lastAngle_ = theta;
  }
  handleUpEvent(mapBrowserEvent) {
    if (!mouseOnly(mapBrowserEvent)) {
      return true;
    }
    const map2 = mapBrowserEvent.map;
    const view = map2.getView();
    view.endInteraction(this.duration_);
    return false;
  }
  handleDownEvent(mapBrowserEvent) {
    if (!mouseOnly(mapBrowserEvent)) {
      return false;
    }
    if (mouseActionButton(mapBrowserEvent) && this.condition_(mapBrowserEvent)) {
      const map2 = mapBrowserEvent.map;
      map2.getView().beginInteraction();
      this.lastAngle_ = void 0;
      return true;
    } else {
      return false;
    }
  }
}
const DragRotate$1 = DragRotate;
class RenderBox extends Disposable$1 {
  constructor(className) {
    super();
    this.geometry_ = null;
    this.element_ = document.createElement("div");
    this.element_.style.position = "absolute";
    this.element_.style.pointerEvents = "auto";
    this.element_.className = "ol-box " + className;
    this.map_ = null;
    this.startPixel_ = null;
    this.endPixel_ = null;
  }
  disposeInternal() {
    this.setMap(null);
  }
  render_() {
    const startPixel = this.startPixel_;
    const endPixel = this.endPixel_;
    const px = "px";
    const style2 = this.element_.style;
    style2.left = Math.min(startPixel[0], endPixel[0]) + px;
    style2.top = Math.min(startPixel[1], endPixel[1]) + px;
    style2.width = Math.abs(endPixel[0] - startPixel[0]) + px;
    style2.height = Math.abs(endPixel[1] - startPixel[1]) + px;
  }
  setMap(map2) {
    if (this.map_) {
      this.map_.getOverlayContainer().removeChild(this.element_);
      const style2 = this.element_.style;
      style2.left = "inherit";
      style2.top = "inherit";
      style2.width = "inherit";
      style2.height = "inherit";
    }
    this.map_ = map2;
    if (this.map_) {
      this.map_.getOverlayContainer().appendChild(this.element_);
    }
  }
  setPixels(startPixel, endPixel) {
    this.startPixel_ = startPixel;
    this.endPixel_ = endPixel;
    this.createOrUpdateGeometry();
    this.render_();
  }
  createOrUpdateGeometry() {
    const startPixel = this.startPixel_;
    const endPixel = this.endPixel_;
    const pixels = [
      startPixel,
      [startPixel[0], endPixel[1]],
      endPixel,
      [endPixel[0], startPixel[1]]
    ];
    const coordinates2 = pixels.map(
      this.map_.getCoordinateFromPixelInternal,
      this.map_
    );
    coordinates2[4] = coordinates2[0].slice();
    if (!this.geometry_) {
      this.geometry_ = new Polygon([coordinates2]);
    } else {
      this.geometry_.setCoordinates([coordinates2]);
    }
  }
  getGeometry() {
    return this.geometry_;
  }
}
const RenderBox$1 = RenderBox;
const DragBoxEventType = {
  BOXSTART: "boxstart",
  BOXDRAG: "boxdrag",
  BOXEND: "boxend",
  BOXCANCEL: "boxcancel"
};
class DragBoxEvent extends Event {
  constructor(type, coordinate, mapBrowserEvent) {
    super(type);
    this.coordinate = coordinate;
    this.mapBrowserEvent = mapBrowserEvent;
  }
}
class DragBox extends PointerInteraction$1 {
  constructor(options) {
    super();
    this.on;
    this.once;
    this.un;
    options = options ? options : {};
    this.box_ = new RenderBox$1(options.className || "ol-dragbox");
    this.minArea_ = options.minArea !== void 0 ? options.minArea : 64;
    if (options.onBoxEnd) {
      this.onBoxEnd = options.onBoxEnd;
    }
    this.startPixel_ = null;
    this.condition_ = options.condition ? options.condition : mouseActionButton;
    this.boxEndCondition_ = options.boxEndCondition ? options.boxEndCondition : this.defaultBoxEndCondition;
  }
  defaultBoxEndCondition(mapBrowserEvent, startPixel, endPixel) {
    const width = endPixel[0] - startPixel[0];
    const height = endPixel[1] - startPixel[1];
    return width * width + height * height >= this.minArea_;
  }
  getGeometry() {
    return this.box_.getGeometry();
  }
  handleDragEvent(mapBrowserEvent) {
    this.box_.setPixels(this.startPixel_, mapBrowserEvent.pixel);
    this.dispatchEvent(
      new DragBoxEvent(
        DragBoxEventType.BOXDRAG,
        mapBrowserEvent.coordinate,
        mapBrowserEvent
      )
    );
  }
  handleUpEvent(mapBrowserEvent) {
    this.box_.setMap(null);
    const completeBox = this.boxEndCondition_(
      mapBrowserEvent,
      this.startPixel_,
      mapBrowserEvent.pixel
    );
    if (completeBox) {
      this.onBoxEnd(mapBrowserEvent);
    }
    this.dispatchEvent(
      new DragBoxEvent(
        completeBox ? DragBoxEventType.BOXEND : DragBoxEventType.BOXCANCEL,
        mapBrowserEvent.coordinate,
        mapBrowserEvent
      )
    );
    return false;
  }
  handleDownEvent(mapBrowserEvent) {
    if (this.condition_(mapBrowserEvent)) {
      this.startPixel_ = mapBrowserEvent.pixel;
      this.box_.setMap(mapBrowserEvent.map);
      this.box_.setPixels(this.startPixel_, this.startPixel_);
      this.dispatchEvent(
        new DragBoxEvent(
          DragBoxEventType.BOXSTART,
          mapBrowserEvent.coordinate,
          mapBrowserEvent
        )
      );
      return true;
    } else {
      return false;
    }
  }
  onBoxEnd(event) {
  }
}
const DragBox$1 = DragBox;
class DragZoom extends DragBox$1 {
  constructor(options) {
    options = options ? options : {};
    const condition = options.condition ? options.condition : shiftKeyOnly;
    super({
      condition,
      className: options.className || "ol-dragzoom",
      minArea: options.minArea
    });
    this.duration_ = options.duration !== void 0 ? options.duration : 200;
    this.out_ = options.out !== void 0 ? options.out : false;
  }
  onBoxEnd(event) {
    const map2 = this.getMap();
    const view = map2.getView();
    let geometry = this.getGeometry();
    if (this.out_) {
      const rotatedExtent = view.rotatedExtentForGeometry(geometry);
      const resolution = view.getResolutionForExtentInternal(rotatedExtent);
      const factor = view.getResolution() / resolution;
      geometry = geometry.clone();
      geometry.scale(factor * factor);
    }
    view.fitInternal(geometry, {
      duration: this.duration_,
      easing: easeOut
    });
  }
}
const DragZoom$1 = DragZoom;
const KeyCode = {
  LEFT: 37,
  UP: 38,
  RIGHT: 39,
  DOWN: 40
};
class KeyboardPan extends Interaction$1 {
  constructor(options) {
    super();
    options = options || {};
    this.defaultCondition_ = function(mapBrowserEvent) {
      return noModifierKeys(mapBrowserEvent) && targetNotEditable(mapBrowserEvent);
    };
    this.condition_ = options.condition !== void 0 ? options.condition : this.defaultCondition_;
    this.duration_ = options.duration !== void 0 ? options.duration : 100;
    this.pixelDelta_ = options.pixelDelta !== void 0 ? options.pixelDelta : 128;
  }
  handleEvent(mapBrowserEvent) {
    let stopEvent = false;
    if (mapBrowserEvent.type == EventType.KEYDOWN) {
      const keyEvent = mapBrowserEvent.originalEvent;
      const keyCode = keyEvent.keyCode;
      if (this.condition_(mapBrowserEvent) && (keyCode == KeyCode.DOWN || keyCode == KeyCode.LEFT || keyCode == KeyCode.RIGHT || keyCode == KeyCode.UP)) {
        const map2 = mapBrowserEvent.map;
        const view = map2.getView();
        const mapUnitsDelta = view.getResolution() * this.pixelDelta_;
        let deltaX = 0, deltaY = 0;
        if (keyCode == KeyCode.DOWN) {
          deltaY = -mapUnitsDelta;
        } else if (keyCode == KeyCode.LEFT) {
          deltaX = -mapUnitsDelta;
        } else if (keyCode == KeyCode.RIGHT) {
          deltaX = mapUnitsDelta;
        } else {
          deltaY = mapUnitsDelta;
        }
        const delta = [deltaX, deltaY];
        rotate$1(delta, view.getRotation());
        pan(view, delta, this.duration_);
        keyEvent.preventDefault();
        stopEvent = true;
      }
    }
    return !stopEvent;
  }
}
const KeyboardPan$1 = KeyboardPan;
class KeyboardZoom extends Interaction$1 {
  constructor(options) {
    super();
    options = options ? options : {};
    this.condition_ = options.condition ? options.condition : targetNotEditable;
    this.delta_ = options.delta ? options.delta : 1;
    this.duration_ = options.duration !== void 0 ? options.duration : 100;
  }
  handleEvent(mapBrowserEvent) {
    let stopEvent = false;
    if (mapBrowserEvent.type == EventType.KEYDOWN || mapBrowserEvent.type == EventType.KEYPRESS) {
      const keyEvent = mapBrowserEvent.originalEvent;
      const charCode = keyEvent.charCode;
      if (this.condition_(mapBrowserEvent) && (charCode == "+".charCodeAt(0) || charCode == "-".charCodeAt(0))) {
        const map2 = mapBrowserEvent.map;
        const delta = charCode == "+".charCodeAt(0) ? this.delta_ : -this.delta_;
        const view = map2.getView();
        zoomByDelta(view, delta, void 0, this.duration_);
        keyEvent.preventDefault();
        stopEvent = true;
      }
    }
    return !stopEvent;
  }
}
const KeyboardZoom$1 = KeyboardZoom;
class Kinetic {
  constructor(decay, minVelocity, delay) {
    this.decay_ = decay;
    this.minVelocity_ = minVelocity;
    this.delay_ = delay;
    this.points_ = [];
    this.angle_ = 0;
    this.initialVelocity_ = 0;
  }
  begin() {
    this.points_.length = 0;
    this.angle_ = 0;
    this.initialVelocity_ = 0;
  }
  update(x, y) {
    this.points_.push(x, y, Date.now());
  }
  end() {
    if (this.points_.length < 6) {
      return false;
    }
    const delay = Date.now() - this.delay_;
    const lastIndex = this.points_.length - 3;
    if (this.points_[lastIndex + 2] < delay) {
      return false;
    }
    let firstIndex = lastIndex - 3;
    while (firstIndex > 0 && this.points_[firstIndex + 2] > delay) {
      firstIndex -= 3;
    }
    const duration = this.points_[lastIndex + 2] - this.points_[firstIndex + 2];
    if (duration < 1e3 / 60) {
      return false;
    }
    const dx = this.points_[lastIndex] - this.points_[firstIndex];
    const dy = this.points_[lastIndex + 1] - this.points_[firstIndex + 1];
    this.angle_ = Math.atan2(dy, dx);
    this.initialVelocity_ = Math.sqrt(dx * dx + dy * dy) / duration;
    return this.initialVelocity_ > this.minVelocity_;
  }
  getDistance() {
    return (this.minVelocity_ - this.initialVelocity_) / this.decay_;
  }
  getAngle() {
    return this.angle_;
  }
}
const Kinetic$1 = Kinetic;
class MouseWheelZoom extends Interaction$1 {
  constructor(options) {
    options = options ? options : {};
    super(
      options
    );
    this.totalDelta_ = 0;
    this.lastDelta_ = 0;
    this.maxDelta_ = options.maxDelta !== void 0 ? options.maxDelta : 1;
    this.duration_ = options.duration !== void 0 ? options.duration : 250;
    this.timeout_ = options.timeout !== void 0 ? options.timeout : 80;
    this.useAnchor_ = options.useAnchor !== void 0 ? options.useAnchor : true;
    this.constrainResolution_ = options.constrainResolution !== void 0 ? options.constrainResolution : false;
    const condition = options.condition ? options.condition : always;
    this.condition_ = options.onFocusOnly ? all(focusWithTabindex, condition) : condition;
    this.lastAnchor_ = null;
    this.startTime_ = void 0;
    this.timeoutId_;
    this.mode_ = void 0;
    this.trackpadEventGap_ = 400;
    this.trackpadTimeoutId_;
    this.deltaPerZoom_ = 300;
  }
  endInteraction_() {
    this.trackpadTimeoutId_ = void 0;
    const map2 = this.getMap();
    if (!map2) {
      return;
    }
    const view = map2.getView();
    view.endInteraction(
      void 0,
      this.lastDelta_ ? this.lastDelta_ > 0 ? 1 : -1 : 0,
      this.lastAnchor_
    );
  }
  handleEvent(mapBrowserEvent) {
    if (!this.condition_(mapBrowserEvent)) {
      return true;
    }
    const type = mapBrowserEvent.type;
    if (type !== EventType.WHEEL) {
      return true;
    }
    const map2 = mapBrowserEvent.map;
    const wheelEvent = mapBrowserEvent.originalEvent;
    wheelEvent.preventDefault();
    if (this.useAnchor_) {
      this.lastAnchor_ = mapBrowserEvent.coordinate;
    }
    let delta;
    if (mapBrowserEvent.type == EventType.WHEEL) {
      delta = wheelEvent.deltaY;
      if (FIREFOX && wheelEvent.deltaMode === WheelEvent.DOM_DELTA_PIXEL) {
        delta /= DEVICE_PIXEL_RATIO;
      }
      if (wheelEvent.deltaMode === WheelEvent.DOM_DELTA_LINE) {
        delta *= 40;
      }
    }
    if (delta === 0) {
      return false;
    } else {
      this.lastDelta_ = delta;
    }
    const now = Date.now();
    if (this.startTime_ === void 0) {
      this.startTime_ = now;
    }
    if (!this.mode_ || now - this.startTime_ > this.trackpadEventGap_) {
      this.mode_ = Math.abs(delta) < 4 ? "trackpad" : "wheel";
    }
    const view = map2.getView();
    if (this.mode_ === "trackpad" && !(view.getConstrainResolution() || this.constrainResolution_)) {
      if (this.trackpadTimeoutId_) {
        clearTimeout(this.trackpadTimeoutId_);
      } else {
        if (view.getAnimating()) {
          view.cancelAnimations();
        }
        view.beginInteraction();
      }
      this.trackpadTimeoutId_ = setTimeout(
        this.endInteraction_.bind(this),
        this.timeout_
      );
      view.adjustZoom(-delta / this.deltaPerZoom_, this.lastAnchor_);
      this.startTime_ = now;
      return false;
    }
    this.totalDelta_ += delta;
    const timeLeft = Math.max(this.timeout_ - (now - this.startTime_), 0);
    clearTimeout(this.timeoutId_);
    this.timeoutId_ = setTimeout(
      this.handleWheelZoom_.bind(this, map2),
      timeLeft
    );
    return false;
  }
  handleWheelZoom_(map2) {
    const view = map2.getView();
    if (view.getAnimating()) {
      view.cancelAnimations();
    }
    let delta = -clamp(
      this.totalDelta_,
      -this.maxDelta_ * this.deltaPerZoom_,
      this.maxDelta_ * this.deltaPerZoom_
    ) / this.deltaPerZoom_;
    if (view.getConstrainResolution() || this.constrainResolution_) {
      delta = delta ? delta > 0 ? 1 : -1 : 0;
    }
    zoomByDelta(view, delta, this.lastAnchor_, this.duration_);
    this.mode_ = void 0;
    this.totalDelta_ = 0;
    this.lastAnchor_ = null;
    this.startTime_ = void 0;
    this.timeoutId_ = void 0;
  }
  setMouseAnchor(useAnchor) {
    this.useAnchor_ = useAnchor;
    if (!useAnchor) {
      this.lastAnchor_ = null;
    }
  }
}
const MouseWheelZoom$1 = MouseWheelZoom;
class PinchRotate extends PointerInteraction$1 {
  constructor(options) {
    options = options ? options : {};
    const pointerOptions = options;
    if (!pointerOptions.stopDown) {
      pointerOptions.stopDown = FALSE;
    }
    super(pointerOptions);
    this.anchor_ = null;
    this.lastAngle_ = void 0;
    this.rotating_ = false;
    this.rotationDelta_ = 0;
    this.threshold_ = options.threshold !== void 0 ? options.threshold : 0.3;
    this.duration_ = options.duration !== void 0 ? options.duration : 250;
  }
  handleDragEvent(mapBrowserEvent) {
    let rotationDelta = 0;
    const touch0 = this.targetPointers[0];
    const touch1 = this.targetPointers[1];
    const angle = Math.atan2(
      touch1.clientY - touch0.clientY,
      touch1.clientX - touch0.clientX
    );
    if (this.lastAngle_ !== void 0) {
      const delta = angle - this.lastAngle_;
      this.rotationDelta_ += delta;
      if (!this.rotating_ && Math.abs(this.rotationDelta_) > this.threshold_) {
        this.rotating_ = true;
      }
      rotationDelta = delta;
    }
    this.lastAngle_ = angle;
    const map2 = mapBrowserEvent.map;
    const view = map2.getView();
    if (view.getConstraints().rotation === disable) {
      return;
    }
    const viewportPosition = map2.getViewport().getBoundingClientRect();
    const centroid$1 = centroid(this.targetPointers);
    centroid$1[0] -= viewportPosition.left;
    centroid$1[1] -= viewportPosition.top;
    this.anchor_ = map2.getCoordinateFromPixelInternal(centroid$1);
    if (this.rotating_) {
      map2.render();
      view.adjustRotationInternal(rotationDelta, this.anchor_);
    }
  }
  handleUpEvent(mapBrowserEvent) {
    if (this.targetPointers.length < 2) {
      const map2 = mapBrowserEvent.map;
      const view = map2.getView();
      view.endInteraction(this.duration_);
      return false;
    } else {
      return true;
    }
  }
  handleDownEvent(mapBrowserEvent) {
    if (this.targetPointers.length >= 2) {
      const map2 = mapBrowserEvent.map;
      this.anchor_ = null;
      this.lastAngle_ = void 0;
      this.rotating_ = false;
      this.rotationDelta_ = 0;
      if (!this.handlingDownUpSequence) {
        map2.getView().beginInteraction();
      }
      return true;
    } else {
      return false;
    }
  }
}
const PinchRotate$1 = PinchRotate;
class PinchZoom extends PointerInteraction$1 {
  constructor(options) {
    options = options ? options : {};
    const pointerOptions = options;
    if (!pointerOptions.stopDown) {
      pointerOptions.stopDown = FALSE;
    }
    super(pointerOptions);
    this.anchor_ = null;
    this.duration_ = options.duration !== void 0 ? options.duration : 400;
    this.lastDistance_ = void 0;
    this.lastScaleDelta_ = 1;
  }
  handleDragEvent(mapBrowserEvent) {
    let scaleDelta = 1;
    const touch0 = this.targetPointers[0];
    const touch1 = this.targetPointers[1];
    const dx = touch0.clientX - touch1.clientX;
    const dy = touch0.clientY - touch1.clientY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (this.lastDistance_ !== void 0) {
      scaleDelta = this.lastDistance_ / distance;
    }
    this.lastDistance_ = distance;
    const map2 = mapBrowserEvent.map;
    const view = map2.getView();
    if (scaleDelta != 1) {
      this.lastScaleDelta_ = scaleDelta;
    }
    const viewportPosition = map2.getViewport().getBoundingClientRect();
    const centroid$1 = centroid(this.targetPointers);
    centroid$1[0] -= viewportPosition.left;
    centroid$1[1] -= viewportPosition.top;
    this.anchor_ = map2.getCoordinateFromPixelInternal(centroid$1);
    map2.render();
    view.adjustResolutionInternal(scaleDelta, this.anchor_);
  }
  handleUpEvent(mapBrowserEvent) {
    if (this.targetPointers.length < 2) {
      const map2 = mapBrowserEvent.map;
      const view = map2.getView();
      const direction = this.lastScaleDelta_ > 1 ? 1 : -1;
      view.endInteraction(this.duration_, direction);
      return false;
    } else {
      return true;
    }
  }
  handleDownEvent(mapBrowserEvent) {
    if (this.targetPointers.length >= 2) {
      const map2 = mapBrowserEvent.map;
      this.anchor_ = null;
      this.lastDistance_ = void 0;
      this.lastScaleDelta_ = 1;
      if (!this.handlingDownUpSequence) {
        map2.getView().beginInteraction();
      }
      return true;
    } else {
      return false;
    }
  }
}
const PinchZoom$1 = PinchZoom;
function defaults(options) {
  options = options ? options : {};
  const interactions = new Collection$1();
  const kinetic = new Kinetic$1(-5e-3, 0.05, 100);
  const altShiftDragRotate = options.altShiftDragRotate !== void 0 ? options.altShiftDragRotate : true;
  if (altShiftDragRotate) {
    interactions.push(new DragRotate$1());
  }
  const doubleClickZoom = options.doubleClickZoom !== void 0 ? options.doubleClickZoom : true;
  if (doubleClickZoom) {
    interactions.push(
      new DoubleClickZoom$1({
        delta: options.zoomDelta,
        duration: options.zoomDuration
      })
    );
  }
  const dragPan = options.dragPan !== void 0 ? options.dragPan : true;
  if (dragPan) {
    interactions.push(
      new DragPan$1({
        onFocusOnly: options.onFocusOnly,
        kinetic
      })
    );
  }
  const pinchRotate = options.pinchRotate !== void 0 ? options.pinchRotate : true;
  if (pinchRotate) {
    interactions.push(new PinchRotate$1());
  }
  const pinchZoom = options.pinchZoom !== void 0 ? options.pinchZoom : true;
  if (pinchZoom) {
    interactions.push(
      new PinchZoom$1({
        duration: options.zoomDuration
      })
    );
  }
  const keyboard = options.keyboard !== void 0 ? options.keyboard : true;
  if (keyboard) {
    interactions.push(new KeyboardPan$1());
    interactions.push(
      new KeyboardZoom$1({
        delta: options.zoomDelta,
        duration: options.zoomDuration
      })
    );
  }
  const mouseWheelZoom = options.mouseWheelZoom !== void 0 ? options.mouseWheelZoom : true;
  if (mouseWheelZoom) {
    interactions.push(
      new MouseWheelZoom$1({
        onFocusOnly: options.onFocusOnly,
        duration: options.zoomDuration
      })
    );
  }
  const shiftDragZoom = options.shiftDragZoom !== void 0 ? options.shiftDragZoom : true;
  if (shiftDragZoom) {
    interactions.push(
      new DragZoom$1({
        duration: options.zoomDuration
      })
    );
  }
  return interactions;
}
function hasArea(size) {
  return size[0] > 0 && size[1] > 0;
}
function scale(size, ratio, dest) {
  if (dest === void 0) {
    dest = [0, 0];
  }
  dest[0] = size[0] * ratio + 0.5 | 0;
  dest[1] = size[1] * ratio + 0.5 | 0;
  return dest;
}
function toSize(size, dest) {
  if (Array.isArray(size)) {
    return size;
  } else {
    if (dest === void 0) {
      dest = [size, size];
    } else {
      dest[0] = size;
      dest[1] = size;
    }
    return dest;
  }
}
function removeLayerMapProperty(layer) {
  if (layer instanceof Layer$1) {
    layer.setMapInternal(null);
    return;
  }
  if (layer instanceof LayerGroup$1) {
    layer.getLayers().forEach(removeLayerMapProperty);
  }
}
function setLayerMapProperty(layer, map2) {
  if (layer instanceof Layer$1) {
    layer.setMapInternal(map2);
    return;
  }
  if (layer instanceof LayerGroup$1) {
    const layers = layer.getLayers().getArray();
    for (let i = 0, ii = layers.length; i < ii; ++i) {
      setLayerMapProperty(layers[i], map2);
    }
  }
}
class Map extends BaseObject$1 {
  constructor(options) {
    super();
    options = options || {};
    this.on;
    this.once;
    this.un;
    const optionsInternal = createOptionsInternal(options);
    this.renderComplete_;
    this.loaded_ = true;
    this.boundHandleBrowserEvent_ = this.handleBrowserEvent.bind(this);
    this.maxTilesLoading_ = options.maxTilesLoading !== void 0 ? options.maxTilesLoading : 16;
    this.pixelRatio_ = options.pixelRatio !== void 0 ? options.pixelRatio : DEVICE_PIXEL_RATIO;
    this.postRenderTimeoutHandle_;
    this.animationDelayKey_;
    this.animationDelay_ = this.animationDelay_.bind(this);
    this.coordinateToPixelTransform_ = create$1();
    this.pixelToCoordinateTransform_ = create$1();
    this.frameIndex_ = 0;
    this.frameState_ = null;
    this.previousExtent_ = null;
    this.viewPropertyListenerKey_ = null;
    this.viewChangeListenerKey_ = null;
    this.layerGroupPropertyListenerKeys_ = null;
    this.viewport_ = document.createElement("div");
    this.viewport_.className = "ol-viewport" + ("ontouchstart" in window ? " ol-touch" : "");
    this.viewport_.style.position = "relative";
    this.viewport_.style.overflow = "hidden";
    this.viewport_.style.width = "100%";
    this.viewport_.style.height = "100%";
    this.overlayContainer_ = document.createElement("div");
    this.overlayContainer_.style.position = "absolute";
    this.overlayContainer_.style.zIndex = "0";
    this.overlayContainer_.style.width = "100%";
    this.overlayContainer_.style.height = "100%";
    this.overlayContainer_.style.pointerEvents = "none";
    this.overlayContainer_.className = "ol-overlaycontainer";
    this.viewport_.appendChild(this.overlayContainer_);
    this.overlayContainerStopEvent_ = document.createElement("div");
    this.overlayContainerStopEvent_.style.position = "absolute";
    this.overlayContainerStopEvent_.style.zIndex = "0";
    this.overlayContainerStopEvent_.style.width = "100%";
    this.overlayContainerStopEvent_.style.height = "100%";
    this.overlayContainerStopEvent_.style.pointerEvents = "none";
    this.overlayContainerStopEvent_.className = "ol-overlaycontainer-stopevent";
    this.viewport_.appendChild(this.overlayContainerStopEvent_);
    this.mapBrowserEventHandler_ = null;
    this.moveTolerance_ = options.moveTolerance;
    this.keyboardEventTarget_ = optionsInternal.keyboardEventTarget;
    this.targetChangeHandlerKeys_ = null;
    this.controls = optionsInternal.controls || defaults$1();
    this.interactions = optionsInternal.interactions || defaults({
      onFocusOnly: true
    });
    this.overlays_ = optionsInternal.overlays;
    this.overlayIdIndex_ = {};
    this.renderer_ = null;
    this.postRenderFunctions_ = [];
    this.tileQueue_ = new TileQueue$1(
      this.getTilePriority.bind(this),
      this.handleTileChange_.bind(this)
    );
    this.addChangeListener(
      MapProperty.LAYERGROUP,
      this.handleLayerGroupChanged_
    );
    this.addChangeListener(MapProperty.VIEW, this.handleViewChanged_);
    this.addChangeListener(MapProperty.SIZE, this.handleSizeChanged_);
    this.addChangeListener(MapProperty.TARGET, this.handleTargetChanged_);
    this.setProperties(optionsInternal.values);
    const map2 = this;
    if (options.view && !(options.view instanceof View$1)) {
      options.view.then(function(viewOptions) {
        map2.setView(new View$1(viewOptions));
      });
    }
    this.controls.addEventListener(
      CollectionEventType.ADD,
      function(event) {
        event.element.setMap(this);
      }.bind(this)
    );
    this.controls.addEventListener(
      CollectionEventType.REMOVE,
      function(event) {
        event.element.setMap(null);
      }.bind(this)
    );
    this.interactions.addEventListener(
      CollectionEventType.ADD,
      function(event) {
        event.element.setMap(this);
      }.bind(this)
    );
    this.interactions.addEventListener(
      CollectionEventType.REMOVE,
      function(event) {
        event.element.setMap(null);
      }.bind(this)
    );
    this.overlays_.addEventListener(
      CollectionEventType.ADD,
      function(event) {
        this.addOverlayInternal_(event.element);
      }.bind(this)
    );
    this.overlays_.addEventListener(
      CollectionEventType.REMOVE,
      function(event) {
        const id = event.element.getId();
        if (id !== void 0) {
          delete this.overlayIdIndex_[id.toString()];
        }
        event.element.setMap(null);
      }.bind(this)
    );
    this.controls.forEach(
      function(control) {
        control.setMap(this);
      }.bind(this)
    );
    this.interactions.forEach(
      function(interaction) {
        interaction.setMap(this);
      }.bind(this)
    );
    this.overlays_.forEach(this.addOverlayInternal_.bind(this));
  }
  addControl(control) {
    this.getControls().push(control);
  }
  addInteraction(interaction) {
    this.getInteractions().push(interaction);
  }
  addLayer(layer) {
    const layers = this.getLayerGroup().getLayers();
    layers.push(layer);
  }
  handleLayerAdd_(event) {
    setLayerMapProperty(event.layer, this);
  }
  addOverlay(overlay) {
    this.getOverlays().push(overlay);
  }
  addOverlayInternal_(overlay) {
    const id = overlay.getId();
    if (id !== void 0) {
      this.overlayIdIndex_[id.toString()] = overlay;
    }
    overlay.setMap(this);
  }
  disposeInternal() {
    this.controls.clear();
    this.interactions.clear();
    this.overlays_.clear();
    this.setTarget(null);
    super.disposeInternal();
  }
  forEachFeatureAtPixel(pixel, callback, options) {
    if (!this.frameState_ || !this.renderer_) {
      return;
    }
    const coordinate = this.getCoordinateFromPixelInternal(pixel);
    options = options !== void 0 ? options : {};
    const hitTolerance = options.hitTolerance !== void 0 ? options.hitTolerance : 0;
    const layerFilter = options.layerFilter !== void 0 ? options.layerFilter : TRUE;
    const checkWrapped = options.checkWrapped !== false;
    return this.renderer_.forEachFeatureAtCoordinate(
      coordinate,
      this.frameState_,
      hitTolerance,
      checkWrapped,
      callback,
      null,
      layerFilter,
      null
    );
  }
  getFeaturesAtPixel(pixel, options) {
    const features = [];
    this.forEachFeatureAtPixel(
      pixel,
      function(feature) {
        features.push(feature);
      },
      options
    );
    return features;
  }
  getAllLayers() {
    const layers = [];
    function addLayersFrom(layerGroup) {
      layerGroup.forEach(function(layer) {
        if (layer instanceof LayerGroup$1) {
          addLayersFrom(layer.getLayers());
        } else {
          layers.push(layer);
        }
      });
    }
    addLayersFrom(this.getLayers());
    return layers;
  }
  hasFeatureAtPixel(pixel, options) {
    if (!this.frameState_ || !this.renderer_) {
      return false;
    }
    const coordinate = this.getCoordinateFromPixelInternal(pixel);
    options = options !== void 0 ? options : {};
    const layerFilter = options.layerFilter !== void 0 ? options.layerFilter : TRUE;
    const hitTolerance = options.hitTolerance !== void 0 ? options.hitTolerance : 0;
    const checkWrapped = options.checkWrapped !== false;
    return this.renderer_.hasFeatureAtCoordinate(
      coordinate,
      this.frameState_,
      hitTolerance,
      checkWrapped,
      layerFilter,
      null
    );
  }
  getEventCoordinate(event) {
    return this.getCoordinateFromPixel(this.getEventPixel(event));
  }
  getEventCoordinateInternal(event) {
    return this.getCoordinateFromPixelInternal(this.getEventPixel(event));
  }
  getEventPixel(event) {
    const viewportPosition = this.viewport_.getBoundingClientRect();
    const eventPosition = "changedTouches" in event ? event.changedTouches[0] : event;
    return [
      eventPosition.clientX - viewportPosition.left,
      eventPosition.clientY - viewportPosition.top
    ];
  }
  getTarget() {
    return this.get(MapProperty.TARGET);
  }
  getTargetElement() {
    const target = this.getTarget();
    if (target !== void 0) {
      return typeof target === "string" ? document.getElementById(target) : target;
    } else {
      return null;
    }
  }
  getCoordinateFromPixel(pixel) {
    return toUserCoordinate(
      this.getCoordinateFromPixelInternal(pixel),
      this.getView().getProjection()
    );
  }
  getCoordinateFromPixelInternal(pixel) {
    const frameState = this.frameState_;
    if (!frameState) {
      return null;
    } else {
      return apply(
        frameState.pixelToCoordinateTransform,
        pixel.slice()
      );
    }
  }
  getControls() {
    return this.controls;
  }
  getOverlays() {
    return this.overlays_;
  }
  getOverlayById(id) {
    const overlay = this.overlayIdIndex_[id.toString()];
    return overlay !== void 0 ? overlay : null;
  }
  getInteractions() {
    return this.interactions;
  }
  getLayerGroup() {
    return this.get(MapProperty.LAYERGROUP);
  }
  setLayers(layers) {
    const group = this.getLayerGroup();
    if (layers instanceof Collection$1) {
      group.setLayers(layers);
      return;
    }
    const collection = group.getLayers();
    collection.clear();
    collection.extend(layers);
  }
  getLayers() {
    const layers = this.getLayerGroup().getLayers();
    return layers;
  }
  getLoadingOrNotReady() {
    const layerStatesArray = this.getLayerGroup().getLayerStatesArray();
    for (let i = 0, ii = layerStatesArray.length; i < ii; ++i) {
      const state = layerStatesArray[i];
      if (!state.visible) {
        continue;
      }
      const renderer = state.layer.getRenderer();
      if (renderer && !renderer.ready) {
        return true;
      }
      const source = state.layer.getSource();
      if (source && source.loading) {
        return true;
      }
    }
    return false;
  }
  getPixelFromCoordinate(coordinate) {
    const viewCoordinate = fromUserCoordinate(
      coordinate,
      this.getView().getProjection()
    );
    return this.getPixelFromCoordinateInternal(viewCoordinate);
  }
  getPixelFromCoordinateInternal(coordinate) {
    const frameState = this.frameState_;
    if (!frameState) {
      return null;
    } else {
      return apply(
        frameState.coordinateToPixelTransform,
        coordinate.slice(0, 2)
      );
    }
  }
  getRenderer() {
    return this.renderer_;
  }
  getSize() {
    return this.get(MapProperty.SIZE);
  }
  getView() {
    return this.get(MapProperty.VIEW);
  }
  getViewport() {
    return this.viewport_;
  }
  getOverlayContainer() {
    return this.overlayContainer_;
  }
  getOverlayContainerStopEvent() {
    return this.overlayContainerStopEvent_;
  }
  getOwnerDocument() {
    const targetElement = this.getTargetElement();
    return targetElement ? targetElement.ownerDocument : document;
  }
  getTilePriority(tile, tileSourceKey, tileCenter, tileResolution) {
    return getTilePriority(
      this.frameState_,
      tile,
      tileSourceKey,
      tileCenter,
      tileResolution
    );
  }
  handleBrowserEvent(browserEvent, type) {
    type = type || browserEvent.type;
    const mapBrowserEvent = new MapBrowserEvent$1(type, this, browserEvent);
    this.handleMapBrowserEvent(mapBrowserEvent);
  }
  handleMapBrowserEvent(mapBrowserEvent) {
    if (!this.frameState_) {
      return;
    }
    const originalEvent = mapBrowserEvent.originalEvent;
    const eventType = originalEvent.type;
    if (eventType === PointerEventType.POINTERDOWN || eventType === EventType.WHEEL || eventType === EventType.KEYDOWN) {
      const doc = this.getOwnerDocument();
      const rootNode = this.viewport_.getRootNode ? this.viewport_.getRootNode() : doc;
      const target = originalEvent.target;
      if (this.overlayContainerStopEvent_.contains(target) || !(rootNode === doc ? doc.documentElement : rootNode).contains(target)) {
        return;
      }
    }
    mapBrowserEvent.frameState = this.frameState_;
    if (this.dispatchEvent(mapBrowserEvent) !== false) {
      const interactionsArray = this.getInteractions().getArray().slice();
      for (let i = interactionsArray.length - 1; i >= 0; i--) {
        const interaction = interactionsArray[i];
        if (interaction.getMap() !== this || !interaction.getActive() || !this.getTargetElement()) {
          continue;
        }
        const cont = interaction.handleEvent(mapBrowserEvent);
        if (!cont || mapBrowserEvent.propagationStopped) {
          break;
        }
      }
    }
  }
  handlePostRender() {
    const frameState = this.frameState_;
    const tileQueue = this.tileQueue_;
    if (!tileQueue.isEmpty()) {
      let maxTotalLoading = this.maxTilesLoading_;
      let maxNewLoads = maxTotalLoading;
      if (frameState) {
        const hints = frameState.viewHints;
        if (hints[ViewHint.ANIMATING] || hints[ViewHint.INTERACTING]) {
          const lowOnFrameBudget = Date.now() - frameState.time > 8;
          maxTotalLoading = lowOnFrameBudget ? 0 : 8;
          maxNewLoads = lowOnFrameBudget ? 0 : 2;
        }
      }
      if (tileQueue.getTilesLoading() < maxTotalLoading) {
        tileQueue.reprioritize();
        tileQueue.loadMoreTiles(maxTotalLoading, maxNewLoads);
      }
    }
    if (frameState && this.renderer_ && !frameState.animate) {
      if (this.renderComplete_ === true) {
        if (this.hasListener(RenderEventType.RENDERCOMPLETE)) {
          this.renderer_.dispatchRenderEvent(
            RenderEventType.RENDERCOMPLETE,
            frameState
          );
        }
        if (this.loaded_ === false) {
          this.loaded_ = true;
          this.dispatchEvent(
            new MapEvent$1(MapEventType.LOADEND, this, frameState)
          );
        }
      } else if (this.loaded_ === true) {
        this.loaded_ = false;
        this.dispatchEvent(
          new MapEvent$1(MapEventType.LOADSTART, this, frameState)
        );
      }
    }
    const postRenderFunctions = this.postRenderFunctions_;
    for (let i = 0, ii = postRenderFunctions.length; i < ii; ++i) {
      postRenderFunctions[i](this, frameState);
    }
    postRenderFunctions.length = 0;
  }
  handleSizeChanged_() {
    if (this.getView() && !this.getView().getAnimating()) {
      this.getView().resolveConstraints(0);
    }
    this.render();
  }
  handleTargetChanged_() {
    if (this.mapBrowserEventHandler_) {
      for (let i = 0, ii = this.targetChangeHandlerKeys_.length; i < ii; ++i) {
        unlistenByKey(this.targetChangeHandlerKeys_[i]);
      }
      this.targetChangeHandlerKeys_ = null;
      this.viewport_.removeEventListener(
        EventType.CONTEXTMENU,
        this.boundHandleBrowserEvent_
      );
      this.viewport_.removeEventListener(
        EventType.WHEEL,
        this.boundHandleBrowserEvent_
      );
      this.mapBrowserEventHandler_.dispose();
      this.mapBrowserEventHandler_ = null;
      removeNode(this.viewport_);
    }
    const targetElement = this.getTargetElement();
    if (!targetElement) {
      if (this.renderer_) {
        clearTimeout(this.postRenderTimeoutHandle_);
        this.postRenderTimeoutHandle_ = void 0;
        this.postRenderFunctions_.length = 0;
        this.renderer_.dispose();
        this.renderer_ = null;
      }
      if (this.animationDelayKey_) {
        cancelAnimationFrame(this.animationDelayKey_);
        this.animationDelayKey_ = void 0;
      }
    } else {
      targetElement.appendChild(this.viewport_);
      if (!this.renderer_) {
        this.renderer_ = new CompositeMapRenderer$1(this);
      }
      this.mapBrowserEventHandler_ = new MapBrowserEventHandler$1(
        this,
        this.moveTolerance_
      );
      for (const key in MapBrowserEventType) {
        this.mapBrowserEventHandler_.addEventListener(
          MapBrowserEventType[key],
          this.handleMapBrowserEvent.bind(this)
        );
      }
      this.viewport_.addEventListener(
        EventType.CONTEXTMENU,
        this.boundHandleBrowserEvent_,
        false
      );
      this.viewport_.addEventListener(
        EventType.WHEEL,
        this.boundHandleBrowserEvent_,
        PASSIVE_EVENT_LISTENERS ? { passive: false } : false
      );
      const defaultView = this.getOwnerDocument().defaultView;
      const keyboardEventTarget = !this.keyboardEventTarget_ ? targetElement : this.keyboardEventTarget_;
      this.targetChangeHandlerKeys_ = [
        listen(
          keyboardEventTarget,
          EventType.KEYDOWN,
          this.handleBrowserEvent,
          this
        ),
        listen(
          keyboardEventTarget,
          EventType.KEYPRESS,
          this.handleBrowserEvent,
          this
        ),
        listen(defaultView, EventType.RESIZE, this.updateSize, this)
      ];
    }
    this.updateSize();
  }
  handleTileChange_() {
    this.render();
  }
  handleViewPropertyChanged_() {
    this.render();
  }
  handleViewChanged_() {
    if (this.viewPropertyListenerKey_) {
      unlistenByKey(this.viewPropertyListenerKey_);
      this.viewPropertyListenerKey_ = null;
    }
    if (this.viewChangeListenerKey_) {
      unlistenByKey(this.viewChangeListenerKey_);
      this.viewChangeListenerKey_ = null;
    }
    const view = this.getView();
    if (view) {
      this.updateViewportSize_();
      this.viewPropertyListenerKey_ = listen(
        view,
        ObjectEventType.PROPERTYCHANGE,
        this.handleViewPropertyChanged_,
        this
      );
      this.viewChangeListenerKey_ = listen(
        view,
        EventType.CHANGE,
        this.handleViewPropertyChanged_,
        this
      );
      view.resolveConstraints(0);
    }
    this.render();
  }
  handleLayerGroupChanged_() {
    if (this.layerGroupPropertyListenerKeys_) {
      this.layerGroupPropertyListenerKeys_.forEach(unlistenByKey);
      this.layerGroupPropertyListenerKeys_ = null;
    }
    const layerGroup = this.getLayerGroup();
    if (layerGroup) {
      this.handleLayerAdd_(new GroupEvent("addlayer", layerGroup));
      this.layerGroupPropertyListenerKeys_ = [
        listen(layerGroup, ObjectEventType.PROPERTYCHANGE, this.render, this),
        listen(layerGroup, EventType.CHANGE, this.render, this),
        listen(layerGroup, "addlayer", this.handleLayerAdd_, this),
        listen(layerGroup, "removelayer", this.handleLayerRemove_, this)
      ];
    }
    this.render();
  }
  isRendered() {
    return !!this.frameState_;
  }
  animationDelay_() {
    this.animationDelayKey_ = void 0;
    this.renderFrame_(Date.now());
  }
  renderSync() {
    if (this.animationDelayKey_) {
      cancelAnimationFrame(this.animationDelayKey_);
    }
    this.animationDelay_();
  }
  redrawText() {
    const layerStates = this.getLayerGroup().getLayerStatesArray();
    for (let i = 0, ii = layerStates.length; i < ii; ++i) {
      const layer = layerStates[i].layer;
      if (layer.hasRenderer()) {
        layer.getRenderer().handleFontsChanged();
      }
    }
  }
  render() {
    if (this.renderer_ && this.animationDelayKey_ === void 0) {
      this.animationDelayKey_ = requestAnimationFrame(this.animationDelay_);
    }
  }
  removeControl(control) {
    return this.getControls().remove(control);
  }
  removeInteraction(interaction) {
    return this.getInteractions().remove(interaction);
  }
  removeLayer(layer) {
    const layers = this.getLayerGroup().getLayers();
    return layers.remove(layer);
  }
  handleLayerRemove_(event) {
    removeLayerMapProperty(event.layer);
  }
  removeOverlay(overlay) {
    return this.getOverlays().remove(overlay);
  }
  renderFrame_(time) {
    const size = this.getSize();
    const view = this.getView();
    const previousFrameState = this.frameState_;
    let frameState = null;
    if (size !== void 0 && hasArea(size) && view && view.isDef()) {
      const viewHints = view.getHints(
        this.frameState_ ? this.frameState_.viewHints : void 0
      );
      const viewState = view.getState();
      frameState = {
        animate: false,
        coordinateToPixelTransform: this.coordinateToPixelTransform_,
        declutterTree: null,
        extent: getForViewAndSize(
          viewState.center,
          viewState.resolution,
          viewState.rotation,
          size
        ),
        index: this.frameIndex_++,
        layerIndex: 0,
        layerStatesArray: this.getLayerGroup().getLayerStatesArray(),
        pixelRatio: this.pixelRatio_,
        pixelToCoordinateTransform: this.pixelToCoordinateTransform_,
        postRenderFunctions: [],
        size,
        tileQueue: this.tileQueue_,
        time,
        usedTiles: {},
        viewState,
        viewHints,
        wantedTiles: {},
        mapId: getUid(this),
        renderTargets: {}
      };
      if (viewState.nextCenter && viewState.nextResolution) {
        const rotation = isNaN(viewState.nextRotation) ? viewState.rotation : viewState.nextRotation;
        frameState.nextExtent = getForViewAndSize(
          viewState.nextCenter,
          viewState.nextResolution,
          rotation,
          size
        );
      }
    }
    this.frameState_ = frameState;
    this.renderer_.renderFrame(frameState);
    if (frameState) {
      if (frameState.animate) {
        this.render();
      }
      Array.prototype.push.apply(
        this.postRenderFunctions_,
        frameState.postRenderFunctions
      );
      if (previousFrameState) {
        const moveStart = !this.previousExtent_ || !isEmpty(this.previousExtent_) && !equals$1(frameState.extent, this.previousExtent_);
        if (moveStart) {
          this.dispatchEvent(
            new MapEvent$1(MapEventType.MOVESTART, this, previousFrameState)
          );
          this.previousExtent_ = createOrUpdateEmpty(this.previousExtent_);
        }
      }
      const idle = this.previousExtent_ && !frameState.viewHints[ViewHint.ANIMATING] && !frameState.viewHints[ViewHint.INTERACTING] && !equals$1(frameState.extent, this.previousExtent_);
      if (idle) {
        this.dispatchEvent(
          new MapEvent$1(MapEventType.MOVEEND, this, frameState)
        );
        clone(frameState.extent, this.previousExtent_);
      }
    }
    this.dispatchEvent(new MapEvent$1(MapEventType.POSTRENDER, this, frameState));
    this.renderComplete_ = this.hasListener(MapEventType.LOADSTART) || this.hasListener(MapEventType.LOADEND) || this.hasListener(RenderEventType.RENDERCOMPLETE) ? !this.tileQueue_.getTilesLoading() && !this.tileQueue_.getCount() && !this.getLoadingOrNotReady() : void 0;
    if (!this.postRenderTimeoutHandle_) {
      this.postRenderTimeoutHandle_ = setTimeout(() => {
        this.postRenderTimeoutHandle_ = void 0;
        this.handlePostRender();
      }, 0);
    }
  }
  setLayerGroup(layerGroup) {
    const oldLayerGroup = this.getLayerGroup();
    if (oldLayerGroup) {
      this.handleLayerRemove_(new GroupEvent("removelayer", oldLayerGroup));
    }
    this.set(MapProperty.LAYERGROUP, layerGroup);
  }
  setSize(size) {
    this.set(MapProperty.SIZE, size);
  }
  setTarget(target) {
    this.set(MapProperty.TARGET, target);
  }
  setView(view) {
    if (!view || view instanceof View$1) {
      this.set(MapProperty.VIEW, view);
      return;
    }
    this.set(MapProperty.VIEW, new View$1());
    const map2 = this;
    view.then(function(viewOptions) {
      map2.setView(new View$1(viewOptions));
    });
  }
  updateSize() {
    const targetElement = this.getTargetElement();
    let size = void 0;
    if (targetElement) {
      const computedStyle = getComputedStyle(targetElement);
      const width = targetElement.offsetWidth - parseFloat(computedStyle["borderLeftWidth"]) - parseFloat(computedStyle["paddingLeft"]) - parseFloat(computedStyle["paddingRight"]) - parseFloat(computedStyle["borderRightWidth"]);
      const height = targetElement.offsetHeight - parseFloat(computedStyle["borderTopWidth"]) - parseFloat(computedStyle["paddingTop"]) - parseFloat(computedStyle["paddingBottom"]) - parseFloat(computedStyle["borderBottomWidth"]);
      if (!isNaN(width) && !isNaN(height)) {
        size = [width, height];
        if (!hasArea(size) && !!(targetElement.offsetWidth || targetElement.offsetHeight || targetElement.getClientRects().length)) {
          console.warn(
            "No map visible because the map container's width or height are 0."
          );
        }
      }
    }
    this.setSize(size);
    this.updateViewportSize_();
  }
  updateViewportSize_() {
    const view = this.getView();
    if (view) {
      let size = void 0;
      const computedStyle = getComputedStyle(this.viewport_);
      if (computedStyle.width && computedStyle.height) {
        size = [
          parseInt(computedStyle.width, 10),
          parseInt(computedStyle.height, 10)
        ];
      }
      view.setViewportSize(size);
    }
  }
}
function createOptionsInternal(options) {
  let keyboardEventTarget = null;
  if (options.keyboardEventTarget !== void 0) {
    keyboardEventTarget = typeof options.keyboardEventTarget === "string" ? document.getElementById(options.keyboardEventTarget) : options.keyboardEventTarget;
  }
  const values = {};
  const layerGroup = options.layers && typeof options.layers.getLayers === "function" ? options.layers : new LayerGroup$1({
    layers: options.layers
  });
  values[MapProperty.LAYERGROUP] = layerGroup;
  values[MapProperty.TARGET] = options.target;
  values[MapProperty.VIEW] = options.view instanceof View$1 ? options.view : new View$1();
  let controls;
  if (options.controls !== void 0) {
    if (Array.isArray(options.controls)) {
      controls = new Collection$1(options.controls.slice());
    } else {
      assert(
        typeof options.controls.getArray === "function",
        47
      );
      controls = options.controls;
    }
  }
  let interactions;
  if (options.interactions !== void 0) {
    if (Array.isArray(options.interactions)) {
      interactions = new Collection$1(options.interactions.slice());
    } else {
      assert(
        typeof options.interactions.getArray === "function",
        48
      );
      interactions = options.interactions;
    }
  }
  let overlays;
  if (options.overlays !== void 0) {
    if (Array.isArray(options.overlays)) {
      overlays = new Collection$1(options.overlays.slice());
    } else {
      assert(
        typeof options.overlays.getArray === "function",
        49
      );
      overlays = options.overlays;
    }
  } else {
    overlays = new Collection$1();
  }
  return {
    controls,
    interactions,
    keyboardEventTarget,
    overlays,
    values
  };
}
const Map$1 = Map;
const style = "";
const TileProperty = {
  PRELOAD: "preload",
  USE_INTERIM_TILES_ON_ERROR: "useInterimTilesOnError"
};
class BaseTileLayer extends Layer$1 {
  constructor(options) {
    options = options ? options : {};
    const baseOptions = Object.assign({}, options);
    delete baseOptions.preload;
    delete baseOptions.useInterimTilesOnError;
    super(baseOptions);
    this.on;
    this.once;
    this.un;
    this.setPreload(options.preload !== void 0 ? options.preload : 0);
    this.setUseInterimTilesOnError(
      options.useInterimTilesOnError !== void 0 ? options.useInterimTilesOnError : true
    );
  }
  getPreload() {
    return this.get(TileProperty.PRELOAD);
  }
  setPreload(preload) {
    this.set(TileProperty.PRELOAD, preload);
  }
  getUseInterimTilesOnError() {
    return this.get(TileProperty.USE_INTERIM_TILES_ON_ERROR);
  }
  setUseInterimTilesOnError(useInterimTilesOnError) {
    this.set(TileProperty.USE_INTERIM_TILES_ON_ERROR, useInterimTilesOnError);
  }
  getData(pixel) {
    return super.getData(pixel);
  }
}
const BaseTileLayer$1 = BaseTileLayer;
class LRUCache {
  constructor(highWaterMark) {
    this.highWaterMark = highWaterMark !== void 0 ? highWaterMark : 2048;
    this.count_ = 0;
    this.entries_ = {};
    this.oldest_ = null;
    this.newest_ = null;
  }
  canExpireCache() {
    return this.highWaterMark > 0 && this.getCount() > this.highWaterMark;
  }
  expireCache(keep) {
    while (this.canExpireCache()) {
      this.pop();
    }
  }
  clear() {
    this.count_ = 0;
    this.entries_ = {};
    this.oldest_ = null;
    this.newest_ = null;
  }
  containsKey(key) {
    return this.entries_.hasOwnProperty(key);
  }
  forEach(f) {
    let entry = this.oldest_;
    while (entry) {
      f(entry.value_, entry.key_, this);
      entry = entry.newer;
    }
  }
  get(key, options) {
    const entry = this.entries_[key];
    assert(entry !== void 0, 15);
    if (entry === this.newest_) {
      return entry.value_;
    } else if (entry === this.oldest_) {
      this.oldest_ = this.oldest_.newer;
      this.oldest_.older = null;
    } else {
      entry.newer.older = entry.older;
      entry.older.newer = entry.newer;
    }
    entry.newer = null;
    entry.older = this.newest_;
    this.newest_.newer = entry;
    this.newest_ = entry;
    return entry.value_;
  }
  remove(key) {
    const entry = this.entries_[key];
    assert(entry !== void 0, 15);
    if (entry === this.newest_) {
      this.newest_ = entry.older;
      if (this.newest_) {
        this.newest_.newer = null;
      }
    } else if (entry === this.oldest_) {
      this.oldest_ = entry.newer;
      if (this.oldest_) {
        this.oldest_.older = null;
      }
    } else {
      entry.newer.older = entry.older;
      entry.older.newer = entry.newer;
    }
    delete this.entries_[key];
    --this.count_;
    return entry.value_;
  }
  getCount() {
    return this.count_;
  }
  getKeys() {
    const keys = new Array(this.count_);
    let i = 0;
    let entry;
    for (entry = this.newest_; entry; entry = entry.older) {
      keys[i++] = entry.key_;
    }
    return keys;
  }
  getValues() {
    const values = new Array(this.count_);
    let i = 0;
    let entry;
    for (entry = this.newest_; entry; entry = entry.older) {
      values[i++] = entry.value_;
    }
    return values;
  }
  peekLast() {
    return this.oldest_.value_;
  }
  peekLastKey() {
    return this.oldest_.key_;
  }
  peekFirstKey() {
    return this.newest_.key_;
  }
  peek(key) {
    if (!this.containsKey(key)) {
      return void 0;
    }
    return this.entries_[key].value_;
  }
  pop() {
    const entry = this.oldest_;
    delete this.entries_[entry.key_];
    if (entry.newer) {
      entry.newer.older = null;
    }
    this.oldest_ = entry.newer;
    if (!this.oldest_) {
      this.newest_ = null;
    }
    --this.count_;
    return entry.value_;
  }
  replace(key, value) {
    this.get(key);
    this.entries_[key].value_ = value;
  }
  set(key, value) {
    assert(!(key in this.entries_), 16);
    const entry = {
      key_: key,
      newer: null,
      older: this.newest_,
      value_: value
    };
    if (!this.newest_) {
      this.oldest_ = entry;
    } else {
      this.newest_.newer = entry;
    }
    this.newest_ = entry;
    this.entries_[key] = entry;
    ++this.count_;
  }
  setSize(size) {
    this.highWaterMark = size;
  }
}
const LRUCache$1 = LRUCache;
const ERROR_THRESHOLD = 0.5;
class Tile extends EventTarget {
  constructor(tileCoord, state, options) {
    super();
    options = options ? options : {};
    this.tileCoord = tileCoord;
    this.state = state;
    this.interimTile = null;
    this.key = "";
    this.transition_ = options.transition === void 0 ? 250 : options.transition;
    this.transitionStarts_ = {};
    this.interpolate = !!options.interpolate;
  }
  changed() {
    this.dispatchEvent(EventType.CHANGE);
  }
  release() {
    if (this.state === TileState.ERROR) {
      this.setState(TileState.EMPTY);
    }
  }
  getKey() {
    return this.key + "/" + this.tileCoord;
  }
  getInterimTile() {
    if (!this.interimTile) {
      return this;
    }
    let tile = this.interimTile;
    do {
      if (tile.getState() == TileState.LOADED) {
        this.transition_ = 0;
        return tile;
      }
      tile = tile.interimTile;
    } while (tile);
    return this;
  }
  refreshInterimChain() {
    if (!this.interimTile) {
      return;
    }
    let tile = this.interimTile;
    let prev = this;
    do {
      if (tile.getState() == TileState.LOADED) {
        tile.interimTile = null;
        break;
      } else if (tile.getState() == TileState.LOADING) {
        prev = tile;
      } else if (tile.getState() == TileState.IDLE) {
        prev.interimTile = tile.interimTile;
      } else {
        prev = tile;
      }
      tile = prev.interimTile;
    } while (tile);
  }
  getTileCoord() {
    return this.tileCoord;
  }
  getState() {
    return this.state;
  }
  setState(state) {
    if (this.state !== TileState.ERROR && this.state > state) {
      throw new Error("Tile load sequence violation");
    }
    this.state = state;
    this.changed();
  }
  load() {
    abstract();
  }
  getAlpha(id, time) {
    if (!this.transition_) {
      return 1;
    }
    let start = this.transitionStarts_[id];
    if (!start) {
      start = time;
      this.transitionStarts_[id] = start;
    } else if (start === -1) {
      return 1;
    }
    const delta = time - start + 1e3 / 60;
    if (delta >= this.transition_) {
      return 1;
    }
    return easeIn(delta / this.transition_);
  }
  inTransition(id) {
    if (!this.transition_) {
      return false;
    }
    return this.transitionStarts_[id] !== -1;
  }
  endTransition(id) {
    if (this.transition_) {
      this.transitionStarts_[id] = -1;
    }
  }
}
const Tile$1 = Tile;
const MAX_SUBDIVISION = 10;
const MAX_TRIANGLE_WIDTH = 0.25;
class Triangulation {
  constructor(sourceProj, targetProj, targetExtent, maxSourceExtent, errorThreshold, destinationResolution) {
    this.sourceProj_ = sourceProj;
    this.targetProj_ = targetProj;
    let transformInvCache = {};
    const transformInv = getTransform(this.targetProj_, this.sourceProj_);
    this.transformInv_ = function(c) {
      const key = c[0] + "/" + c[1];
      if (!transformInvCache[key]) {
        transformInvCache[key] = transformInv(c);
      }
      return transformInvCache[key];
    };
    this.maxSourceExtent_ = maxSourceExtent;
    this.errorThresholdSquared_ = errorThreshold * errorThreshold;
    this.triangles_ = [];
    this.wrapsXInSource_ = false;
    this.canWrapXInSource_ = this.sourceProj_.canWrapX() && !!maxSourceExtent && !!this.sourceProj_.getExtent() && getWidth(maxSourceExtent) == getWidth(this.sourceProj_.getExtent());
    this.sourceWorldWidth_ = this.sourceProj_.getExtent() ? getWidth(this.sourceProj_.getExtent()) : null;
    this.targetWorldWidth_ = this.targetProj_.getExtent() ? getWidth(this.targetProj_.getExtent()) : null;
    const destinationTopLeft = getTopLeft(targetExtent);
    const destinationTopRight = getTopRight(targetExtent);
    const destinationBottomRight = getBottomRight(targetExtent);
    const destinationBottomLeft = getBottomLeft(targetExtent);
    const sourceTopLeft = this.transformInv_(destinationTopLeft);
    const sourceTopRight = this.transformInv_(destinationTopRight);
    const sourceBottomRight = this.transformInv_(destinationBottomRight);
    const sourceBottomLeft = this.transformInv_(destinationBottomLeft);
    const maxSubdivision = MAX_SUBDIVISION + (destinationResolution ? Math.max(
      0,
      Math.ceil(
        Math.log2(
          getArea(targetExtent) / (destinationResolution * destinationResolution * 256 * 256)
        )
      )
    ) : 0);
    this.addQuad_(
      destinationTopLeft,
      destinationTopRight,
      destinationBottomRight,
      destinationBottomLeft,
      sourceTopLeft,
      sourceTopRight,
      sourceBottomRight,
      sourceBottomLeft,
      maxSubdivision
    );
    if (this.wrapsXInSource_) {
      let leftBound = Infinity;
      this.triangles_.forEach(function(triangle, i, arr) {
        leftBound = Math.min(
          leftBound,
          triangle.source[0][0],
          triangle.source[1][0],
          triangle.source[2][0]
        );
      });
      this.triangles_.forEach(
        function(triangle) {
          if (Math.max(
            triangle.source[0][0],
            triangle.source[1][0],
            triangle.source[2][0]
          ) - leftBound > this.sourceWorldWidth_ / 2) {
            const newTriangle = [
              [triangle.source[0][0], triangle.source[0][1]],
              [triangle.source[1][0], triangle.source[1][1]],
              [triangle.source[2][0], triangle.source[2][1]]
            ];
            if (newTriangle[0][0] - leftBound > this.sourceWorldWidth_ / 2) {
              newTriangle[0][0] -= this.sourceWorldWidth_;
            }
            if (newTriangle[1][0] - leftBound > this.sourceWorldWidth_ / 2) {
              newTriangle[1][0] -= this.sourceWorldWidth_;
            }
            if (newTriangle[2][0] - leftBound > this.sourceWorldWidth_ / 2) {
              newTriangle[2][0] -= this.sourceWorldWidth_;
            }
            const minX = Math.min(
              newTriangle[0][0],
              newTriangle[1][0],
              newTriangle[2][0]
            );
            const maxX = Math.max(
              newTriangle[0][0],
              newTriangle[1][0],
              newTriangle[2][0]
            );
            if (maxX - minX < this.sourceWorldWidth_ / 2) {
              triangle.source = newTriangle;
            }
          }
        }.bind(this)
      );
    }
    transformInvCache = {};
  }
  addTriangle_(a, b, c, aSrc, bSrc, cSrc) {
    this.triangles_.push({
      source: [aSrc, bSrc, cSrc],
      target: [a, b, c]
    });
  }
  addQuad_(a, b, c, d, aSrc, bSrc, cSrc, dSrc, maxSubdivision) {
    const sourceQuadExtent = boundingExtent([aSrc, bSrc, cSrc, dSrc]);
    const sourceCoverageX = this.sourceWorldWidth_ ? getWidth(sourceQuadExtent) / this.sourceWorldWidth_ : null;
    const sourceWorldWidth = this.sourceWorldWidth_;
    const wrapsX = this.sourceProj_.canWrapX() && sourceCoverageX > 0.5 && sourceCoverageX < 1;
    let needsSubdivision = false;
    if (maxSubdivision > 0) {
      if (this.targetProj_.isGlobal() && this.targetWorldWidth_) {
        const targetQuadExtent = boundingExtent([a, b, c, d]);
        const targetCoverageX = getWidth(targetQuadExtent) / this.targetWorldWidth_;
        needsSubdivision = targetCoverageX > MAX_TRIANGLE_WIDTH || needsSubdivision;
      }
      if (!wrapsX && this.sourceProj_.isGlobal() && sourceCoverageX) {
        needsSubdivision = sourceCoverageX > MAX_TRIANGLE_WIDTH || needsSubdivision;
      }
    }
    if (!needsSubdivision && this.maxSourceExtent_) {
      if (isFinite(sourceQuadExtent[0]) && isFinite(sourceQuadExtent[1]) && isFinite(sourceQuadExtent[2]) && isFinite(sourceQuadExtent[3])) {
        if (!intersects(sourceQuadExtent, this.maxSourceExtent_)) {
          return;
        }
      }
    }
    let isNotFinite = 0;
    if (!needsSubdivision) {
      if (!isFinite(aSrc[0]) || !isFinite(aSrc[1]) || !isFinite(bSrc[0]) || !isFinite(bSrc[1]) || !isFinite(cSrc[0]) || !isFinite(cSrc[1]) || !isFinite(dSrc[0]) || !isFinite(dSrc[1])) {
        if (maxSubdivision > 0) {
          needsSubdivision = true;
        } else {
          isNotFinite = (!isFinite(aSrc[0]) || !isFinite(aSrc[1]) ? 8 : 0) + (!isFinite(bSrc[0]) || !isFinite(bSrc[1]) ? 4 : 0) + (!isFinite(cSrc[0]) || !isFinite(cSrc[1]) ? 2 : 0) + (!isFinite(dSrc[0]) || !isFinite(dSrc[1]) ? 1 : 0);
          if (isNotFinite != 1 && isNotFinite != 2 && isNotFinite != 4 && isNotFinite != 8) {
            return;
          }
        }
      }
    }
    if (maxSubdivision > 0) {
      if (!needsSubdivision) {
        const center = [(a[0] + c[0]) / 2, (a[1] + c[1]) / 2];
        const centerSrc = this.transformInv_(center);
        let dx;
        if (wrapsX) {
          const centerSrcEstimX = (modulo(aSrc[0], sourceWorldWidth) + modulo(cSrc[0], sourceWorldWidth)) / 2;
          dx = centerSrcEstimX - modulo(centerSrc[0], sourceWorldWidth);
        } else {
          dx = (aSrc[0] + cSrc[0]) / 2 - centerSrc[0];
        }
        const dy = (aSrc[1] + cSrc[1]) / 2 - centerSrc[1];
        const centerSrcErrorSquared = dx * dx + dy * dy;
        needsSubdivision = centerSrcErrorSquared > this.errorThresholdSquared_;
      }
      if (needsSubdivision) {
        if (Math.abs(a[0] - c[0]) <= Math.abs(a[1] - c[1])) {
          const bc = [(b[0] + c[0]) / 2, (b[1] + c[1]) / 2];
          const bcSrc = this.transformInv_(bc);
          const da = [(d[0] + a[0]) / 2, (d[1] + a[1]) / 2];
          const daSrc = this.transformInv_(da);
          this.addQuad_(
            a,
            b,
            bc,
            da,
            aSrc,
            bSrc,
            bcSrc,
            daSrc,
            maxSubdivision - 1
          );
          this.addQuad_(
            da,
            bc,
            c,
            d,
            daSrc,
            bcSrc,
            cSrc,
            dSrc,
            maxSubdivision - 1
          );
        } else {
          const ab = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
          const abSrc = this.transformInv_(ab);
          const cd = [(c[0] + d[0]) / 2, (c[1] + d[1]) / 2];
          const cdSrc = this.transformInv_(cd);
          this.addQuad_(
            a,
            ab,
            cd,
            d,
            aSrc,
            abSrc,
            cdSrc,
            dSrc,
            maxSubdivision - 1
          );
          this.addQuad_(
            ab,
            b,
            c,
            cd,
            abSrc,
            bSrc,
            cSrc,
            cdSrc,
            maxSubdivision - 1
          );
        }
        return;
      }
    }
    if (wrapsX) {
      if (!this.canWrapXInSource_) {
        return;
      }
      this.wrapsXInSource_ = true;
    }
    if ((isNotFinite & 11) == 0) {
      this.addTriangle_(a, c, d, aSrc, cSrc, dSrc);
    }
    if ((isNotFinite & 14) == 0) {
      this.addTriangle_(a, c, b, aSrc, cSrc, bSrc);
    }
    if (isNotFinite) {
      if ((isNotFinite & 13) == 0) {
        this.addTriangle_(b, d, a, bSrc, dSrc, aSrc);
      }
      if ((isNotFinite & 7) == 0) {
        this.addTriangle_(b, d, c, bSrc, dSrc, cSrc);
      }
    }
  }
  calculateSourceExtent() {
    const extent2 = createEmpty();
    this.triangles_.forEach(function(triangle, i, arr) {
      const src = triangle.source;
      extendCoordinate(extent2, src[0]);
      extendCoordinate(extent2, src[1]);
      extendCoordinate(extent2, src[2]);
    });
    return extent2;
  }
  getTriangles() {
    return this.triangles_;
  }
}
const Triangulation$1 = Triangulation;
let brokenDiagonalRendering_;
const canvasPool = [];
function drawTestTriangle(ctx, u1, v1, u2, v2) {
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(u1, v1);
  ctx.lineTo(u2, v2);
  ctx.closePath();
  ctx.save();
  ctx.clip();
  ctx.fillRect(0, 0, Math.max(u1, u2) + 1, Math.max(v1, v2));
  ctx.restore();
}
function verifyBrokenDiagonalRendering(data, offset) {
  return Math.abs(data[offset * 4] - 210) > 2 || Math.abs(data[offset * 4 + 3] - 0.75 * 255) > 2;
}
function isBrokenDiagonalRendering() {
  if (brokenDiagonalRendering_ === void 0) {
    const ctx = document.createElement("canvas").getContext("2d");
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = "rgba(210, 0, 0, 0.75)";
    drawTestTriangle(ctx, 4, 5, 4, 0);
    drawTestTriangle(ctx, 4, 5, 0, 5);
    const data = ctx.getImageData(0, 0, 3, 3).data;
    brokenDiagonalRendering_ = verifyBrokenDiagonalRendering(data, 0) || verifyBrokenDiagonalRendering(data, 4) || verifyBrokenDiagonalRendering(data, 8);
  }
  return brokenDiagonalRendering_;
}
function calculateSourceResolution(sourceProj, targetProj, targetCenter, targetResolution) {
  const sourceCenter = transform(targetCenter, targetProj, sourceProj);
  let sourceResolution = getPointResolution(
    targetProj,
    targetResolution,
    targetCenter
  );
  const targetMetersPerUnit = targetProj.getMetersPerUnit();
  if (targetMetersPerUnit !== void 0) {
    sourceResolution *= targetMetersPerUnit;
  }
  const sourceMetersPerUnit = sourceProj.getMetersPerUnit();
  if (sourceMetersPerUnit !== void 0) {
    sourceResolution /= sourceMetersPerUnit;
  }
  const sourceExtent = sourceProj.getExtent();
  if (!sourceExtent || containsCoordinate(sourceExtent, sourceCenter)) {
    const compensationFactor = getPointResolution(sourceProj, sourceResolution, sourceCenter) / sourceResolution;
    if (isFinite(compensationFactor) && compensationFactor > 0) {
      sourceResolution /= compensationFactor;
    }
  }
  return sourceResolution;
}
function calculateSourceExtentResolution(sourceProj, targetProj, targetExtent, targetResolution) {
  const targetCenter = getCenter(targetExtent);
  let sourceResolution = calculateSourceResolution(
    sourceProj,
    targetProj,
    targetCenter,
    targetResolution
  );
  if (!isFinite(sourceResolution) || sourceResolution <= 0) {
    forEachCorner(targetExtent, function(corner) {
      sourceResolution = calculateSourceResolution(
        sourceProj,
        targetProj,
        corner,
        targetResolution
      );
      return isFinite(sourceResolution) && sourceResolution > 0;
    });
  }
  return sourceResolution;
}
function render(width, height, pixelRatio, sourceResolution, sourceExtent, targetResolution, targetExtent, triangulation, sources, gutter, renderEdges, interpolate) {
  const context2 = createCanvasContext2D(
    Math.round(pixelRatio * width),
    Math.round(pixelRatio * height),
    canvasPool
  );
  if (!interpolate) {
    context2.imageSmoothingEnabled = false;
  }
  if (sources.length === 0) {
    return context2.canvas;
  }
  context2.scale(pixelRatio, pixelRatio);
  function pixelRound(value) {
    return Math.round(value * pixelRatio) / pixelRatio;
  }
  context2.globalCompositeOperation = "lighter";
  const sourceDataExtent = createEmpty();
  sources.forEach(function(src, i, arr) {
    extend(sourceDataExtent, src.extent);
  });
  const canvasWidthInUnits = getWidth(sourceDataExtent);
  const canvasHeightInUnits = getHeight(sourceDataExtent);
  const stitchContext = createCanvasContext2D(
    Math.round(pixelRatio * canvasWidthInUnits / sourceResolution),
    Math.round(pixelRatio * canvasHeightInUnits / sourceResolution)
  );
  if (!interpolate) {
    stitchContext.imageSmoothingEnabled = false;
  }
  const stitchScale = pixelRatio / sourceResolution;
  sources.forEach(function(src, i, arr) {
    const xPos = src.extent[0] - sourceDataExtent[0];
    const yPos = -(src.extent[3] - sourceDataExtent[3]);
    const srcWidth = getWidth(src.extent);
    const srcHeight = getHeight(src.extent);
    if (src.image.width > 0 && src.image.height > 0) {
      stitchContext.drawImage(
        src.image,
        gutter,
        gutter,
        src.image.width - 2 * gutter,
        src.image.height - 2 * gutter,
        xPos * stitchScale,
        yPos * stitchScale,
        srcWidth * stitchScale,
        srcHeight * stitchScale
      );
    }
  });
  const targetTopLeft = getTopLeft(targetExtent);
  triangulation.getTriangles().forEach(function(triangle, i, arr) {
    const source = triangle.source;
    const target = triangle.target;
    let x0 = source[0][0], y0 = source[0][1];
    let x1 = source[1][0], y1 = source[1][1];
    let x2 = source[2][0], y2 = source[2][1];
    const u0 = pixelRound((target[0][0] - targetTopLeft[0]) / targetResolution);
    const v0 = pixelRound(
      -(target[0][1] - targetTopLeft[1]) / targetResolution
    );
    const u1 = pixelRound((target[1][0] - targetTopLeft[0]) / targetResolution);
    const v1 = pixelRound(
      -(target[1][1] - targetTopLeft[1]) / targetResolution
    );
    const u2 = pixelRound((target[2][0] - targetTopLeft[0]) / targetResolution);
    const v2 = pixelRound(
      -(target[2][1] - targetTopLeft[1]) / targetResolution
    );
    const sourceNumericalShiftX = x0;
    const sourceNumericalShiftY = y0;
    x0 = 0;
    y0 = 0;
    x1 -= sourceNumericalShiftX;
    y1 -= sourceNumericalShiftY;
    x2 -= sourceNumericalShiftX;
    y2 -= sourceNumericalShiftY;
    const augmentedMatrix = [
      [x1, y1, 0, 0, u1 - u0],
      [x2, y2, 0, 0, u2 - u0],
      [0, 0, x1, y1, v1 - v0],
      [0, 0, x2, y2, v2 - v0]
    ];
    const affineCoefs = solveLinearSystem(augmentedMatrix);
    if (!affineCoefs) {
      return;
    }
    context2.save();
    context2.beginPath();
    if (isBrokenDiagonalRendering() || !interpolate) {
      context2.moveTo(u1, v1);
      const steps = 4;
      const ud = u0 - u1;
      const vd = v0 - v1;
      for (let step = 0; step < steps; step++) {
        context2.lineTo(
          u1 + pixelRound((step + 1) * ud / steps),
          v1 + pixelRound(step * vd / (steps - 1))
        );
        if (step != steps - 1) {
          context2.lineTo(
            u1 + pixelRound((step + 1) * ud / steps),
            v1 + pixelRound((step + 1) * vd / (steps - 1))
          );
        }
      }
      context2.lineTo(u2, v2);
    } else {
      context2.moveTo(u1, v1);
      context2.lineTo(u0, v0);
      context2.lineTo(u2, v2);
    }
    context2.clip();
    context2.transform(
      affineCoefs[0],
      affineCoefs[2],
      affineCoefs[1],
      affineCoefs[3],
      u0,
      v0
    );
    context2.translate(
      sourceDataExtent[0] - sourceNumericalShiftX,
      sourceDataExtent[3] - sourceNumericalShiftY
    );
    context2.scale(
      sourceResolution / pixelRatio,
      -sourceResolution / pixelRatio
    );
    context2.drawImage(stitchContext.canvas, 0, 0);
    context2.restore();
  });
  if (renderEdges) {
    context2.save();
    context2.globalCompositeOperation = "source-over";
    context2.strokeStyle = "black";
    context2.lineWidth = 1;
    triangulation.getTriangles().forEach(function(triangle, i, arr) {
      const target = triangle.target;
      const u0 = (target[0][0] - targetTopLeft[0]) / targetResolution;
      const v0 = -(target[0][1] - targetTopLeft[1]) / targetResolution;
      const u1 = (target[1][0] - targetTopLeft[0]) / targetResolution;
      const v1 = -(target[1][1] - targetTopLeft[1]) / targetResolution;
      const u2 = (target[2][0] - targetTopLeft[0]) / targetResolution;
      const v2 = -(target[2][1] - targetTopLeft[1]) / targetResolution;
      context2.beginPath();
      context2.moveTo(u1, v1);
      context2.lineTo(u0, v0);
      context2.lineTo(u2, v2);
      context2.closePath();
      context2.stroke();
    });
    context2.restore();
  }
  return context2.canvas;
}
class ReprojTile extends Tile$1 {
  constructor(sourceProj, sourceTileGrid, targetProj, targetTileGrid, tileCoord, wrappedTileCoord, pixelRatio, gutter, getTileFunction, errorThreshold, renderEdges, interpolate) {
    super(tileCoord, TileState.IDLE, { interpolate: !!interpolate });
    this.renderEdges_ = renderEdges !== void 0 ? renderEdges : false;
    this.pixelRatio_ = pixelRatio;
    this.gutter_ = gutter;
    this.canvas_ = null;
    this.sourceTileGrid_ = sourceTileGrid;
    this.targetTileGrid_ = targetTileGrid;
    this.wrappedTileCoord_ = wrappedTileCoord ? wrappedTileCoord : tileCoord;
    this.sourceTiles_ = [];
    this.sourcesListenerKeys_ = null;
    this.sourceZ_ = 0;
    const targetExtent = targetTileGrid.getTileCoordExtent(
      this.wrappedTileCoord_
    );
    const maxTargetExtent = this.targetTileGrid_.getExtent();
    let maxSourceExtent = this.sourceTileGrid_.getExtent();
    const limitedTargetExtent = maxTargetExtent ? getIntersection(targetExtent, maxTargetExtent) : targetExtent;
    if (getArea(limitedTargetExtent) === 0) {
      this.state = TileState.EMPTY;
      return;
    }
    const sourceProjExtent = sourceProj.getExtent();
    if (sourceProjExtent) {
      if (!maxSourceExtent) {
        maxSourceExtent = sourceProjExtent;
      } else {
        maxSourceExtent = getIntersection(maxSourceExtent, sourceProjExtent);
      }
    }
    const targetResolution = targetTileGrid.getResolution(
      this.wrappedTileCoord_[0]
    );
    const sourceResolution = calculateSourceExtentResolution(
      sourceProj,
      targetProj,
      limitedTargetExtent,
      targetResolution
    );
    if (!isFinite(sourceResolution) || sourceResolution <= 0) {
      this.state = TileState.EMPTY;
      return;
    }
    const errorThresholdInPixels = errorThreshold !== void 0 ? errorThreshold : ERROR_THRESHOLD;
    this.triangulation_ = new Triangulation$1(
      sourceProj,
      targetProj,
      limitedTargetExtent,
      maxSourceExtent,
      sourceResolution * errorThresholdInPixels,
      targetResolution
    );
    if (this.triangulation_.getTriangles().length === 0) {
      this.state = TileState.EMPTY;
      return;
    }
    this.sourceZ_ = sourceTileGrid.getZForResolution(sourceResolution);
    let sourceExtent = this.triangulation_.calculateSourceExtent();
    if (maxSourceExtent) {
      if (sourceProj.canWrapX()) {
        sourceExtent[1] = clamp(
          sourceExtent[1],
          maxSourceExtent[1],
          maxSourceExtent[3]
        );
        sourceExtent[3] = clamp(
          sourceExtent[3],
          maxSourceExtent[1],
          maxSourceExtent[3]
        );
      } else {
        sourceExtent = getIntersection(sourceExtent, maxSourceExtent);
      }
    }
    if (!getArea(sourceExtent)) {
      this.state = TileState.EMPTY;
    } else {
      const sourceRange = sourceTileGrid.getTileRangeForExtentAndZ(
        sourceExtent,
        this.sourceZ_
      );
      for (let srcX = sourceRange.minX; srcX <= sourceRange.maxX; srcX++) {
        for (let srcY = sourceRange.minY; srcY <= sourceRange.maxY; srcY++) {
          const tile = getTileFunction(this.sourceZ_, srcX, srcY, pixelRatio);
          if (tile) {
            this.sourceTiles_.push(tile);
          }
        }
      }
      if (this.sourceTiles_.length === 0) {
        this.state = TileState.EMPTY;
      }
    }
  }
  getImage() {
    return this.canvas_;
  }
  reproject_() {
    const sources = [];
    this.sourceTiles_.forEach(
      function(tile, i, arr) {
        if (tile && tile.getState() == TileState.LOADED) {
          sources.push({
            extent: this.sourceTileGrid_.getTileCoordExtent(tile.tileCoord),
            image: tile.getImage()
          });
        }
      }.bind(this)
    );
    this.sourceTiles_.length = 0;
    if (sources.length === 0) {
      this.state = TileState.ERROR;
    } else {
      const z = this.wrappedTileCoord_[0];
      const size = this.targetTileGrid_.getTileSize(z);
      const width = typeof size === "number" ? size : size[0];
      const height = typeof size === "number" ? size : size[1];
      const targetResolution = this.targetTileGrid_.getResolution(z);
      const sourceResolution = this.sourceTileGrid_.getResolution(
        this.sourceZ_
      );
      const targetExtent = this.targetTileGrid_.getTileCoordExtent(
        this.wrappedTileCoord_
      );
      this.canvas_ = render(
        width,
        height,
        this.pixelRatio_,
        sourceResolution,
        this.sourceTileGrid_.getExtent(),
        targetResolution,
        targetExtent,
        this.triangulation_,
        sources,
        this.gutter_,
        this.renderEdges_,
        this.interpolate
      );
      this.state = TileState.LOADED;
    }
    this.changed();
  }
  load() {
    if (this.state == TileState.IDLE) {
      this.state = TileState.LOADING;
      this.changed();
      let leftToLoad = 0;
      this.sourcesListenerKeys_ = [];
      this.sourceTiles_.forEach(
        function(tile, i, arr) {
          const state = tile.getState();
          if (state == TileState.IDLE || state == TileState.LOADING) {
            leftToLoad++;
            const sourceListenKey = listen(
              tile,
              EventType.CHANGE,
              function(e) {
                const state2 = tile.getState();
                if (state2 == TileState.LOADED || state2 == TileState.ERROR || state2 == TileState.EMPTY) {
                  unlistenByKey(sourceListenKey);
                  leftToLoad--;
                  if (leftToLoad === 0) {
                    this.unlistenSources_();
                    this.reproject_();
                  }
                }
              },
              this
            );
            this.sourcesListenerKeys_.push(sourceListenKey);
          }
        }.bind(this)
      );
      if (leftToLoad === 0) {
        setTimeout(this.reproject_.bind(this), 0);
      } else {
        this.sourceTiles_.forEach(function(tile, i, arr) {
          const state = tile.getState();
          if (state == TileState.IDLE) {
            tile.load();
          }
        });
      }
    }
  }
  unlistenSources_() {
    this.sourcesListenerKeys_.forEach(unlistenByKey);
    this.sourcesListenerKeys_ = null;
  }
  release() {
    if (this.canvas_) {
      releaseCanvas$1(this.canvas_.getContext("2d"));
      canvasPool.push(this.canvas_);
      this.canvas_ = null;
    }
    super.release();
  }
}
const ReprojTile$1 = ReprojTile;
class TileRange {
  constructor(minX, maxX, minY, maxY) {
    this.minX = minX;
    this.maxX = maxX;
    this.minY = minY;
    this.maxY = maxY;
  }
  contains(tileCoord) {
    return this.containsXY(tileCoord[1], tileCoord[2]);
  }
  containsTileRange(tileRange) {
    return this.minX <= tileRange.minX && tileRange.maxX <= this.maxX && this.minY <= tileRange.minY && tileRange.maxY <= this.maxY;
  }
  containsXY(x, y) {
    return this.minX <= x && x <= this.maxX && this.minY <= y && y <= this.maxY;
  }
  equals(tileRange) {
    return this.minX == tileRange.minX && this.minY == tileRange.minY && this.maxX == tileRange.maxX && this.maxY == tileRange.maxY;
  }
  extend(tileRange) {
    if (tileRange.minX < this.minX) {
      this.minX = tileRange.minX;
    }
    if (tileRange.maxX > this.maxX) {
      this.maxX = tileRange.maxX;
    }
    if (tileRange.minY < this.minY) {
      this.minY = tileRange.minY;
    }
    if (tileRange.maxY > this.maxY) {
      this.maxY = tileRange.maxY;
    }
  }
  getHeight() {
    return this.maxY - this.minY + 1;
  }
  getSize() {
    return [this.getWidth(), this.getHeight()];
  }
  getWidth() {
    return this.maxX - this.minX + 1;
  }
  intersects(tileRange) {
    return this.minX <= tileRange.maxX && this.maxX >= tileRange.minX && this.minY <= tileRange.maxY && this.maxY >= tileRange.minY;
  }
}
function createOrUpdate$1(minX, maxX, minY, maxY, tileRange) {
  if (tileRange !== void 0) {
    tileRange.minX = minX;
    tileRange.maxX = maxX;
    tileRange.minY = minY;
    tileRange.maxY = maxY;
    return tileRange;
  } else {
    return new TileRange(minX, maxX, minY, maxY);
  }
}
const TileRange$1 = TileRange;
class DataTile extends Tile$1 {
  constructor(options) {
    const state = TileState.IDLE;
    super(options.tileCoord, state, {
      transition: options.transition,
      interpolate: options.interpolate
    });
    this.loader_ = options.loader;
    this.data_ = null;
    this.error_ = null;
    this.size_ = options.size || [256, 256];
  }
  getSize() {
    return this.size_;
  }
  getData() {
    return this.data_;
  }
  getError() {
    return this.error_;
  }
  load() {
    if (this.state !== TileState.IDLE && this.state !== TileState.ERROR) {
      return;
    }
    this.state = TileState.LOADING;
    this.changed();
    const self2 = this;
    this.loader_().then(function(data) {
      self2.data_ = data;
      self2.state = TileState.LOADED;
      self2.changed();
    }).catch(function(error) {
      self2.error_ = error;
      self2.state = TileState.ERROR;
      self2.changed();
    });
  }
}
const DataTile$1 = DataTile;
class ImageBase extends EventTarget {
  constructor(extent2, resolution, pixelRatio, state) {
    super();
    this.extent = extent2;
    this.pixelRatio_ = pixelRatio;
    this.resolution = resolution;
    this.state = state;
  }
  changed() {
    this.dispatchEvent(EventType.CHANGE);
  }
  getExtent() {
    return this.extent;
  }
  getImage() {
    return abstract();
  }
  getPixelRatio() {
    return this.pixelRatio_;
  }
  getResolution() {
    return this.resolution;
  }
  getState() {
    return this.state;
  }
  load() {
    abstract();
  }
}
const ImageBase$1 = ImageBase;
const ImageState = {
  IDLE: 0,
  LOADING: 1,
  LOADED: 2,
  ERROR: 3,
  EMPTY: 4
};
function listenImage(image, loadHandler, errorHandler) {
  const img = image;
  let listening = true;
  let decoding = false;
  let loaded = false;
  const listenerKeys = [
    listenOnce(img, EventType.LOAD, function() {
      loaded = true;
      if (!decoding) {
        loadHandler();
      }
    })
  ];
  if (img.src && IMAGE_DECODE) {
    decoding = true;
    img.decode().then(function() {
      if (listening) {
        loadHandler();
      }
    }).catch(function(error) {
      if (listening) {
        if (loaded) {
          loadHandler();
        } else {
          errorHandler();
        }
      }
    });
  } else {
    listenerKeys.push(listenOnce(img, EventType.ERROR, errorHandler));
  }
  return function unlisten() {
    listening = false;
    listenerKeys.forEach(unlistenByKey);
  };
}
class ImageTile extends Tile$1 {
  constructor(tileCoord, state, src, crossOrigin, tileLoadFunction, options) {
    super(tileCoord, state, options);
    this.crossOrigin_ = crossOrigin;
    this.src_ = src;
    this.key = src;
    this.image_ = new Image();
    if (crossOrigin !== null) {
      this.image_.crossOrigin = crossOrigin;
    }
    this.unlisten_ = null;
    this.tileLoadFunction_ = tileLoadFunction;
  }
  getImage() {
    return this.image_;
  }
  setImage(element) {
    this.image_ = element;
    this.state = TileState.LOADED;
    this.unlistenImage_();
    this.changed();
  }
  handleImageError_() {
    this.state = TileState.ERROR;
    this.unlistenImage_();
    this.image_ = getBlankImage();
    this.changed();
  }
  handleImageLoad_() {
    const image = this.image_;
    if (image.naturalWidth && image.naturalHeight) {
      this.state = TileState.LOADED;
    } else {
      this.state = TileState.EMPTY;
    }
    this.unlistenImage_();
    this.changed();
  }
  load() {
    if (this.state == TileState.ERROR) {
      this.state = TileState.IDLE;
      this.image_ = new Image();
      if (this.crossOrigin_ !== null) {
        this.image_.crossOrigin = this.crossOrigin_;
      }
    }
    if (this.state == TileState.IDLE) {
      this.state = TileState.LOADING;
      this.changed();
      this.tileLoadFunction_(this, this.src_);
      this.unlisten_ = listenImage(
        this.image_,
        this.handleImageLoad_.bind(this),
        this.handleImageError_.bind(this)
      );
    }
  }
  unlistenImage_() {
    if (this.unlisten_) {
      this.unlisten_();
      this.unlisten_ = null;
    }
  }
}
function getBlankImage() {
  const ctx = createCanvasContext2D(1, 1);
  ctx.fillStyle = "rgba(0,0,0,0)";
  ctx.fillRect(0, 0, 1, 1);
  return ctx.canvas;
}
const ImageTile$1 = ImageTile;
const ARRAY_BUFFER = 34962;
const ELEMENT_ARRAY_BUFFER = 34963;
const STREAM_DRAW = 35040;
const STATIC_DRAW = 35044;
const DYNAMIC_DRAW = 35048;
const UNSIGNED_BYTE = 5121;
const UNSIGNED_SHORT = 5123;
const UNSIGNED_INT = 5125;
const FLOAT = 5126;
const CONTEXT_IDS = ["experimental-webgl", "webgl", "webkit-3d", "moz-webgl"];
function getContext(canvas, attributes) {
  attributes = Object.assign(
    {
      preserveDrawingBuffer: true,
      antialias: SAFARI_BUG_237906 ? false : true
    },
    attributes
  );
  const ii = CONTEXT_IDS.length;
  for (let i = 0; i < ii; ++i) {
    try {
      const context2 = canvas.getContext(CONTEXT_IDS[i], attributes);
      if (context2) {
        return context2;
      }
    } catch (e) {
    }
  }
  return null;
}
const BufferUsage = {
  STATIC_DRAW,
  STREAM_DRAW,
  DYNAMIC_DRAW
};
class WebGLArrayBuffer {
  constructor(type, usage) {
    this.array = null;
    this.type = type;
    assert(type === ARRAY_BUFFER || type === ELEMENT_ARRAY_BUFFER, 62);
    this.usage = usage !== void 0 ? usage : BufferUsage.STATIC_DRAW;
  }
  ofSize(size) {
    this.array = new (getArrayClassForType(this.type))(size);
  }
  fromArray(array) {
    this.array = getArrayClassForType(this.type).from(array);
  }
  fromArrayBuffer(buffer) {
    this.array = new (getArrayClassForType(this.type))(buffer);
  }
  getType() {
    return this.type;
  }
  getArray() {
    return this.array;
  }
  getUsage() {
    return this.usage;
  }
  getSize() {
    return this.array ? this.array.length : 0;
  }
}
function getArrayClassForType(type) {
  switch (type) {
    case ARRAY_BUFFER:
      return Float32Array;
    case ELEMENT_ARRAY_BUFFER:
      return Uint32Array;
    default:
      return Float32Array;
  }
}
const WebGLArrayBuffer$1 = WebGLArrayBuffer;
function bindAndConfigure(gl, texture, interpolate) {
  const resampleFilter = interpolate ? gl.LINEAR : gl.NEAREST;
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, resampleFilter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, resampleFilter);
}
function uploadImageTexture(gl, texture, image, interpolate) {
  bindAndConfigure(gl, texture, interpolate);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
}
function uploadDataTexture(helper, texture, data, size, bandCount, interpolate) {
  const gl = helper.getGL();
  let textureType;
  let canInterpolate;
  if (data instanceof Float32Array) {
    textureType = gl.FLOAT;
    helper.getExtension("OES_texture_float");
    const extension = helper.getExtension("OES_texture_float_linear");
    canInterpolate = extension !== null;
  } else {
    textureType = gl.UNSIGNED_BYTE;
    canInterpolate = true;
  }
  bindAndConfigure(gl, texture, interpolate && canInterpolate);
  const bytesPerRow = data.byteLength / size[1];
  let unpackAlignment = 1;
  if (bytesPerRow % 8 === 0) {
    unpackAlignment = 8;
  } else if (bytesPerRow % 4 === 0) {
    unpackAlignment = 4;
  } else if (bytesPerRow % 2 === 0) {
    unpackAlignment = 2;
  }
  let format;
  switch (bandCount) {
    case 1: {
      format = gl.LUMINANCE;
      break;
    }
    case 2: {
      format = gl.LUMINANCE_ALPHA;
      break;
    }
    case 3: {
      format = gl.RGB;
      break;
    }
    case 4: {
      format = gl.RGBA;
      break;
    }
    default: {
      throw new Error(`Unsupported number of bands: ${bandCount}`);
    }
  }
  const oldUnpackAlignment = gl.getParameter(gl.UNPACK_ALIGNMENT);
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, unpackAlignment);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    format,
    size[0],
    size[1],
    0,
    format,
    textureType,
    data
  );
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, oldUnpackAlignment);
}
let pixelContext$1 = null;
function createPixelContext$1() {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  pixelContext$1 = canvas.getContext("2d");
}
class TileTexture extends EventTarget {
  constructor(options) {
    super();
    this.tile;
    this.textures = [];
    this.handleTileChange_ = this.handleTileChange_.bind(this);
    this.renderSize_ = toSize(
      options.grid.getTileSize(options.tile.tileCoord[0])
    );
    this.gutter_ = options.gutter || 0;
    this.bandCount = NaN;
    this.helper_ = options.helper;
    const coords = new WebGLArrayBuffer$1(ARRAY_BUFFER, STATIC_DRAW);
    coords.fromArray([
      0,
      1,
      1,
      1,
      1,
      0,
      0,
      0
    ]);
    this.helper_.flushBufferData(coords);
    this.coords = coords;
    this.setTile(options.tile);
  }
  setTile(tile) {
    if (tile !== this.tile) {
      if (this.tile) {
        this.tile.removeEventListener(EventType.CHANGE, this.handleTileChange_);
      }
      this.tile = tile;
      this.textures.length = 0;
      this.loaded = tile.getState() === TileState.LOADED;
      if (this.loaded) {
        this.uploadTile_();
      } else {
        if (tile instanceof ImageTile$1) {
          const image = tile.getImage();
          if (image instanceof Image && !image.crossOrigin) {
            image.crossOrigin = "anonymous";
          }
        }
        tile.addEventListener(EventType.CHANGE, this.handleTileChange_);
      }
    }
  }
  uploadTile_() {
    const helper = this.helper_;
    const gl = helper.getGL();
    const tile = this.tile;
    if (tile instanceof ImageTile$1 || tile instanceof ReprojTile$1) {
      const texture = gl.createTexture();
      this.textures.push(texture);
      this.bandCount = 4;
      uploadImageTexture(gl, texture, tile.getImage(), tile.interpolate);
      return;
    }
    const sourceTileSize = tile.getSize();
    const pixelSize = [
      sourceTileSize[0] + 2 * this.gutter_,
      sourceTileSize[1] + 2 * this.gutter_
    ];
    const data = tile.getData();
    const isFloat = data instanceof Float32Array;
    const pixelCount = pixelSize[0] * pixelSize[1];
    const DataType = isFloat ? Float32Array : Uint8Array;
    const bytesPerElement = DataType.BYTES_PER_ELEMENT;
    const bytesPerRow = data.byteLength / pixelSize[1];
    this.bandCount = Math.floor(bytesPerRow / bytesPerElement / pixelSize[0]);
    const textureCount = Math.ceil(this.bandCount / 4);
    if (textureCount === 1) {
      const texture = gl.createTexture();
      this.textures.push(texture);
      uploadDataTexture(
        helper,
        texture,
        data,
        pixelSize,
        this.bandCount,
        tile.interpolate
      );
      return;
    }
    const textureDataArrays = new Array(textureCount);
    for (let textureIndex = 0; textureIndex < textureCount; ++textureIndex) {
      const texture = gl.createTexture();
      this.textures.push(texture);
      const bandCount = textureIndex < textureCount - 1 ? 4 : (this.bandCount - 1) % 4 + 1;
      textureDataArrays[textureIndex] = new DataType(pixelCount * bandCount);
    }
    let dataIndex = 0;
    let rowOffset = 0;
    const colCount = pixelSize[0] * this.bandCount;
    for (let rowIndex = 0; rowIndex < pixelSize[1]; ++rowIndex) {
      for (let colIndex = 0; colIndex < colCount; ++colIndex) {
        const dataValue = data[rowOffset + colIndex];
        const pixelIndex = Math.floor(dataIndex / this.bandCount);
        const bandIndex = colIndex % this.bandCount;
        const textureIndex = Math.floor(bandIndex / 4);
        const textureData = textureDataArrays[textureIndex];
        const bandCount = textureData.length / pixelCount;
        const textureBandIndex = bandIndex % 4;
        textureData[pixelIndex * bandCount + textureBandIndex] = dataValue;
        ++dataIndex;
      }
      rowOffset += bytesPerRow / bytesPerElement;
    }
    for (let textureIndex = 0; textureIndex < textureCount; ++textureIndex) {
      const texture = this.textures[textureIndex];
      const textureData = textureDataArrays[textureIndex];
      const bandCount = textureData.length / pixelCount;
      uploadDataTexture(
        helper,
        texture,
        textureData,
        pixelSize,
        bandCount,
        tile.interpolate
      );
    }
  }
  handleTileChange_() {
    if (this.tile.getState() === TileState.LOADED) {
      this.loaded = true;
      this.uploadTile_();
      this.dispatchEvent(EventType.CHANGE);
    }
  }
  disposeInternal() {
    const gl = this.helper_.getGL();
    this.helper_.deleteBuffer(this.coords);
    for (let i = 0; i < this.textures.length; ++i) {
      gl.deleteTexture(this.textures[i]);
    }
    this.tile.removeEventListener(EventType.CHANGE, this.handleTileChange_);
  }
  getPixelData(renderCol, renderRow) {
    if (!this.loaded) {
      return null;
    }
    const renderWidth = this.renderSize_[0];
    const renderHeight = this.renderSize_[1];
    const gutter = this.gutter_;
    if (this.tile instanceof DataTile$1) {
      const sourceSize = this.tile.getSize();
      const sourceWidthWithoutGutter2 = sourceSize[0];
      const sourceHeightWithoutGutter2 = sourceSize[1];
      const sourceWidth2 = sourceWidthWithoutGutter2 + 2 * gutter;
      const sourceHeight2 = sourceHeightWithoutGutter2 + 2 * gutter;
      const sourceCol2 = gutter + Math.floor(sourceWidthWithoutGutter2 * (renderCol / renderWidth));
      const sourceRow2 = gutter + Math.floor(sourceHeightWithoutGutter2 * (renderRow / renderHeight));
      const data2 = this.tile.getData();
      if (data2 instanceof DataView) {
        const bytesPerPixel = data2.byteLength / (sourceWidth2 * sourceHeight2);
        const offset2 = bytesPerPixel * (sourceRow2 * sourceWidth2 + sourceCol2);
        const buffer = data2.buffer.slice(offset2, offset2 + bytesPerPixel);
        return new DataView(buffer);
      }
      const offset = this.bandCount * (sourceRow2 * sourceWidth2 + sourceCol2);
      return data2.slice(offset, offset + this.bandCount);
    }
    if (!pixelContext$1) {
      createPixelContext$1();
    }
    pixelContext$1.clearRect(0, 0, 1, 1);
    const image = this.tile.getImage();
    const sourceWidth = image.width;
    const sourceHeight = image.height;
    const sourceWidthWithoutGutter = sourceWidth - 2 * gutter;
    const sourceHeightWithoutGutter = sourceHeight - 2 * gutter;
    const sourceCol = gutter + Math.floor(sourceWidthWithoutGutter * (renderCol / renderWidth));
    const sourceRow = gutter + Math.floor(sourceHeightWithoutGutter * (renderRow / renderHeight));
    let data;
    try {
      pixelContext$1.drawImage(image, sourceCol, sourceRow, 1, 1, 0, 0, 1, 1);
      data = pixelContext$1.getImageData(0, 0, 1, 1).data;
    } catch (err) {
      pixelContext$1 = null;
      return null;
    }
    return data;
  }
}
const TileTexture$1 = TileTexture;
class LayerRenderer extends Observable$1 {
  constructor(layer) {
    super();
    this.ready = true;
    this.boundHandleImageChange_ = this.handleImageChange_.bind(this);
    this.layer_ = layer;
    this.declutterExecutorGroup = null;
  }
  getFeatures(pixel) {
    return abstract();
  }
  getData(pixel) {
    return null;
  }
  prepareFrame(frameState) {
    return abstract();
  }
  renderFrame(frameState, target) {
    return abstract();
  }
  loadedTileCallback(tiles, zoom, tile) {
    if (!tiles[zoom]) {
      tiles[zoom] = {};
    }
    tiles[zoom][tile.tileCoord.toString()] = tile;
    return void 0;
  }
  createLoadedTileFinder(source, projection, tiles) {
    return function(zoom, tileRange) {
      const callback = this.loadedTileCallback.bind(this, tiles, zoom);
      return source.forEachLoadedTile(projection, zoom, tileRange, callback);
    }.bind(this);
  }
  forEachFeatureAtCoordinate(coordinate, frameState, hitTolerance, callback, matches) {
    return void 0;
  }
  getLayer() {
    return this.layer_;
  }
  handleFontsChanged() {
  }
  handleImageChange_(event) {
    const image = event.target;
    if (image.getState() === ImageState.LOADED) {
      this.renderIfReadyAndVisible();
    }
  }
  loadImage(image) {
    let imageState = image.getState();
    if (imageState != ImageState.LOADED && imageState != ImageState.ERROR) {
      image.addEventListener(EventType.CHANGE, this.boundHandleImageChange_);
    }
    if (imageState == ImageState.IDLE) {
      image.load();
      imageState = image.getState();
    }
    return imageState == ImageState.LOADED;
  }
  renderIfReadyAndVisible() {
    const layer = this.getLayer();
    if (layer && layer.getVisible() && layer.getSourceState() === "ready") {
      layer.changed();
    }
  }
  disposeInternal() {
    delete this.layer_;
    super.disposeInternal();
  }
}
const LayerRenderer$1 = LayerRenderer;
const ContextEventType = {
  LOST: "webglcontextlost",
  RESTORED: "webglcontextrestored"
};
const DEFAULT_VERTEX_SHADER = `
  precision mediump float;
  
  attribute vec2 a_position;
  varying vec2 v_texCoord;
  varying vec2 v_screenCoord;
  
  uniform vec2 u_screenSize;
   
  void main() {
    v_texCoord = a_position * 0.5 + 0.5;
    v_screenCoord = v_texCoord * u_screenSize;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;
const DEFAULT_FRAGMENT_SHADER = `
  precision mediump float;
   
  uniform sampler2D u_image;
  uniform float u_opacity;
   
  varying vec2 v_texCoord;
   
  void main() {
    gl_FragColor = texture2D(u_image, v_texCoord) * u_opacity;
  }
`;
class WebGLPostProcessingPass {
  constructor(options) {
    this.gl_ = options.webGlContext;
    const gl = this.gl_;
    this.scaleRatio_ = options.scaleRatio || 1;
    this.renderTargetTexture_ = gl.createTexture();
    this.renderTargetTextureSize_ = null;
    this.frameBuffer_ = gl.createFramebuffer();
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(
      vertexShader,
      options.vertexShader || DEFAULT_VERTEX_SHADER
    );
    gl.compileShader(vertexShader);
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(
      fragmentShader,
      options.fragmentShader || DEFAULT_FRAGMENT_SHADER
    );
    gl.compileShader(fragmentShader);
    this.renderTargetProgram_ = gl.createProgram();
    gl.attachShader(this.renderTargetProgram_, vertexShader);
    gl.attachShader(this.renderTargetProgram_, fragmentShader);
    gl.linkProgram(this.renderTargetProgram_);
    this.renderTargetVerticesBuffer_ = gl.createBuffer();
    const verticesArray = [-1, -1, 1, -1, -1, 1, 1, -1, 1, 1, -1, 1];
    gl.bindBuffer(gl.ARRAY_BUFFER, this.renderTargetVerticesBuffer_);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(verticesArray),
      gl.STATIC_DRAW
    );
    this.renderTargetAttribLocation_ = gl.getAttribLocation(
      this.renderTargetProgram_,
      "a_position"
    );
    this.renderTargetUniformLocation_ = gl.getUniformLocation(
      this.renderTargetProgram_,
      "u_screenSize"
    );
    this.renderTargetOpacityLocation_ = gl.getUniformLocation(
      this.renderTargetProgram_,
      "u_opacity"
    );
    this.renderTargetTextureLocation_ = gl.getUniformLocation(
      this.renderTargetProgram_,
      "u_image"
    );
    this.uniforms_ = [];
    options.uniforms && Object.keys(options.uniforms).forEach(
      function(name) {
        this.uniforms_.push({
          value: options.uniforms[name],
          location: gl.getUniformLocation(this.renderTargetProgram_, name)
        });
      }.bind(this)
    );
  }
  getGL() {
    return this.gl_;
  }
  init(frameState) {
    const gl = this.getGL();
    const textureSize = [
      gl.drawingBufferWidth * this.scaleRatio_,
      gl.drawingBufferHeight * this.scaleRatio_
    ];
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.getFrameBuffer());
    gl.viewport(0, 0, textureSize[0], textureSize[1]);
    if (!this.renderTargetTextureSize_ || this.renderTargetTextureSize_[0] !== textureSize[0] || this.renderTargetTextureSize_[1] !== textureSize[1]) {
      this.renderTargetTextureSize_ = textureSize;
      const level = 0;
      const internalFormat = gl.RGBA;
      const border = 0;
      const format = gl.RGBA;
      const type = gl.UNSIGNED_BYTE;
      const data = null;
      gl.bindTexture(gl.TEXTURE_2D, this.renderTargetTexture_);
      gl.texImage2D(
        gl.TEXTURE_2D,
        level,
        internalFormat,
        textureSize[0],
        textureSize[1],
        border,
        format,
        type,
        data
      );
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        this.renderTargetTexture_,
        0
      );
    }
  }
  apply(frameState, nextPass, preCompose, postCompose) {
    const gl = this.getGL();
    const size = frameState.size;
    gl.bindFramebuffer(
      gl.FRAMEBUFFER,
      nextPass ? nextPass.getFrameBuffer() : null
    );
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.renderTargetTexture_);
    if (!nextPass) {
      const canvasId = getUid(gl.canvas);
      if (!frameState.renderTargets[canvasId]) {
        const attributes = gl.getContextAttributes();
        if (attributes && attributes.preserveDrawingBuffer) {
          gl.clearColor(0, 0, 0, 0);
          gl.clear(gl.COLOR_BUFFER_BIT);
        }
        frameState.renderTargets[canvasId] = true;
      }
    }
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.renderTargetVerticesBuffer_);
    gl.useProgram(this.renderTargetProgram_);
    gl.enableVertexAttribArray(this.renderTargetAttribLocation_);
    gl.vertexAttribPointer(
      this.renderTargetAttribLocation_,
      2,
      gl.FLOAT,
      false,
      0,
      0
    );
    gl.uniform2f(this.renderTargetUniformLocation_, size[0], size[1]);
    gl.uniform1i(this.renderTargetTextureLocation_, 0);
    const opacity = frameState.layerStatesArray[frameState.layerIndex].opacity;
    gl.uniform1f(this.renderTargetOpacityLocation_, opacity);
    this.applyUniforms(frameState);
    if (preCompose) {
      preCompose(gl, frameState);
    }
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    if (postCompose) {
      postCompose(gl, frameState);
    }
  }
  getFrameBuffer() {
    return this.frameBuffer_;
  }
  applyUniforms(frameState) {
    const gl = this.getGL();
    let value;
    let textureSlot = 1;
    this.uniforms_.forEach(function(uniform) {
      value = typeof uniform.value === "function" ? uniform.value(frameState) : uniform.value;
      if (value instanceof HTMLCanvasElement || value instanceof ImageData) {
        if (!uniform.texture) {
          uniform.texture = gl.createTexture();
        }
        gl.activeTexture(gl[`TEXTURE${textureSlot}`]);
        gl.bindTexture(gl.TEXTURE_2D, uniform.texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        if (value instanceof ImageData) {
          gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            gl.RGBA,
            value.width,
            value.height,
            0,
            gl.UNSIGNED_BYTE,
            new Uint8Array(value.data)
          );
        } else {
          gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            value
          );
        }
        gl.uniform1i(uniform.location, textureSlot++);
      } else if (Array.isArray(value)) {
        switch (value.length) {
          case 2:
            gl.uniform2f(uniform.location, value[0], value[1]);
            return;
          case 3:
            gl.uniform3f(uniform.location, value[0], value[1], value[2]);
            return;
          case 4:
            gl.uniform4f(
              uniform.location,
              value[0],
              value[1],
              value[2],
              value[3]
            );
            return;
          default:
            return;
        }
      } else if (typeof value === "number") {
        gl.uniform1f(uniform.location, value);
      }
    });
  }
}
const WebGLPostProcessingPass$1 = WebGLPostProcessingPass;
function create() {
  return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
}
function fromTransform(mat4, transform2) {
  mat4[0] = transform2[0];
  mat4[1] = transform2[1];
  mat4[4] = transform2[2];
  mat4[5] = transform2[3];
  mat4[12] = transform2[4];
  mat4[13] = transform2[5];
  return mat4;
}
const DefaultUniform = {
  PROJECTION_MATRIX: "u_projectionMatrix",
  OFFSET_SCALE_MATRIX: "u_offsetScaleMatrix",
  OFFSET_ROTATION_MATRIX: "u_offsetRotateMatrix",
  TIME: "u_time",
  ZOOM: "u_zoom",
  RESOLUTION: "u_resolution",
  SIZE_PX: "u_sizePx",
  PIXEL_RATIO: "u_pixelRatio"
};
const AttributeType = {
  UNSIGNED_BYTE,
  UNSIGNED_SHORT,
  UNSIGNED_INT,
  FLOAT
};
const canvasCache = {};
function getSharedCanvasCacheKey(key) {
  return "shared/" + key;
}
let uniqueCanvasCacheKeyCount = 0;
function getUniqueCanvasCacheKey() {
  const key = "unique/" + uniqueCanvasCacheKeyCount;
  uniqueCanvasCacheKeyCount += 1;
  return key;
}
function getCanvas(key) {
  let cacheItem = canvasCache[key];
  if (!cacheItem) {
    const canvas = document.createElement("canvas");
    canvas.style.position = "absolute";
    canvas.style.left = "0";
    cacheItem = { users: 0, canvas };
    canvasCache[key] = cacheItem;
  }
  cacheItem.users += 1;
  return cacheItem.canvas;
}
function releaseCanvas(key) {
  const cacheItem = canvasCache[key];
  if (!cacheItem) {
    return;
  }
  cacheItem.users -= 1;
  if (cacheItem.users > 0) {
    return;
  }
  const canvas = cacheItem.canvas;
  const gl = getContext(canvas);
  const extension = gl.getExtension("WEBGL_lose_context");
  if (extension) {
    extension.loseContext();
  }
  delete canvasCache[key];
}
class WebGLHelper extends Disposable$1 {
  constructor(options) {
    super();
    options = options || {};
    this.boundHandleWebGLContextLost_ = this.handleWebGLContextLost.bind(this);
    this.boundHandleWebGLContextRestored_ = this.handleWebGLContextRestored.bind(this);
    this.canvasCacheKey_ = options.canvasCacheKey ? getSharedCanvasCacheKey(options.canvasCacheKey) : getUniqueCanvasCacheKey();
    this.canvas_ = getCanvas(this.canvasCacheKey_);
    this.gl_ = getContext(this.canvas_);
    this.bufferCache_ = {};
    this.extensionCache_ = {};
    this.currentProgram_ = null;
    this.canvas_.addEventListener(
      ContextEventType.LOST,
      this.boundHandleWebGLContextLost_
    );
    this.canvas_.addEventListener(
      ContextEventType.RESTORED,
      this.boundHandleWebGLContextRestored_
    );
    this.offsetRotateMatrix_ = create$1();
    this.offsetScaleMatrix_ = create$1();
    this.tmpMat4_ = create();
    this.uniformLocations_ = {};
    this.attribLocations_ = {};
    this.uniforms_ = [];
    if (options.uniforms) {
      this.setUniforms(options.uniforms);
    }
    const gl = this.getGL();
    this.postProcessPasses_ = options.postProcesses ? options.postProcesses.map(function(options2) {
      return new WebGLPostProcessingPass$1({
        webGlContext: gl,
        scaleRatio: options2.scaleRatio,
        vertexShader: options2.vertexShader,
        fragmentShader: options2.fragmentShader,
        uniforms: options2.uniforms
      });
    }) : [new WebGLPostProcessingPass$1({ webGlContext: gl })];
    this.shaderCompileErrors_ = null;
    this.startTime_ = Date.now();
  }
  setUniforms(uniforms) {
    this.uniforms_ = [];
    for (const name in uniforms) {
      this.uniforms_.push({
        name,
        value: uniforms[name]
      });
    }
    this.uniformLocations_ = {};
  }
  canvasCacheKeyMatches(canvasCacheKey) {
    return this.canvasCacheKey_ === getSharedCanvasCacheKey(canvasCacheKey);
  }
  getExtension(name) {
    if (name in this.extensionCache_) {
      return this.extensionCache_[name];
    }
    const extension = this.gl_.getExtension(name);
    this.extensionCache_[name] = extension;
    return extension;
  }
  bindBuffer(buffer) {
    const gl = this.getGL();
    const bufferKey = getUid(buffer);
    let bufferCache = this.bufferCache_[bufferKey];
    if (!bufferCache) {
      const webGlBuffer = gl.createBuffer();
      bufferCache = {
        buffer,
        webGlBuffer
      };
      this.bufferCache_[bufferKey] = bufferCache;
    }
    gl.bindBuffer(buffer.getType(), bufferCache.webGlBuffer);
  }
  flushBufferData(buffer) {
    const gl = this.getGL();
    this.bindBuffer(buffer);
    gl.bufferData(buffer.getType(), buffer.getArray(), buffer.getUsage());
  }
  deleteBuffer(buf) {
    const gl = this.getGL();
    const bufferKey = getUid(buf);
    const bufferCacheEntry = this.bufferCache_[bufferKey];
    if (bufferCacheEntry && !gl.isContextLost()) {
      gl.deleteBuffer(bufferCacheEntry.webGlBuffer);
    }
    delete this.bufferCache_[bufferKey];
  }
  disposeInternal() {
    this.canvas_.removeEventListener(
      ContextEventType.LOST,
      this.boundHandleWebGLContextLost_
    );
    this.canvas_.removeEventListener(
      ContextEventType.RESTORED,
      this.boundHandleWebGLContextRestored_
    );
    releaseCanvas(this.canvasCacheKey_);
    delete this.gl_;
    delete this.canvas_;
  }
  prepareDraw(frameState, disableAlphaBlend) {
    const gl = this.getGL();
    const canvas = this.getCanvas();
    const size = frameState.size;
    const pixelRatio = frameState.pixelRatio;
    canvas.width = size[0] * pixelRatio;
    canvas.height = size[1] * pixelRatio;
    canvas.style.width = size[0] + "px";
    canvas.style.height = size[1] + "px";
    for (let i = this.postProcessPasses_.length - 1; i >= 0; i--) {
      this.postProcessPasses_[i].init(frameState);
    }
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, disableAlphaBlend ? gl.ZERO : gl.ONE_MINUS_SRC_ALPHA);
  }
  prepareDrawToRenderTarget(frameState, renderTarget, disableAlphaBlend) {
    const gl = this.getGL();
    const size = renderTarget.getSize();
    gl.bindFramebuffer(gl.FRAMEBUFFER, renderTarget.getFramebuffer());
    gl.viewport(0, 0, size[0], size[1]);
    gl.bindTexture(gl.TEXTURE_2D, renderTarget.getTexture());
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, disableAlphaBlend ? gl.ZERO : gl.ONE_MINUS_SRC_ALPHA);
  }
  drawElements(start, end) {
    const gl = this.getGL();
    this.getExtension("OES_element_index_uint");
    const elementType = gl.UNSIGNED_INT;
    const elementSize = 4;
    const numItems = end - start;
    const offsetInBytes = start * elementSize;
    gl.drawElements(gl.TRIANGLES, numItems, elementType, offsetInBytes);
  }
  finalizeDraw(frameState, preCompose, postCompose) {
    for (let i = 0, ii = this.postProcessPasses_.length; i < ii; i++) {
      if (i === ii - 1) {
        this.postProcessPasses_[i].apply(
          frameState,
          null,
          preCompose,
          postCompose
        );
      } else {
        this.postProcessPasses_[i].apply(
          frameState,
          this.postProcessPasses_[i + 1]
        );
      }
    }
  }
  getCanvas() {
    return this.canvas_;
  }
  getGL() {
    return this.gl_;
  }
  applyFrameState(frameState) {
    const size = frameState.size;
    const rotation = frameState.viewState.rotation;
    const pixelRatio = frameState.pixelRatio;
    const offsetScaleMatrix = reset(this.offsetScaleMatrix_);
    scale$3(offsetScaleMatrix, 2 / size[0], 2 / size[1]);
    const offsetRotateMatrix = reset(this.offsetRotateMatrix_);
    if (rotation !== 0) {
      rotate$2(offsetRotateMatrix, -rotation);
    }
    this.setUniformMatrixValue(
      DefaultUniform.OFFSET_SCALE_MATRIX,
      fromTransform(this.tmpMat4_, offsetScaleMatrix)
    );
    this.setUniformMatrixValue(
      DefaultUniform.OFFSET_ROTATION_MATRIX,
      fromTransform(this.tmpMat4_, offsetRotateMatrix)
    );
    this.setUniformFloatValue(
      DefaultUniform.TIME,
      (Date.now() - this.startTime_) * 1e-3
    );
    this.setUniformFloatValue(DefaultUniform.ZOOM, frameState.viewState.zoom);
    this.setUniformFloatValue(
      DefaultUniform.RESOLUTION,
      frameState.viewState.resolution
    );
    this.setUniformFloatValue(DefaultUniform.PIXEL_RATIO, pixelRatio);
    this.setUniformFloatVec2(DefaultUniform.SIZE_PX, [size[0], size[1]]);
  }
  applyUniforms(frameState) {
    const gl = this.getGL();
    let value;
    let textureSlot = 0;
    this.uniforms_.forEach(
      function(uniform) {
        value = typeof uniform.value === "function" ? uniform.value(frameState) : uniform.value;
        if (value instanceof HTMLCanvasElement || value instanceof HTMLImageElement || value instanceof ImageData) {
          if (!uniform.texture) {
            uniform.prevValue = void 0;
            uniform.texture = gl.createTexture();
          }
          gl.activeTexture(gl[`TEXTURE${textureSlot}`]);
          gl.bindTexture(gl.TEXTURE_2D, uniform.texture);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          const imageReady = !(value instanceof HTMLImageElement) || value.complete;
          if (imageReady && uniform.prevValue !== value) {
            uniform.prevValue = value;
            gl.texImage2D(
              gl.TEXTURE_2D,
              0,
              gl.RGBA,
              gl.RGBA,
              gl.UNSIGNED_BYTE,
              value
            );
          }
          gl.uniform1i(this.getUniformLocation(uniform.name), textureSlot++);
        } else if (Array.isArray(value) && value.length === 6) {
          this.setUniformMatrixValue(
            uniform.name,
            fromTransform(this.tmpMat4_, value)
          );
        } else if (Array.isArray(value) && value.length <= 4) {
          switch (value.length) {
            case 2:
              gl.uniform2f(
                this.getUniformLocation(uniform.name),
                value[0],
                value[1]
              );
              return;
            case 3:
              gl.uniform3f(
                this.getUniformLocation(uniform.name),
                value[0],
                value[1],
                value[2]
              );
              return;
            case 4:
              gl.uniform4f(
                this.getUniformLocation(uniform.name),
                value[0],
                value[1],
                value[2],
                value[3]
              );
              return;
            default:
              return;
          }
        } else if (typeof value === "number") {
          gl.uniform1f(this.getUniformLocation(uniform.name), value);
        }
      }.bind(this)
    );
  }
  useProgram(program, frameState) {
    const gl = this.getGL();
    gl.useProgram(program);
    this.currentProgram_ = program;
    this.uniformLocations_ = {};
    this.attribLocations_ = {};
    this.applyFrameState(frameState);
    this.applyUniforms(frameState);
  }
  compileShader(source, type) {
    const gl = this.getGL();
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
  }
  getProgram(fragmentShaderSource, vertexShaderSource) {
    const gl = this.getGL();
    const fragmentShader = this.compileShader(
      fragmentShaderSource,
      gl.FRAGMENT_SHADER
    );
    const vertexShader = this.compileShader(
      vertexShaderSource,
      gl.VERTEX_SHADER
    );
    const program = gl.createProgram();
    gl.attachShader(program, fragmentShader);
    gl.attachShader(program, vertexShader);
    gl.linkProgram(program);
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
      const message = `Fragment shader compliation failed: ${gl.getShaderInfoLog(
        fragmentShader
      )}`;
      throw new Error(message);
    }
    gl.deleteShader(fragmentShader);
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
      const message = `Vertex shader compilation failed: ${gl.getShaderInfoLog(
        vertexShader
      )}`;
      throw new Error(message);
    }
    gl.deleteShader(vertexShader);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const message = `GL program linking failed: ${gl.getShaderInfoLog(
        vertexShader
      )}`;
      throw new Error(message);
    }
    return program;
  }
  getUniformLocation(name) {
    if (this.uniformLocations_[name] === void 0) {
      this.uniformLocations_[name] = this.getGL().getUniformLocation(
        this.currentProgram_,
        name
      );
    }
    return this.uniformLocations_[name];
  }
  getAttributeLocation(name) {
    if (this.attribLocations_[name] === void 0) {
      this.attribLocations_[name] = this.getGL().getAttribLocation(
        this.currentProgram_,
        name
      );
    }
    return this.attribLocations_[name];
  }
  makeProjectionTransform(frameState, transform2) {
    const size = frameState.size;
    const rotation = frameState.viewState.rotation;
    const resolution = frameState.viewState.resolution;
    const center = frameState.viewState.center;
    reset(transform2);
    compose(
      transform2,
      0,
      0,
      2 / (resolution * size[0]),
      2 / (resolution * size[1]),
      -rotation,
      -center[0],
      -center[1]
    );
    return transform2;
  }
  setUniformFloatValue(uniform, value) {
    this.getGL().uniform1f(this.getUniformLocation(uniform), value);
  }
  setUniformFloatVec2(uniform, value) {
    this.getGL().uniform2fv(this.getUniformLocation(uniform), value);
  }
  setUniformFloatVec4(uniform, value) {
    this.getGL().uniform4fv(this.getUniformLocation(uniform), value);
  }
  setUniformMatrixValue(uniform, value) {
    this.getGL().uniformMatrix4fv(
      this.getUniformLocation(uniform),
      false,
      value
    );
  }
  enableAttributeArray_(attribName, size, type, stride, offset) {
    const location = this.getAttributeLocation(attribName);
    if (location < 0) {
      return;
    }
    this.getGL().enableVertexAttribArray(location);
    this.getGL().vertexAttribPointer(
      location,
      size,
      type,
      false,
      stride,
      offset
    );
  }
  enableAttributes(attributes) {
    const stride = computeAttributesStride(attributes);
    let offset = 0;
    for (let i = 0; i < attributes.length; i++) {
      const attr = attributes[i];
      this.enableAttributeArray_(
        attr.name,
        attr.size,
        attr.type || FLOAT,
        stride,
        offset
      );
      offset += attr.size * getByteSizeFromType(attr.type);
    }
  }
  handleWebGLContextLost() {
    clear(this.bufferCache_);
    this.currentProgram_ = null;
  }
  handleWebGLContextRestored() {
  }
  createTexture(size, data, texture) {
    const gl = this.getGL();
    texture = texture || gl.createTexture();
    const level = 0;
    const internalFormat = gl.RGBA;
    const border = 0;
    const format = gl.RGBA;
    const type = gl.UNSIGNED_BYTE;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    if (data) {
      gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, format, type, data);
    } else {
      gl.texImage2D(
        gl.TEXTURE_2D,
        level,
        internalFormat,
        size[0],
        size[1],
        border,
        format,
        type,
        null
      );
    }
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return texture;
  }
}
function computeAttributesStride(attributes) {
  let stride = 0;
  for (let i = 0; i < attributes.length; i++) {
    const attr = attributes[i];
    stride += attr.size * getByteSizeFromType(attr.type);
  }
  return stride;
}
function getByteSizeFromType(type) {
  switch (type) {
    case AttributeType.UNSIGNED_BYTE:
      return Uint8Array.BYTES_PER_ELEMENT;
    case AttributeType.UNSIGNED_SHORT:
      return Uint16Array.BYTES_PER_ELEMENT;
    case AttributeType.UNSIGNED_INT:
      return Uint32Array.BYTES_PER_ELEMENT;
    case AttributeType.FLOAT:
    default:
      return Float32Array.BYTES_PER_ELEMENT;
  }
}
class WebGLLayerRenderer extends LayerRenderer$1 {
  constructor(layer, options) {
    super(layer);
    options = options || {};
    this.inversePixelTransform_ = create$1();
    this.pixelContext_ = null;
    this.postProcesses_ = options.postProcesses;
    this.uniforms_ = options.uniforms;
    this.helper;
    layer.addChangeListener(LayerProperty.MAP, this.removeHelper.bind(this));
    this.dispatchPreComposeEvent = this.dispatchPreComposeEvent.bind(this);
    this.dispatchPostComposeEvent = this.dispatchPostComposeEvent.bind(this);
  }
  dispatchPreComposeEvent(context2, frameState) {
    const layer = this.getLayer();
    if (layer.hasListener(RenderEventType.PRECOMPOSE)) {
      const event = new RenderEvent$1(
        RenderEventType.PRECOMPOSE,
        void 0,
        frameState,
        context2
      );
      layer.dispatchEvent(event);
    }
  }
  dispatchPostComposeEvent(context2, frameState) {
    const layer = this.getLayer();
    if (layer.hasListener(RenderEventType.POSTCOMPOSE)) {
      const event = new RenderEvent$1(
        RenderEventType.POSTCOMPOSE,
        void 0,
        frameState,
        context2
      );
      layer.dispatchEvent(event);
    }
  }
  reset(options) {
    this.uniforms_ = options.uniforms;
    if (this.helper) {
      this.helper.setUniforms(this.uniforms_);
    }
  }
  removeHelper() {
    if (this.helper) {
      this.helper.dispose();
      delete this.helper;
    }
  }
  prepareFrame(frameState) {
    if (this.getLayer().getRenderSource()) {
      let incrementGroup = true;
      let groupNumber = -1;
      let className;
      for (let i = 0, ii = frameState.layerStatesArray.length; i < ii; i++) {
        const layer = frameState.layerStatesArray[i].layer;
        const renderer = layer.getRenderer();
        if (!(renderer instanceof WebGLLayerRenderer)) {
          incrementGroup = true;
          continue;
        }
        const layerClassName = layer.getClassName();
        if (incrementGroup || layerClassName !== className) {
          groupNumber += 1;
          incrementGroup = false;
        }
        className = layerClassName;
        if (renderer === this) {
          break;
        }
      }
      const canvasCacheKey = "map/" + frameState.mapId + "/group/" + groupNumber;
      if (!this.helper || !this.helper.canvasCacheKeyMatches(canvasCacheKey)) {
        this.removeHelper();
        this.helper = new WebGLHelper({
          postProcesses: this.postProcesses_,
          uniforms: this.uniforms_,
          canvasCacheKey
        });
        if (className) {
          this.helper.getCanvas().className = className;
        }
        this.afterHelperCreated();
      }
    }
    return this.prepareFrameInternal(frameState);
  }
  afterHelperCreated() {
  }
  prepareFrameInternal(frameState) {
    return true;
  }
  disposeInternal() {
    this.removeHelper();
    super.disposeInternal();
  }
  dispatchRenderEvent_(type, context2, frameState) {
    const layer = this.getLayer();
    if (layer.hasListener(type)) {
      compose(
        this.inversePixelTransform_,
        0,
        0,
        frameState.pixelRatio,
        -frameState.pixelRatio,
        0,
        0,
        -frameState.size[1]
      );
      const event = new RenderEvent$1(
        type,
        this.inversePixelTransform_,
        frameState,
        context2
      );
      layer.dispatchEvent(event);
    }
  }
  preRender(context2, frameState) {
    this.dispatchRenderEvent_(RenderEventType.PRERENDER, context2, frameState);
  }
  postRender(context2, frameState) {
    this.dispatchRenderEvent_(RenderEventType.POSTRENDER, context2, frameState);
  }
}
const WebGLLayerRenderer$1 = WebGLLayerRenderer;
function createOrUpdate(z, x, y, tileCoord) {
  if (tileCoord !== void 0) {
    tileCoord[0] = z;
    tileCoord[1] = x;
    tileCoord[2] = y;
    return tileCoord;
  } else {
    return [z, x, y];
  }
}
function getKeyZXY(z, x, y) {
  return z + "/" + x + "/" + y;
}
function getKey(tileCoord) {
  return getKeyZXY(tileCoord[0], tileCoord[1], tileCoord[2]);
}
function fromKey(key) {
  return key.split("/").map(Number);
}
function hash(tileCoord) {
  return (tileCoord[1] << tileCoord[0]) + tileCoord[2];
}
function withinExtentAndZ(tileCoord, tileGrid) {
  const z = tileCoord[0];
  const x = tileCoord[1];
  const y = tileCoord[2];
  if (tileGrid.getMinZoom() > z || z > tileGrid.getMaxZoom()) {
    return false;
  }
  const tileRange = tileGrid.getFullTileRange(z);
  if (!tileRange) {
    return true;
  } else {
    return tileRange.containsXY(x, y);
  }
}
const Uniforms = {
  TILE_TEXTURE_ARRAY: "u_tileTextures",
  TILE_TRANSFORM: "u_tileTransform",
  TRANSITION_ALPHA: "u_transitionAlpha",
  DEPTH: "u_depth",
  TEXTURE_PIXEL_WIDTH: "u_texturePixelWidth",
  TEXTURE_PIXEL_HEIGHT: "u_texturePixelHeight",
  TEXTURE_RESOLUTION: "u_textureResolution",
  TEXTURE_ORIGIN_X: "u_textureOriginX",
  TEXTURE_ORIGIN_Y: "u_textureOriginY",
  RENDER_EXTENT: "u_renderExtent",
  RESOLUTION: "u_resolution",
  ZOOM: "u_zoom"
};
const Attributes = {
  TEXTURE_COORD: "a_textureCoord"
};
const attributeDescriptions = [
  {
    name: Attributes.TEXTURE_COORD,
    size: 2,
    type: AttributeType.FLOAT
  }
];
const empty = {};
function depthForZ(z) {
  return 2 * (1 - 1 / (z + 1)) - 1;
}
function addTileTextureToLookup(tileTexturesByZ, tileTexture, z) {
  if (!(z in tileTexturesByZ)) {
    tileTexturesByZ[z] = [];
  }
  tileTexturesByZ[z].push(tileTexture);
}
function getRenderExtent(frameState, extent2) {
  const layerState = frameState.layerStatesArray[frameState.layerIndex];
  if (layerState.extent) {
    extent2 = getIntersection(
      extent2,
      fromUserExtent(layerState.extent, frameState.viewState.projection)
    );
  }
  const source = layerState.layer.getRenderSource();
  if (!source.getWrapX()) {
    const gridExtent = source.getTileGridForProjection(frameState.viewState.projection).getExtent();
    if (gridExtent) {
      extent2 = getIntersection(extent2, gridExtent);
    }
  }
  return extent2;
}
function getCacheKey(source, tileCoord) {
  return `${source.getKey()},${getKey(tileCoord)}`;
}
class WebGLTileLayerRenderer extends WebGLLayerRenderer$1 {
  constructor(tileLayer, options) {
    super(tileLayer, {
      uniforms: options.uniforms
    });
    this.renderComplete = false;
    this.tileTransform_ = create$1();
    this.tempMat4_ = create();
    this.tempTileRange_ = new TileRange$1(0, 0, 0, 0);
    this.tempTileCoord_ = createOrUpdate(0, 0, 0);
    this.tempSize_ = [0, 0];
    this.program_;
    this.vertexShader_ = options.vertexShader;
    this.fragmentShader_ = options.fragmentShader;
    this.indices_ = new WebGLArrayBuffer$1(ELEMENT_ARRAY_BUFFER, STATIC_DRAW);
    this.indices_.fromArray([0, 1, 3, 1, 2, 3]);
    const cacheSize = options.cacheSize !== void 0 ? options.cacheSize : 512;
    this.tileTextureCache_ = new LRUCache$1(cacheSize);
    this.paletteTextures_ = options.paletteTextures || [];
    this.frameState_ = null;
    this.projection_ = void 0;
  }
  reset(options) {
    super.reset({
      uniforms: options.uniforms
    });
    this.vertexShader_ = options.vertexShader;
    this.fragmentShader_ = options.fragmentShader;
    this.paletteTextures_ = options.paletteTextures || [];
    if (this.helper) {
      this.program_ = this.helper.getProgram(
        this.fragmentShader_,
        this.vertexShader_
      );
    }
  }
  afterHelperCreated() {
    this.program_ = this.helper.getProgram(
      this.fragmentShader_,
      this.vertexShader_
    );
    this.helper.flushBufferData(this.indices_);
  }
  isDrawableTile_(tile) {
    const tileLayer = this.getLayer();
    const tileState = tile.getState();
    const useInterimTilesOnError = tileLayer.getUseInterimTilesOnError();
    return tileState == TileState.LOADED || tileState == TileState.EMPTY || tileState == TileState.ERROR && !useInterimTilesOnError;
  }
  prepareFrameInternal(frameState) {
    if (!this.projection_) {
      this.projection_ = frameState.viewState.projection;
    } else if (frameState.viewState.projection !== this.projection_) {
      this.clearCache();
      this.projection_ = frameState.viewState.projection;
    }
    const layer = this.getLayer();
    const source = layer.getRenderSource();
    if (!source) {
      return false;
    }
    if (isEmpty(getRenderExtent(frameState, frameState.extent))) {
      return false;
    }
    return source.getState() === "ready";
  }
  enqueueTiles(frameState, extent2, initialZ, tileTexturesByZ, preload) {
    const viewState = frameState.viewState;
    const tileLayer = this.getLayer();
    const tileSource = tileLayer.getRenderSource();
    const tileGrid = tileSource.getTileGridForProjection(viewState.projection);
    const gutter = tileSource.getGutterForProjection(viewState.projection);
    const tileSourceKey = getUid(tileSource);
    if (!(tileSourceKey in frameState.wantedTiles)) {
      frameState.wantedTiles[tileSourceKey] = {};
    }
    const wantedTiles = frameState.wantedTiles[tileSourceKey];
    const tileTextureCache = this.tileTextureCache_;
    const map2 = tileLayer.getMapInternal();
    const minZ = Math.max(
      initialZ - preload,
      tileGrid.getMinZoom(),
      tileGrid.getZForResolution(
        Math.min(
          tileLayer.getMaxResolution(),
          map2 ? map2.getView().getResolutionForZoom(Math.max(tileLayer.getMinZoom(), 0)) : tileGrid.getResolution(0)
        ),
        tileSource.zDirection
      )
    );
    for (let z = initialZ; z >= minZ; --z) {
      const tileRange = tileGrid.getTileRangeForExtentAndZ(
        extent2,
        z,
        this.tempTileRange_
      );
      const tileResolution = tileGrid.getResolution(z);
      for (let x = tileRange.minX; x <= tileRange.maxX; ++x) {
        for (let y = tileRange.minY; y <= tileRange.maxY; ++y) {
          const tileCoord = createOrUpdate(z, x, y, this.tempTileCoord_);
          const cacheKey = getCacheKey(tileSource, tileCoord);
          let tileTexture;
          let tile;
          if (tileTextureCache.containsKey(cacheKey)) {
            tileTexture = tileTextureCache.get(cacheKey);
            tile = tileTexture.tile;
          }
          if (!tileTexture || tileTexture.tile.key !== tileSource.getKey()) {
            tile = tileSource.getTile(
              z,
              x,
              y,
              frameState.pixelRatio,
              viewState.projection
            );
            if (!tileTexture) {
              tileTexture = new TileTexture$1({
                tile,
                grid: tileGrid,
                helper: this.helper,
                gutter
              });
              tileTextureCache.set(cacheKey, tileTexture);
            } else {
              if (this.isDrawableTile_(tile)) {
                tileTexture.setTile(tile);
              } else {
                const interimTile = tile.getInterimTile();
                tileTexture.setTile(interimTile);
              }
            }
          }
          addTileTextureToLookup(tileTexturesByZ, tileTexture, z);
          const tileQueueKey = tile.getKey();
          wantedTiles[tileQueueKey] = true;
          if (tile.getState() === TileState.IDLE) {
            if (!frameState.tileQueue.isKeyQueued(tileQueueKey)) {
              frameState.tileQueue.enqueue([
                tile,
                tileSourceKey,
                tileGrid.getTileCoordCenter(tileCoord),
                tileResolution
              ]);
            }
          }
        }
      }
    }
  }
  renderFrame(frameState) {
    this.frameState_ = frameState;
    this.renderComplete = true;
    const gl = this.helper.getGL();
    this.preRender(gl, frameState);
    const viewState = frameState.viewState;
    const tileLayer = this.getLayer();
    const tileSource = tileLayer.getRenderSource();
    const tileGrid = tileSource.getTileGridForProjection(viewState.projection);
    const gutter = tileSource.getGutterForProjection(viewState.projection);
    const extent2 = getRenderExtent(frameState, frameState.extent);
    const z = tileGrid.getZForResolution(
      viewState.resolution,
      tileSource.zDirection
    );
    const tileTexturesByZ = {};
    const preload = tileLayer.getPreload();
    if (frameState.nextExtent) {
      const targetZ = tileGrid.getZForResolution(
        viewState.nextResolution,
        tileSource.zDirection
      );
      const nextExtent = getRenderExtent(frameState, frameState.nextExtent);
      this.enqueueTiles(
        frameState,
        nextExtent,
        targetZ,
        tileTexturesByZ,
        preload
      );
    }
    this.enqueueTiles(frameState, extent2, z, tileTexturesByZ, 0);
    if (preload > 0) {
      setTimeout(() => {
        this.enqueueTiles(
          frameState,
          extent2,
          z - 1,
          tileTexturesByZ,
          preload - 1
        );
      }, 0);
    }
    const alphaLookup = {};
    const uid = getUid(this);
    const time = frameState.time;
    let blend = false;
    const tileTextures = tileTexturesByZ[z];
    for (let i = 0, ii = tileTextures.length; i < ii; ++i) {
      const tileTexture = tileTextures[i];
      const tile = tileTexture.tile;
      if (tile instanceof ReprojTile$1 && tile.getState() === TileState.EMPTY) {
        continue;
      }
      const tileCoord = tile.tileCoord;
      if (tileTexture.loaded) {
        const alpha = tile.getAlpha(uid, time);
        if (alpha === 1) {
          tile.endTransition(uid);
          continue;
        }
        blend = true;
        const tileCoordKey = getKey(tileCoord);
        alphaLookup[tileCoordKey] = alpha;
      }
      this.renderComplete = false;
      const coveredByChildren = this.findAltTiles_(
        tileGrid,
        tileCoord,
        z + 1,
        tileTexturesByZ
      );
      if (coveredByChildren) {
        continue;
      }
      const minZoom = tileGrid.getMinZoom();
      for (let parentZ = z - 1; parentZ >= minZoom; --parentZ) {
        const coveredByParent = this.findAltTiles_(
          tileGrid,
          tileCoord,
          parentZ,
          tileTexturesByZ
        );
        if (coveredByParent) {
          break;
        }
      }
    }
    this.helper.useProgram(this.program_, frameState);
    this.helper.prepareDraw(frameState, !blend);
    const zs = Object.keys(tileTexturesByZ).map(Number).sort(numberSafeCompareFunction);
    const centerX = viewState.center[0];
    const centerY = viewState.center[1];
    for (let j = 0, jj = zs.length; j < jj; ++j) {
      const tileZ = zs[j];
      const tileResolution = tileGrid.getResolution(tileZ);
      const tileSize = toSize(tileGrid.getTileSize(tileZ), this.tempSize_);
      const tileOrigin = tileGrid.getOrigin(tileZ);
      const tileWidthWithGutter = tileSize[0] + 2 * gutter;
      const tileHeightWithGutter = tileSize[1] + 2 * gutter;
      const aspectRatio = tileWidthWithGutter / tileHeightWithGutter;
      const centerI = (centerX - tileOrigin[0]) / (tileSize[0] * tileResolution);
      const centerJ = (tileOrigin[1] - centerY) / (tileSize[1] * tileResolution);
      const tileScale = viewState.resolution / tileResolution;
      const depth = depthForZ(tileZ);
      const tileTextures2 = tileTexturesByZ[tileZ];
      for (let i = 0, ii = tileTextures2.length; i < ii; ++i) {
        const tileTexture = tileTextures2[i];
        if (!tileTexture.loaded) {
          continue;
        }
        const tile = tileTexture.tile;
        const tileCoord = tile.tileCoord;
        const tileCoordKey = getKey(tileCoord);
        const tileCenterI = tileCoord[1];
        const tileCenterJ = tileCoord[2];
        reset(this.tileTransform_);
        scale$3(
          this.tileTransform_,
          2 / (frameState.size[0] * tileScale / tileWidthWithGutter),
          -2 / (frameState.size[1] * tileScale / tileWidthWithGutter)
        );
        rotate$2(this.tileTransform_, viewState.rotation);
        scale$3(this.tileTransform_, 1, 1 / aspectRatio);
        translate$1(
          this.tileTransform_,
          (tileSize[0] * (tileCenterI - centerI) - gutter) / tileWidthWithGutter,
          (tileSize[1] * (tileCenterJ - centerJ) - gutter) / tileHeightWithGutter
        );
        this.helper.setUniformMatrixValue(
          Uniforms.TILE_TRANSFORM,
          fromTransform(this.tempMat4_, this.tileTransform_)
        );
        this.helper.bindBuffer(tileTexture.coords);
        this.helper.bindBuffer(this.indices_);
        this.helper.enableAttributes(attributeDescriptions);
        let textureSlot = 0;
        while (textureSlot < tileTexture.textures.length) {
          const textureProperty = "TEXTURE" + textureSlot;
          const uniformName = `${Uniforms.TILE_TEXTURE_ARRAY}[${textureSlot}]`;
          gl.activeTexture(gl[textureProperty]);
          gl.bindTexture(gl.TEXTURE_2D, tileTexture.textures[textureSlot]);
          gl.uniform1i(
            this.helper.getUniformLocation(uniformName),
            textureSlot
          );
          ++textureSlot;
        }
        for (let paletteIndex = 0; paletteIndex < this.paletteTextures_.length; ++paletteIndex) {
          const paletteTexture = this.paletteTextures_[paletteIndex];
          gl.activeTexture(gl["TEXTURE" + textureSlot]);
          const texture = paletteTexture.getTexture(gl);
          gl.bindTexture(gl.TEXTURE_2D, texture);
          gl.uniform1i(
            this.helper.getUniformLocation(paletteTexture.name),
            textureSlot
          );
          ++textureSlot;
        }
        const alpha = tileCoordKey in alphaLookup ? alphaLookup[tileCoordKey] : 1;
        if (alpha < 1) {
          frameState.animate = true;
        }
        this.helper.setUniformFloatValue(Uniforms.TRANSITION_ALPHA, alpha);
        this.helper.setUniformFloatValue(Uniforms.DEPTH, depth);
        this.helper.setUniformFloatValue(
          Uniforms.TEXTURE_PIXEL_WIDTH,
          tileWidthWithGutter
        );
        this.helper.setUniformFloatValue(
          Uniforms.TEXTURE_PIXEL_HEIGHT,
          tileHeightWithGutter
        );
        this.helper.setUniformFloatValue(
          Uniforms.TEXTURE_RESOLUTION,
          tileResolution
        );
        this.helper.setUniformFloatValue(
          Uniforms.TEXTURE_ORIGIN_X,
          tileOrigin[0] + tileCenterI * tileSize[0] * tileResolution - gutter * tileResolution
        );
        this.helper.setUniformFloatValue(
          Uniforms.TEXTURE_ORIGIN_Y,
          tileOrigin[1] - tileCenterJ * tileSize[1] * tileResolution + gutter * tileResolution
        );
        let gutterExtent = extent2;
        if (gutter > 0) {
          gutterExtent = tileGrid.getTileCoordExtent(tileCoord);
          getIntersection(gutterExtent, extent2, gutterExtent);
        }
        this.helper.setUniformFloatVec4(Uniforms.RENDER_EXTENT, gutterExtent);
        this.helper.setUniformFloatValue(
          Uniforms.RESOLUTION,
          viewState.resolution
        );
        this.helper.setUniformFloatValue(Uniforms.ZOOM, viewState.zoom);
        this.helper.drawElements(0, this.indices_.getSize());
      }
    }
    this.helper.finalizeDraw(
      frameState,
      this.dispatchPreComposeEvent,
      this.dispatchPostComposeEvent
    );
    const canvas = this.helper.getCanvas();
    const tileTextureCache = this.tileTextureCache_;
    while (tileTextureCache.canExpireCache()) {
      const tileTexture = tileTextureCache.pop();
      tileTexture.dispose();
    }
    const postRenderFunction = function(map2, frameState2) {
      tileSource.updateCacheSize(0.1, frameState2.viewState.projection);
      tileSource.expireCache(frameState2.viewState.projection, empty);
    };
    frameState.postRenderFunctions.push(postRenderFunction);
    this.postRender(gl, frameState);
    return canvas;
  }
  getData(pixel) {
    const gl = this.helper.getGL();
    if (!gl) {
      return null;
    }
    const frameState = this.frameState_;
    if (!frameState) {
      return null;
    }
    const layer = this.getLayer();
    const coordinate = apply(
      frameState.pixelToCoordinateTransform,
      pixel.slice()
    );
    const viewState = frameState.viewState;
    const layerExtent = layer.getExtent();
    if (layerExtent) {
      if (!containsCoordinate(
        fromUserExtent(layerExtent, viewState.projection),
        coordinate
      )) {
        return null;
      }
    }
    const sources = layer.getSources(
      boundingExtent([coordinate]),
      viewState.resolution
    );
    let i, source, tileGrid;
    for (i = sources.length - 1; i >= 0; --i) {
      source = sources[i];
      if (source.getState() === "ready") {
        tileGrid = source.getTileGridForProjection(viewState.projection);
        if (source.getWrapX()) {
          break;
        }
        const gridExtent = tileGrid.getExtent();
        if (!gridExtent || containsCoordinate(gridExtent, coordinate)) {
          break;
        }
      }
    }
    if (i < 0) {
      return null;
    }
    const tileTextureCache = this.tileTextureCache_;
    for (let z = tileGrid.getZForResolution(viewState.resolution); z >= tileGrid.getMinZoom(); --z) {
      const tileCoord = tileGrid.getTileCoordForCoordAndZ(coordinate, z);
      const cacheKey = getCacheKey(source, tileCoord);
      if (!tileTextureCache.containsKey(cacheKey)) {
        continue;
      }
      const tileTexture = tileTextureCache.get(cacheKey);
      const tile = tileTexture.tile;
      if (tile instanceof ReprojTile$1 && tile.getState() === TileState.EMPTY) {
        return null;
      }
      if (!tileTexture.loaded) {
        continue;
      }
      const tileOrigin = tileGrid.getOrigin(z);
      const tileSize = toSize(tileGrid.getTileSize(z));
      const tileResolution = tileGrid.getResolution(z);
      const col = (coordinate[0] - tileOrigin[0]) / tileResolution - tileCoord[1] * tileSize[0];
      const row = (tileOrigin[1] - coordinate[1]) / tileResolution - tileCoord[2] * tileSize[1];
      return tileTexture.getPixelData(col, row);
    }
    return null;
  }
  findAltTiles_(tileGrid, tileCoord, altZ, tileTexturesByZ) {
    const tileRange = tileGrid.getTileRangeForTileCoordAndZ(
      tileCoord,
      altZ,
      this.tempTileRange_
    );
    if (!tileRange) {
      return false;
    }
    let covered = true;
    const tileTextureCache = this.tileTextureCache_;
    const source = this.getLayer().getRenderSource();
    for (let x = tileRange.minX; x <= tileRange.maxX; ++x) {
      for (let y = tileRange.minY; y <= tileRange.maxY; ++y) {
        const cacheKey = getCacheKey(source, [altZ, x, y]);
        let loaded = false;
        if (tileTextureCache.containsKey(cacheKey)) {
          const tileTexture = tileTextureCache.get(cacheKey);
          if (tileTexture.loaded) {
            addTileTextureToLookup(tileTexturesByZ, tileTexture, altZ);
            loaded = true;
          }
        }
        if (!loaded) {
          covered = false;
        }
      }
    }
    return covered;
  }
  clearCache() {
    const tileTextureCache = this.tileTextureCache_;
    tileTextureCache.forEach((tileTexture) => tileTexture.dispose());
    tileTextureCache.clear();
  }
  removeHelper() {
    if (this.helper) {
      this.clearCache();
    }
    super.removeHelper();
  }
  disposeInternal() {
    const helper = this.helper;
    if (helper) {
      const gl = helper.getGL();
      gl.deleteProgram(this.program_);
      delete this.program_;
      helper.deleteBuffer(this.indices_);
    }
    super.disposeInternal();
    delete this.indices_;
    delete this.tileTextureCache_;
    delete this.frameState_;
  }
}
const WebGLTileLayerRenderer$1 = WebGLTileLayerRenderer;
class PaletteTexture {
  constructor(name, data) {
    this.name = name;
    this.data = data;
    this.texture_ = null;
  }
  getTexture(gl) {
    if (!this.texture_) {
      const texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        this.data.length / 4,
        1,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        this.data
      );
      this.texture_ = texture;
    }
    return this.texture_;
  }
}
const PaletteTexture$1 = PaletteTexture;
const ValueTypes = {
  NUMBER: 1,
  STRING: 2,
  COLOR: 4,
  BOOLEAN: 8,
  NUMBER_ARRAY: 16,
  ANY: 31,
  NONE: 0
};
const Operators = {};
function getValueType(value) {
  if (typeof value === "number") {
    return ValueTypes.NUMBER;
  }
  if (typeof value === "boolean") {
    return ValueTypes.BOOLEAN;
  }
  if (typeof value === "string") {
    if (isStringColor(value)) {
      return ValueTypes.COLOR | ValueTypes.STRING;
    }
    return ValueTypes.STRING;
  }
  if (!Array.isArray(value)) {
    throw new Error(`Unhandled value type: ${JSON.stringify(value)}`);
  }
  const valueArr = value;
  const onlyNumbers = valueArr.every(function(v) {
    return typeof v === "number";
  });
  if (onlyNumbers) {
    if (valueArr.length === 3 || valueArr.length === 4) {
      return ValueTypes.COLOR | ValueTypes.NUMBER_ARRAY;
    }
    return ValueTypes.NUMBER_ARRAY;
  }
  if (typeof valueArr[0] !== "string") {
    throw new Error(
      `Expected an expression operator but received: ${JSON.stringify(
        valueArr
      )}`
    );
  }
  const operator = Operators[valueArr[0]];
  if (operator === void 0) {
    throw new Error(
      `Unrecognized expression operator: ${JSON.stringify(valueArr)}`
    );
  }
  return operator.getReturnType(valueArr.slice(1));
}
function isTypeUnique(valueType) {
  return Math.log2(valueType) % 1 === 0;
}
function numberToGlsl(v) {
  const s = v.toString();
  return s.includes(".") ? s : s + ".0";
}
function arrayToGlsl(array) {
  if (array.length < 2 || array.length > 4) {
    throw new Error(
      "`formatArray` can only output `vec2`, `vec3` or `vec4` arrays."
    );
  }
  return `vec${array.length}(${array.map(numberToGlsl).join(", ")})`;
}
function colorToGlsl(color) {
  const array = asArray(color).slice();
  if (array.length < 4) {
    array.push(1);
  }
  return arrayToGlsl(
    array.map(function(c, i) {
      return i < 3 ? c / 255 : c;
    })
  );
}
function getStringNumberEquivalent(context2, string) {
  if (context2.stringLiteralsMap[string] === void 0) {
    context2.stringLiteralsMap[string] = Object.keys(
      context2.stringLiteralsMap
    ).length;
  }
  return context2.stringLiteralsMap[string];
}
function stringToGlsl(context2, string) {
  return numberToGlsl(getStringNumberEquivalent(context2, string));
}
function expressionToGlsl(context2, value, typeHint) {
  if (Array.isArray(value) && typeof value[0] === "string") {
    const operator = Operators[value[0]];
    if (operator === void 0) {
      throw new Error(
        `Unrecognized expression operator: ${JSON.stringify(value)}`
      );
    }
    return operator.toGlsl(context2, value.slice(1), typeHint);
  }
  const valueType = getValueType(value);
  if ((valueType & ValueTypes.NUMBER) > 0) {
    return numberToGlsl(value);
  }
  if ((valueType & ValueTypes.BOOLEAN) > 0) {
    return value.toString();
  }
  if ((valueType & ValueTypes.STRING) > 0 && (typeHint === void 0 || typeHint == ValueTypes.STRING)) {
    return stringToGlsl(context2, value.toString());
  }
  if ((valueType & ValueTypes.COLOR) > 0 && (typeHint === void 0 || typeHint == ValueTypes.COLOR)) {
    return colorToGlsl(value);
  }
  if ((valueType & ValueTypes.NUMBER_ARRAY) > 0) {
    return arrayToGlsl(value);
  }
  throw new Error(`Unexpected expression ${value} (expected type ${typeHint})`);
}
function assertNumber(value) {
  if (!(getValueType(value) & ValueTypes.NUMBER)) {
    throw new Error(
      `A numeric value was expected, got ${JSON.stringify(value)} instead`
    );
  }
}
function assertNumbers(values) {
  for (let i = 0; i < values.length; i++) {
    assertNumber(values[i]);
  }
}
function assertString(value) {
  if (!(getValueType(value) & ValueTypes.STRING)) {
    throw new Error(
      `A string value was expected, got ${JSON.stringify(value)} instead`
    );
  }
}
function assertBoolean(value) {
  if (!(getValueType(value) & ValueTypes.BOOLEAN)) {
    throw new Error(
      `A boolean value was expected, got ${JSON.stringify(value)} instead`
    );
  }
}
function assertArgsCount(args, count) {
  if (args.length !== count) {
    throw new Error(
      `Exactly ${count} arguments were expected, got ${args.length} instead`
    );
  }
}
function assertArgsMinCount(args, count) {
  if (args.length < count) {
    throw new Error(
      `At least ${count} arguments were expected, got ${args.length} instead`
    );
  }
}
function assertArgsMaxCount(args, count) {
  if (args.length > count) {
    throw new Error(
      `At most ${count} arguments were expected, got ${args.length} instead`
    );
  }
}
function assertArgsEven(args) {
  if (args.length % 2 !== 0) {
    throw new Error(
      `An even amount of arguments was expected, got ${args} instead`
    );
  }
}
function assertArgsOdd(args) {
  if (args.length % 2 === 0) {
    throw new Error(
      `An odd amount of arguments was expected, got ${args} instead`
    );
  }
}
function assertUniqueInferredType(args, types) {
  if (!isTypeUnique(types)) {
    throw new Error(
      `Could not infer only one type from the following expression: ${JSON.stringify(
        args
      )}`
    );
  }
}
Operators["get"] = {
  getReturnType: function(args) {
    return ValueTypes.ANY;
  },
  toGlsl: function(context2, args) {
    assertArgsCount(args, 1);
    assertString(args[0]);
    const value = args[0].toString();
    if (!context2.attributes.includes(value)) {
      context2.attributes.push(value);
    }
    const prefix = context2.inFragmentShader ? "v_" : "a_";
    return prefix + value;
  }
};
function uniformNameForVariable(variableName) {
  return "u_var_" + variableName;
}
Operators["var"] = {
  getReturnType: function(args) {
    return ValueTypes.ANY;
  },
  toGlsl: function(context2, args) {
    assertArgsCount(args, 1);
    assertString(args[0]);
    const value = args[0].toString();
    if (!context2.variables.includes(value)) {
      context2.variables.push(value);
    }
    return uniformNameForVariable(value);
  }
};
const PALETTE_TEXTURE_ARRAY = "u_paletteTextures";
Operators["palette"] = {
  getReturnType: function(args) {
    return ValueTypes.COLOR;
  },
  toGlsl: function(context2, args) {
    assertArgsCount(args, 2);
    assertNumber(args[0]);
    const index = expressionToGlsl(context2, args[0]);
    const colors = args[1];
    if (!Array.isArray(colors)) {
      throw new Error("The second argument of palette must be an array");
    }
    const numColors = colors.length;
    const palette = new Uint8Array(numColors * 4);
    for (let i = 0; i < numColors; i++) {
      const candidate = colors[i];
      let color;
      if (typeof candidate === "string") {
        color = fromString(candidate);
      } else {
        if (!Array.isArray(candidate)) {
          throw new Error(
            "The second argument of palette must be an array of strings or colors"
          );
        }
        const length = candidate.length;
        if (length === 4) {
          color = candidate;
        } else {
          if (length !== 3) {
            throw new Error(
              `Expected palette color to have 3 or 4 values, got ${length}`
            );
          }
          color = [candidate[0], candidate[1], candidate[2], 1];
        }
      }
      const offset = i * 4;
      palette[offset] = color[0];
      palette[offset + 1] = color[1];
      palette[offset + 2] = color[2];
      palette[offset + 3] = color[3] * 255;
    }
    if (!context2.paletteTextures) {
      context2.paletteTextures = [];
    }
    const paletteName = `${PALETTE_TEXTURE_ARRAY}[${context2.paletteTextures.length}]`;
    const paletteTexture = new PaletteTexture$1(paletteName, palette);
    context2.paletteTextures.push(paletteTexture);
    return `texture2D(${paletteName}, vec2((${index} + 0.5) / ${numColors}.0, 0.5))`;
  }
};
const GET_BAND_VALUE_FUNC = "getBandValue";
Operators["band"] = {
  getReturnType: function(args) {
    return ValueTypes.NUMBER;
  },
  toGlsl: function(context2, args) {
    assertArgsMinCount(args, 1);
    assertArgsMaxCount(args, 3);
    const band = args[0];
    if (!(GET_BAND_VALUE_FUNC in context2.functions)) {
      let ifBlocks = "";
      const bandCount = context2.bandCount || 1;
      for (let i = 0; i < bandCount; i++) {
        const colorIndex = Math.floor(i / 4);
        let bandIndex = i % 4;
        if (i === bandCount - 1 && bandIndex === 1) {
          bandIndex = 3;
        }
        const textureName = `${Uniforms.TILE_TEXTURE_ARRAY}[${colorIndex}]`;
        ifBlocks += `
          if (band == ${i + 1}.0) {
            return texture2D(${textureName}, v_textureCoord + vec2(dx, dy))[${bandIndex}];
          }
        `;
      }
      context2.functions[GET_BAND_VALUE_FUNC] = `
        float getBandValue(float band, float xOffset, float yOffset) {
          float dx = xOffset / ${Uniforms.TEXTURE_PIXEL_WIDTH};
          float dy = yOffset / ${Uniforms.TEXTURE_PIXEL_HEIGHT};
          ${ifBlocks}
        }
      `;
    }
    const bandExpression = expressionToGlsl(context2, band);
    const xOffsetExpression = expressionToGlsl(context2, args[1] || 0);
    const yOffsetExpression = expressionToGlsl(context2, args[2] || 0);
    return `${GET_BAND_VALUE_FUNC}(${bandExpression}, ${xOffsetExpression}, ${yOffsetExpression})`;
  }
};
Operators["time"] = {
  getReturnType: function(args) {
    return ValueTypes.NUMBER;
  },
  toGlsl: function(context2, args) {
    assertArgsCount(args, 0);
    return "u_time";
  }
};
Operators["zoom"] = {
  getReturnType: function(args) {
    return ValueTypes.NUMBER;
  },
  toGlsl: function(context2, args) {
    assertArgsCount(args, 0);
    return "u_zoom";
  }
};
Operators["resolution"] = {
  getReturnType: function(args) {
    return ValueTypes.NUMBER;
  },
  toGlsl: function(context2, args) {
    assertArgsCount(args, 0);
    return "u_resolution";
  }
};
Operators["*"] = {
  getReturnType: function(args) {
    return ValueTypes.NUMBER;
  },
  toGlsl: function(context2, args) {
    assertArgsCount(args, 2);
    assertNumbers(args);
    return `(${expressionToGlsl(context2, args[0])} * ${expressionToGlsl(
      context2,
      args[1]
    )})`;
  }
};
Operators["/"] = {
  getReturnType: function(args) {
    return ValueTypes.NUMBER;
  },
  toGlsl: function(context2, args) {
    assertArgsCount(args, 2);
    assertNumbers(args);
    return `(${expressionToGlsl(context2, args[0])} / ${expressionToGlsl(
      context2,
      args[1]
    )})`;
  }
};
Operators["+"] = {
  getReturnType: function(args) {
    return ValueTypes.NUMBER;
  },
  toGlsl: function(context2, args) {
    assertArgsCount(args, 2);
    assertNumbers(args);
    return `(${expressionToGlsl(context2, args[0])} + ${expressionToGlsl(
      context2,
      args[1]
    )})`;
  }
};
Operators["-"] = {
  getReturnType: function(args) {
    return ValueTypes.NUMBER;
  },
  toGlsl: function(context2, args) {
    assertArgsCount(args, 2);
    assertNumbers(args);
    return `(${expressionToGlsl(context2, args[0])} - ${expressionToGlsl(
      context2,
      args[1]
    )})`;
  }
};
Operators["clamp"] = {
  getReturnType: function(args) {
    return ValueTypes.NUMBER;
  },
  toGlsl: function(context2, args) {
    assertArgsCount(args, 3);
    assertNumbers(args);
    const min = expressionToGlsl(context2, args[1]);
    const max = expressionToGlsl(context2, args[2]);
    return `clamp(${expressionToGlsl(context2, args[0])}, ${min}, ${max})`;
  }
};
Operators["%"] = {
  getReturnType: function(args) {
    return ValueTypes.NUMBER;
  },
  toGlsl: function(context2, args) {
    assertArgsCount(args, 2);
    assertNumbers(args);
    return `mod(${expressionToGlsl(context2, args[0])}, ${expressionToGlsl(
      context2,
      args[1]
    )})`;
  }
};
Operators["^"] = {
  getReturnType: function(args) {
    return ValueTypes.NUMBER;
  },
  toGlsl: function(context2, args) {
    assertArgsCount(args, 2);
    assertNumbers(args);
    return `pow(${expressionToGlsl(context2, args[0])}, ${expressionToGlsl(
      context2,
      args[1]
    )})`;
  }
};
Operators["abs"] = {
  getReturnType: function(args) {
    return ValueTypes.NUMBER;
  },
  toGlsl: function(context2, args) {
    assertArgsCount(args, 1);
    assertNumbers(args);
    return `abs(${expressionToGlsl(context2, args[0])})`;
  }
};
Operators["floor"] = {
  getReturnType: function(args) {
    return ValueTypes.NUMBER;
  },
  toGlsl: function(context2, args) {
    assertArgsCount(args, 1);
    assertNumbers(args);
    return `floor(${expressionToGlsl(context2, args[0])})`;
  }
};
Operators["round"] = {
  getReturnType: function(args) {
    return ValueTypes.NUMBER;
  },
  toGlsl: function(context2, args) {
    assertArgsCount(args, 1);
    assertNumbers(args);
    return `floor(${expressionToGlsl(context2, args[0])} + 0.5)`;
  }
};
Operators["ceil"] = {
  getReturnType: function(args) {
    return ValueTypes.NUMBER;
  },
  toGlsl: function(context2, args) {
    assertArgsCount(args, 1);
    assertNumbers(args);
    return `ceil(${expressionToGlsl(context2, args[0])})`;
  }
};
Operators["sin"] = {
  getReturnType: function(args) {
    return ValueTypes.NUMBER;
  },
  toGlsl: function(context2, args) {
    assertArgsCount(args, 1);
    assertNumbers(args);
    return `sin(${expressionToGlsl(context2, args[0])})`;
  }
};
Operators["cos"] = {
  getReturnType: function(args) {
    return ValueTypes.NUMBER;
  },
  toGlsl: function(context2, args) {
    assertArgsCount(args, 1);
    assertNumbers(args);
    return `cos(${expressionToGlsl(context2, args[0])})`;
  }
};
Operators["atan"] = {
  getReturnType: function(args) {
    return ValueTypes.NUMBER;
  },
  toGlsl: function(context2, args) {
    assertArgsMinCount(args, 1);
    assertArgsMaxCount(args, 2);
    assertNumbers(args);
    return args.length === 2 ? `atan(${expressionToGlsl(context2, args[0])}, ${expressionToGlsl(
      context2,
      args[1]
    )})` : `atan(${expressionToGlsl(context2, args[0])})`;
  }
};
Operators[">"] = {
  getReturnType: function(args) {
    return ValueTypes.BOOLEAN;
  },
  toGlsl: function(context2, args) {
    assertArgsCount(args, 2);
    assertNumbers(args);
    return `(${expressionToGlsl(context2, args[0])} > ${expressionToGlsl(
      context2,
      args[1]
    )})`;
  }
};
Operators[">="] = {
  getReturnType: function(args) {
    return ValueTypes.BOOLEAN;
  },
  toGlsl: function(context2, args) {
    assertArgsCount(args, 2);
    assertNumbers(args);
    return `(${expressionToGlsl(context2, args[0])} >= ${expressionToGlsl(
      context2,
      args[1]
    )})`;
  }
};
Operators["<"] = {
  getReturnType: function(args) {
    return ValueTypes.BOOLEAN;
  },
  toGlsl: function(context2, args) {
    assertArgsCount(args, 2);
    assertNumbers(args);
    return `(${expressionToGlsl(context2, args[0])} < ${expressionToGlsl(
      context2,
      args[1]
    )})`;
  }
};
Operators["<="] = {
  getReturnType: function(args) {
    return ValueTypes.BOOLEAN;
  },
  toGlsl: function(context2, args) {
    assertArgsCount(args, 2);
    assertNumbers(args);
    return `(${expressionToGlsl(context2, args[0])} <= ${expressionToGlsl(
      context2,
      args[1]
    )})`;
  }
};
function getEqualOperator(operator) {
  return {
    getReturnType: function(args) {
      return ValueTypes.BOOLEAN;
    },
    toGlsl: function(context2, args) {
      assertArgsCount(args, 2);
      let type = ValueTypes.ANY;
      for (let i = 0; i < args.length; i++) {
        type &= getValueType(args[i]);
      }
      if (type === ValueTypes.NONE) {
        throw new Error(
          `All arguments should be of compatible type, got ${JSON.stringify(
            args
          )} instead`
        );
      }
      type &= ~ValueTypes.COLOR;
      return `(${expressionToGlsl(
        context2,
        args[0],
        type
      )} ${operator} ${expressionToGlsl(context2, args[1], type)})`;
    }
  };
}
Operators["=="] = getEqualOperator("==");
Operators["!="] = getEqualOperator("!=");
Operators["!"] = {
  getReturnType: function(args) {
    return ValueTypes.BOOLEAN;
  },
  toGlsl: function(context2, args) {
    assertArgsCount(args, 1);
    assertBoolean(args[0]);
    return `(!${expressionToGlsl(context2, args[0])})`;
  }
};
function getDecisionOperator(operator) {
  return {
    getReturnType: function(args) {
      return ValueTypes.BOOLEAN;
    },
    toGlsl: function(context2, args) {
      assertArgsMinCount(args, 2);
      for (let i = 0; i < args.length; i++) {
        assertBoolean(args[i]);
      }
      let result = "";
      result = args.map((arg) => expressionToGlsl(context2, arg)).join(` ${operator} `);
      result = `(${result})`;
      return result;
    }
  };
}
Operators["all"] = getDecisionOperator("&&");
Operators["any"] = getDecisionOperator("||");
Operators["between"] = {
  getReturnType: function(args) {
    return ValueTypes.BOOLEAN;
  },
  toGlsl: function(context2, args) {
    assertArgsCount(args, 3);
    assertNumbers(args);
    const min = expressionToGlsl(context2, args[1]);
    const max = expressionToGlsl(context2, args[2]);
    const value = expressionToGlsl(context2, args[0]);
    return `(${value} >= ${min} && ${value} <= ${max})`;
  }
};
Operators["array"] = {
  getReturnType: function(args) {
    return ValueTypes.NUMBER_ARRAY;
  },
  toGlsl: function(context2, args) {
    assertArgsMinCount(args, 2);
    assertArgsMaxCount(args, 4);
    assertNumbers(args);
    const parsedArgs = args.map(function(val) {
      return expressionToGlsl(context2, val, ValueTypes.NUMBER);
    });
    return `vec${args.length}(${parsedArgs.join(", ")})`;
  }
};
Operators["color"] = {
  getReturnType: function(args) {
    return ValueTypes.COLOR;
  },
  toGlsl: function(context2, args) {
    assertArgsMinCount(args, 3);
    assertArgsMaxCount(args, 4);
    assertNumbers(args);
    const array = args;
    if (args.length === 3) {
      array.push(1);
    }
    const parsedArgs = args.map(function(val, i) {
      return expressionToGlsl(context2, val, ValueTypes.NUMBER) + (i < 3 ? " / 255.0" : "");
    });
    return `vec${args.length}(${parsedArgs.join(", ")})`;
  }
};
Operators["interpolate"] = {
  getReturnType: function(args) {
    let type = ValueTypes.COLOR | ValueTypes.NUMBER;
    for (let i = 3; i < args.length; i += 2) {
      type = type & getValueType(args[i]);
    }
    return type;
  },
  toGlsl: function(context2, args, typeHint) {
    assertArgsEven(args);
    assertArgsMinCount(args, 6);
    const type = args[0];
    let interpolation;
    switch (type[0]) {
      case "linear":
        interpolation = 1;
        break;
      case "exponential":
        interpolation = type[1];
        break;
      default:
        interpolation = null;
    }
    if (!interpolation) {
      throw new Error(
        `Invalid interpolation type for "interpolate" operator, received: ${JSON.stringify(
          type
        )}`
      );
    }
    typeHint = typeHint !== void 0 ? typeHint : ValueTypes.ANY;
    const outputType = Operators["interpolate"].getReturnType(args) & typeHint;
    assertUniqueInferredType(args, outputType);
    const input = expressionToGlsl(context2, args[1]);
    const exponent = numberToGlsl(interpolation);
    let result = "";
    for (let i = 2; i < args.length - 2; i += 2) {
      const stop1 = expressionToGlsl(context2, args[i]);
      const output1 = result || expressionToGlsl(context2, args[i + 1], outputType);
      const stop2 = expressionToGlsl(context2, args[i + 2]);
      const output2 = expressionToGlsl(context2, args[i + 3], outputType);
      result = `mix(${output1}, ${output2}, pow(clamp((${input} - ${stop1}) / (${stop2} - ${stop1}), 0.0, 1.0), ${exponent}))`;
    }
    return result;
  }
};
Operators["match"] = {
  getReturnType: function(args) {
    let type = ValueTypes.ANY;
    for (let i = 2; i < args.length; i += 2) {
      type = type & getValueType(args[i]);
    }
    type = type & getValueType(args[args.length - 1]);
    return type;
  },
  toGlsl: function(context2, args, typeHint) {
    assertArgsEven(args);
    assertArgsMinCount(args, 4);
    typeHint = typeHint !== void 0 ? typeHint : ValueTypes.ANY;
    const outputType = Operators["match"].getReturnType(args) & typeHint;
    assertUniqueInferredType(args, outputType);
    const input = expressionToGlsl(context2, args[0]);
    const fallback = expressionToGlsl(
      context2,
      args[args.length - 1],
      outputType
    );
    let result = null;
    for (let i = args.length - 3; i >= 1; i -= 2) {
      const match = expressionToGlsl(context2, args[i]);
      const output = expressionToGlsl(context2, args[i + 1], outputType);
      result = `(${input} == ${match} ? ${output} : ${result || fallback})`;
    }
    return result;
  }
};
Operators["case"] = {
  getReturnType: function(args) {
    let type = ValueTypes.ANY;
    for (let i = 1; i < args.length; i += 2) {
      type = type & getValueType(args[i]);
    }
    type = type & getValueType(args[args.length - 1]);
    return type;
  },
  toGlsl: function(context2, args, typeHint) {
    assertArgsOdd(args);
    assertArgsMinCount(args, 3);
    typeHint = typeHint !== void 0 ? typeHint : ValueTypes.ANY;
    const outputType = Operators["case"].getReturnType(args) & typeHint;
    assertUniqueInferredType(args, outputType);
    for (let i = 0; i < args.length - 1; i += 2) {
      assertBoolean(args[i]);
    }
    const fallback = expressionToGlsl(
      context2,
      args[args.length - 1],
      outputType
    );
    let result = null;
    for (let i = args.length - 3; i >= 0; i -= 2) {
      const condition = expressionToGlsl(context2, args[i]);
      const output = expressionToGlsl(context2, args[i + 1], outputType);
      result = `(${condition} ? ${output} : ${result || fallback})`;
    }
    return result;
  }
};
function parseStyle(style2, bandCount) {
  const vertexShader = `
    attribute vec2 ${Attributes.TEXTURE_COORD};
    uniform mat4 ${Uniforms.TILE_TRANSFORM};
    uniform float ${Uniforms.TEXTURE_PIXEL_WIDTH};
    uniform float ${Uniforms.TEXTURE_PIXEL_HEIGHT};
    uniform float ${Uniforms.TEXTURE_RESOLUTION};
    uniform float ${Uniforms.TEXTURE_ORIGIN_X};
    uniform float ${Uniforms.TEXTURE_ORIGIN_Y};
    uniform float ${Uniforms.DEPTH};

    varying vec2 v_textureCoord;
    varying vec2 v_mapCoord;

    void main() {
      v_textureCoord = ${Attributes.TEXTURE_COORD};
      v_mapCoord = vec2(
        ${Uniforms.TEXTURE_ORIGIN_X} + ${Uniforms.TEXTURE_RESOLUTION} * ${Uniforms.TEXTURE_PIXEL_WIDTH} * v_textureCoord[0],
        ${Uniforms.TEXTURE_ORIGIN_Y} - ${Uniforms.TEXTURE_RESOLUTION} * ${Uniforms.TEXTURE_PIXEL_HEIGHT} * v_textureCoord[1]
      );
      gl_Position = ${Uniforms.TILE_TRANSFORM} * vec4(${Attributes.TEXTURE_COORD}, ${Uniforms.DEPTH}, 1.0);
    }
  `;
  const context2 = {
    inFragmentShader: true,
    variables: [],
    attributes: [],
    stringLiteralsMap: {},
    functions: {},
    bandCount
  };
  const pipeline = [];
  if (style2.color !== void 0) {
    const color = expressionToGlsl(context2, style2.color, ValueTypes.COLOR);
    pipeline.push(`color = ${color};`);
  }
  if (style2.contrast !== void 0) {
    const contrast = expressionToGlsl(
      context2,
      style2.contrast,
      ValueTypes.NUMBER
    );
    pipeline.push(
      `color.rgb = clamp((${contrast} + 1.0) * color.rgb - (${contrast} / 2.0), vec3(0.0, 0.0, 0.0), vec3(1.0, 1.0, 1.0));`
    );
  }
  if (style2.exposure !== void 0) {
    const exposure = expressionToGlsl(
      context2,
      style2.exposure,
      ValueTypes.NUMBER
    );
    pipeline.push(
      `color.rgb = clamp((${exposure} + 1.0) * color.rgb, vec3(0.0, 0.0, 0.0), vec3(1.0, 1.0, 1.0));`
    );
  }
  if (style2.saturation !== void 0) {
    const saturation = expressionToGlsl(
      context2,
      style2.saturation,
      ValueTypes.NUMBER
    );
    pipeline.push(`
      float saturation = ${saturation} + 1.0;
      float sr = (1.0 - saturation) * 0.2126;
      float sg = (1.0 - saturation) * 0.7152;
      float sb = (1.0 - saturation) * 0.0722;
      mat3 saturationMatrix = mat3(
        sr + saturation, sr, sr,
        sg, sg + saturation, sg,
        sb, sb, sb + saturation
      );
      color.rgb = clamp(saturationMatrix * color.rgb, vec3(0.0, 0.0, 0.0), vec3(1.0, 1.0, 1.0));
    `);
  }
  if (style2.gamma !== void 0) {
    const gamma = expressionToGlsl(context2, style2.gamma, ValueTypes.NUMBER);
    pipeline.push(`color.rgb = pow(color.rgb, vec3(1.0 / ${gamma}));`);
  }
  if (style2.brightness !== void 0) {
    const brightness = expressionToGlsl(
      context2,
      style2.brightness,
      ValueTypes.NUMBER
    );
    pipeline.push(
      `color.rgb = clamp(color.rgb + ${brightness}, vec3(0.0, 0.0, 0.0), vec3(1.0, 1.0, 1.0));`
    );
  }
  const uniforms = {};
  const numVariables = context2.variables.length;
  if (numVariables > 1 && !style2.variables) {
    throw new Error(
      `Missing variables in style (expected ${context2.variables})`
    );
  }
  for (let i = 0; i < numVariables; ++i) {
    const variableName = context2.variables[i];
    if (!(variableName in style2.variables)) {
      throw new Error(`Missing '${variableName}' in style variables`);
    }
    const uniformName = uniformNameForVariable(variableName);
    uniforms[uniformName] = function() {
      let value = style2.variables[variableName];
      if (typeof value === "string") {
        value = getStringNumberEquivalent(context2, value);
      }
      return value !== void 0 ? value : -9999999;
    };
  }
  const uniformDeclarations = Object.keys(uniforms).map(function(name) {
    return `uniform float ${name};`;
  });
  const textureCount = Math.ceil(bandCount / 4);
  uniformDeclarations.push(
    `uniform sampler2D ${Uniforms.TILE_TEXTURE_ARRAY}[${textureCount}];`
  );
  if (context2.paletteTextures) {
    uniformDeclarations.push(
      `uniform sampler2D ${PALETTE_TEXTURE_ARRAY}[${context2.paletteTextures.length}];`
    );
  }
  const functionDefintions = Object.keys(context2.functions).map(function(name) {
    return context2.functions[name];
  });
  const fragmentShader = `
    #ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
    #else
    precision mediump float;
    #endif

    varying vec2 v_textureCoord;
    varying vec2 v_mapCoord;
    uniform vec4 ${Uniforms.RENDER_EXTENT};
    uniform float ${Uniforms.TRANSITION_ALPHA};
    uniform float ${Uniforms.TEXTURE_PIXEL_WIDTH};
    uniform float ${Uniforms.TEXTURE_PIXEL_HEIGHT};
    uniform float ${Uniforms.RESOLUTION};
    uniform float ${Uniforms.ZOOM};

    ${uniformDeclarations.join("\n")}

    ${functionDefintions.join("\n")}

    void main() {
      if (
        v_mapCoord[0] < ${Uniforms.RENDER_EXTENT}[0] ||
        v_mapCoord[1] < ${Uniforms.RENDER_EXTENT}[1] ||
        v_mapCoord[0] > ${Uniforms.RENDER_EXTENT}[2] ||
        v_mapCoord[1] > ${Uniforms.RENDER_EXTENT}[3]
      ) {
        discard;
      }

      vec4 color = texture2D(${Uniforms.TILE_TEXTURE_ARRAY}[0],  v_textureCoord);

      ${pipeline.join("\n")}

      if (color.a == 0.0) {
        discard;
      }

      gl_FragColor = color;
      gl_FragColor.rgb *= gl_FragColor.a;
      gl_FragColor *= ${Uniforms.TRANSITION_ALPHA};
    }`;
  return {
    vertexShader,
    fragmentShader,
    uniforms,
    paletteTextures: context2.paletteTextures
  };
}
class WebGLTileLayer extends BaseTileLayer$1 {
  constructor(options) {
    options = options ? Object.assign({}, options) : {};
    const style2 = options.style || {};
    delete options.style;
    const cacheSize = options.cacheSize;
    delete options.cacheSize;
    super(options);
    this.sources_ = options.sources;
    this.renderedSource_ = null;
    this.renderedResolution_ = NaN;
    this.style_ = style2;
    this.cacheSize_ = cacheSize;
    this.styleVariables_ = this.style_.variables || {};
    this.addChangeListener(LayerProperty.SOURCE, this.handleSourceUpdate_);
  }
  getSources(extent2, resolution) {
    const source = this.getSource();
    return this.sources_ ? typeof this.sources_ === "function" ? this.sources_(extent2, resolution) : this.sources_ : source ? [source] : [];
  }
  getRenderSource() {
    return this.renderedSource_ || this.getSource();
  }
  getSourceState() {
    const source = this.getRenderSource();
    return source ? source.getState() : "undefined";
  }
  handleSourceUpdate_() {
    if (this.hasRenderer()) {
      this.getRenderer().clearCache();
    }
    if (this.getSource()) {
      this.setStyle(this.style_);
    }
  }
  getSourceBandCount_() {
    const max = Number.MAX_SAFE_INTEGER;
    const sources = this.getSources([-max, -max, max, max], max);
    return sources && sources.length && "bandCount" in sources[0] ? sources[0].bandCount : 4;
  }
  createRenderer() {
    const parsedStyle = parseStyle(this.style_, this.getSourceBandCount_());
    return new WebGLTileLayerRenderer$1(this, {
      vertexShader: parsedStyle.vertexShader,
      fragmentShader: parsedStyle.fragmentShader,
      uniforms: parsedStyle.uniforms,
      cacheSize: this.cacheSize_,
      paletteTextures: parsedStyle.paletteTextures
    });
  }
  renderSources(frameState, sources) {
    const layerRenderer = this.getRenderer();
    let canvas;
    for (let i = 0, ii = sources.length; i < ii; ++i) {
      this.renderedSource_ = sources[i];
      if (layerRenderer.prepareFrame(frameState)) {
        canvas = layerRenderer.renderFrame(frameState);
      }
    }
    return canvas;
  }
  render(frameState, target) {
    this.rendered = true;
    const viewState = frameState.viewState;
    const sources = this.getSources(frameState.extent, viewState.resolution);
    let ready = true;
    for (let i = 0, ii = sources.length; i < ii; ++i) {
      const source = sources[i];
      const sourceState = source.getState();
      if (sourceState == "loading") {
        const onChange = () => {
          if (source.getState() == "ready") {
            source.removeEventListener("change", onChange);
            this.changed();
          }
        };
        source.addEventListener("change", onChange);
      }
      ready = ready && sourceState == "ready";
    }
    const canvas = this.renderSources(frameState, sources);
    if (this.getRenderer().renderComplete && ready) {
      this.renderedResolution_ = viewState.resolution;
      return canvas;
    }
    if (this.renderedResolution_ > 0.5 * viewState.resolution) {
      const altSources = this.getSources(
        frameState.extent,
        this.renderedResolution_
      ).filter((source) => !sources.includes(source));
      if (altSources.length > 0) {
        return this.renderSources(frameState, altSources);
      }
    }
    return canvas;
  }
  setStyle(style2) {
    this.styleVariables_ = style2.variables || {};
    this.style_ = style2;
    const parsedStyle = parseStyle(this.style_, this.getSourceBandCount_());
    const renderer = this.getRenderer();
    renderer.reset({
      vertexShader: parsedStyle.vertexShader,
      fragmentShader: parsedStyle.fragmentShader,
      uniforms: parsedStyle.uniforms,
      paletteTextures: parsedStyle.paletteTextures
    });
    this.changed();
  }
  updateStyleVariables(variables) {
    Object.assign(this.styleVariables_, variables);
    this.changed();
  }
}
WebGLTileLayer.prototype.dispose;
const TileLayer$2 = WebGLTileLayer;
const tmpTileCoord = [0, 0, 0];
const DECIMALS = 5;
class TileGrid {
  constructor(options) {
    this.minZoom = options.minZoom !== void 0 ? options.minZoom : 0;
    this.resolutions_ = options.resolutions;
    assert(
      isSorted(
        this.resolutions_,
        function(a, b) {
          return b - a;
        },
        true
      ),
      17
    );
    let zoomFactor;
    if (!options.origins) {
      for (let i = 0, ii = this.resolutions_.length - 1; i < ii; ++i) {
        if (!zoomFactor) {
          zoomFactor = this.resolutions_[i] / this.resolutions_[i + 1];
        } else {
          if (this.resolutions_[i] / this.resolutions_[i + 1] !== zoomFactor) {
            zoomFactor = void 0;
            break;
          }
        }
      }
    }
    this.zoomFactor_ = zoomFactor;
    this.maxZoom = this.resolutions_.length - 1;
    this.origin_ = options.origin !== void 0 ? options.origin : null;
    this.origins_ = null;
    if (options.origins !== void 0) {
      this.origins_ = options.origins;
      assert(this.origins_.length == this.resolutions_.length, 20);
    }
    const extent2 = options.extent;
    if (extent2 !== void 0 && !this.origin_ && !this.origins_) {
      this.origin_ = getTopLeft(extent2);
    }
    assert(
      !this.origin_ && this.origins_ || this.origin_ && !this.origins_,
      18
    );
    this.tileSizes_ = null;
    if (options.tileSizes !== void 0) {
      this.tileSizes_ = options.tileSizes;
      assert(this.tileSizes_.length == this.resolutions_.length, 19);
    }
    this.tileSize_ = options.tileSize !== void 0 ? options.tileSize : !this.tileSizes_ ? DEFAULT_TILE_SIZE : null;
    assert(
      !this.tileSize_ && this.tileSizes_ || this.tileSize_ && !this.tileSizes_,
      22
    );
    this.extent_ = extent2 !== void 0 ? extent2 : null;
    this.fullTileRanges_ = null;
    this.tmpSize_ = [0, 0];
    this.tmpExtent_ = [0, 0, 0, 0];
    if (options.sizes !== void 0) {
      this.fullTileRanges_ = options.sizes.map(function(size, z) {
        const tileRange = new TileRange$1(
          Math.min(0, size[0]),
          Math.max(size[0] - 1, -1),
          Math.min(0, size[1]),
          Math.max(size[1] - 1, -1)
        );
        if (extent2) {
          const restrictedTileRange = this.getTileRangeForExtentAndZ(extent2, z);
          tileRange.minX = Math.max(restrictedTileRange.minX, tileRange.minX);
          tileRange.maxX = Math.min(restrictedTileRange.maxX, tileRange.maxX);
          tileRange.minY = Math.max(restrictedTileRange.minY, tileRange.minY);
          tileRange.maxY = Math.min(restrictedTileRange.maxY, tileRange.maxY);
        }
        return tileRange;
      }, this);
    } else if (extent2) {
      this.calculateTileRanges_(extent2);
    }
  }
  forEachTileCoord(extent2, zoom, callback) {
    const tileRange = this.getTileRangeForExtentAndZ(extent2, zoom);
    for (let i = tileRange.minX, ii = tileRange.maxX; i <= ii; ++i) {
      for (let j = tileRange.minY, jj = tileRange.maxY; j <= jj; ++j) {
        callback([zoom, i, j]);
      }
    }
  }
  forEachTileCoordParentTileRange(tileCoord, callback, tempTileRange, tempExtent) {
    let tileRange, x, y;
    let tileCoordExtent = null;
    let z = tileCoord[0] - 1;
    if (this.zoomFactor_ === 2) {
      x = tileCoord[1];
      y = tileCoord[2];
    } else {
      tileCoordExtent = this.getTileCoordExtent(tileCoord, tempExtent);
    }
    while (z >= this.minZoom) {
      if (this.zoomFactor_ === 2) {
        x = Math.floor(x / 2);
        y = Math.floor(y / 2);
        tileRange = createOrUpdate$1(x, x, y, y, tempTileRange);
      } else {
        tileRange = this.getTileRangeForExtentAndZ(
          tileCoordExtent,
          z,
          tempTileRange
        );
      }
      if (callback(z, tileRange)) {
        return true;
      }
      --z;
    }
    return false;
  }
  getExtent() {
    return this.extent_;
  }
  getMaxZoom() {
    return this.maxZoom;
  }
  getMinZoom() {
    return this.minZoom;
  }
  getOrigin(z) {
    if (this.origin_) {
      return this.origin_;
    } else {
      return this.origins_[z];
    }
  }
  getResolution(z) {
    return this.resolutions_[z];
  }
  getResolutions() {
    return this.resolutions_;
  }
  getTileCoordChildTileRange(tileCoord, tempTileRange, tempExtent) {
    if (tileCoord[0] < this.maxZoom) {
      if (this.zoomFactor_ === 2) {
        const minX = tileCoord[1] * 2;
        const minY = tileCoord[2] * 2;
        return createOrUpdate$1(
          minX,
          minX + 1,
          minY,
          minY + 1,
          tempTileRange
        );
      }
      const tileCoordExtent = this.getTileCoordExtent(
        tileCoord,
        tempExtent || this.tmpExtent_
      );
      return this.getTileRangeForExtentAndZ(
        tileCoordExtent,
        tileCoord[0] + 1,
        tempTileRange
      );
    }
    return null;
  }
  getTileRangeForTileCoordAndZ(tileCoord, z, tempTileRange) {
    if (z > this.maxZoom || z < this.minZoom) {
      return null;
    }
    const tileCoordZ = tileCoord[0];
    const tileCoordX = tileCoord[1];
    const tileCoordY = tileCoord[2];
    if (z === tileCoordZ) {
      return createOrUpdate$1(
        tileCoordX,
        tileCoordY,
        tileCoordX,
        tileCoordY,
        tempTileRange
      );
    }
    if (this.zoomFactor_) {
      const factor = Math.pow(this.zoomFactor_, z - tileCoordZ);
      const minX = Math.floor(tileCoordX * factor);
      const minY = Math.floor(tileCoordY * factor);
      if (z < tileCoordZ) {
        return createOrUpdate$1(minX, minX, minY, minY, tempTileRange);
      }
      const maxX = Math.floor(factor * (tileCoordX + 1)) - 1;
      const maxY = Math.floor(factor * (tileCoordY + 1)) - 1;
      return createOrUpdate$1(minX, maxX, minY, maxY, tempTileRange);
    }
    const tileCoordExtent = this.getTileCoordExtent(tileCoord, this.tmpExtent_);
    return this.getTileRangeForExtentAndZ(tileCoordExtent, z, tempTileRange);
  }
  getTileRangeExtent(z, tileRange, tempExtent) {
    const origin = this.getOrigin(z);
    const resolution = this.getResolution(z);
    const tileSize = toSize(this.getTileSize(z), this.tmpSize_);
    const minX = origin[0] + tileRange.minX * tileSize[0] * resolution;
    const maxX = origin[0] + (tileRange.maxX + 1) * tileSize[0] * resolution;
    const minY = origin[1] + tileRange.minY * tileSize[1] * resolution;
    const maxY = origin[1] + (tileRange.maxY + 1) * tileSize[1] * resolution;
    return createOrUpdate$2(minX, minY, maxX, maxY, tempExtent);
  }
  getTileRangeForExtentAndZ(extent2, z, tempTileRange) {
    const tileCoord = tmpTileCoord;
    this.getTileCoordForXYAndZ_(extent2[0], extent2[3], z, false, tileCoord);
    const minX = tileCoord[1];
    const minY = tileCoord[2];
    this.getTileCoordForXYAndZ_(extent2[2], extent2[1], z, true, tileCoord);
    return createOrUpdate$1(
      minX,
      tileCoord[1],
      minY,
      tileCoord[2],
      tempTileRange
    );
  }
  getTileCoordCenter(tileCoord) {
    const origin = this.getOrigin(tileCoord[0]);
    const resolution = this.getResolution(tileCoord[0]);
    const tileSize = toSize(this.getTileSize(tileCoord[0]), this.tmpSize_);
    return [
      origin[0] + (tileCoord[1] + 0.5) * tileSize[0] * resolution,
      origin[1] - (tileCoord[2] + 0.5) * tileSize[1] * resolution
    ];
  }
  getTileCoordExtent(tileCoord, tempExtent) {
    const origin = this.getOrigin(tileCoord[0]);
    const resolution = this.getResolution(tileCoord[0]);
    const tileSize = toSize(this.getTileSize(tileCoord[0]), this.tmpSize_);
    const minX = origin[0] + tileCoord[1] * tileSize[0] * resolution;
    const minY = origin[1] - (tileCoord[2] + 1) * tileSize[1] * resolution;
    const maxX = minX + tileSize[0] * resolution;
    const maxY = minY + tileSize[1] * resolution;
    return createOrUpdate$2(minX, minY, maxX, maxY, tempExtent);
  }
  getTileCoordForCoordAndResolution(coordinate, resolution, opt_tileCoord) {
    return this.getTileCoordForXYAndResolution_(
      coordinate[0],
      coordinate[1],
      resolution,
      false,
      opt_tileCoord
    );
  }
  getTileCoordForXYAndResolution_(x, y, resolution, reverseIntersectionPolicy, opt_tileCoord) {
    const z = this.getZForResolution(resolution);
    const scale2 = resolution / this.getResolution(z);
    const origin = this.getOrigin(z);
    const tileSize = toSize(this.getTileSize(z), this.tmpSize_);
    let tileCoordX = scale2 * (x - origin[0]) / resolution / tileSize[0];
    let tileCoordY = scale2 * (origin[1] - y) / resolution / tileSize[1];
    if (reverseIntersectionPolicy) {
      tileCoordX = ceil(tileCoordX, DECIMALS) - 1;
      tileCoordY = ceil(tileCoordY, DECIMALS) - 1;
    } else {
      tileCoordX = floor(tileCoordX, DECIMALS);
      tileCoordY = floor(tileCoordY, DECIMALS);
    }
    return createOrUpdate(z, tileCoordX, tileCoordY, opt_tileCoord);
  }
  getTileCoordForXYAndZ_(x, y, z, reverseIntersectionPolicy, opt_tileCoord) {
    const origin = this.getOrigin(z);
    const resolution = this.getResolution(z);
    const tileSize = toSize(this.getTileSize(z), this.tmpSize_);
    let tileCoordX = (x - origin[0]) / resolution / tileSize[0];
    let tileCoordY = (origin[1] - y) / resolution / tileSize[1];
    if (reverseIntersectionPolicy) {
      tileCoordX = ceil(tileCoordX, DECIMALS) - 1;
      tileCoordY = ceil(tileCoordY, DECIMALS) - 1;
    } else {
      tileCoordX = floor(tileCoordX, DECIMALS);
      tileCoordY = floor(tileCoordY, DECIMALS);
    }
    return createOrUpdate(z, tileCoordX, tileCoordY, opt_tileCoord);
  }
  getTileCoordForCoordAndZ(coordinate, z, opt_tileCoord) {
    return this.getTileCoordForXYAndZ_(
      coordinate[0],
      coordinate[1],
      z,
      false,
      opt_tileCoord
    );
  }
  getTileCoordResolution(tileCoord) {
    return this.resolutions_[tileCoord[0]];
  }
  getTileSize(z) {
    if (this.tileSize_) {
      return this.tileSize_;
    } else {
      return this.tileSizes_[z];
    }
  }
  getFullTileRange(z) {
    if (!this.fullTileRanges_) {
      return this.extent_ ? this.getTileRangeForExtentAndZ(this.extent_, z) : null;
    } else {
      return this.fullTileRanges_[z];
    }
  }
  getZForResolution(resolution, opt_direction) {
    const z = linearFindNearest(
      this.resolutions_,
      resolution,
      opt_direction || 0
    );
    return clamp(z, this.minZoom, this.maxZoom);
  }
  tileCoordIntersectsViewport(tileCoord, viewport) {
    return intersectsLinearRing(
      viewport,
      0,
      viewport.length,
      2,
      this.getTileCoordExtent(tileCoord)
    );
  }
  calculateTileRanges_(extent2) {
    const length = this.resolutions_.length;
    const fullTileRanges = new Array(length);
    for (let z = this.minZoom; z < length; ++z) {
      fullTileRanges[z] = this.getTileRangeForExtentAndZ(extent2, z);
    }
    this.fullTileRanges_ = fullTileRanges;
  }
}
const TileGrid$1 = TileGrid;
class TileCache extends LRUCache$1 {
  clear() {
    while (this.getCount() > 0) {
      this.pop().release();
    }
    super.clear();
  }
  expireCache(usedTiles) {
    while (this.canExpireCache()) {
      const tile = this.peekLast();
      if (tile.getKey() in usedTiles) {
        break;
      } else {
        this.pop().release();
      }
    }
  }
  pruneExceptNewestZ() {
    if (this.getCount() === 0) {
      return;
    }
    const key = this.peekFirstKey();
    const tileCoord = fromKey(key);
    const z = tileCoord[0];
    this.forEach(
      function(tile) {
        if (tile.tileCoord[0] !== z) {
          this.remove(getKey(tile.tileCoord));
          tile.release();
        }
      }.bind(this)
    );
  }
}
const TileCache$1 = TileCache;
const TileEventType = {
  TILELOADSTART: "tileloadstart",
  TILELOADEND: "tileloadend",
  TILELOADERROR: "tileloaderror"
};
class Source extends BaseObject$1 {
  constructor(options) {
    super();
    this.projection = get(options.projection);
    this.attributions_ = adaptAttributions(options.attributions);
    this.attributionsCollapsible_ = options.attributionsCollapsible !== void 0 ? options.attributionsCollapsible : true;
    this.loading = false;
    this.state_ = options.state !== void 0 ? options.state : "ready";
    this.wrapX_ = options.wrapX !== void 0 ? options.wrapX : false;
    this.interpolate_ = !!options.interpolate;
    this.viewResolver = null;
    this.viewRejector = null;
    const self2 = this;
    this.viewPromise_ = new Promise(function(resolve, reject) {
      self2.viewResolver = resolve;
      self2.viewRejector = reject;
    });
  }
  getAttributions() {
    return this.attributions_;
  }
  getAttributionsCollapsible() {
    return this.attributionsCollapsible_;
  }
  getProjection() {
    return this.projection;
  }
  getResolutions() {
    return abstract();
  }
  getView() {
    return this.viewPromise_;
  }
  getState() {
    return this.state_;
  }
  getWrapX() {
    return this.wrapX_;
  }
  getInterpolate() {
    return this.interpolate_;
  }
  refresh() {
    this.changed();
  }
  setAttributions(attributions) {
    this.attributions_ = adaptAttributions(attributions);
    this.changed();
  }
  setState(state) {
    this.state_ = state;
    this.changed();
  }
}
function adaptAttributions(attributionLike) {
  if (!attributionLike) {
    return null;
  }
  if (Array.isArray(attributionLike)) {
    return function(frameState) {
      return attributionLike;
    };
  }
  if (typeof attributionLike === "function") {
    return attributionLike;
  }
  return function(frameState) {
    return [attributionLike];
  };
}
const Source$1 = Source;
function getForProjection(projection) {
  let tileGrid = projection.getDefaultTileGrid();
  if (!tileGrid) {
    tileGrid = createForProjection(projection);
    projection.setDefaultTileGrid(tileGrid);
  }
  return tileGrid;
}
function wrapX(tileGrid, tileCoord, projection) {
  const z = tileCoord[0];
  const center = tileGrid.getTileCoordCenter(tileCoord);
  const projectionExtent = extentFromProjection(projection);
  if (!containsCoordinate(projectionExtent, center)) {
    const worldWidth = getWidth(projectionExtent);
    const worldsAway = Math.ceil(
      (projectionExtent[0] - center[0]) / worldWidth
    );
    center[0] += worldWidth * worldsAway;
    return tileGrid.getTileCoordForCoordAndZ(center, z);
  } else {
    return tileCoord;
  }
}
function createForExtent(extent2, maxZoom, tileSize, corner) {
  corner = corner !== void 0 ? corner : "top-left";
  const resolutions = resolutionsFromExtent(extent2, maxZoom, tileSize);
  return new TileGrid$1({
    extent: extent2,
    origin: getCorner(extent2, corner),
    resolutions,
    tileSize
  });
}
function resolutionsFromExtent(extent2, maxZoom, tileSize, maxResolution) {
  maxZoom = maxZoom !== void 0 ? maxZoom : DEFAULT_MAX_ZOOM;
  tileSize = toSize(tileSize !== void 0 ? tileSize : DEFAULT_TILE_SIZE);
  const height = getHeight(extent2);
  const width = getWidth(extent2);
  maxResolution = maxResolution > 0 ? maxResolution : Math.max(width / tileSize[0], height / tileSize[1]);
  const length = maxZoom + 1;
  const resolutions = new Array(length);
  for (let z = 0; z < length; ++z) {
    resolutions[z] = maxResolution / Math.pow(2, z);
  }
  return resolutions;
}
function createForProjection(projection, maxZoom, tileSize, corner) {
  const extent2 = extentFromProjection(projection);
  return createForExtent(extent2, maxZoom, tileSize, corner);
}
function extentFromProjection(projection) {
  projection = get(projection);
  let extent2 = projection.getExtent();
  if (!extent2) {
    const half = 180 * METERS_PER_UNIT$1.degrees / projection.getMetersPerUnit();
    extent2 = createOrUpdate$2(-half, -half, half, half);
  }
  return extent2;
}
class TileSource extends Source$1 {
  constructor(options) {
    super({
      attributions: options.attributions,
      attributionsCollapsible: options.attributionsCollapsible,
      projection: options.projection,
      state: options.state,
      wrapX: options.wrapX,
      interpolate: options.interpolate
    });
    this.on;
    this.once;
    this.un;
    this.opaque_ = options.opaque !== void 0 ? options.opaque : false;
    this.tilePixelRatio_ = options.tilePixelRatio !== void 0 ? options.tilePixelRatio : 1;
    this.tileGrid = options.tileGrid !== void 0 ? options.tileGrid : null;
    const tileSize = [256, 256];
    if (this.tileGrid) {
      toSize(this.tileGrid.getTileSize(this.tileGrid.getMinZoom()), tileSize);
    }
    this.tileCache = new TileCache$1(options.cacheSize || 0);
    this.tmpSize = [0, 0];
    this.key_ = options.key || "";
    this.tileOptions = {
      transition: options.transition,
      interpolate: options.interpolate
    };
    this.zDirection = options.zDirection ? options.zDirection : 0;
  }
  canExpireCache() {
    return this.tileCache.canExpireCache();
  }
  expireCache(projection, usedTiles) {
    const tileCache = this.getTileCacheForProjection(projection);
    if (tileCache) {
      tileCache.expireCache(usedTiles);
    }
  }
  forEachLoadedTile(projection, z, tileRange, callback) {
    const tileCache = this.getTileCacheForProjection(projection);
    if (!tileCache) {
      return false;
    }
    let covered = true;
    let tile, tileCoordKey, loaded;
    for (let x = tileRange.minX; x <= tileRange.maxX; ++x) {
      for (let y = tileRange.minY; y <= tileRange.maxY; ++y) {
        tileCoordKey = getKeyZXY(z, x, y);
        loaded = false;
        if (tileCache.containsKey(tileCoordKey)) {
          tile = tileCache.get(tileCoordKey);
          loaded = tile.getState() === TileState.LOADED;
          if (loaded) {
            loaded = callback(tile) !== false;
          }
        }
        if (!loaded) {
          covered = false;
        }
      }
    }
    return covered;
  }
  getGutterForProjection(projection) {
    return 0;
  }
  getKey() {
    return this.key_;
  }
  setKey(key) {
    if (this.key_ !== key) {
      this.key_ = key;
      this.changed();
    }
  }
  getOpaque(projection) {
    return this.opaque_;
  }
  getResolutions() {
    if (!this.tileGrid) {
      return null;
    }
    return this.tileGrid.getResolutions();
  }
  getTile(z, x, y, pixelRatio, projection) {
    return abstract();
  }
  getTileGrid() {
    return this.tileGrid;
  }
  getTileGridForProjection(projection) {
    if (!this.tileGrid) {
      return getForProjection(projection);
    } else {
      return this.tileGrid;
    }
  }
  getTileCacheForProjection(projection) {
    const sourceProjection = this.getProjection();
    assert(
      sourceProjection === null || equivalent(sourceProjection, projection),
      68
    );
    return this.tileCache;
  }
  getTilePixelRatio(pixelRatio) {
    return this.tilePixelRatio_;
  }
  getTilePixelSize(z, pixelRatio, projection) {
    const tileGrid = this.getTileGridForProjection(projection);
    const tilePixelRatio = this.getTilePixelRatio(pixelRatio);
    const tileSize = toSize(tileGrid.getTileSize(z), this.tmpSize);
    if (tilePixelRatio == 1) {
      return tileSize;
    } else {
      return scale(tileSize, tilePixelRatio, this.tmpSize);
    }
  }
  getTileCoordForTileUrlFunction(tileCoord, projection) {
    projection = projection !== void 0 ? projection : this.getProjection();
    const tileGrid = this.getTileGridForProjection(projection);
    if (this.getWrapX() && projection.isGlobal()) {
      tileCoord = wrapX(tileGrid, tileCoord, projection);
    }
    return withinExtentAndZ(tileCoord, tileGrid) ? tileCoord : null;
  }
  clear() {
    this.tileCache.clear();
  }
  refresh() {
    this.clear();
    super.refresh();
  }
  updateCacheSize(tileCount, projection) {
    const tileCache = this.getTileCacheForProjection(projection);
    if (tileCount > tileCache.highWaterMark) {
      tileCache.highWaterMark = tileCount;
    }
  }
  useTile(z, x, y, projection) {
  }
}
class TileSourceEvent extends Event {
  constructor(type, tile) {
    super(type);
    this.tile = tile;
  }
}
const TileSource$1 = TileSource;
function createFromTemplate(template, tileGrid) {
  const zRegEx = /\{z\}/g;
  const xRegEx = /\{x\}/g;
  const yRegEx = /\{y\}/g;
  const dashYRegEx = /\{-y\}/g;
  return function(tileCoord, pixelRatio, projection) {
    if (!tileCoord) {
      return void 0;
    } else {
      return template.replace(zRegEx, tileCoord[0].toString()).replace(xRegEx, tileCoord[1].toString()).replace(yRegEx, tileCoord[2].toString()).replace(dashYRegEx, function() {
        const z = tileCoord[0];
        const range = tileGrid.getFullTileRange(z);
        assert(range, 55);
        const y = range.getHeight() - tileCoord[2] - 1;
        return y.toString();
      });
    }
  };
}
function createFromTemplates(templates, tileGrid) {
  const len = templates.length;
  const tileUrlFunctions = new Array(len);
  for (let i = 0; i < len; ++i) {
    tileUrlFunctions[i] = createFromTemplate(templates[i], tileGrid);
  }
  return createFromTileUrlFunctions(tileUrlFunctions);
}
function createFromTileUrlFunctions(tileUrlFunctions) {
  if (tileUrlFunctions.length === 1) {
    return tileUrlFunctions[0];
  }
  return function(tileCoord, pixelRatio, projection) {
    if (!tileCoord) {
      return void 0;
    } else {
      const h = hash(tileCoord);
      const index = modulo(h, tileUrlFunctions.length);
      return tileUrlFunctions[index](tileCoord, pixelRatio, projection);
    }
  };
}
function expandUrl(url) {
  const urls = [];
  let match = /\{([a-z])-([a-z])\}/.exec(url);
  if (match) {
    const startCharCode = match[1].charCodeAt(0);
    const stopCharCode = match[2].charCodeAt(0);
    let charCode;
    for (charCode = startCharCode; charCode <= stopCharCode; ++charCode) {
      urls.push(url.replace(match[0], String.fromCharCode(charCode)));
    }
    return urls;
  }
  match = /\{(\d+)-(\d+)\}/.exec(url);
  if (match) {
    const stop = parseInt(match[2], 10);
    for (let i = parseInt(match[1], 10); i <= stop; i++) {
      urls.push(url.replace(match[0], i.toString()));
    }
    return urls;
  }
  urls.push(url);
  return urls;
}
class UrlTile extends TileSource$1 {
  constructor(options) {
    super({
      attributions: options.attributions,
      cacheSize: options.cacheSize,
      opaque: options.opaque,
      projection: options.projection,
      state: options.state,
      tileGrid: options.tileGrid,
      tilePixelRatio: options.tilePixelRatio,
      wrapX: options.wrapX,
      transition: options.transition,
      interpolate: options.interpolate,
      key: options.key,
      attributionsCollapsible: options.attributionsCollapsible,
      zDirection: options.zDirection
    });
    this.generateTileUrlFunction_ = this.tileUrlFunction === UrlTile.prototype.tileUrlFunction;
    this.tileLoadFunction = options.tileLoadFunction;
    if (options.tileUrlFunction) {
      this.tileUrlFunction = options.tileUrlFunction;
    }
    this.urls = null;
    if (options.urls) {
      this.setUrls(options.urls);
    } else if (options.url) {
      this.setUrl(options.url);
    }
    this.tileLoadingKeys_ = {};
  }
  getTileLoadFunction() {
    return this.tileLoadFunction;
  }
  getTileUrlFunction() {
    return Object.getPrototypeOf(this).tileUrlFunction === this.tileUrlFunction ? this.tileUrlFunction.bind(this) : this.tileUrlFunction;
  }
  getUrls() {
    return this.urls;
  }
  handleTileChange(event) {
    const tile = event.target;
    const uid = getUid(tile);
    const tileState = tile.getState();
    let type;
    if (tileState == TileState.LOADING) {
      this.tileLoadingKeys_[uid] = true;
      type = TileEventType.TILELOADSTART;
    } else if (uid in this.tileLoadingKeys_) {
      delete this.tileLoadingKeys_[uid];
      type = tileState == TileState.ERROR ? TileEventType.TILELOADERROR : tileState == TileState.LOADED ? TileEventType.TILELOADEND : void 0;
    }
    if (type != void 0) {
      this.dispatchEvent(new TileSourceEvent(type, tile));
    }
  }
  setTileLoadFunction(tileLoadFunction) {
    this.tileCache.clear();
    this.tileLoadFunction = tileLoadFunction;
    this.changed();
  }
  setTileUrlFunction(tileUrlFunction, key) {
    this.tileUrlFunction = tileUrlFunction;
    this.tileCache.pruneExceptNewestZ();
    if (typeof key !== "undefined") {
      this.setKey(key);
    } else {
      this.changed();
    }
  }
  setUrl(url) {
    const urls = expandUrl(url);
    this.urls = urls;
    this.setUrls(urls);
  }
  setUrls(urls) {
    this.urls = urls;
    const key = urls.join("\n");
    if (this.generateTileUrlFunction_) {
      this.setTileUrlFunction(createFromTemplates(urls, this.tileGrid), key);
    } else {
      this.setKey(key);
    }
  }
  tileUrlFunction(tileCoord, pixelRatio, projection) {
    return void 0;
  }
  useTile(z, x, y) {
    const tileCoordKey = getKeyZXY(z, x, y);
    if (this.tileCache.containsKey(tileCoordKey)) {
      this.tileCache.get(tileCoordKey);
    }
  }
}
const UrlTile$1 = UrlTile;
class TileImage extends UrlTile$1 {
  constructor(options) {
    super({
      attributions: options.attributions,
      cacheSize: options.cacheSize,
      opaque: options.opaque,
      projection: options.projection,
      state: options.state,
      tileGrid: options.tileGrid,
      tileLoadFunction: options.tileLoadFunction ? options.tileLoadFunction : defaultTileLoadFunction,
      tilePixelRatio: options.tilePixelRatio,
      tileUrlFunction: options.tileUrlFunction,
      url: options.url,
      urls: options.urls,
      wrapX: options.wrapX,
      transition: options.transition,
      interpolate: options.interpolate !== void 0 ? options.interpolate : true,
      key: options.key,
      attributionsCollapsible: options.attributionsCollapsible,
      zDirection: options.zDirection
    });
    this.crossOrigin = options.crossOrigin !== void 0 ? options.crossOrigin : null;
    this.tileClass = options.tileClass !== void 0 ? options.tileClass : ImageTile$1;
    this.tileCacheForProjection = {};
    this.tileGridForProjection = {};
    this.reprojectionErrorThreshold_ = options.reprojectionErrorThreshold;
    this.renderReprojectionEdges_ = false;
  }
  canExpireCache() {
    if (this.tileCache.canExpireCache()) {
      return true;
    } else {
      for (const key in this.tileCacheForProjection) {
        if (this.tileCacheForProjection[key].canExpireCache()) {
          return true;
        }
      }
    }
    return false;
  }
  expireCache(projection, usedTiles) {
    const usedTileCache = this.getTileCacheForProjection(projection);
    this.tileCache.expireCache(
      this.tileCache == usedTileCache ? usedTiles : {}
    );
    for (const id in this.tileCacheForProjection) {
      const tileCache = this.tileCacheForProjection[id];
      tileCache.expireCache(tileCache == usedTileCache ? usedTiles : {});
    }
  }
  getGutterForProjection(projection) {
    if (this.getProjection() && projection && !equivalent(this.getProjection(), projection)) {
      return 0;
    } else {
      return this.getGutter();
    }
  }
  getGutter() {
    return 0;
  }
  getKey() {
    let key = super.getKey();
    if (!this.getInterpolate()) {
      key += ":disable-interpolation";
    }
    return key;
  }
  getOpaque(projection) {
    if (this.getProjection() && projection && !equivalent(this.getProjection(), projection)) {
      return false;
    } else {
      return super.getOpaque(projection);
    }
  }
  getTileGridForProjection(projection) {
    const thisProj = this.getProjection();
    if (this.tileGrid && (!thisProj || equivalent(thisProj, projection))) {
      return this.tileGrid;
    } else {
      const projKey = getUid(projection);
      if (!(projKey in this.tileGridForProjection)) {
        this.tileGridForProjection[projKey] = getForProjection(projection);
      }
      return this.tileGridForProjection[projKey];
    }
  }
  getTileCacheForProjection(projection) {
    const thisProj = this.getProjection();
    if (!thisProj || equivalent(thisProj, projection)) {
      return this.tileCache;
    } else {
      const projKey = getUid(projection);
      if (!(projKey in this.tileCacheForProjection)) {
        this.tileCacheForProjection[projKey] = new TileCache$1(
          this.tileCache.highWaterMark
        );
      }
      return this.tileCacheForProjection[projKey];
    }
  }
  createTile_(z, x, y, pixelRatio, projection, key) {
    const tileCoord = [z, x, y];
    const urlTileCoord = this.getTileCoordForTileUrlFunction(
      tileCoord,
      projection
    );
    const tileUrl = urlTileCoord ? this.tileUrlFunction(urlTileCoord, pixelRatio, projection) : void 0;
    const tile = new this.tileClass(
      tileCoord,
      tileUrl !== void 0 ? TileState.IDLE : TileState.EMPTY,
      tileUrl !== void 0 ? tileUrl : "",
      this.crossOrigin,
      this.tileLoadFunction,
      this.tileOptions
    );
    tile.key = key;
    tile.addEventListener(EventType.CHANGE, this.handleTileChange.bind(this));
    return tile;
  }
  getTile(z, x, y, pixelRatio, projection) {
    const sourceProjection = this.getProjection();
    if (!sourceProjection || !projection || equivalent(sourceProjection, projection)) {
      return this.getTileInternal(
        z,
        x,
        y,
        pixelRatio,
        sourceProjection || projection
      );
    } else {
      const cache2 = this.getTileCacheForProjection(projection);
      const tileCoord = [z, x, y];
      let tile;
      const tileCoordKey = getKey(tileCoord);
      if (cache2.containsKey(tileCoordKey)) {
        tile = cache2.get(tileCoordKey);
      }
      const key = this.getKey();
      if (tile && tile.key == key) {
        return tile;
      } else {
        const sourceTileGrid = this.getTileGridForProjection(sourceProjection);
        const targetTileGrid = this.getTileGridForProjection(projection);
        const wrappedTileCoord = this.getTileCoordForTileUrlFunction(
          tileCoord,
          projection
        );
        const newTile = new ReprojTile$1(
          sourceProjection,
          sourceTileGrid,
          projection,
          targetTileGrid,
          tileCoord,
          wrappedTileCoord,
          this.getTilePixelRatio(pixelRatio),
          this.getGutter(),
          function(z2, x2, y2, pixelRatio2) {
            return this.getTileInternal(z2, x2, y2, pixelRatio2, sourceProjection);
          }.bind(this),
          this.reprojectionErrorThreshold_,
          this.renderReprojectionEdges_,
          this.getInterpolate()
        );
        newTile.key = key;
        if (tile) {
          newTile.interimTile = tile;
          newTile.refreshInterimChain();
          cache2.replace(tileCoordKey, newTile);
        } else {
          cache2.set(tileCoordKey, newTile);
        }
        return newTile;
      }
    }
  }
  getTileInternal(z, x, y, pixelRatio, projection) {
    let tile = null;
    const tileCoordKey = getKeyZXY(z, x, y);
    const key = this.getKey();
    if (!this.tileCache.containsKey(tileCoordKey)) {
      tile = this.createTile_(z, x, y, pixelRatio, projection, key);
      this.tileCache.set(tileCoordKey, tile);
    } else {
      tile = this.tileCache.get(tileCoordKey);
      if (tile.key != key) {
        const interimTile = tile;
        tile = this.createTile_(z, x, y, pixelRatio, projection, key);
        if (interimTile.getState() == TileState.IDLE) {
          tile.interimTile = interimTile.interimTile;
        } else {
          tile.interimTile = interimTile;
        }
        tile.refreshInterimChain();
        this.tileCache.replace(tileCoordKey, tile);
      }
    }
    return tile;
  }
  setRenderReprojectionEdges(render2) {
    if (this.renderReprojectionEdges_ == render2) {
      return;
    }
    this.renderReprojectionEdges_ = render2;
    for (const id in this.tileCacheForProjection) {
      this.tileCacheForProjection[id].clear();
    }
    this.changed();
  }
  setTileGridForProjection(projection, tilegrid) {
    const proj = get(projection);
    if (proj) {
      const projKey = getUid(proj);
      if (!(projKey in this.tileGridForProjection)) {
        this.tileGridForProjection[projKey] = tilegrid;
      }
    }
  }
  clear() {
    super.clear();
    for (const id in this.tileCacheForProjection) {
      this.tileCacheForProjection[id].clear();
    }
  }
}
function defaultTileLoadFunction(imageTile, src) {
  imageTile.getImage().src = src;
}
const TileImage$1 = TileImage;
class CustomTile extends ImageTile$1 {
  constructor(tileSize, tileCoord, state, src, crossOrigin, tileLoadFunction, options) {
    super(tileCoord, state, src, crossOrigin, tileLoadFunction, options);
    this.zoomifyImage_ = null;
    this.tileSize_ = tileSize;
  }
  getImage() {
    if (this.zoomifyImage_) {
      return this.zoomifyImage_;
    }
    const image = super.getImage();
    if (this.state == TileState.LOADED) {
      const tileSize = this.tileSize_;
      if (image.width == tileSize[0] && image.height == tileSize[1]) {
        this.zoomifyImage_ = image;
        return image;
      } else {
        const context2 = createCanvasContext2D(tileSize[0], tileSize[1]);
        context2.drawImage(image, 0, 0);
        this.zoomifyImage_ = context2.canvas;
        return context2.canvas;
      }
    } else {
      return image;
    }
  }
}
class Zoomify extends TileImage$1 {
  constructor(options) {
    const size = options.size;
    const tierSizeCalculation = options.tierSizeCalculation !== void 0 ? options.tierSizeCalculation : "default";
    const tilePixelRatio = options.tilePixelRatio || 1;
    const imageWidth = size[0];
    const imageHeight = size[1];
    const tierSizeInTiles = [];
    const tileSize = options.tileSize || DEFAULT_TILE_SIZE;
    let tileSizeForTierSizeCalculation = tileSize * tilePixelRatio;
    switch (tierSizeCalculation) {
      case "default":
        while (imageWidth > tileSizeForTierSizeCalculation || imageHeight > tileSizeForTierSizeCalculation) {
          tierSizeInTiles.push([
            Math.ceil(imageWidth / tileSizeForTierSizeCalculation),
            Math.ceil(imageHeight / tileSizeForTierSizeCalculation)
          ]);
          tileSizeForTierSizeCalculation += tileSizeForTierSizeCalculation;
        }
        break;
      case "truncated":
        let width = imageWidth;
        let height = imageHeight;
        while (width > tileSizeForTierSizeCalculation || height > tileSizeForTierSizeCalculation) {
          tierSizeInTiles.push([
            Math.ceil(width / tileSizeForTierSizeCalculation),
            Math.ceil(height / tileSizeForTierSizeCalculation)
          ]);
          width >>= 1;
          height >>= 1;
        }
        break;
      default:
        assert(false, 53);
        break;
    }
    tierSizeInTiles.push([1, 1]);
    tierSizeInTiles.reverse();
    const resolutions = [tilePixelRatio];
    const tileCountUpToTier = [0];
    for (let i = 1, ii = tierSizeInTiles.length; i < ii; i++) {
      resolutions.push(tilePixelRatio << i);
      tileCountUpToTier.push(
        tierSizeInTiles[i - 1][0] * tierSizeInTiles[i - 1][1] + tileCountUpToTier[i - 1]
      );
    }
    resolutions.reverse();
    const tileGrid = new TileGrid$1({
      tileSize,
      extent: options.extent || [0, -imageHeight, imageWidth, 0],
      resolutions
    });
    let url = options.url;
    if (url && !url.includes("{TileGroup}") && !url.includes("{tileIndex}")) {
      url += "{TileGroup}/{z}-{x}-{y}.jpg";
    }
    const urls = expandUrl(url);
    let tileWidth = tileSize * tilePixelRatio;
    function createFromTemplate2(template) {
      return function(tileCoord, pixelRatio, projection) {
        if (!tileCoord) {
          return void 0;
        } else {
          const tileCoordZ = tileCoord[0];
          const tileCoordX = tileCoord[1];
          const tileCoordY = tileCoord[2];
          const tileIndex = tileCoordX + tileCoordY * tierSizeInTiles[tileCoordZ][0];
          const tileGroup = (tileIndex + tileCountUpToTier[tileCoordZ]) / tileWidth | 0;
          const localContext = {
            "z": tileCoordZ,
            "x": tileCoordX,
            "y": tileCoordY,
            "tileIndex": tileIndex,
            "TileGroup": "TileGroup" + tileGroup
          };
          return template.replace(/\{(\w+?)\}/g, function(m, p) {
            return localContext[p];
          });
        }
      };
    }
    const tileUrlFunction = createFromTileUrlFunctions(
      urls.map(createFromTemplate2)
    );
    const ZoomifyTileClass = CustomTile.bind(
      null,
      toSize(tileSize * tilePixelRatio)
    );
    super({
      attributions: options.attributions,
      cacheSize: options.cacheSize,
      crossOrigin: options.crossOrigin,
      interpolate: options.interpolate,
      projection: options.projection,
      tilePixelRatio,
      reprojectionErrorThreshold: options.reprojectionErrorThreshold,
      tileClass: ZoomifyTileClass,
      tileGrid,
      tileUrlFunction,
      transition: options.transition
    });
    this.zDirection = options.zDirection;
    const tileUrl = tileGrid.getTileCoordForCoordAndResolution(
      getCenter(tileGrid.getExtent()),
      resolutions[resolutions.length - 1]
    );
    const testTileUrl = tileUrlFunction(tileUrl, 1, null);
    const image = new Image();
    image.addEventListener(
      "error",
      function() {
        tileWidth = tileSize;
        this.changed();
      }.bind(this)
    );
    image.src = testTileUrl;
  }
}
const Zoomify$1 = Zoomify;
class ImageCanvas extends ImageBase$1 {
  constructor(extent2, resolution, pixelRatio, canvas, loader) {
    const state = loader !== void 0 ? ImageState.IDLE : ImageState.LOADED;
    super(extent2, resolution, pixelRatio, state);
    this.loader_ = loader !== void 0 ? loader : null;
    this.canvas_ = canvas;
    this.error_ = null;
  }
  getError() {
    return this.error_;
  }
  handleLoad_(err) {
    if (err) {
      this.error_ = err;
      this.state = ImageState.ERROR;
    } else {
      this.state = ImageState.LOADED;
    }
    this.changed();
  }
  load() {
    if (this.state == ImageState.IDLE) {
      this.state = ImageState.LOADING;
      this.changed();
      this.loader_(this.handleLoad_.bind(this));
    }
  }
  getImage() {
    return this.canvas_;
  }
}
const ImageCanvas$1 = ImageCanvas;
class BaseImageLayer extends Layer$1 {
  constructor(options) {
    options = options ? options : {};
    super(options);
  }
}
const BaseImageLayer$1 = BaseImageLayer;
let pixelContext = null;
function createPixelContext() {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  pixelContext = canvas.getContext("2d");
}
class CanvasLayerRenderer extends LayerRenderer$1 {
  constructor(layer) {
    super(layer);
    this.container = null;
    this.renderedResolution;
    this.tempTransform = create$1();
    this.pixelTransform = create$1();
    this.inversePixelTransform = create$1();
    this.context = null;
    this.containerReused = false;
    this.pixelContext_ = null;
    this.frameState = null;
  }
  getImageData(image, col, row) {
    if (!pixelContext) {
      createPixelContext();
    }
    pixelContext.clearRect(0, 0, 1, 1);
    let data;
    try {
      pixelContext.drawImage(image, col, row, 1, 1, 0, 0, 1, 1);
      data = pixelContext.getImageData(0, 0, 1, 1).data;
    } catch (err) {
      pixelContext = null;
      return null;
    }
    return data;
  }
  getBackground(frameState) {
    const layer = this.getLayer();
    let background = layer.getBackground();
    if (typeof background === "function") {
      background = background(frameState.viewState.resolution);
    }
    return background || void 0;
  }
  useContainer(target, transform2, backgroundColor) {
    const layerClassName = this.getLayer().getClassName();
    let container, context2;
    if (target && target.className === layerClassName && (!backgroundColor || target && target.style.backgroundColor && equals$2(
      asArray(target.style.backgroundColor),
      asArray(backgroundColor)
    ))) {
      const canvas = target.firstElementChild;
      if (canvas instanceof HTMLCanvasElement) {
        context2 = canvas.getContext("2d");
      }
    }
    if (context2 && context2.canvas.style.transform === transform2) {
      this.container = target;
      this.context = context2;
      this.containerReused = true;
    } else if (this.containerReused) {
      this.container = null;
      this.context = null;
      this.containerReused = false;
    }
    if (!this.container) {
      container = document.createElement("div");
      container.className = layerClassName;
      let style2 = container.style;
      style2.position = "absolute";
      style2.width = "100%";
      style2.height = "100%";
      context2 = createCanvasContext2D();
      const canvas = context2.canvas;
      container.appendChild(canvas);
      style2 = canvas.style;
      style2.position = "absolute";
      style2.left = "0";
      style2.transformOrigin = "top left";
      this.container = container;
      this.context = context2;
    }
    if (!this.containerReused && backgroundColor && !this.container.style.backgroundColor) {
      this.container.style.backgroundColor = backgroundColor;
    }
  }
  clipUnrotated(context2, frameState, extent2) {
    const topLeft = getTopLeft(extent2);
    const topRight = getTopRight(extent2);
    const bottomRight = getBottomRight(extent2);
    const bottomLeft = getBottomLeft(extent2);
    apply(frameState.coordinateToPixelTransform, topLeft);
    apply(frameState.coordinateToPixelTransform, topRight);
    apply(frameState.coordinateToPixelTransform, bottomRight);
    apply(frameState.coordinateToPixelTransform, bottomLeft);
    const inverted = this.inversePixelTransform;
    apply(inverted, topLeft);
    apply(inverted, topRight);
    apply(inverted, bottomRight);
    apply(inverted, bottomLeft);
    context2.save();
    context2.beginPath();
    context2.moveTo(Math.round(topLeft[0]), Math.round(topLeft[1]));
    context2.lineTo(Math.round(topRight[0]), Math.round(topRight[1]));
    context2.lineTo(Math.round(bottomRight[0]), Math.round(bottomRight[1]));
    context2.lineTo(Math.round(bottomLeft[0]), Math.round(bottomLeft[1]));
    context2.clip();
  }
  dispatchRenderEvent_(type, context2, frameState) {
    const layer = this.getLayer();
    if (layer.hasListener(type)) {
      const event = new RenderEvent$1(
        type,
        this.inversePixelTransform,
        frameState,
        context2
      );
      layer.dispatchEvent(event);
    }
  }
  preRender(context2, frameState) {
    this.frameState = frameState;
    this.dispatchRenderEvent_(RenderEventType.PRERENDER, context2, frameState);
  }
  postRender(context2, frameState) {
    this.dispatchRenderEvent_(RenderEventType.POSTRENDER, context2, frameState);
  }
  getRenderTransform(center, resolution, rotation, pixelRatio, width, height, offsetX) {
    const dx1 = width / 2;
    const dy1 = height / 2;
    const sx = pixelRatio / resolution;
    const sy = -sx;
    const dx2 = -center[0] + offsetX;
    const dy2 = -center[1];
    return compose(
      this.tempTransform,
      dx1,
      dy1,
      sx,
      sy,
      -rotation,
      dx2,
      dy2
    );
  }
  disposeInternal() {
    delete this.frameState;
    super.disposeInternal();
  }
}
const CanvasLayerRenderer$1 = CanvasLayerRenderer;
class CanvasImageLayerRenderer extends CanvasLayerRenderer$1 {
  constructor(imageLayer) {
    super(imageLayer);
    this.image_ = null;
  }
  getImage() {
    return !this.image_ ? null : this.image_.getImage();
  }
  prepareFrame(frameState) {
    const layerState = frameState.layerStatesArray[frameState.layerIndex];
    const pixelRatio = frameState.pixelRatio;
    const viewState = frameState.viewState;
    const viewResolution = viewState.resolution;
    const imageSource = this.getLayer().getSource();
    const hints = frameState.viewHints;
    let renderedExtent = frameState.extent;
    if (layerState.extent !== void 0) {
      renderedExtent = getIntersection(
        renderedExtent,
        fromUserExtent(layerState.extent, viewState.projection)
      );
    }
    if (!hints[ViewHint.ANIMATING] && !hints[ViewHint.INTERACTING] && !isEmpty(renderedExtent)) {
      if (imageSource) {
        const projection = viewState.projection;
        const image = imageSource.getImage(
          renderedExtent,
          viewResolution,
          pixelRatio,
          projection
        );
        if (image) {
          if (this.loadImage(image)) {
            this.image_ = image;
          } else if (image.getState() === ImageState.EMPTY) {
            this.image_ = null;
          }
        }
      } else {
        this.image_ = null;
      }
    }
    return !!this.image_;
  }
  getData(pixel) {
    const frameState = this.frameState;
    if (!frameState) {
      return null;
    }
    const layer = this.getLayer();
    const coordinate = apply(
      frameState.pixelToCoordinateTransform,
      pixel.slice()
    );
    const layerExtent = layer.getExtent();
    if (layerExtent) {
      if (!containsCoordinate(layerExtent, coordinate)) {
        return null;
      }
    }
    const imageExtent = this.image_.getExtent();
    const img = this.image_.getImage();
    const imageMapWidth = getWidth(imageExtent);
    const col = Math.floor(
      img.width * ((coordinate[0] - imageExtent[0]) / imageMapWidth)
    );
    if (col < 0 || col >= img.width) {
      return null;
    }
    const imageMapHeight = getHeight(imageExtent);
    const row = Math.floor(
      img.height * ((imageExtent[3] - coordinate[1]) / imageMapHeight)
    );
    if (row < 0 || row >= img.height) {
      return null;
    }
    return this.getImageData(img, col, row);
  }
  renderFrame(frameState, target) {
    const image = this.image_;
    const imageExtent = image.getExtent();
    const imageResolution = image.getResolution();
    const imagePixelRatio = image.getPixelRatio();
    const layerState = frameState.layerStatesArray[frameState.layerIndex];
    const pixelRatio = frameState.pixelRatio;
    const viewState = frameState.viewState;
    const viewCenter = viewState.center;
    const viewResolution = viewState.resolution;
    const scale2 = pixelRatio * imageResolution / (viewResolution * imagePixelRatio);
    const extent2 = frameState.extent;
    const resolution = viewState.resolution;
    const rotation = viewState.rotation;
    const width = Math.round(getWidth(extent2) / resolution * pixelRatio);
    const height = Math.round(getHeight(extent2) / resolution * pixelRatio);
    compose(
      this.pixelTransform,
      frameState.size[0] / 2,
      frameState.size[1] / 2,
      1 / pixelRatio,
      1 / pixelRatio,
      rotation,
      -width / 2,
      -height / 2
    );
    makeInverse(this.inversePixelTransform, this.pixelTransform);
    const canvasTransform = toString$1(this.pixelTransform);
    this.useContainer(target, canvasTransform, this.getBackground(frameState));
    const context2 = this.context;
    const canvas = context2.canvas;
    if (canvas.width != width || canvas.height != height) {
      canvas.width = width;
      canvas.height = height;
    } else if (!this.containerReused) {
      context2.clearRect(0, 0, width, height);
    }
    let clipped = false;
    let render2 = true;
    if (layerState.extent) {
      const layerExtent = fromUserExtent(
        layerState.extent,
        viewState.projection
      );
      render2 = intersects(layerExtent, frameState.extent);
      clipped = render2 && !containsExtent(layerExtent, frameState.extent);
      if (clipped) {
        this.clipUnrotated(context2, frameState, layerExtent);
      }
    }
    const img = image.getImage();
    const transform2 = compose(
      this.tempTransform,
      width / 2,
      height / 2,
      scale2,
      scale2,
      0,
      imagePixelRatio * (imageExtent[0] - viewCenter[0]) / imageResolution,
      imagePixelRatio * (viewCenter[1] - imageExtent[3]) / imageResolution
    );
    this.renderedResolution = imageResolution * pixelRatio / imagePixelRatio;
    const dw = img.width * transform2[0];
    const dh = img.height * transform2[3];
    if (!this.getLayer().getSource().getInterpolate()) {
      context2.imageSmoothingEnabled = false;
    }
    this.preRender(context2, frameState);
    if (render2 && dw >= 0.5 && dh >= 0.5) {
      const dx = transform2[4];
      const dy = transform2[5];
      const opacity = layerState.opacity;
      let previousAlpha;
      if (opacity !== 1) {
        previousAlpha = context2.globalAlpha;
        context2.globalAlpha = opacity;
      }
      context2.drawImage(img, 0, 0, +img.width, +img.height, dx, dy, dw, dh);
      if (opacity !== 1) {
        context2.globalAlpha = previousAlpha;
      }
    }
    this.postRender(context2, frameState);
    if (clipped) {
      context2.restore();
    }
    context2.imageSmoothingEnabled = true;
    if (canvasTransform !== canvas.style.transform) {
      canvas.style.transform = canvasTransform;
    }
    return this.container;
  }
}
const CanvasImageLayerRenderer$1 = CanvasImageLayerRenderer;
class ImageLayer extends BaseImageLayer$1 {
  constructor(options) {
    super(options);
  }
  createRenderer() {
    return new CanvasImageLayerRenderer$1(this);
  }
  getData(pixel) {
    return super.getData(pixel);
  }
}
const ImageLayer$1 = ImageLayer;
class ReprojImage extends ImageBase$1 {
  constructor(sourceProj, targetProj, targetExtent, targetResolution, pixelRatio, getImageFunction, interpolate) {
    const maxSourceExtent = sourceProj.getExtent();
    const maxTargetExtent = targetProj.getExtent();
    const limitedTargetExtent = maxTargetExtent ? getIntersection(targetExtent, maxTargetExtent) : targetExtent;
    const targetCenter = getCenter(limitedTargetExtent);
    const sourceResolution = calculateSourceResolution(
      sourceProj,
      targetProj,
      targetCenter,
      targetResolution
    );
    const errorThresholdInPixels = ERROR_THRESHOLD;
    const triangulation = new Triangulation$1(
      sourceProj,
      targetProj,
      limitedTargetExtent,
      maxSourceExtent,
      sourceResolution * errorThresholdInPixels,
      targetResolution
    );
    const sourceExtent = triangulation.calculateSourceExtent();
    const sourceImage = getImageFunction(
      sourceExtent,
      sourceResolution,
      pixelRatio
    );
    const state = sourceImage ? ImageState.IDLE : ImageState.EMPTY;
    const sourcePixelRatio = sourceImage ? sourceImage.getPixelRatio() : 1;
    super(targetExtent, targetResolution, sourcePixelRatio, state);
    this.targetProj_ = targetProj;
    this.maxSourceExtent_ = maxSourceExtent;
    this.triangulation_ = triangulation;
    this.targetResolution_ = targetResolution;
    this.targetExtent_ = targetExtent;
    this.sourceImage_ = sourceImage;
    this.sourcePixelRatio_ = sourcePixelRatio;
    this.interpolate_ = interpolate;
    this.canvas_ = null;
    this.sourceListenerKey_ = null;
  }
  disposeInternal() {
    if (this.state == ImageState.LOADING) {
      this.unlistenSource_();
    }
    super.disposeInternal();
  }
  getImage() {
    return this.canvas_;
  }
  getProjection() {
    return this.targetProj_;
  }
  reproject_() {
    const sourceState = this.sourceImage_.getState();
    if (sourceState == ImageState.LOADED) {
      const width = getWidth(this.targetExtent_) / this.targetResolution_;
      const height = getHeight(this.targetExtent_) / this.targetResolution_;
      this.canvas_ = render(
        width,
        height,
        this.sourcePixelRatio_,
        this.sourceImage_.getResolution(),
        this.maxSourceExtent_,
        this.targetResolution_,
        this.targetExtent_,
        this.triangulation_,
        [
          {
            extent: this.sourceImage_.getExtent(),
            image: this.sourceImage_.getImage()
          }
        ],
        0,
        void 0,
        this.interpolate_
      );
    }
    this.state = sourceState;
    this.changed();
  }
  load() {
    if (this.state == ImageState.IDLE) {
      this.state = ImageState.LOADING;
      this.changed();
      const sourceState = this.sourceImage_.getState();
      if (sourceState == ImageState.LOADED || sourceState == ImageState.ERROR) {
        this.reproject_();
      } else {
        this.sourceListenerKey_ = listen(
          this.sourceImage_,
          EventType.CHANGE,
          function(e) {
            const sourceState2 = this.sourceImage_.getState();
            if (sourceState2 == ImageState.LOADED || sourceState2 == ImageState.ERROR) {
              this.unlistenSource_();
              this.reproject_();
            }
          },
          this
        );
        this.sourceImage_.load();
      }
    }
  }
  unlistenSource_() {
    unlistenByKey(
      this.sourceListenerKey_
    );
    this.sourceListenerKey_ = null;
  }
}
const ReprojImage$1 = ReprojImage;
const ImageSourceEventType = {
  IMAGELOADSTART: "imageloadstart",
  IMAGELOADEND: "imageloadend",
  IMAGELOADERROR: "imageloaderror"
};
class ImageSourceEvent extends Event {
  constructor(type, image) {
    super(type);
    this.image = image;
  }
}
class ImageSource extends Source$1 {
  constructor(options) {
    super({
      attributions: options.attributions,
      projection: options.projection,
      state: options.state,
      interpolate: options.interpolate !== void 0 ? options.interpolate : true
    });
    this.on;
    this.once;
    this.un;
    this.resolutions_ = options.resolutions !== void 0 ? options.resolutions : null;
    this.reprojectedImage_ = null;
    this.reprojectedRevision_ = 0;
  }
  getResolutions() {
    return this.resolutions_;
  }
  findNearestResolution(resolution) {
    if (this.resolutions_) {
      const idx = linearFindNearest(this.resolutions_, resolution, 0);
      resolution = this.resolutions_[idx];
    }
    return resolution;
  }
  getImage(extent2, resolution, pixelRatio, projection) {
    const sourceProjection = this.getProjection();
    if (!sourceProjection || !projection || equivalent(sourceProjection, projection)) {
      if (sourceProjection) {
        projection = sourceProjection;
      }
      return this.getImageInternal(extent2, resolution, pixelRatio, projection);
    } else {
      if (this.reprojectedImage_) {
        if (this.reprojectedRevision_ == this.getRevision() && equivalent(this.reprojectedImage_.getProjection(), projection) && this.reprojectedImage_.getResolution() == resolution && equals$1(this.reprojectedImage_.getExtent(), extent2)) {
          return this.reprojectedImage_;
        }
        this.reprojectedImage_.dispose();
        this.reprojectedImage_ = null;
      }
      this.reprojectedImage_ = new ReprojImage$1(
        sourceProjection,
        projection,
        extent2,
        resolution,
        pixelRatio,
        function(extent3, resolution2, pixelRatio2) {
          return this.getImageInternal(
            extent3,
            resolution2,
            pixelRatio2,
            sourceProjection
          );
        }.bind(this),
        this.getInterpolate()
      );
      this.reprojectedRevision_ = this.getRevision();
      return this.reprojectedImage_;
    }
  }
  getImageInternal(extent2, resolution, pixelRatio, projection) {
    return abstract();
  }
  handleImageChange(event) {
    const image = event.target;
    let type;
    switch (image.getState()) {
      case ImageState.LOADING:
        this.loading = true;
        type = ImageSourceEventType.IMAGELOADSTART;
        break;
      case ImageState.LOADED:
        this.loading = false;
        type = ImageSourceEventType.IMAGELOADEND;
        break;
      case ImageState.ERROR:
        this.loading = false;
        type = ImageSourceEventType.IMAGELOADERROR;
        break;
      default:
        return;
    }
    if (this.hasListener(type)) {
      this.dispatchEvent(new ImageSourceEvent(type, image));
    }
  }
}
const ImageSource$1 = ImageSource;
class CanvasTileLayerRenderer extends CanvasLayerRenderer$1 {
  constructor(tileLayer) {
    super(tileLayer);
    this.extentChanged = true;
    this.renderedExtent_ = null;
    this.renderedPixelRatio;
    this.renderedProjection = null;
    this.renderedRevision;
    this.renderedTiles = [];
    this.newTiles_ = false;
    this.tmpExtent = createEmpty();
    this.tmpTileRange_ = new TileRange$1(0, 0, 0, 0);
  }
  isDrawableTile(tile) {
    const tileLayer = this.getLayer();
    const tileState = tile.getState();
    const useInterimTilesOnError = tileLayer.getUseInterimTilesOnError();
    return tileState == TileState.LOADED || tileState == TileState.EMPTY || tileState == TileState.ERROR && !useInterimTilesOnError;
  }
  getTile(z, x, y, frameState) {
    const pixelRatio = frameState.pixelRatio;
    const projection = frameState.viewState.projection;
    const tileLayer = this.getLayer();
    const tileSource = tileLayer.getSource();
    let tile = tileSource.getTile(z, x, y, pixelRatio, projection);
    if (tile.getState() == TileState.ERROR) {
      if (tileLayer.getUseInterimTilesOnError() && tileLayer.getPreload() > 0) {
        this.newTiles_ = true;
      }
    }
    if (!this.isDrawableTile(tile)) {
      tile = tile.getInterimTile();
    }
    return tile;
  }
  getData(pixel) {
    const frameState = this.frameState;
    if (!frameState) {
      return null;
    }
    const layer = this.getLayer();
    const coordinate = apply(
      frameState.pixelToCoordinateTransform,
      pixel.slice()
    );
    const layerExtent = layer.getExtent();
    if (layerExtent) {
      if (!containsCoordinate(layerExtent, coordinate)) {
        return null;
      }
    }
    const pixelRatio = frameState.pixelRatio;
    const projection = frameState.viewState.projection;
    const viewState = frameState.viewState;
    const source = layer.getRenderSource();
    const tileGrid = source.getTileGridForProjection(viewState.projection);
    const tilePixelRatio = source.getTilePixelRatio(frameState.pixelRatio);
    for (let z = tileGrid.getZForResolution(viewState.resolution); z >= tileGrid.getMinZoom(); --z) {
      const tileCoord = tileGrid.getTileCoordForCoordAndZ(coordinate, z);
      const tile = source.getTile(
        z,
        tileCoord[1],
        tileCoord[2],
        pixelRatio,
        projection
      );
      if (!(tile instanceof ImageTile$1 || tile instanceof ReprojTile$1) || tile instanceof ReprojTile$1 && tile.getState() === TileState.EMPTY) {
        return null;
      }
      if (tile.getState() !== TileState.LOADED) {
        continue;
      }
      const tileOrigin = tileGrid.getOrigin(z);
      const tileSize = toSize(tileGrid.getTileSize(z));
      const tileResolution = tileGrid.getResolution(z);
      const col = Math.floor(
        tilePixelRatio * ((coordinate[0] - tileOrigin[0]) / tileResolution - tileCoord[1] * tileSize[0])
      );
      const row = Math.floor(
        tilePixelRatio * ((tileOrigin[1] - coordinate[1]) / tileResolution - tileCoord[2] * tileSize[1])
      );
      const gutter = Math.round(
        tilePixelRatio * source.getGutterForProjection(viewState.projection)
      );
      return this.getImageData(tile.getImage(), col + gutter, row + gutter);
    }
    return null;
  }
  loadedTileCallback(tiles, zoom, tile) {
    if (this.isDrawableTile(tile)) {
      return super.loadedTileCallback(tiles, zoom, tile);
    }
    return false;
  }
  prepareFrame(frameState) {
    return !!this.getLayer().getSource();
  }
  renderFrame(frameState, target) {
    const layerState = frameState.layerStatesArray[frameState.layerIndex];
    const viewState = frameState.viewState;
    const projection = viewState.projection;
    const viewResolution = viewState.resolution;
    const viewCenter = viewState.center;
    const rotation = viewState.rotation;
    const pixelRatio = frameState.pixelRatio;
    const tileLayer = this.getLayer();
    const tileSource = tileLayer.getSource();
    const sourceRevision = tileSource.getRevision();
    const tileGrid = tileSource.getTileGridForProjection(projection);
    const z = tileGrid.getZForResolution(viewResolution, tileSource.zDirection);
    const tileResolution = tileGrid.getResolution(z);
    let extent2 = frameState.extent;
    const resolution = frameState.viewState.resolution;
    const tilePixelRatio = tileSource.getTilePixelRatio(pixelRatio);
    const width = Math.round(getWidth(extent2) / resolution * pixelRatio);
    const height = Math.round(getHeight(extent2) / resolution * pixelRatio);
    const layerExtent = layerState.extent && fromUserExtent(layerState.extent);
    if (layerExtent) {
      extent2 = getIntersection(
        extent2,
        fromUserExtent(layerState.extent)
      );
    }
    const dx = tileResolution * width / 2 / tilePixelRatio;
    const dy = tileResolution * height / 2 / tilePixelRatio;
    const canvasExtent = [
      viewCenter[0] - dx,
      viewCenter[1] - dy,
      viewCenter[0] + dx,
      viewCenter[1] + dy
    ];
    const tileRange = tileGrid.getTileRangeForExtentAndZ(extent2, z);
    const tilesToDrawByZ = {};
    tilesToDrawByZ[z] = {};
    const findLoadedTiles = this.createLoadedTileFinder(
      tileSource,
      projection,
      tilesToDrawByZ
    );
    const tmpExtent = this.tmpExtent;
    const tmpTileRange = this.tmpTileRange_;
    this.newTiles_ = false;
    const viewport = rotation ? getRotatedViewport(
      viewState.center,
      resolution,
      rotation,
      frameState.size
    ) : void 0;
    for (let x = tileRange.minX; x <= tileRange.maxX; ++x) {
      for (let y = tileRange.minY; y <= tileRange.maxY; ++y) {
        if (rotation && !tileGrid.tileCoordIntersectsViewport([z, x, y], viewport)) {
          continue;
        }
        const tile = this.getTile(z, x, y, frameState);
        if (this.isDrawableTile(tile)) {
          const uid = getUid(this);
          if (tile.getState() == TileState.LOADED) {
            tilesToDrawByZ[z][tile.tileCoord.toString()] = tile;
            let inTransition = tile.inTransition(uid);
            if (inTransition && layerState.opacity !== 1) {
              tile.endTransition(uid);
              inTransition = false;
            }
            if (!this.newTiles_ && (inTransition || !this.renderedTiles.includes(tile))) {
              this.newTiles_ = true;
            }
          }
          if (tile.getAlpha(uid, frameState.time) === 1) {
            continue;
          }
        }
        const childTileRange = tileGrid.getTileCoordChildTileRange(
          tile.tileCoord,
          tmpTileRange,
          tmpExtent
        );
        let covered = false;
        if (childTileRange) {
          covered = findLoadedTiles(z + 1, childTileRange);
        }
        if (!covered) {
          tileGrid.forEachTileCoordParentTileRange(
            tile.tileCoord,
            findLoadedTiles,
            tmpTileRange,
            tmpExtent
          );
        }
      }
    }
    const canvasScale = tileResolution / viewResolution * pixelRatio / tilePixelRatio;
    compose(
      this.pixelTransform,
      frameState.size[0] / 2,
      frameState.size[1] / 2,
      1 / pixelRatio,
      1 / pixelRatio,
      rotation,
      -width / 2,
      -height / 2
    );
    const canvasTransform = toString$1(this.pixelTransform);
    this.useContainer(target, canvasTransform, this.getBackground(frameState));
    const context2 = this.context;
    const canvas = context2.canvas;
    makeInverse(this.inversePixelTransform, this.pixelTransform);
    compose(
      this.tempTransform,
      width / 2,
      height / 2,
      canvasScale,
      canvasScale,
      0,
      -width / 2,
      -height / 2
    );
    if (canvas.width != width || canvas.height != height) {
      canvas.width = width;
      canvas.height = height;
    } else if (!this.containerReused) {
      context2.clearRect(0, 0, width, height);
    }
    if (layerExtent) {
      this.clipUnrotated(context2, frameState, layerExtent);
    }
    if (!tileSource.getInterpolate()) {
      context2.imageSmoothingEnabled = false;
    }
    this.preRender(context2, frameState);
    this.renderedTiles.length = 0;
    let zs = Object.keys(tilesToDrawByZ).map(Number);
    zs.sort(numberSafeCompareFunction);
    let clips, clipZs, currentClip;
    if (layerState.opacity === 1 && (!this.containerReused || tileSource.getOpaque(frameState.viewState.projection))) {
      zs = zs.reverse();
    } else {
      clips = [];
      clipZs = [];
    }
    for (let i = zs.length - 1; i >= 0; --i) {
      const currentZ = zs[i];
      const currentTilePixelSize = tileSource.getTilePixelSize(
        currentZ,
        pixelRatio,
        projection
      );
      const currentResolution = tileGrid.getResolution(currentZ);
      const currentScale = currentResolution / tileResolution;
      const dx2 = currentTilePixelSize[0] * currentScale * canvasScale;
      const dy2 = currentTilePixelSize[1] * currentScale * canvasScale;
      const originTileCoord = tileGrid.getTileCoordForCoordAndZ(
        getTopLeft(canvasExtent),
        currentZ
      );
      const originTileExtent = tileGrid.getTileCoordExtent(originTileCoord);
      const origin = apply(this.tempTransform, [
        tilePixelRatio * (originTileExtent[0] - canvasExtent[0]) / tileResolution,
        tilePixelRatio * (canvasExtent[3] - originTileExtent[3]) / tileResolution
      ]);
      const tileGutter = tilePixelRatio * tileSource.getGutterForProjection(projection);
      const tilesToDraw = tilesToDrawByZ[currentZ];
      for (const tileCoordKey in tilesToDraw) {
        const tile = tilesToDraw[tileCoordKey];
        const tileCoord = tile.tileCoord;
        const xIndex = originTileCoord[1] - tileCoord[1];
        const nextX = Math.round(origin[0] - (xIndex - 1) * dx2);
        const yIndex = originTileCoord[2] - tileCoord[2];
        const nextY = Math.round(origin[1] - (yIndex - 1) * dy2);
        const x = Math.round(origin[0] - xIndex * dx2);
        const y = Math.round(origin[1] - yIndex * dy2);
        const w = nextX - x;
        const h = nextY - y;
        const transition = z === currentZ;
        const inTransition = transition && tile.getAlpha(getUid(this), frameState.time) !== 1;
        let contextSaved = false;
        if (!inTransition) {
          if (clips) {
            currentClip = [x, y, x + w, y, x + w, y + h, x, y + h];
            for (let i2 = 0, ii = clips.length; i2 < ii; ++i2) {
              if (z !== currentZ && currentZ < clipZs[i2]) {
                const clip = clips[i2];
                if (intersects(
                  [x, y, x + w, y + h],
                  [clip[0], clip[3], clip[4], clip[7]]
                )) {
                  if (!contextSaved) {
                    context2.save();
                    contextSaved = true;
                  }
                  context2.beginPath();
                  context2.moveTo(currentClip[0], currentClip[1]);
                  context2.lineTo(currentClip[2], currentClip[3]);
                  context2.lineTo(currentClip[4], currentClip[5]);
                  context2.lineTo(currentClip[6], currentClip[7]);
                  context2.moveTo(clip[6], clip[7]);
                  context2.lineTo(clip[4], clip[5]);
                  context2.lineTo(clip[2], clip[3]);
                  context2.lineTo(clip[0], clip[1]);
                  context2.clip();
                }
              }
            }
            clips.push(currentClip);
            clipZs.push(currentZ);
          } else {
            context2.clearRect(x, y, w, h);
          }
        }
        this.drawTileImage(
          tile,
          frameState,
          x,
          y,
          w,
          h,
          tileGutter,
          transition
        );
        if (clips && !inTransition) {
          if (contextSaved) {
            context2.restore();
          }
          this.renderedTiles.unshift(tile);
        } else {
          this.renderedTiles.push(tile);
        }
        this.updateUsedTiles(frameState.usedTiles, tileSource, tile);
      }
    }
    this.renderedRevision = sourceRevision;
    this.renderedResolution = tileResolution;
    this.extentChanged = !this.renderedExtent_ || !equals$1(this.renderedExtent_, canvasExtent);
    this.renderedExtent_ = canvasExtent;
    this.renderedPixelRatio = pixelRatio;
    this.renderedProjection = projection;
    this.manageTilePyramid(
      frameState,
      tileSource,
      tileGrid,
      pixelRatio,
      projection,
      extent2,
      z,
      tileLayer.getPreload()
    );
    this.scheduleExpireCache(frameState, tileSource);
    this.postRender(context2, frameState);
    if (layerState.extent) {
      context2.restore();
    }
    context2.imageSmoothingEnabled = true;
    if (canvasTransform !== canvas.style.transform) {
      canvas.style.transform = canvasTransform;
    }
    return this.container;
  }
  drawTileImage(tile, frameState, x, y, w, h, gutter, transition) {
    const image = this.getTileImage(tile);
    if (!image) {
      return;
    }
    const uid = getUid(this);
    const layerState = frameState.layerStatesArray[frameState.layerIndex];
    const alpha = layerState.opacity * (transition ? tile.getAlpha(uid, frameState.time) : 1);
    const alphaChanged = alpha !== this.context.globalAlpha;
    if (alphaChanged) {
      this.context.save();
      this.context.globalAlpha = alpha;
    }
    this.context.drawImage(
      image,
      gutter,
      gutter,
      image.width - 2 * gutter,
      image.height - 2 * gutter,
      x,
      y,
      w,
      h
    );
    if (alphaChanged) {
      this.context.restore();
    }
    if (alpha !== layerState.opacity) {
      frameState.animate = true;
    } else if (transition) {
      tile.endTransition(uid);
    }
  }
  getImage() {
    const context2 = this.context;
    return context2 ? context2.canvas : null;
  }
  getTileImage(tile) {
    return tile.getImage();
  }
  scheduleExpireCache(frameState, tileSource) {
    if (tileSource.canExpireCache()) {
      const postRenderFunction = function(tileSource2, map2, frameState2) {
        const tileSourceKey = getUid(tileSource2);
        if (tileSourceKey in frameState2.usedTiles) {
          tileSource2.expireCache(
            frameState2.viewState.projection,
            frameState2.usedTiles[tileSourceKey]
          );
        }
      }.bind(null, tileSource);
      frameState.postRenderFunctions.push(
        postRenderFunction
      );
    }
  }
  updateUsedTiles(usedTiles, tileSource, tile) {
    const tileSourceKey = getUid(tileSource);
    if (!(tileSourceKey in usedTiles)) {
      usedTiles[tileSourceKey] = {};
    }
    usedTiles[tileSourceKey][tile.getKey()] = true;
  }
  manageTilePyramid(frameState, tileSource, tileGrid, pixelRatio, projection, extent2, currentZ, preload, tileCallback) {
    const tileSourceKey = getUid(tileSource);
    if (!(tileSourceKey in frameState.wantedTiles)) {
      frameState.wantedTiles[tileSourceKey] = {};
    }
    const wantedTiles = frameState.wantedTiles[tileSourceKey];
    const tileQueue = frameState.tileQueue;
    const minZoom = tileGrid.getMinZoom();
    const rotation = frameState.viewState.rotation;
    const viewport = rotation ? getRotatedViewport(
      frameState.viewState.center,
      frameState.viewState.resolution,
      rotation,
      frameState.size
    ) : void 0;
    let tileCount = 0;
    let tile, tileRange, tileResolution, x, y, z;
    for (z = minZoom; z <= currentZ; ++z) {
      tileRange = tileGrid.getTileRangeForExtentAndZ(extent2, z, tileRange);
      tileResolution = tileGrid.getResolution(z);
      for (x = tileRange.minX; x <= tileRange.maxX; ++x) {
        for (y = tileRange.minY; y <= tileRange.maxY; ++y) {
          if (rotation && !tileGrid.tileCoordIntersectsViewport([z, x, y], viewport)) {
            continue;
          }
          if (currentZ - z <= preload) {
            ++tileCount;
            tile = tileSource.getTile(z, x, y, pixelRatio, projection);
            if (tile.getState() == TileState.IDLE) {
              wantedTiles[tile.getKey()] = true;
              if (!tileQueue.isKeyQueued(tile.getKey())) {
                tileQueue.enqueue([
                  tile,
                  tileSourceKey,
                  tileGrid.getTileCoordCenter(tile.tileCoord),
                  tileResolution
                ]);
              }
            }
            if (tileCallback !== void 0) {
              tileCallback(tile);
            }
          } else {
            tileSource.useTile(z, x, y, projection);
          }
        }
      }
    }
    tileSource.updateCacheSize(tileCount, projection);
  }
}
const CanvasTileLayerRenderer$1 = CanvasTileLayerRenderer;
class TileLayer extends BaseTileLayer$1 {
  constructor(options) {
    super(options);
  }
  createRenderer() {
    return new CanvasTileLayerRenderer$1(this);
  }
}
const TileLayer$1 = TileLayer;
let hasImageData = true;
try {
  new ImageData(10, 10);
} catch (_) {
  hasImageData = false;
}
let context;
function newImageData(data, width, height) {
  if (hasImageData) {
    return new ImageData(data, width, height);
  }
  if (!context) {
    context = document.createElement("canvas").getContext("2d");
  }
  const imageData = context.createImageData(width, height);
  imageData.data.set(data);
  return imageData;
}
function createMinion(operation) {
  let workerHasImageData = true;
  try {
    new ImageData(10, 10);
  } catch (_) {
    workerHasImageData = false;
  }
  function newWorkerImageData(data, width, height) {
    if (workerHasImageData) {
      return new ImageData(data, width, height);
    } else {
      return { data, width, height };
    }
  }
  return function(data) {
    const buffers = data["buffers"];
    const meta = data["meta"];
    const imageOps = data["imageOps"];
    const width = data["width"];
    const height = data["height"];
    const numBuffers = buffers.length;
    const numBytes = buffers[0].byteLength;
    if (imageOps) {
      const images = new Array(numBuffers);
      for (let b = 0; b < numBuffers; ++b) {
        images[b] = newWorkerImageData(
          new Uint8ClampedArray(buffers[b]),
          width,
          height
        );
      }
      const output2 = operation(images, meta).data;
      return output2.buffer;
    }
    const output = new Uint8ClampedArray(numBytes);
    const arrays = new Array(numBuffers);
    const pixels = new Array(numBuffers);
    for (let b = 0; b < numBuffers; ++b) {
      arrays[b] = new Uint8ClampedArray(buffers[b]);
      pixels[b] = [0, 0, 0, 0];
    }
    for (let i = 0; i < numBytes; i += 4) {
      for (let j = 0; j < numBuffers; ++j) {
        const array = arrays[j];
        pixels[j][0] = array[i];
        pixels[j][1] = array[i + 1];
        pixels[j][2] = array[i + 2];
        pixels[j][3] = array[i + 3];
      }
      const pixel = operation(pixels, meta);
      output[i] = pixel[0];
      output[i + 1] = pixel[1];
      output[i + 2] = pixel[2];
      output[i + 3] = pixel[3];
    }
    return output.buffer;
  };
}
function createWorker(config, onMessage) {
  const lib = Object.keys(config.lib || {}).map(function(name) {
    return "const " + name + " = " + config.lib[name].toString() + ";";
  });
  const lines = lib.concat([
    "const __minion__ = (" + createMinion.toString() + ")(",
    config.operation.toString(),
    ");",
    'self.addEventListener("message", function(event) {',
    "  const buffer = __minion__(event.data);",
    "  self.postMessage({buffer: buffer, meta: event.data.meta}, [buffer]);",
    "});"
  ]);
  const worker = new Worker(
    typeof Blob === "undefined" ? "data:text/javascript;base64," + Buffer.from(lines.join("\n"), "binary").toString("base64") : URL.createObjectURL(new Blob(lines, { type: "text/javascript" }))
  );
  worker.addEventListener("message", onMessage);
  return worker;
}
function createFauxWorker(config, onMessage) {
  const minion = createMinion(config.operation);
  let terminated = false;
  return {
    postMessage: function(data) {
      setTimeout(function() {
        if (terminated) {
          return;
        }
        onMessage({ data: { buffer: minion(data), meta: data["meta"] } });
      }, 0);
    },
    terminate: function() {
      terminated = true;
    }
  };
}
class Processor extends Disposable$1 {
  constructor(config) {
    super();
    this._imageOps = !!config.imageOps;
    let threads;
    if (config.threads === 0) {
      threads = 0;
    } else if (this._imageOps) {
      threads = 1;
    } else {
      threads = config.threads || 1;
    }
    const workers = new Array(threads);
    if (threads) {
      for (let i = 0; i < threads; ++i) {
        workers[i] = createWorker(config, this._onWorkerMessage.bind(this, i));
      }
    } else {
      workers[0] = createFauxWorker(
        config,
        this._onWorkerMessage.bind(this, 0)
      );
    }
    this._workers = workers;
    this._queue = [];
    this._maxQueueLength = config.queue || Infinity;
    this._running = 0;
    this._dataLookup = {};
    this._job = null;
  }
  process(inputs, meta, callback) {
    this._enqueue({
      inputs,
      meta,
      callback
    });
    this._dispatch();
  }
  _enqueue(job) {
    this._queue.push(job);
    while (this._queue.length > this._maxQueueLength) {
      this._queue.shift().callback(null, null);
    }
  }
  _dispatch() {
    if (this._running || this._queue.length === 0) {
      return;
    }
    const job = this._queue.shift();
    this._job = job;
    const width = job.inputs[0].width;
    const height = job.inputs[0].height;
    const buffers = job.inputs.map(function(input) {
      return input.data.buffer;
    });
    const threads = this._workers.length;
    this._running = threads;
    if (threads === 1) {
      this._workers[0].postMessage(
        {
          buffers,
          meta: job.meta,
          imageOps: this._imageOps,
          width,
          height
        },
        buffers
      );
      return;
    }
    const length = job.inputs[0].data.length;
    const segmentLength = 4 * Math.ceil(length / 4 / threads);
    for (let i = 0; i < threads; ++i) {
      const offset = i * segmentLength;
      const slices = [];
      for (let j = 0, jj = buffers.length; j < jj; ++j) {
        slices.push(buffers[j].slice(offset, offset + segmentLength));
      }
      this._workers[i].postMessage(
        {
          buffers: slices,
          meta: job.meta,
          imageOps: this._imageOps,
          width,
          height
        },
        slices
      );
    }
  }
  _onWorkerMessage(index, event) {
    if (this.disposed) {
      return;
    }
    this._dataLookup[index] = event.data;
    --this._running;
    if (this._running === 0) {
      this._resolveJob();
    }
  }
  _resolveJob() {
    const job = this._job;
    const threads = this._workers.length;
    let data, meta;
    if (threads === 1) {
      data = new Uint8ClampedArray(this._dataLookup[0]["buffer"]);
      meta = this._dataLookup[0]["meta"];
    } else {
      const length = job.inputs[0].data.length;
      data = new Uint8ClampedArray(length);
      meta = new Array(threads);
      const segmentLength = 4 * Math.ceil(length / 4 / threads);
      for (let i = 0; i < threads; ++i) {
        const buffer = this._dataLookup[i]["buffer"];
        const offset = i * segmentLength;
        data.set(new Uint8ClampedArray(buffer), offset);
        meta[i] = this._dataLookup[i]["meta"];
      }
    }
    this._job = null;
    this._dataLookup = {};
    job.callback(
      null,
      newImageData(data, job.inputs[0].width, job.inputs[0].height),
      meta
    );
    this._dispatch();
  }
  disposeInternal() {
    for (let i = 0; i < this._workers.length; ++i) {
      this._workers[i].terminate();
    }
    this._workers.length = 0;
  }
}
const RasterEventType = {
  BEFOREOPERATIONS: "beforeoperations",
  AFTEROPERATIONS: "afteroperations"
};
class RasterSourceEvent extends Event {
  constructor(type, frameState, data) {
    super(type);
    this.extent = frameState.extent;
    this.resolution = frameState.viewState.resolution / frameState.pixelRatio;
    this.data = data;
  }
}
class RasterSource extends ImageSource$1 {
  constructor(options) {
    super({
      projection: null
    });
    this.on;
    this.once;
    this.un;
    this.processor_ = null;
    this.operationType_ = options.operationType !== void 0 ? options.operationType : "pixel";
    this.threads_ = options.threads !== void 0 ? options.threads : 1;
    this.layers_ = createLayers(options.sources);
    const changed = this.changed.bind(this);
    for (let i = 0, ii = this.layers_.length; i < ii; ++i) {
      this.layers_[i].addEventListener(EventType.CHANGE, changed);
    }
    this.tileQueue_ = new TileQueue$1(function() {
      return 1;
    }, this.changed.bind(this));
    this.requestedFrameState_;
    this.renderedImageCanvas_ = null;
    this.renderedRevision_;
    this.frameState_ = {
      animate: false,
      coordinateToPixelTransform: create$1(),
      declutterTree: null,
      extent: null,
      index: 0,
      layerIndex: 0,
      layerStatesArray: getLayerStatesArray(this.layers_),
      pixelRatio: 1,
      pixelToCoordinateTransform: create$1(),
      postRenderFunctions: [],
      size: [0, 0],
      tileQueue: this.tileQueue_,
      time: Date.now(),
      usedTiles: {},
      viewState: {
        rotation: 0
      },
      viewHints: [],
      wantedTiles: {},
      mapId: getUid(this),
      renderTargets: {}
    };
    this.setAttributions(function(frameState) {
      const attributions = [];
      for (let index = 0, iMax = options.sources.length; index < iMax; ++index) {
        const sourceOrLayer = options.sources[index];
        const source = sourceOrLayer instanceof Source$1 ? sourceOrLayer : sourceOrLayer.getSource();
        const attributionGetter = source.getAttributions();
        if (typeof attributionGetter === "function") {
          const sourceAttribution = attributionGetter(frameState);
          attributions.push.apply(attributions, sourceAttribution);
        }
      }
      return attributions.length !== 0 ? attributions : null;
    });
    if (options.operation !== void 0) {
      this.setOperation(options.operation, options.lib);
    }
  }
  setOperation(operation, lib) {
    if (this.processor_) {
      this.processor_.dispose();
    }
    this.processor_ = new Processor({
      operation,
      imageOps: this.operationType_ === "image",
      queue: 1,
      lib,
      threads: this.threads_
    });
    this.changed();
  }
  updateFrameState_(extent2, resolution, projection) {
    const frameState = Object.assign({}, this.frameState_);
    frameState.viewState = Object.assign({}, frameState.viewState);
    const center = getCenter(extent2);
    frameState.extent = extent2.slice();
    frameState.size[0] = Math.round(getWidth(extent2) / resolution);
    frameState.size[1] = Math.round(getHeight(extent2) / resolution);
    frameState.time = Date.now();
    const viewState = frameState.viewState;
    viewState.center = center;
    viewState.projection = projection;
    viewState.resolution = resolution;
    return frameState;
  }
  allSourcesReady_() {
    let ready = true;
    let source;
    for (let i = 0, ii = this.layers_.length; i < ii; ++i) {
      source = this.layers_[i].getSource();
      if (source.getState() !== "ready") {
        ready = false;
        break;
      }
    }
    return ready;
  }
  getImage(extent2, resolution, pixelRatio, projection) {
    if (!this.allSourcesReady_()) {
      return null;
    }
    const frameState = this.updateFrameState_(extent2, resolution, projection);
    this.requestedFrameState_ = frameState;
    if (this.renderedImageCanvas_) {
      const renderedResolution = this.renderedImageCanvas_.getResolution();
      const renderedExtent = this.renderedImageCanvas_.getExtent();
      if (resolution !== renderedResolution || !equals$1(extent2, renderedExtent)) {
        this.renderedImageCanvas_ = null;
      }
    }
    if (!this.renderedImageCanvas_ || this.getRevision() !== this.renderedRevision_) {
      this.processSources_();
    }
    frameState.tileQueue.loadMoreTiles(16, 16);
    if (frameState.animate) {
      requestAnimationFrame(this.changed.bind(this));
    }
    return this.renderedImageCanvas_;
  }
  processSources_() {
    const frameState = this.requestedFrameState_;
    const len = this.layers_.length;
    const imageDatas = new Array(len);
    for (let i = 0; i < len; ++i) {
      frameState.layerIndex = i;
      const imageData = getImageData(this.layers_[i], frameState);
      if (imageData) {
        imageDatas[i] = imageData;
      } else {
        return;
      }
    }
    const data = {};
    this.dispatchEvent(
      new RasterSourceEvent(RasterEventType.BEFOREOPERATIONS, frameState, data)
    );
    this.processor_.process(
      imageDatas,
      data,
      this.onWorkerComplete_.bind(this, frameState)
    );
  }
  onWorkerComplete_(frameState, err, output, data) {
    if (err || !output) {
      return;
    }
    const extent2 = frameState.extent;
    const resolution = frameState.viewState.resolution;
    if (resolution !== this.requestedFrameState_.viewState.resolution || !equals$1(extent2, this.requestedFrameState_.extent)) {
      return;
    }
    let context2;
    if (this.renderedImageCanvas_) {
      context2 = this.renderedImageCanvas_.getImage().getContext("2d");
    } else {
      const width = Math.round(getWidth(extent2) / resolution);
      const height = Math.round(getHeight(extent2) / resolution);
      context2 = createCanvasContext2D(width, height);
      this.renderedImageCanvas_ = new ImageCanvas$1(
        extent2,
        resolution,
        1,
        context2.canvas
      );
    }
    context2.putImageData(output, 0, 0);
    this.changed();
    this.renderedRevision_ = this.getRevision();
    this.dispatchEvent(
      new RasterSourceEvent(RasterEventType.AFTEROPERATIONS, frameState, data)
    );
    if (frameState.animate) {
      requestAnimationFrame(this.changed.bind(this));
    }
  }
  disposeInternal() {
    if (this.processor_) {
      this.processor_.dispose();
    }
    super.disposeInternal();
  }
}
RasterSource.prototype.dispose;
let sharedContext = null;
function getImageData(layer, frameState) {
  const renderer = layer.getRenderer();
  if (!renderer) {
    throw new Error("Unsupported layer type: " + layer);
  }
  if (!renderer.prepareFrame(frameState)) {
    return null;
  }
  const width = frameState.size[0];
  const height = frameState.size[1];
  if (width === 0 || height === 0) {
    return null;
  }
  const container = renderer.renderFrame(frameState, null);
  let element;
  if (container instanceof HTMLCanvasElement) {
    element = container;
  } else {
    if (container) {
      element = container.firstElementChild;
    }
    if (!(element instanceof HTMLCanvasElement)) {
      throw new Error("Unsupported rendered element: " + element);
    }
    if (element.width === width && element.height === height) {
      const context2 = element.getContext("2d");
      return context2.getImageData(0, 0, width, height);
    }
  }
  if (!sharedContext) {
    sharedContext = createCanvasContext2D(width, height);
  } else {
    const canvas = sharedContext.canvas;
    if (canvas.width !== width || canvas.height !== height) {
      sharedContext = createCanvasContext2D(width, height);
    } else {
      sharedContext.clearRect(0, 0, width, height);
    }
  }
  sharedContext.drawImage(element, 0, 0, width, height);
  return sharedContext.getImageData(0, 0, width, height);
}
function getLayerStatesArray(layers) {
  return layers.map(function(layer) {
    return layer.getLayerState();
  });
}
function createLayers(sources) {
  const len = sources.length;
  const layers = new Array(len);
  for (let i = 0; i < len; ++i) {
    layers[i] = createLayer(sources[i]);
  }
  return layers;
}
function createLayer(layerOrSource) {
  let layer;
  if (layerOrSource instanceof Source$1) {
    if (layerOrSource instanceof TileSource$1) {
      layer = new TileLayer$1({ source: layerOrSource });
    } else if (layerOrSource instanceof ImageSource$1) {
      layer = new ImageLayer$1({ source: layerOrSource });
    }
  } else {
    layer = layerOrSource;
  }
  return layer;
}
const Raster = RasterSource;
let map;
const imgWidth = 5192;
const imgHeight = 6489;
let extent = [0, -imgHeight, imgWidth, 0];
function setupScene(url) {
  let source = new Zoomify$1({
    url: "https://warm-mesa-43639.herokuapp.com/" + url,
    size: [imgWidth, imgHeight],
    crossOrigin: "anonymous",
    zDirection: -1
  });
  let layer = new TileLayer$2({
    tileSize: 256,
    source: new Raster({
      sources: [source],
      operation: function(pixels, data) {
        return data;
      }
    })
  });
  source.setTileLoadFunction(tileLoadProgress);
  map = new Map$1({
    controls: [],
    layers: [layer],
    target: "map",
    view: new View$1({
      extent,
      enableRotation: false,
      resolutions: source.getTileGrid().getResolutions(),
      constrainOnlyCenter: true,
      minZoom: 1
    })
  });
  map.getView().fit(extent);
}
function tileLoadProgress(tile, src) {
  var xhr = new XMLHttpRequest();
  xhr.onloadstart = function() {
    xhr.responseType = "blob";
  };
  xhr.addEventListener("progress", function(evt) {
    window.flutter_inappwebview.callHandler("loadProgress", evt.total / evt.loaded * 100);
  });
  xhr.addEventListener("loadend", function(evt) {
    var data = this.response;
    if (data !== void 0) {
      tile.getImage().src = URL.createObjectURL(data);
      tile.getImage().onload = function() {
        URL.revokeObjectURL(this.src);
      };
    } else {
      tile.setState(TileState.ERROR);
    }
  });
  xhr.addEventListener("error", function() {
    console.log("ERROR GETTING SOURCE");
    tile.setState(TileState.ERROR);
  });
  xhr.open("GET", src);
  xhr.send();
}
function updateImageMap(url) {
  let curCenter = map.getView().getCenter();
  let curZoom = map.getView().getZoom();
  let source = new Zoomify$1({
    url: "https://warm-mesa-43639.herokuapp.com/" + url,
    size: [imgWidth, imgHeight],
    crossOrigin: "anonymous",
    zDirection: -1
  });
  source.setTileLoadFunction(tileLoadProgress);
  let layer = new TileLayer$2({
    tileSize: 256,
    source
  });
  let view = new View$1({
    extent,
    enableRotation: false,
    resolutions: layer.getSource().getTileGrid().getResolutions(),
    constrainOnlyCenter: true,
    minZoom: 1
  });
  map.setView(view);
  map.getLayers().getArray()[0] = layer;
  map.getView().fit(extent);
  map.getView().setZoom(curZoom);
  map.getView().setCenter(curCenter);
}
window.setupScene = setupScene;
window.updateImageMap = updateImageMap;
//# sourceMappingURL=index.js.map
