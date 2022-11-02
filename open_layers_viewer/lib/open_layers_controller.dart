import 'package:webview_flutter/webview_flutter.dart';

class OpenLayersController {
  WebViewController? webController;
  bool? debug;

  OpenLayersController({
    required this.webController,
  });

  Future<void> updateLayer(String url) async {
    return webController?.runJavascript('window.updateImageMap($url)');
  }
}
