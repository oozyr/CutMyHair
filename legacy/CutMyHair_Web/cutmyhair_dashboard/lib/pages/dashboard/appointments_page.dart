// ignore_for_file: unused_element

import 'dart:ui';
import 'package:intl/intl.dart';
import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cutmyhair_dashboard/models/booking_model.dart';

class AppointmentsPage extends StatefulWidget {
  const AppointmentsPage({super.key});

  @override
  State<AppointmentsPage> createState() => _AppointmentsPageState();
}

class _AppointmentsPageState extends State<AppointmentsPage> {
  Stream<QuerySnapshot>? _bookingStream;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _initBookingsStream();
  }

  Future<void> _initBookingsStream() async {
    User? user;
    while (user == null) {
      await Future.delayed(const Duration(milliseconds: 200));
      user = FirebaseAuth.instance.currentUser;
    }

    final query = FirebaseFirestore.instance
        .collection('bookings')
        .where('barberId', isEqualTo: user.uid)
        .orderBy('dateTime', descending: true);

    setState(() {
      _bookingStream = query.snapshots();
      _isLoading = false;
    });
  }

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

  Future<String> _getCustomerName(String userId) async {
    try {
      final doc = await FirebaseFirestore.instance
          .collection('users')
          .doc(userId)
          .get();
      return doc.data()?['name'] ?? 'Customer';
    } catch (_) {
      return 'Customer';
    }
  }

  Color _statusColor(String status) {
    switch (status.toLowerCase()) {
      case 'accepted':
      case 'confirmed':
        return Colors.greenAccent;
      case 'pending':
        return Colors.orangeAccent;
      case 'cancelled':
        return Colors.redAccent;
      case 'completed':
        return Colors.amberAccent;
      default:
        return Colors.grey;
    }
  }

  Future<void> _updateStatus(String bookingId, String status) async {
    await FirebaseFirestore.instance
        .collection('bookings')
        .doc(bookingId)
        .update({'status': status});
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text("Booking marked as $status."),
        backgroundColor: Colors.blueAccent,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  void _showDetailsModal(
    BookingModel booking,
    String customerName,
    String serviceName,
  ) {
    showDialog(
      context: context,
      barrierDismissible: true,
      builder: (BuildContext context) {
        // Local copy of status (don't modify BookingModel directly)
        String localStatus = booking.status;

        // When status is updated → update Firestore + refresh dialog instantly
        Future<void> updateStatus(String newStatus) async {
          await _updateStatus(booking.id, newStatus);
          setState(() {}); // refresh outer list
          localStatus = newStatus;
          Navigator.pop(context); // close and reopen for live update
          _showDetailsModal(
            BookingModel(
              id: booking.id,
              userId: booking.userId,
              barberId: booking.barberId,
              serviceId: booking.serviceId,
              dateTime: booking.dateTime,
              status: newStatus, // updated status
            ),
            customerName,
            serviceName,
          );
        }

        return StatefulBuilder(
          builder: (context, setStateDialog) {
            Color statusColor = _statusColor(localStatus);

            return BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
              child: AlertDialog(
                backgroundColor: Colors.black.withOpacity(0.8),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(20),
                ),
                title: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      "Booking Details",
                      style: TextStyle(
                        color: Colors.cyanAccent,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    IconButton(
                      icon: const Icon(
                        Icons.close_rounded,
                        color: Colors.white70,
                        size: 20,
                      ),
                      onPressed: () => Navigator.pop(context),
                    ),
                  ],
                ),
                content: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _detailRow("Customer", customerName),
                    _detailRow("Service", serviceName),
                    _detailRow("Date", booking.dateTime.toString()),
                    Row(
                      children: [
                        const Text(
                          "Status: ",
                          style: TextStyle(color: Colors.white70, fontSize: 14),
                        ),
                        Text(
                          localStatus.toUpperCase(),
                          style: TextStyle(
                            color: statusColor,
                            fontWeight: FontWeight.bold,
                            fontSize: 14,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 18),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.start,
                      children: [
                        ..._buildDialogButtons(localStatus, (newStatus) {
                          setStateDialog(() => localStatus = newStatus);
                          updateStatus(newStatus);
                        }),
                      ],
                    ),
                    const SizedBox(height: 20),
                    Center(
                      child: OutlinedButton.icon(
                        style: OutlinedButton.styleFrom(
                          foregroundColor: Colors.cyanAccent,
                          side: const BorderSide(color: Colors.cyanAccent),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                        ),
                        onPressed: () => Navigator.pop(context),
                        icon: const Icon(Icons.arrow_back_rounded, size: 18),
                        label: const Text(
                          "Back",
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            color: Colors.cyanAccent,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  /// 🔹 Builds the correct buttons dynamically (Accept / Reject / Complete)
  List<Widget> _buildDialogButtons(
    String status,
    void Function(String newStatus) onTap,
  ) {
    if (status.toLowerCase() == "pending" ||
        status.toLowerCase() == "confirmed") {
      return [
        _glassButton("Accept", Colors.greenAccent, () => onTap("accepted")),
        _glassButton("Reject", Colors.redAccent, () => onTap("cancelled")),
      ];
    } else if (status.toLowerCase() == "accepted") {
      return [
        _glassButton("Complete", Colors.amberAccent, () => onTap("completed")),
      ];
    } else {
      return [];
    }
  }

  Widget _detailRow(String label, String value) => Padding(
    padding: const EdgeInsets.only(bottom: 6),
    child: Text(
      "$label: $value",
      style: const TextStyle(color: Colors.white70, fontSize: 14),
    ),
  );

  Widget _glassButton(String text, Color color, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        margin: const EdgeInsets.only(right: 6),
        decoration: BoxDecoration(
          color: color.withOpacity(0.15),
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: color, width: 1.3),
          boxShadow: [
            BoxShadow(
              color: color.withOpacity(0.5),
              blurRadius: 8,
              spreadRadius: 1,
            ),
          ],
        ),
        child: Text(
          text,
          style: TextStyle(
            color: color,
            fontWeight: FontWeight.bold,
            fontSize: 13,
          ),
        ),
      ),
    );
  }

  Widget _actionButtons(BookingModel booking) {
    final status = booking.status.toLowerCase();
    return Row(
      children: [
        if (status == "pending" || status == "confirmed") ...[
          _glassButton(
            "Accept",
            Colors.greenAccent,
            () => _updateStatus(booking.id, "accepted"),
          ),
          _glassButton(
            "Reject",
            Colors.redAccent,
            () => _updateStatus(booking.id, "cancelled"),
          ),
        ],
        if (status == "accepted")
          _glassButton(
            "Complete",
            Colors.amberAccent,
            () => _updateStatus(booking.id, "completed"),
          ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(
        child: CircularProgressIndicator(color: Colors.cyanAccent),
      );
    }

    if (_bookingStream == null) {
      return const Center(
        child: Text(
          "No barber logged in",
          style: TextStyle(color: Colors.white70),
        ),
      );
    }

    final user = FirebaseAuth.instance.currentUser!;

    return Stack(
      children: [
        // 🌌 Background Gradient
        Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0xFF0A1428), Color(0xFF1C2541)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
        ),

        // 🪞 Batik Overlay
        Opacity(
          opacity: 0.15,
          child: Image.asset(
            "assets/images/batik1.jpg",
            fit: BoxFit.cover,
            width: double.infinity,
            height: double.infinity,
          ),
        ),

        // 📋 Main Content
        StreamBuilder<QuerySnapshot>(
          stream: _bookingStream,
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const Center(
                child: CircularProgressIndicator(color: Colors.cyanAccent),
              );
            }

            if (!snapshot.hasData || snapshot.data!.docs.isEmpty) {
              return const Center(
                child: Text(
                  "No appointments yet",
                  style: TextStyle(color: Colors.white70, fontSize: 18),
                ),
              );
            }

            final allBookings = snapshot.data!.docs
                .map((doc) => BookingModel.fromFirestore(doc))
                .toList();

            final upcoming = allBookings.where((b) {
              final s = b.status.toLowerCase();
              return s == "pending" || s == "accepted" || s == "confirmed";
            }).toList();

            final history = allBookings.where((b) {
              final s = b.status.toLowerCase();
              return s == "completed" || s == "cancelled";
            }).toList();

            return ListView(
              padding: const EdgeInsets.only(
                top: 70,
                left: 24,
                right: 24,
                bottom: 100,
              ),
              children: [
                // 🟦 Upcoming Appointments
                const Padding(
                  padding: EdgeInsets.only(bottom: 16),
                  child: Text(
                    "Upcomming Appointments",
                    style: TextStyle(
                      color: Colors.cyanAccent,
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      shadows: [
                        Shadow(color: Colors.blueAccent, blurRadius: 9),
                      ],
                    ),
                  ),
                ),
                ClipRRect(
                  borderRadius: BorderRadius.circular(25),
                  child: BackdropFilter(
                    filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
                    child: Container(
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.06),
                        borderRadius: BorderRadius.circular(25),
                        border: Border.all(color: Colors.white24),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.blueAccent.withOpacity(0.25),
                            blurRadius: 20,
                            offset: const Offset(0, 6),
                          ),
                        ],
                      ),
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        children: upcoming.isEmpty
                            ? [
                                const Padding(
                                  padding: EdgeInsets.all(12),
                                  child: Text(
                                    "No upcomming appointments yet.",
                                    style: TextStyle(color: Colors.white54),
                                  ),
                                ),
                              ]
                            : upcoming
                                  .map((b) => _buildBookingTile(user.uid, b))
                                  .toList(),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 30),

                // 🟪 Appointments History
                const Text(
                  "Appointments History",
                  style: TextStyle(
                    color: Colors.cyanAccent,
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    shadows: [Shadow(color: Colors.blueAccent, blurRadius: 9)],
                  ),
                ),
                const SizedBox(height: 16),
                ClipRRect(
                  borderRadius: BorderRadius.circular(25),
                  child: BackdropFilter(
                    filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
                    child: Container(
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.06),
                        borderRadius: BorderRadius.circular(25),
                        border: Border.all(color: Colors.white24),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.blueAccent.withOpacity(0.25),
                            blurRadius: 20,
                            offset: const Offset(0, 6),
                          ),
                        ],
                      ),
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        children: history.isEmpty
                            ? [
                                const Padding(
                                  padding: EdgeInsets.all(12),
                                  child: Text(
                                    "No appointment history yet.",
                                    style: TextStyle(color: Colors.white54),
                                  ),
                                ),
                              ]
                            : history
                                  .map((b) => _buildBookingTile(user.uid, b))
                                  .toList(),
                      ),
                    ),
                  ),
                ),
              ],
            );
          },
        ),

        // 🏷 Floating Page Title
        const Positioned(
          top: 20,
          left: 24,
          child: Text(
            "Appointments",
            style: TextStyle(
              color: Colors.white,
              fontSize: 26,
              fontWeight: FontWeight.bold,
              shadows: [Shadow(color: Colors.blueAccent, blurRadius: 18)],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildBookingTile(String barberId, BookingModel booking) {
    final dateTime = booking.dateTime;
    final formattedDate = DateFormat(
      'MMM d, yyyy • h:mm a',
    ).format(dateTime); // 👈 formatted date

    return FutureBuilder(
      future: Future.wait([
        _getServiceName(barberId, booking.serviceId),
        _getCustomerName(booking.userId),
      ]),
      builder: (context, snapshot) {
        if (!snapshot.hasData) return const SizedBox(height: 50);

        final serviceName = snapshot.data![0];
        final customerName = snapshot.data![1];

        return GestureDetector(
          onTap: () => _showDetailsModal(booking, customerName, serviceName),
          child: Container(
            margin: const EdgeInsets.only(bottom: 14),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(18),
              child: BackdropFilter(
                filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.05),
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(color: Colors.white24),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.blueAccent.withOpacity(0.2),
                        blurRadius: 15,
                        offset: const Offset(0, 6),
                      ),
                    ],
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            customerName,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            serviceName,
                            style: const TextStyle(
                              color: Colors.white70,
                              fontSize: 14,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            formattedDate, // 👈 full formatted date/time
                            style: const TextStyle(
                              color: Colors.cyanAccent,
                              fontSize: 13,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 14,
                          vertical: 6,
                        ),
                        decoration: BoxDecoration(
                          color: _statusColor(booking.status).withOpacity(0.2),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(
                            color: _statusColor(booking.status),
                            width: 1.2,
                          ),
                        ),
                        child: Text(
                          booking.status.toUpperCase(),
                          style: TextStyle(
                            color: _statusColor(booking.status),
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}
