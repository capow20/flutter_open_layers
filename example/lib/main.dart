import 'package:flutter/material.dart';
import 'package:open_layers_viewer/open_layers_controller.dart';
import 'package:open_layers_viewer/open_layers_image_viewer.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

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
              initialUrl: imageUrls[0],
              onWebViewCreated: (OpenLayersController c) {
                controller = c;
              },
              onError: (message, code) {
                print("Error: $message, $code");
              },
              progressBuilder: (double? progress, String message) {
                return Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    CircularProgressIndicator(
                      value: progress,
                      color: Colors.red,
                      backgroundColor: Colors.black,
                    ),
                    const SizedBox(
                      height: 20,
                      width: double.infinity,
                    ),
                    Text(message),
                  ],
                );
              },
            ),
            Positioned(
              left: 20,
              top: 100,
              child: Container(
                color: Colors.red,
                height: 80,
                width: 100,
                child: const Center(
                    child: Text(
                  "Click here to break controls",
                  style: TextStyle(color: Colors.white),
                  textAlign: TextAlign.center,
                )),
              ),
            ),
            Positioned(
              right: 0,
              top: 100,
              child: GestureDetector(
                onTap: () {
                  controller?.resetControls();
                },
                child: Container(
                  decoration: BoxDecoration(
                    color: Colors.red,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Padding(
                    padding: EdgeInsets.all(8.0),
                    child: Text("RESET CONTROLS", style: TextStyle(color: Colors.white)),
                  ),
                ),
              ),
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
            if (value.contains('tiled_three')) {
              controller?.updateLayer(
                value,
                replace: false,
                lat: 0.018467959670429742,
                long: -0.017113785161427586,
                zoom: 1.7564143626023134,
              );
            } else {
              controller?.updateLayer(value);
            }
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
