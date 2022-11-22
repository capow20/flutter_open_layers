// ignore_for_file: avoid_print

import 'package:flutter/foundation.dart';
import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:open_layers_viewer/open_layers_viewer.dart';

class OpenLayersImageViewer extends StatefulWidget {
  const OpenLayersImageViewer({super.key, required this.imageUrl, this.onWebViewCreated, required this.onLoadProgress});
  final String imageUrl;
  final Function(OpenLayersController)? onWebViewCreated;
  final Function(double progress, String message)? onLoadProgress;
  @override
  State<OpenLayersImageViewer> createState() => _OpenLayersImageViewerState();
}

class _OpenLayersImageViewerState extends State<OpenLayersImageViewer> {
  OpenLayersController controller = OpenLayersController(webController: null);
  final InAppLocalhostServer localhostServer = InAppLocalhostServer(documentRoot: 'packages/open_layers_viewer/web', port: 9090);

  Future<void> initServer() async {
    if (!localhostServer.isRunning()) await localhostServer.start();
  }

  @override
  void dispose() {
    super.dispose();
    if (localhostServer.isRunning()) localhostServer.close();
  }

  @override
  Widget build(BuildContext context) {
    initServer();
    return InAppWebView(
      initialOptions:
          InAppWebViewGroupOptions(crossPlatform: InAppWebViewOptions(cacheEnabled: false, clearCache: true, transparentBackground: true)),
      onConsoleMessage: (controller, consoleMessage) => print(consoleMessage),
      initialUrlRequest: URLRequest(url: Uri.parse('http://localhost:9090/index.html')),
      onProgressChanged: ((controller, progress) {
        if (widget.onLoadProgress != null) widget.onLoadProgress!(progress * 1.0, 'Initializing Webview...');
      }),
      onWebViewCreated: (c) {
        controller = OpenLayersController(webController: c);
        if (widget.onWebViewCreated != null) widget.onWebViewCreated!(controller);
        controller.webController?.addJavaScriptHandler(
            handlerName: 'loadProgress',
            callback: (args) {
              if (widget.onLoadProgress != null) widget.onLoadProgress!(args[0] * 1.0, 'Loading Image...');
            });
      },
      onLoadStop: (c, url) {
        c.clearCache();
        controller.setupScene(widget.imageUrl);
      },
    );
  }
}
