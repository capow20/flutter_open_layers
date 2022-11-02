// ignore_for_file: avoid_print

import 'package:flutter/material.dart';
import 'package:open_layers_viewer/open_layers_viewer.dart';

class OpenLayersImageViewer extends StatefulWidget {
  const OpenLayersImageViewer({super.key, required this.imageUrl, this.onWebViewCreated});
  final String imageUrl;
  final Function(OpenLayersController)? onWebViewCreated;
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
    return Stack(
      children: [
        InAppWebView(
          initialOptions: InAppWebViewGroupOptions(crossPlatform: InAppWebViewOptions(cacheEnabled: false)),
          onConsoleMessage: (controller, consoleMessage) => print(consoleMessage),
          initialUrlRequest: URLRequest(url: Uri.parse('http://localhost:9090/index.html')),
          onWebViewCreated: (c) {
            controller = OpenLayersController(webController: c);
            if (widget.onWebViewCreated != null) widget.onWebViewCreated!(controller);
          },
          onLoadStop: (c, url) {
            controller.setupScene(widget.imageUrl);
          },
        ),
      ],
    );
  }
}
