import 'dart:async';
import 'dart:math';
import 'dart:ui';
import 'package:cutmyhair1/models/barber_model.dart';
import 'package:cutmyhair1/services/auth_service.dart';
import 'package:cutmyhair1/services/firestore_service.dart';
import 'package:cutmyhair1/views/barber_detail_page.dart';
import 'package:cutmyhair1/widgets/barber_tile.dart';
import 'package:cutmyhair1/widgets/loading_widget.dart';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:provider/provider.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  Position? _position;
  bool _loading = true;
  List<Barber> _barbers = [];
  StreamSubscription? _barberSub;
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _initPage();
  }

  Future<void> _initPage() async {
    await _getLocation();
    _listenBarbers();
  }

  Future<void> _getLocation() async {
    try {
      await Geolocator.requestPermission();
      final pos = await Geolocator.getCurrentPosition(
          desiredAccuracy: LocationAccuracy.high);
      if (mounted) {
        setState(() {
          _position = pos;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _listenBarbers() {
    final firestore = Provider.of<FirestoreService>(context, listen: false);
    _barberSub = firestore.streamBarbers().listen((barbers) {
      if (mounted) setState(() => _barbers = barbers);
    });
  }

  @override
  void dispose() {
    _barberSub?.cancel();
    _scrollController.dispose();
    super.dispose();
  }

  double _distanceKm(double lat1, double lon1, double lat2, double lon2) {
    const p = 0.017453292519943295;
    final a = 0.5 -
        cos((lat2 - lat1) * p) / 2 +
        cos(lat1 * p) *
            cos(lat2 * p) *
            (1 - cos((lon2 - lon1) * p)) /
            2;
    return 12742 * asin(sqrt(a));
  }

  @override
  Widget build(BuildContext context) {
    final user = Provider.of<AuthService>(context).currentUser;
    final name = user?.displayName?.split(' ').first ?? "there";
    const blue = Color(0xFF007AFF);
    const lightBlue = Color(0xFFE7F3FF);

    if (_loading) return const LoadingWidget();

    // Nearby barbers
    List<Barber> nearby = [];
    if (_position != null) {
      nearby = _barbers
          .where((b) =>
              b.latitude != null &&
              b.longitude != null &&
              _distanceKm(_position!.latitude, _position!.longitude,
                      b.latitude!, b.longitude!) <=
                  30)
          .toList();
    } else {
      nearby = List.from(_barbers);
    }

    // Top rated
    final top = _barbers
        .where((b) => b.isActive && b.rating >= 4.0)
        .toList()
      ..sort((a, b) => b.rating.compareTo(a.rating));
    final topLimited = top.take(5).toList();

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: RefreshIndicator(
          color: blue,
          onRefresh: () async {
            await _getLocation();
            setState(() {});
          },
          child: CustomScrollView(
            controller: _scrollController,
            physics: const BouncingScrollPhysics(),
            slivers: [
              // 🌈 Fancy Dynamic Header
              SliverAppBar(
                expandedHeight: 200,
                backgroundColor: Colors.transparent,
                elevation: 0,
                pinned: true,
                flexibleSpace: LayoutBuilder(
                  builder: (context, constraints) {
                    final percent = (constraints.maxHeight - kToolbarHeight) /
                        (200 - kToolbarHeight);
                    final opacity = percent.clamp(0.0, 1.0);

                    return Stack(
                      fit: StackFit.expand,
                      children: [
                        // Gradient background
                        Container(
                          decoration: const BoxDecoration(
                            gradient: LinearGradient(
                              colors: [Color(0xFF007AFF), Color(0xFF00C6FF)],
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                            ),
                          ),
                        ),
                        // Greeting text with parallax fade
                        Positioned(
                          left: 20,
                          bottom: 50 * opacity + 10,
                          child: Opacity(
                            opacity: opacity,
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  "Hi, $name 👋",
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 32,
                                    fontWeight: FontWeight.bold,
                                    shadows: [
                                      Shadow(
                                          color: Colors.black26,
                                          blurRadius: 8),
                                    ],
                                  ),
                                ),
                                const SizedBox(height: 4),
                                const Text(
                                  "Find the best barbers near you",
                                  style: TextStyle(
                                    color: Colors.white70,
                                    fontSize: 15,
                                    fontWeight: FontWeight.w400,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    );
                  },
                ),
              ),

              // 💈 Top Rated Barbers Section (Glass White + Blue Tint)
              SliverToBoxAdapter(
                child: Padding(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                  child: _frostedGlassContainer(
                    title: "Top Rated Barbers",
                    child: topLimited.isEmpty
                        ? const Padding(
                            padding: EdgeInsets.all(40),
                            child: Center(
                              child: Text(
                                "No top barbers yet",
                                style: TextStyle(color: Colors.black54),
                              ),
                            ),
                          )
                        : SizedBox(
                            height: 210,
                            child: ListView.separated(
                              scrollDirection: Axis.horizontal,
                              physics: const BouncingScrollPhysics(),
                              separatorBuilder: (_, __) =>
                                  const SizedBox(width: 16),
                              itemCount: topLimited.length,
                              itemBuilder: (_, i) {
                                final b = topLimited[i];
                                final distance = (_position != null &&
                                        b.latitude != null)
                                    ? _distanceKm(
                                        _position!.latitude,
                                        _position!.longitude,
                                        b.latitude!,
                                        b.longitude!,
                                      )
                                    : null;
                                return GestureDetector(
                                  onTap: () => Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                      builder: (_) =>
                                          BarberDetailPage(barberId: b.id),
                                    ),
                                  ),
                                  child: _barberCard(b, distance),
                                );
                              },
                            ),
                          ),
                  ),
                ),
              ),

              // 📍 Nearby Barbers Section (Glass White + Blue Tint)
              SliverToBoxAdapter(
                child: Padding(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                  child: _frostedGlassContainer(
                    title: "All Nearby Barbers",
                    child: nearby.isEmpty
                        ? const Padding(
                            padding: EdgeInsets.all(40),
                            child: Center(
                              child: Text(
                                "No barbers nearby",
                                style: TextStyle(color: Colors.black54),
                              ),
                            ),
                          )
                        : GridView.builder(
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            gridDelegate:
                                const SliverGridDelegateWithFixedCrossAxisCount(
                              crossAxisCount: 2,
                              crossAxisSpacing: 14,
                              mainAxisSpacing: 14,
                              childAspectRatio: 0.78,
                            ),
                            itemCount: nearby.length,
                            itemBuilder: (_, i) {
                              final b = nearby[i];
                              final distance = (_position != null &&
                                      b.latitude != null)
                                  ? _distanceKm(
                                      _position!.latitude,
                                      _position!.longitude,
                                      b.latitude!,
                                      b.longitude!,
                                    )
                                  : null;
                              return GestureDetector(
                                onTap: () => Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (_) =>
                                        BarberDetailPage(barberId: b.id),
                                  ),
                                ),
                                child: BarberTile(
                                  barber: b,
                                  subtitle:
                                      "${b.rating.toStringAsFixed(1)} ★ | ${b.barberType}",
                                  distanceKm: distance,
                                ),
                              );
                            },
                          ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // 🔹 Frosted glass container with light blue tint
  Widget _frostedGlassContainer({
    required String title,
    required Widget child,
  }) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(28),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
        child: Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                Colors.white.withOpacity(0.6),
                const Color.fromARGB(255, 152, 200, 248).withOpacity(0.4),
              ],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(28),
            border: Border.all(color: Colors.white.withOpacity(0.3)),
            boxShadow: [
              BoxShadow(
                color: Colors.blue.withOpacity(0.08),
                blurRadius: 20,
                offset: const Offset(0, 6),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(
                  color: Colors.black87,
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 12),
              child,
            ],
          ),
        ),
      ),
    );
  }

  // 🔹 Barber card
  Widget _barberCard(Barber b, double? distance) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 300),
      width: 160,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 8,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(20),
        child: Stack(
          children: [
            Image.network(
              b.imageUrl,
              fit: BoxFit.cover,
              width: 160,
              height: 210,
            ),
            Positioned(
              bottom: 0,
              left: 0,
              right: 0,
              child: Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.bottomCenter,
                    end: Alignment.topCenter,
                    colors: [
                      Colors.black.withOpacity(0.55),
                      Colors.transparent,
                    ],
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      b.name,
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                    Text(
                      "${b.rating.toStringAsFixed(1)} ★ | ${b.barberType}",
                      style: const TextStyle(
                        color: Colors.white70,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
