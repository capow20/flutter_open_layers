import 'package:open_layers_viewer/open_layers_viewer.dart';

class OpenLayersController {
  InAppWebViewController? webController;
  bool? debug;

  OpenLayersController({
    required this.webController,
  });

  Future<void> updateLayer(String url) async {
    return webController?.evaluateJavascript(source: 'window.updateImageMap("$url")');
  }

  Future<void> setupScene(String url) async {
    return webController?.evaluateJavascript(
      source: 'window.setupScene("$url")',
    );
  }
}
