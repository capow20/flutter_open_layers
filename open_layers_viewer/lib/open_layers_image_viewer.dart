// ignore_for_file: avoid_print

import 'package:flutter/material.dart';
import 'package:open_layers_viewer/open_layers_viewer.dart';

class OpenLayersImageViewer extends StatefulWidget {
  const OpenLayersImageViewer({super.key, required this.initialUrl, this.onWebViewCreated, required this.onError, this.progressBuilder});
  final String initialUrl;
  final Function(OpenLayersController)? onWebViewCreated;
  final Widget Function(double?, String)? progressBuilder;
  final Function(String message, int code) onError;
  @override
  State<OpenLayersImageViewer> createState() => _OpenLayersImageViewerState();
}

class _OpenLayersImageViewerState extends State<OpenLayersImageViewer> {
  OpenLayersController controller = OpenLayersController(webController: null);
  final InAppLocalhostServer localhostServer = InAppLocalhostServer(documentRoot: 'packages/open_layers_viewer/web', port: 9090);
  double? loadProgress;
  String loadMessage = "Initializing Server...";

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
    return Stack(
      children: [
        InAppWebView(
          initialOptions:
              InAppWebViewGroupOptions(crossPlatform: InAppWebViewOptions(cacheEnabled: false, clearCache: true, transparentBackground: true)),
          onConsoleMessage: (controller, consoleMessage) => print(consoleMessage),
          initialUrlRequest: URLRequest(url: Uri.parse('http://localhost:9090/index.html')),
          onWebViewCreated: (c) {
            controller = OpenLayersController(webController: c);
            if (widget.onWebViewCreated != null) widget.onWebViewCreated!(controller);
            controller.webController?.addJavaScriptHandler(
                handlerName: 'loadProgress',
                callback: (args) {
                  setState(() {
                    loadMessage = "Loading Model...";
                    loadProgress = args[0] * 1.0;
                  });
                });
          },
          onLoadStop: (c, url) {
            c.clearCache();
            controller.setupScene(widget.initialUrl);
          },
          onLoadError: (controller, url, code, message) {
            widget.onError(message, code);
          },
          onLoadHttpError: (controller, url, statusCode, description) {
            widget.onError(description, statusCode);
          },
        ),
        if (loadProgress != 100.0 && widget.progressBuilder != null)
          widget.progressBuilder!(
            loadProgress == null ? null : (loadProgress! / 100.0),
            loadMessage,
          )
      ],
    );
  }
}
