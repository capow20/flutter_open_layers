import 'package:open_layers_viewer/open_layers_viewer.dart';

class OpenLayersController {
  InAppWebViewController? webController;
  bool? debug;
  String currentUrl = "";

  OpenLayersController({
    required this.webController,
  });

  Future<void> updateLayer(String url) async {
    currentUrl = url;
    return webController?.evaluateJavascript(source: 'window.updateImageMap("$url")');
  }

  Future<void> setupScene(String url) async {
    currentUrl = url;
    return webController?.evaluateJavascript(
      source: 'window.setupScene("$url")',
    );
  }

  Future<void> resetControls() async {
    return webController?.evaluateJavascript(source: 'window.updateImageMap("$currentUrl")');
  }
}
