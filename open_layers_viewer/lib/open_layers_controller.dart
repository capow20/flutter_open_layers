import 'package:open_layers_viewer/open_layers_viewer.dart';

class OpenLayersController {
  InAppWebViewController? webController;
  bool? debug;
  String currentUrl = "";

  OpenLayersController({
    required this.webController,
  });

  Future<void> updateLayer(String url, {bool? replace, double? lat, double? long, double? zoom}) async {
    currentUrl = url;
    lat = lat == 0 ? null : lat;
    long = long == 0 ? null : long;
    zoom = zoom == 0 ? null : zoom;
    return webController?.evaluateJavascript(
      source: 'window.updateImageMap("$url",$replace, $lat, $long, $zoom)',
    );
  }

  Future<void> setupScene(String url) async {
    currentUrl = url;
    return webController?.evaluateJavascript(
      source: 'window.setupScene("$url")',
    );
  }

  Future<void> resetControls() async {
    return webController?.evaluateJavascript(source: 'window.replaceMap()');
  }

  Future<void> animateTo(double lat, double long, double zoom) async {
    return webController?.evaluateJavascript(
      source: 'window.animateTo($lat, $long, $zoom)',
    );
  }
}
