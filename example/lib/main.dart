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
      debugShowCheckedModeBanner: false,
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
  double? progress;
  String loadMessage = "";
  final imageUrls = [
    "https://imgprd21.museumofthebible.org/mobileapi/assets/tiled/tiled_one/",
    "https://imgprd21.museumofthebible.org/mobileapi/assets/tiled/tiled_two/",
    "https://imgprd21.museumofthebible.org/mobileapi/assets/tiled/tiled_three/",
  ];
  late String selectedUrl = imageUrls[0];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.blue,
      body: Container(
        decoration: BoxDecoration(
            gradient: RadialGradient(colors: [
          Colors.black,
          Colors.grey.shade400,
          Colors.blue.shade500,
          Colors.blue,
        ], radius: 2)),
        child: Stack(
          children: [
            OpenLayersImageViewer(
              onLoadProgress: ((double prog, String message) {
                setState(() {
                  progress = prog / 100;
                  loadMessage = message;
                });
              }),
              initialUrl: imageUrls[0],
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
            if (progress != 1)
              Align(
                alignment: Alignment.center,
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    CircularProgressIndicator(value: progress, color: Colors.blue),
                    Padding(
                      padding: const EdgeInsets.only(top: 8.0),
                      child: Text(
                        loadMessage,
                        style: const TextStyle(color: Colors.blue, fontSize: 15),
                      ),
                    ),
                  ],
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
            setState(() => selectedUrl = value);
          },
          child: Column(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              if (selectedUrl == value)
                const Icon(
                  Icons.star,
                  color: Colors.deepOrangeAccent,
                ),
              Container(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(10),
                  color: Colors.blue,
                ),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                  child: Text(
                    "Layer $layerNum",
                    style: const TextStyle(fontSize: 20, color: Colors.white),
                  ),
                ),
              ),
            ],
          ),
        ),
      );
    }).toList();

    return imageButtons;
  }
}
