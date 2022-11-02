// ignore_for_file: avoid_print

import 'package:flutter/material.dart';
import 'package:open_layers_viewer/open_layers_viewer.dart';

class OpenLayersImageViewer extends StatefulWidget {
  const OpenLayersImageViewer({super.key});

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
  Widget build(BuildContext context) {
    initServer();
    return Stack(
      children: [
        InAppWebView(
          onConsoleMessage: (controller, consoleMessage) => print(consoleMessage),
          initialUrlRequest: URLRequest(url: Uri.parse('http://localhost:9090/index.html')),
          onWebViewCreated: (c) {
            controller = OpenLayersController(webController: c);
          },
          onLoadStop: (c, url) {
            controller.updateLayer('packages/open_layers_viewer/assets/tiled_one');
          },
        ),
      ],
    );
  }
}
