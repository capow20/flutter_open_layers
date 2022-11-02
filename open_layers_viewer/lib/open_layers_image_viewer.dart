import 'package:flutter/foundation.dart';
import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';

class OpenLayersImageViewer extends StatefulWidget {
  const OpenLayersImageViewer({super.key});

  @override
  State<OpenLayersImageViewer> createState() => _OpenLayersImageViewerState();
}

class _OpenLayersImageViewerState extends State<OpenLayersImageViewer> {
  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        FutureBuilder(
          builder: ((context, snapshot) {
            if (!snapshot.hasData) return const SizedBox();
            return WebView(
              allowsInlineMediaPlayback: true,
              gestureRecognizers: {
                Factory<OneSequenceGestureRecognizer>(
                  () => EagerGestureRecognizer(),
                )
              },
              zoomEnabled: true,
              backgroundColor: Colors.transparent,
              javascriptMode: JavascriptMode.unrestricted,
              initialUrl: "../web/index.html",
            );
          }),
        ),
      ],
    );
  }
}
