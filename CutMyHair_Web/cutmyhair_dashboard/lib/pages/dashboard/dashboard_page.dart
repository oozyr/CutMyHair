import 'dart:ui';
import 'dart:async'; // ✅ DITAMBAH: untuk StreamSubscription

import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';

import 'appointments_page.dart';
import 'services_page.dart';
import 'profile_page.dart';
import 'reviews_page.dart';
import '../auth/login_page.dart';
import 'package:cutmyhair_dashboard/models/barber_model.dart';

class DashboardPage extends StatefulWidget {
  const DashboardPage({super.key});

  @override
  State<DashboardPage> createState() => _DashboardPageState();
}

class _DashboardPageState extends State<DashboardPage>
    with SingleTickerProviderStateMixin {
  int _selectedIndex = 0;
  int _hoveredIndex = -1;
  bool _isCollapsed = false;
  late final List<Widget> _pages;
  late final AnimationController _controller;
  late final Animation<double> _widthAnimation;

  Barber? barber;
  bool isActive = false;
  bool loadingProfile = true;
  bool loadError = false;

  Stream<DocumentSnapshot<Map<String, dynamic>>>? _barberStream;
  StreamSubscription<DocumentSnapshot<Map<String, dynamic>>>? _barberListener; // ✅ optional to cancel later

  @override
  void initState() {
    super.initState();

    _pages = [
      HomeContent(onViewBookings: _goToBookings),
      const AppointmentsPage(),
      const ServicesPage(),
      const ReviewsPage(),
      const ProfilePage(),
    ];

    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 400),
    );
    _widthAnimation = Tween<double>(begin: 240, end: 80)
        .animate(CurvedAnimation(parent: _controller, curve: Curves.easeInOut));

    _initBarberListener();
  }

  void _initBarberListener() {
    final uid = FirebaseAuth.instance.currentUser?.uid;
    if (uid == null) return;

    _barberStream =
        FirebaseFirestore.instance.collection('barbers').doc(uid).snapshots();

    _barberListener = _barberStream!.listen((snapshot) {
      if (!snapshot.exists) return;
      final data = snapshot.data()!;
      setState(() {
        barber = Barber.fromFirestore(snapshot);
        isActive = data['isActive'] ?? false;
        loadingProfile = false;
        loadError = false;
      });
    }, onError: (error) {
      debugPrint("Error listening to barber profile: $error");
      setState(() {
        loadError = true;
        loadingProfile = false;
      });
    });
  }

  void _goToBookings() {
    setState(() {
      _selectedIndex = 1;
    });
  }

  Future<void> _toggleActiveStatus() async {
    final uid = FirebaseAuth.instance.currentUser?.uid;
    if (uid == null) return;

    final newState = !isActive;
    setState(() => isActive = newState);

    try {
      await FirebaseFirestore.instance.collection('barbers').doc(uid).update({
        'isActive': newState,
        'updatedAt': FieldValue.serverTimestamp(),
      });
    } catch (e) {
      debugPrint('Failed to update isActive: $e');
      setState(() => isActive = !newState);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Failed to change status. Please try again.'),
          backgroundColor: Colors.redAccent,
        ),
      );
    }
  }

  void _toggleSidebar() {
    setState(() {
      _isCollapsed = !_isCollapsed;
      _isCollapsed ? _controller.forward() : _controller.reverse();
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    _barberListener?.cancel(); // ✅ pastikan listener dibersihkan
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                colors: [Color(0xFF0A1428), Color(0xFF1C2541)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
            ),
          ),
          Opacity(
            opacity: 0.15,
            child: Image.asset(
              "assets/images/batik1.jpg",
              fit: BoxFit.cover,
              width: double.infinity,
              height: double.infinity,
            ),
          ),
          Row(
            children: [
              _buildSidebar(),
              Expanded(
                child: AnimatedSwitcher(
                  duration: const Duration(milliseconds: 350),
                  transitionBuilder: (child, anim) =>
                      FadeTransition(opacity: anim, child: child),
                  child: _pages[_selectedIndex],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // Sidebar + semua UI bawah ni kekal tak diubah langsung...
  // (sama seperti yang kau bagi)

  // --- [KEEP ALL CODE BELOW EXACTLY THE SAME] ---
  // (Sidebar, _handleLogout, _navItem, dan HomeContent class)


  // ------------------------------------------------
  // 💠 SIDEBAR
  // ------------------------------------------------
  Widget _buildSidebar() {
    return AnimatedBuilder(
      animation: _widthAnimation,
      builder: (context, child) {
        return ClipRRect(
          borderRadius: BorderRadius.circular(28),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 18, sigmaY: 18),
            child: Container(
              width: _widthAnimation.value,
              margin: const EdgeInsets.all(14),
              padding: const EdgeInsets.symmetric(vertical: 30, horizontal: 10),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    const Color(0xFF0D1B2A).withOpacity(0.9),
                    const Color(0xFF1B263B).withOpacity(0.85),
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(28),
                border: Border.all(color: Colors.white.withOpacity(0.12)),
                boxShadow: [
                  BoxShadow(
                    color: Colors.blueAccent.withOpacity(0.25),
                    blurRadius: 25,
                    offset: const Offset(0, 6),
                  ),
                ],
              ),
              child: SingleChildScrollView(
                physics: const BouncingScrollPhysics(),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    // 🌟 Logo Header Section
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 6.0),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          if (!_isCollapsed)
                            Row(
                              children: [
                                ClipRRect(
                                  borderRadius: BorderRadius.circular(12),
                                  child: Image.asset(
                                    "assets/images/logo.png",
                                    width: 40,
                                    height: 40,
                                    fit: BoxFit.cover,
                                    errorBuilder: (context, _, __) =>
                                        const Icon(
                                          Icons.cut_rounded,
                                          color: Colors.cyanAccent,
                                          size: 32,
                                        ),
                                  ),
                                ),
                                const SizedBox(width: 10),
                                ShaderMask(
                                  shaderCallback: (bounds) =>
                                      const LinearGradient(
                                        colors: [
                                          Colors.cyanAccent,
                                          Colors.blueAccent,
                                        ],
                                      ).createShader(bounds),
                                  child: const Text(
                                    "CUTMYHAIR",
                                    style: TextStyle(
                                      color: Colors.white,
                                      fontSize: 20,
                                      fontWeight: FontWeight.bold,
                                      letterSpacing: 1.2,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          InkWell(
                            borderRadius: BorderRadius.circular(12),
                            onTap: _toggleSidebar,
                            hoverColor: Colors.white.withOpacity(0.08),
                            child: Padding(
                              padding: const EdgeInsets.all(6.0),
                              child: Icon(
                                _isCollapsed
                                    ? Icons.arrow_forward_ios_rounded
                                    : Icons.arrow_back_ios_new_rounded,
                                color: Colors.cyanAccent,
                                size: 20,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 30),
                    if (!_isCollapsed)
                      loadingProfile
                          ? const Padding(
                              padding: EdgeInsets.all(10),
                              child: SizedBox(
                                height: 28,
                                width: 28,
                                child: CircularProgressIndicator(
                                  color: Colors.cyanAccent,
                                  strokeWidth: 2,
                                ),
                              ),
                            )
                          : loadError
                              ? const Padding(
                                  padding: EdgeInsets.all(8.0),
                                  child: Text(
                                    'Failed to load profile',
                                    style: TextStyle(color: Colors.redAccent),
                                  ),
                                )
                              : Column(
                                  children: [
                                    Stack(
                                      alignment: Alignment.bottomRight,
                                      children: [
                                        CircleAvatar(
                                          radius: 38,
                                          backgroundColor: Colors.white12,
                                          backgroundImage:
                                              (barber != null &&
                                                      barber!.imageUrl.isNotEmpty)
                                                  ? NetworkImage(barber!.imageUrl)
                                                  : const AssetImage(
                                                          "assets/images/blank.jpg")
                                                      as ImageProvider,
                                        ),
                                        GestureDetector(
                                          onTap: _toggleActiveStatus,
                                          child: Container(
                                            padding: const EdgeInsets.all(6),
                                            decoration: BoxDecoration(
                                              shape: BoxShape.circle,
                                              color: isActive
                                                  ? Colors.greenAccent
                                                  : Colors.redAccent,
                                              boxShadow: [
                                                BoxShadow(
                                                  color: isActive
                                                      ? Colors.greenAccent
                                                          .withOpacity(0.6)
                                                      : Colors.redAccent
                                                          .withOpacity(0.6),
                                                  blurRadius: 10,
                                                  spreadRadius: 2,
                                                ),
                                              ],
                                            ),
                                            child: const Icon(
                                              Icons.power_settings_new_rounded,
                                              color: Colors.white,
                                              size: 16,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 10),
                                    Text(
                                      barber?.name ?? "Barber",
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontWeight: FontWeight.bold,
                                        fontSize: 16,
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Row(
                                      mainAxisAlignment:
                                          MainAxisAlignment.center,
                                      children: [
                                        const Icon(
                                          Icons.star,
                                          color: Colors.amberAccent,
                                          size: 18,
                                        ),
                                        const SizedBox(width: 4),
                                        Text(
                                          (barber?.rating ?? 0.0)
                                              .toStringAsFixed(1),
                                          style: const TextStyle(
                                            color: Colors.white70,
                                            fontSize: 14,
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 8),
                                    Text(
                                      isActive ? "Online" : "Offline",
                                      style: TextStyle(
                                        color: isActive
                                            ? Colors.greenAccent
                                            : Colors.redAccent,
                                        fontWeight: FontWeight.bold,
                                        fontSize: 13,
                                      ),
                                    ),
                                  ],
                                ),
                    const SizedBox(height: 30),
                    _navItem(Icons.home_rounded, "Home", 0),
                    _navItem(Icons.calendar_month_rounded, "Appointments", 1),
                    _navItem(Icons.cut_rounded, "Services", 2),
                    _navItem(Icons.reviews_rounded, "Reviews", 3),
                    _navItem(Icons.person_outline_rounded, "Profile", 4),
                    const SizedBox(height: 20),
                    const Divider(color: Colors.white24, indent: 10, endIndent: 10),
                    const SizedBox(height: 15),
                    _isCollapsed
                        ? IconButton(
                            icon: const Icon(Icons.logout_rounded,
                                color: Colors.redAccent),
                            onPressed: _handleLogout,
                          )
                        : ElevatedButton.icon(
                            onPressed: _handleLogout,
                            icon: const Icon(Icons.logout_rounded, size: 20),
                            label: const Text("Logout"),
                            style: ElevatedButton.styleFrom(
                              foregroundColor: Colors.white,
                              backgroundColor:
                                  const Color(0xFF1E88E5).withOpacity(0.7),
                              shadowColor: Colors.cyanAccent.withOpacity(0.4),
                              elevation: 10,
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 20, vertical: 12),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(16),
                              ),
                            ),
                          ),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  Future<void> _handleLogout() async {
    await FirebaseAuth.instance.signOut();
    if (!mounted) return;
    Navigator.pushReplacement(
      context,
      MaterialPageRoute(builder: (_) => const LoginPage()),
    );
  }

  Widget _navItem(IconData icon, String label, int index) {
    final bool active = _selectedIndex == index;
    final bool hovered = _hoveredIndex == index;

    return MouseRegion(
      onEnter: (_) => setState(() => _hoveredIndex = index),
      onExit: (_) => setState(() => _hoveredIndex = -1),
      cursor: SystemMouseCursors.click,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 250),
        margin: const EdgeInsets.symmetric(vertical: 6, horizontal: 6),
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 10),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(14),
          gradient: active
              ? const LinearGradient(
                  colors: [Color(0xFF2196F3), Color(0xFF64B5F6)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                )
              : null,
          color: active
              ? null
              : hovered
                  ? Colors.white.withOpacity(0.05)
                  : Colors.transparent,
          boxShadow: [
            if (active || hovered)
              BoxShadow(
                color: Colors.lightBlueAccent.withOpacity(active ? 0.6 : 0.3),
                blurRadius: hovered ? 25 : 18,
                offset: const Offset(0, 6),
                spreadRadius: hovered ? 1.5 : 0.5,
              ),
          ],
        ),
        child: InkWell(
          onTap: () => setState(() => _selectedIndex = index),
          borderRadius: BorderRadius.circular(14),
          child: Row(
            children: [
              Icon(
                icon,
                color: active
                    ? Colors.white
                    : hovered
                        ? Colors.cyanAccent
                        : Colors.white70,
                size: 22,
              ),
              if (!_isCollapsed) ...[
                const SizedBox(width: 12),
                Text(
                  label,
                  style: TextStyle(
                    color: active
                        ? Colors.white
                        : hovered
                            ? Colors.cyanAccent
                            : Colors.white70,
                    fontWeight: active ? FontWeight.bold : FontWeight.w500,
                    fontSize: 15,
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

// ------------------------------------------------
// 🌌 HOME CONTENT + DASHBOARD WITH UPCOMING PREVIEW
// ------------------------------------------------
class HomeContent extends StatefulWidget {
  final VoidCallback onViewBookings;
  const HomeContent({super.key, required this.onViewBookings});

  @override
  State<HomeContent> createState() => _HomeContentState();
}

class _HomeContentState extends State<HomeContent> {
  int totalAppointments = 0;
  int completedAppointments = 0;
  int ongoingAppointments = 0; // accepted
  int upcomingAppointments = 0; // pending
  int totalReviews = 0;
  bool loading = true;
  List<Map<String, dynamic>> upcomingList = [];

  @override
  void initState() {
    super.initState();
    _loadDashboardData();
  }

  Future<void> _loadDashboardData() async {
    final uid = FirebaseAuth.instance.currentUser?.uid;
    if (uid == null) return;

    try {
      final bookingsSnapshot = await FirebaseFirestore.instance
          .collection('bookings')
          .where('barberId', isEqualTo: uid)
          .get();

      int total = bookingsSnapshot.size;
      int completed = 0;
      int upcoming = 0;
      int ongoing = 0;

      final List<Map<String, dynamic>> tempUpcoming = [];

      for (var doc in bookingsSnapshot.docs) {
        final data = doc.data();
        final status = (data['status'] ?? '').toString().toLowerCase();

        if (status == 'completed') completed++;
        else if (status == 'accepted') ongoing++;
        else if (status == 'pending') {
          upcoming++;
          tempUpcoming.add({
            'id': doc.id,
            'userId': data['userId'],
            'serviceId': data['serviceId'],
            'barberId': data['barberId'],
            'dateTime': (data['dateTime'] as Timestamp?)?.toDate(),
            'status': status,
          });
        }
      }

      // 🔹 Get total reviews
      final reviewsSnapshot = await FirebaseFirestore.instance
          .collection('reviews')
          .where('barberId', isEqualTo: uid)
          .get();

      if (mounted) {
        setState(() {
          totalAppointments = total;
          completedAppointments = completed;
          ongoingAppointments = ongoing;
          upcomingAppointments = upcoming;
          totalReviews = reviewsSnapshot.size;
          upcomingList = tempUpcoming.take(3).toList(); // limit preview
          loading = false;
        });
      }
    } catch (e) {
      debugPrint("Error loading dashboard data: $e");
      if (mounted) setState(() => loading = false);
    }
  }

  // 🔹 Fetch service name
  Future<String> _getServiceName(String barberId, String serviceId) async {
    try {
      final doc = await FirebaseFirestore.instance
          .collection('barbers')
          .doc(barberId)
          .collection('services')
          .doc(serviceId)
          .get();
      return doc.data()?['name'] ?? '-';
    } catch (_) {
      return '-';
    }
  }

  // 🔹 Fetch customer name
  Future<String> _getCustomerName(String userId) async {
    try {
      final doc =
          await FirebaseFirestore.instance.collection('users').doc(userId).get();
      return doc.data()?['name'] ?? 'Customer';
    } catch (_) {
      return 'Customer';
    }
  }

  // 🔹 Status color
  Color _statusColor(String status) {
    switch (status.toLowerCase()) {
      case 'accepted':
        return Colors.greenAccent;
      case 'pending':
        return Colors.orangeAccent;
      case 'completed':
        return Colors.amberAccent;
      case 'cancelled':
        return Colors.redAccent;
      default:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Center(
      child: loading
          ? const CircularProgressIndicator(color: Colors.cyanAccent)
          : SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 30, vertical: 60),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.cut_rounded,
                      color: Colors.lightBlueAccent, size: 70),
                  const SizedBox(height: 20),
                  const Text(
                    "Welcome to CutMyHair Barber Portal",
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 28,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 1,
                      shadows: [
                        Shadow(color: Colors.blueAccent, blurRadius: 20),
                      ],
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    "Manage your bookings, clients, and services efficiently.",
                    style: TextStyle(color: Colors.white70, fontSize: 16),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 50),

                  // 🌟 Full-width glass section
                  ClipRRect(
                    borderRadius: BorderRadius.circular(25),
                    child: BackdropFilter(
                      filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
                      child: Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(
                            horizontal: 30, vertical: 30),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.08),
                          borderRadius: BorderRadius.circular(25),
                          border: Border.all(color: Colors.white.withOpacity(0.15)),
                        ),
                        child: Column(
                          children: [
                            // 📊 Stat cards (one row)
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                _buildGlassCard("Total", "$totalAppointments",
                                    Icons.event_note_rounded),
                                _buildGlassCard("Completed",
                                    "$completedAppointments", Icons.check),
                                _buildGlassCard("Ongoing", "$ongoingAppointments",
                                    Icons.work_history),
                                _buildGlassCard(
                                    "Reviews",
                                    "$totalReviews",
                                    Icons.star_border_rounded),
                              ],
                            ),
                            const SizedBox(height: 40),

                            // 🟦 Upcoming preview section
                            Align(
                              alignment: Alignment.centerLeft,
                              child: Text(
                                "Upcoming Appointments (${upcomingAppointments})",
                                style: const TextStyle(
                                  color: Colors.cyanAccent,
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                            const SizedBox(height: 14),
                            ClipRRect(
                              borderRadius: BorderRadius.circular(18),
                              child: BackdropFilter(
                                filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                                child: Container(
                                  width: double.infinity,
                                  padding: const EdgeInsets.all(18),
                                  decoration: BoxDecoration(
                                    color: Colors.white.withOpacity(0.05),
                                    borderRadius: BorderRadius.circular(18),
                                    border: Border.all(
                                        color: Colors.white.withOpacity(0.15)),
                                  ),
                                  child: upcomingList.isEmpty
                                      ? const Text(
                                          "No upcoming appointments yet.",
                                          style: TextStyle(
                                              color: Colors.white70, fontSize: 14),
                                        )
                                      : Column(
                                          children: upcomingList
                                              .map((data) =>
                                                  _buildMiniAppointmentTile(data))
                                              .toList(),
                                        ),
                                ),
                              ),
                            ),
                            const SizedBox(height: 14),
                            TextButton.icon(
                              onPressed: widget.onViewBookings,
                              icon: const Icon(Icons.arrow_forward_ios_rounded,
                                  size: 16, color: Colors.cyanAccent),
                              label: const Text("View All",
                                  style: TextStyle(
                                      color: Colors.cyanAccent,
                                      fontWeight: FontWeight.bold)),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
    );
  }

  // 🔹 Stat card
  Widget _buildGlassCard(String title, String value, IconData icon) {
    return Expanded(
      child: Container(
        height: 130,
        margin: const EdgeInsets.symmetric(horizontal: 8),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.07),
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: Colors.white.withOpacity(0.2)),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: Colors.cyanAccent, size: 32),
            const SizedBox(height: 10),
            Text(
              value,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 24,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 4),
            Text(title,
                style: const TextStyle(color: Colors.white70, fontSize: 14)),
          ],
        ),
      ),
    );
  }

  // 🔹 Mini upcoming tile
  Widget _buildMiniAppointmentTile(Map<String, dynamic> data) {
    final date = data['dateTime'] as DateTime?;
    final formattedTime =
        date != null ? "${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}" : "-";

    return FutureBuilder(
      future: Future.wait([
        _getCustomerName(data['userId']),
        _getServiceName(data['barberId'], data['serviceId']),
      ]),
      builder: (context, snapshot) {
        if (!snapshot.hasData) return const SizedBox(height: 40);

        final customer = snapshot.data![0];
        final service = snapshot.data![1];

        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.05),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: Colors.white.withOpacity(0.2)),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(customer,
                      style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 15)),
                  const SizedBox(height: 3),
                  Text(service,
                      style:
                          const TextStyle(color: Colors.white70, fontSize: 13)),
                  Text(formattedTime,
                      style:
                          const TextStyle(color: Colors.cyanAccent, fontSize: 13)),
                ],
              ),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: _statusColor(data['status']).withOpacity(0.2),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: _statusColor(data['status']), width: 1),
                ),
                child: Text(
                  data['status'].toString().toUpperCase(),
                  style: TextStyle(
                    color: _statusColor(data['status']),
                    fontWeight: FontWeight.bold,
                    fontSize: 12,
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
