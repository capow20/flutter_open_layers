import 'package:flutter/material.dart';
import 'package:open_layers_viewer/open_layers_controller.dart';
import 'package:open_layers_viewer/open_layers_image_viewer.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  // This widget is the root of your application.
  @override
  Widget build(BuildContext context) {
    return const MaterialApp(
      title: 'Flutter Open Layers Demo',
      home: OpenLayersView(),
    );
  }
}

class OpenLayersView extends StatefulWidget {
  const OpenLayersView({super.key});

  @override
  State<OpenLayersView> createState() => _OpenLayersViewState();
}

class _OpenLayersViewState extends State<OpenLayersView> {
  OpenLayersController? controller;
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text("Open Layers Demo"),
        backgroundColor: Colors.red,
      ),
      body: Container(
        color: Colors.white,
        child: Stack(
          children: [
            const OpenLayersImageViewer(),
          ],
        ),
      ),
    );
  }
}
