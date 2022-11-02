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

  final imageUrls = [
    "https://imgprd21.museumofthebible.org/mobileapi/assets/tiled/tiled_one/",
    "https://imgprd21.museumofthebible.org/mobileapi/assets/tiled/tiled_two/",
    "https://imgprd21.museumofthebible.org/mobileapi/assets/tiled/tiled_three/",
  ];
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: Container(
        color: Colors.white,
        child: Stack(
          children: [
            OpenLayersImageViewer(
              imageUrl: imageUrls[0],
              onWebViewCreated: (OpenLayersController c) {
                controller = c;
              },
            ),
            Align(
              alignment: Alignment.bottomCenter,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: _buildLayerButtons(),
              ),
            ),
          ],
        ),
      ),
    );
  }

  List<Widget> _buildLayerButtons() {
    int layerNum = 0;
    List<Widget> imageButtons = imageUrls.map((value) {
      layerNum++;
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 100, horizontal: 15),
        child: GestureDetector(
          onTap: () {
            controller?.updateLayer(value);
          },
          child: Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(10),
              color: Colors.red,
            ),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
              child: Text(
                "Layer $layerNum",
                style: const TextStyle(fontSize: 20, color: Colors.white),
              ),
            ),
          ),
        ),
      );
    }).toList();

    return imageButtons;
  }
}
