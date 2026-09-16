import 'dart:async';
import 'dart:ui' as ui;
import 'package:cutmyhair1/models/barber_model.dart';
import 'package:cutmyhair1/services/firestore_service.dart';
import 'package:cutmyhair1/views/barber_detail_page.dart';
import 'package:cutmyhair1/widgets/barber_tile.dart';
import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:geolocator/geolocator.dart';
import 'package:provider/provider.dart';

class MapPage extends StatefulWidget {
  const MapPage({super.key});

  @override
  State<MapPage> createState() => _MapPageState();
}

class _MapPageState extends State<MapPage> with TickerProviderStateMixin {
  final Completer<GoogleMapController> _controller = Completer();
  Set<Marker> _markers = {};
  Marker? _userMarker;
  Position? _position;
  bool _loadingLocation = true;

  BitmapDescriptor? _barberPin;
  BitmapDescriptor? _userPin;
  bool _isDarkMode = false;
  Barber? _selectedBarber;
  late AnimationController _pulseController;

  static const _fallback = CameraPosition(
    target: LatLng(3.139, 101.6869),
    zoom: 12,
  );

  String _mapStyleLight = '';
  String _mapStyleDark = '';

  @override
  void initState() {
    super.initState();
    _loadMapStyles();
    _pulseController =
        AnimationController(vsync: this, duration: const Duration(seconds: 2))
          ..repeat(reverse: false);
    _initMap();
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  void _loadMapStyles() {
    _mapStyleLight = '''
    [
      { "featureType": "poi", "stylers": [{ "visibility": "off" }] },
      { "featureType": "transit", "stylers": [{ "visibility": "off" }] },
      { "featureType": "road", "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
      { "featureType": "administrative", "elementType": "labels", "stylers": [{ "visibility": "off" }] },
      { "featureType": "water", "stylers": [{ "color": "#d1e6fa" }] },
      { "featureType": "landscape", "stylers": [{ "color": "#f5f7fa" }] }
    ]
    ''';

    _mapStyleDark = '''
    [
      { "elementType": "geometry", "stylers": [{ "color": "#1b1b1b" }] },
      { "elementType": "labels.text.fill", "stylers": [{ "color": "#a9a9a9" }] },
      { "featureType": "poi", "stylers": [{ "visibility": "off" }] },
      { "featureType": "transit", "stylers": [{ "visibility": "off" }] },
      { "featureType": "road", "stylers": [{ "color": "#292929" }] },
      { "featureType": "water", "stylers": [{ "color": "#0f2027" }] },
      { "featureType": "landscape", "stylers": [{ "color": "#181818" }] }
    ]
    ''';
  }

  Future<void> _initMap() async {
    await Future.wait([
      _loadBarberMarker(),
      _loadUserMarker(),
    ]);
    await _getLocation();
    _listenBarbers();
  }

  /// 💈 Barber pin (blue gradient)
  Future<void> _loadBarberMarker() async {
    const double width = 100;
    const double height = 120;
    final recorder = ui.PictureRecorder();
    final canvas = Canvas(recorder);
    final center = Offset(width / 2, height / 2 - 10);

    final gradient = ui.Gradient.linear(
      Offset(width / 2, 0),
      Offset(width / 2, height),
      [const Color(0xFF007AFF), const Color(0xFF00B2FF)],
    );

    final bodyPaint = Paint()..shader = gradient;
    final outline = Paint()
      ..color = const Color(0xFF007AFF)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3.0;
    final shadow = Paint()
      ..color = Colors.black.withOpacity(0.15)
      ..maskFilter = const ui.MaskFilter.blur(ui.BlurStyle.normal, 6);

    canvas.drawCircle(center.translate(0, 12), 20, shadow);
    final path = Path()
      ..addOval(Rect.fromCircle(center: center, radius: 20))
      ..moveTo(width / 2 - 10, height / 2 + 10)
      ..lineTo(width / 2 + 10, height / 2 + 10)
      ..lineTo(width / 2, height - 12)
      ..close();

    canvas.drawPath(path, bodyPaint);
    canvas.drawPath(path, outline);
    canvas.drawCircle(center, 8, Paint()..color = Colors.white);

    final image =
        await recorder.endRecording().toImage(width.toInt(), height.toInt());
    final bytes = await image.toByteData(format: ui.ImageByteFormat.png);
    _barberPin = BitmapDescriptor.fromBytes(bytes!.buffer.asUint8List());
  }

  /// 📍 User pin (pulsing blue)
  Future<void> _loadUserMarker() async {
    const double size = 120;
    final recorder = ui.PictureRecorder();
    final canvas = Canvas(recorder);
    final center = Offset(size / 2, size / 2);

    final glowGradient = ui.Gradient.radial(
      center,
      40,
      [const Color(0xFF007AFF).withOpacity(0.3), Colors.transparent],
    );
    canvas.drawCircle(center, 30, Paint()..shader = glowGradient);
    canvas.drawCircle(center, 14,
        Paint()..color = Colors.white..style = PaintingStyle.stroke..strokeWidth = 4);
    canvas.drawCircle(center, 9, Paint()..color = const Color(0xFF007AFF));

    final image =
        await recorder.endRecording().toImage(size.toInt(), size.toInt());
    final bytes = await image.toByteData(format: ui.ImageByteFormat.png);
    _userPin = BitmapDescriptor.fromBytes(bytes!.buffer.asUint8List());
  }

  Future<void> _getLocation() async {
    try {
      bool enabled = await Geolocator.isLocationServiceEnabled();
      if (!enabled) {
        setState(() => _loadingLocation = false);
        return;
      }

      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.denied ||
          permission == LocationPermission.deniedForever) {
        setState(() => _loadingLocation = false);
        return;
      }

      final pos = await Geolocator.getCurrentPosition(
          desiredAccuracy: LocationAccuracy.high);
      if (!mounted) return;
      setState(() {
        _position = pos;
        _loadingLocation = false;
      });
      _updateUserMarker();

      final c = await _controller.future;
      c.animateCamera(CameraUpdate.newCameraPosition(
          CameraPosition(target: LatLng(pos.latitude, pos.longitude), zoom: 15)));
    } catch (e) {
      debugPrint("Location error: $e");
      if (mounted) setState(() => _loadingLocation = false);
    }
  }

  void _updateUserMarker() {
    if (_position == null || _userPin == null) return;

    final marker = Marker(
      markerId: const MarkerId('user'),
      position: LatLng(_position!.latitude, _position!.longitude),
      icon: _userPin!,
      anchor: const Offset(0.5, 0.5),
      zIndex: 2,
    );

    setState(() {
      _userMarker = marker;
      _markers = {
        ..._markers.where((m) => m.markerId.value != 'user'),
        marker,
      };
    });
  }

  void _listenBarbers() {
    final db = Provider.of<FirestoreService>(context, listen: false);
    db.streamBarbers().listen((barbers) {
      if (!mounted) return;
      setState(() {
        final barberMarkers = barbers
            .where((b) => b.latitude != null && b.longitude != null)
            .map((b) => Marker(
                  markerId: MarkerId(b.id),
                  position: LatLng(b.latitude!, b.longitude!),
                  icon: _barberPin ??
                      BitmapDescriptor.defaultMarkerWithHue(
                          BitmapDescriptor.hueAzure),
                  onTap: () => setState(() => _selectedBarber = b),
                ))
            .toSet();
        _markers = {...barberMarkers, if (_userMarker != null) _userMarker!};
      });
    });
  }

  Future<void> _zoomIn() async =>
      (await _controller.future).animateCamera(CameraUpdate.zoomIn());
  Future<void> _zoomOut() async =>
      (await _controller.future).animateCamera(CameraUpdate.zoomOut());

  Future<void> _recenter() async {
    final c = await _controller.future;
    if (_position != null) {
      await c.animateCamera(CameraUpdate.newCameraPosition(CameraPosition(
          target: LatLng(_position!.latitude, _position!.longitude), zoom: 15)));
    } else {
      await c.animateCamera(CameraUpdate.newCameraPosition(_fallback));
    }
  }

  Future<void> _toggleMapStyle() async {
    final controller = await _controller.future;
    setState(() => _isDarkMode = !_isDarkMode);
    await controller.setMapStyle(_isDarkMode ? _mapStyleDark : _mapStyleLight);
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).padding.bottom;
    final initial = _position == null
        ? _fallback
        : CameraPosition(
            target: LatLng(_position!.latitude, _position!.longitude), zoom: 14);

    return SafeArea(
      bottom: false,
      child: Scaffold(
        extendBodyBehindAppBar: true,
        body: Stack(
          children: [
            GoogleMap(
              initialCameraPosition: initial,
              markers: _markers,
              myLocationEnabled: false,
              myLocationButtonEnabled: false,
              zoomControlsEnabled: false,
              onMapCreated: (c) async {
                _controller.complete(c);
                await c.setMapStyle(
                    _isDarkMode ? _mapStyleDark : _mapStyleLight);
              },
              onTap: (_) => setState(() => _selectedBarber = null),
            ),

            if (_loadingLocation)
              Container(
                color: Colors.white.withOpacity(0.4),
                alignment: Alignment.center,
                child: const CircularProgressIndicator(color: Color(0xFF007AFF)),
              ),

            // 🌫 Frosted map controls
            Positioned(
              bottom: 30 + bottomInset,
              left: 20,
              right: 20,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      _frostedButton(
                        _isDarkMode
                            ? Icons.wb_sunny_rounded
                            : Icons.dark_mode_rounded,
                        _toggleMapStyle,
                      ),
                      const SizedBox(height: 12),
                      _frostedButton(Icons.my_location_rounded, _recenter),
                    ],
                  ),
                  Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      _frostedButton(Icons.add, _zoomIn),
                      const SizedBox(height: 12),
                      _frostedButton(Icons.remove, _zoomOut),
                    ],
                  ),
                ],
              ),
            ),

            // 💈 Frosted barber card
            if (_selectedBarber != null)
              Positioned(
                left: 0,
                right: 0,
                bottom: 80 + bottomInset,
                child: GestureDetector(
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => BarberDetailPage(
                          barberId: _selectedBarber!.id,
                          bookingId: '',
                        ),
                      ),
                    );
                  },
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(20),
                      child: BackdropFilter(
                        filter: ui.ImageFilter.blur(sigmaX: 15, sigmaY: 15),
                        child: Container(
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: [
                                Colors.white.withOpacity(0.7),
                                const Color(0xFFE7F3FF).withOpacity(0.8),
                              ],
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                            ),
                            borderRadius: BorderRadius.circular(20),
                            border:
                                Border.all(color: Colors.white.withOpacity(0.4)),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.1),
                                blurRadius: 15,
                                offset: const Offset(0, 6),
                              ),
                            ],
                          ),
                          child: BarberTile(
                            barber: _selectedBarber!,
                            subtitle: _selectedBarber!.priceRange,
                            compact: true,
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _frostedButton(IconData icon, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: ClipOval(
        child: BackdropFilter(
          filter: ui.ImageFilter.blur(sigmaX: 12, sigmaY: 12),
          child: Container(
            height: 50,
            width: 50,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  Colors.white.withOpacity(0.7),
                  const Color(0xFFE7F3FF).withOpacity(0.8),
                ],
              ),
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: Colors.blue.withOpacity(0.12),
                  blurRadius: 12,
                  offset: const Offset(0, 4),
                ),
              ],
              border: Border.all(color: Colors.white.withOpacity(0.4)),
            ),
            child: Icon(icon, color: const Color(0xFF007AFF)),
          ),
        ),
      ),
    );
  }
}
