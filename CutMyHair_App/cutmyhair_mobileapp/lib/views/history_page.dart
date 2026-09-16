import 'dart:ui';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cutmyhair1/models/barber_model.dart';
import 'package:cutmyhair1/models/booking_model.dart';
import 'package:cutmyhair1/models/service_model.dart';
import 'package:cutmyhair1/services/auth_service.dart';
import 'package:cutmyhair1/services/firestore_service.dart';
import 'package:cutmyhair1/theme/app_theme.dart';
import 'package:cutmyhair1/views/booking_detail_page.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

class HistoryPage extends StatefulWidget {
  const HistoryPage({super.key});

  @override
  State<HistoryPage> createState() => _HistoryPageState();
}

class _HistoryPageState extends State<HistoryPage> {
  String? _statusFilter = "All";
  String _sortBy = 'date_desc';
  bool _groupByBarber = false;

  Future<void> _openBookingDetail(
      BuildContext context, BookingModel booking) async {
    try {
      final barberSnap = await FirebaseFirestore.instance
          .collection('barbers')
          .doc(booking.barberId)
          .get();

      if (!barberSnap.exists) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("Barber not found.")),
        );
        return;
      }

      final barber = Barber.fromFirestore(barberSnap);

      DocumentSnapshot? serviceSnap = await FirebaseFirestore.instance
          .collection('services')
          .doc(booking.serviceId)
          .get();

      if (!serviceSnap.exists) {
        serviceSnap = await FirebaseFirestore.instance
            .collection('barbers')
            .doc(booking.barberId)
            .collection('services')
            .doc(booking.serviceId)
            .get();
      }

      final service = serviceSnap.exists
          ? ServiceModel.fromFirestore(serviceSnap)
          : ServiceModel(
              id: booking.serviceId,
              barberId: booking.barberId,
              name: "Service Unavailable",
              price: 0,
              durationMinutes: 0,
            );

      if (context.mounted) {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => BookingDetailPage(
              booking: booking,
              barber: barber,
              service: service,
            ),
          ),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text("Error opening booking: $e")),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthService>(context, listen: false);
    final db = Provider.of<FirestoreService>(context, listen: false);
    const blue = Color(0xFF007AFF);
    const lightBlue = Color(0xFFE7F3FF);

    return Scaffold(
      extendBodyBehindAppBar: true,
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text("Booking History"),
        centerTitle: true,
        backgroundColor: Colors.transparent,
        elevation: 0,
        foregroundColor: Colors.white,
        flexibleSpace: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [blue, Color(0xFF00C6FF)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
        ),
      ),
      body: SafeArea(
        child: Column(
          children: [
            _glassFilterBar(),
            Expanded(
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      Colors.white,
                      lightBlue,
                    ],
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                  ),
                ),
                child: StreamBuilder<List<BookingModel>>(
                  stream: db.streamUserBookings(auth.uid!),
                  builder: (context, snap) {
                    if (!snap.hasData) {
                      return const Center(child: CircularProgressIndicator());
                    }

                    var bookings = snap.data!;

                    // Filter
                    if (_statusFilter != null && _statusFilter != "All") {
                      bookings = bookings
                          .where((b) =>
                              b.status.toLowerCase() ==
                              _statusFilter!.toLowerCase())
                          .toList();
                    }

                    // Sort
                    switch (_sortBy) {
                      case 'date_asc':
                        bookings.sort((a, b) => a.dateTime.compareTo(b.dateTime));
                        break;
                      default:
                        bookings.sort((a, b) => b.dateTime.compareTo(a.dateTime));
                    }

                    if (bookings.isEmpty) {
                      return const Center(
                        child: Text(
                          "No bookings found.",
                          style:
                              TextStyle(color: Colors.black54, fontSize: 16),
                        ),
                      );
                    }

                    if (_groupByBarber) {
                      final grouped = <String, List<BookingModel>>{};
                      for (var b in bookings) {
                        grouped.putIfAbsent(b.barberId, () => []).add(b);
                      }

                      return ListView(
                        physics: const BouncingScrollPhysics(),
                        children: grouped.entries.map((entry) {
                          return _glassSection(
                            titleFuture: FirebaseFirestore.instance
                                .collection('barbers')
                                .doc(entry.key)
                                .get()
                                .then((snap) =>
                                    snap.data()?['name'] ?? 'Unknown Barber'),
                            children: entry.value.map(_buildBookingCard).toList(),
                          );
                        }).toList(),
                      );
                    }

                    return ListView.separated(
                      physics: const BouncingScrollPhysics(),
                      itemCount: bookings.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 10),
                      itemBuilder: (_, i) => _buildBookingCard(bookings[i]),
                    );
                  },
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // 🌫 Frosted glass filter bar
  Widget _glassFilterBar() {
    const blue = Color(0xFF007AFF);

    return ClipRRect(
      borderRadius: const BorderRadius.vertical(bottom: Radius.circular(26)),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 16, sigmaY: 16),
        child: Container(
          margin: const EdgeInsets.only(bottom: 10),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.3),
            border: Border.all(color: Colors.white.withOpacity(0.2)),
            boxShadow: [
              BoxShadow(
                color: Colors.blue.withOpacity(0.08),
                blurRadius: 10,
                offset: const Offset(0, 3),
              ),
            ],
          ),
          child: Row(
            children: [
              Expanded(
                child: DropdownButtonFormField<String>(
                  value: _statusFilter,
                  dropdownColor: Colors.white,
                  style: const TextStyle(color: Colors.black87),
                  decoration: _glassFieldDecoration("Status"),
                  items: const [
                    DropdownMenuItem(value: "All", child: Text("All")),
                    DropdownMenuItem(value: "Pending", child: Text("Pending")),
                    DropdownMenuItem(value: "Confirmed", child: Text("Confirmed")),
                    DropdownMenuItem(value: "Completed", child: Text("Completed")),
                    DropdownMenuItem(value: "Cancelled", child: Text("Cancelled")),
                  ],
                  onChanged: (v) => setState(() => _statusFilter = v),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: DropdownButtonFormField<String>(
                  value: _sortBy,
                  dropdownColor: Colors.white,
                  style: const TextStyle(color: Colors.black87),
                  decoration: _glassFieldDecoration("Sort"),
                  items: const [
                    DropdownMenuItem(value: "date_desc", child: Text("Newest")),
                    DropdownMenuItem(value: "date_asc", child: Text("Oldest")),
                  ],
                  onChanged: (v) => setState(() => _sortBy = v!),
                ),
              ),
              const SizedBox(width: 8),
              IconButton(
                icon: Icon(
                  _groupByBarber ? Icons.group : Icons.group_outlined,
                  color: _groupByBarber ? blue : Colors.black54,
                ),
                onPressed: () => setState(() => _groupByBarber = !_groupByBarber),
              ),
            ],
          ),
        ),
      ),
    );
  }

  InputDecoration _glassFieldDecoration(String label) {
    return InputDecoration(
      labelText: label,
      labelStyle: const TextStyle(color: Colors.black54, fontSize: 13),
      filled: true,
      fillColor: Colors.white.withOpacity(0.4),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      contentPadding:
          const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
    );
  }

  // 🌫 Frosted glass section for grouped layout
  Widget _glassSection({
    required Future<String> titleFuture,
    required List<Widget> children,
  }) {
    return FutureBuilder<String>(
      future: titleFuture,
      builder: (context, snap) {
        final title = snap.data ?? "Loading...";
        return ClipRRect(
          borderRadius: BorderRadius.circular(20),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
            child: Container(
              margin: const EdgeInsets.only(bottom: 14),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    Colors.white.withOpacity(0.6),
                    const Color(0xFFE7F3FF).withOpacity(0.7),
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: Colors.white.withOpacity(0.3)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 17,
                      color: Color(0xFF007AFF),
                    ),
                  ),
                  const SizedBox(height: 8),
                  ...children,
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  // 💈 Booking card with shadow and glass effect
  Widget _buildBookingCard(BookingModel b) {
    final formattedDate =
        DateFormat('EEE, d MMM yyyy • hh:mm a').format(b.dateTime);
    final statusColor = _statusColor(b.status);

    return FutureBuilder<DocumentSnapshot>(
      future: FirebaseFirestore.instance
          .collection('barbers')
          .doc(b.barberId)
          .get(),
      builder: (context, barberSnap) {
        String barberName = "Loading...";
        if (barberSnap.hasData && barberSnap.data!.exists) {
          final data = barberSnap.data!.data() as Map<String, dynamic>;
          barberName = data['name'] ?? 'Unknown Barber';
        }

        return GestureDetector(
          onTap: () => _openBookingDetail(context, b),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(18),
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 15, sigmaY: 15),
              child: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      Colors.white.withOpacity(0.6),
                      const Color(0xFFE7F3FF).withOpacity(0.6),
                    ],
                  ),
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: Colors.white.withOpacity(0.3)),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.05),
                      blurRadius: 10,
                      offset: const Offset(0, 3),
                    ),
                  ],
                ),
                child: ListTile(
                  leading:
                      const Icon(Icons.cut, color: Color(0xFF007AFF), size: 30),
                  title: Text(
                    barberName,
                    style: const TextStyle(
                      fontWeight: FontWeight.w600,
                      fontSize: 16,
                      color: Colors.black87,
                    ),
                  ),
                  subtitle: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        formattedDate,
                        style: const TextStyle(
                            fontSize: 13, color: Colors.black54),
                      ),
                      const SizedBox(height: 3),
                      Text(
                        "Status: ${b.status[0].toUpperCase()}${b.status.substring(1)}",
                        style: TextStyle(
                          color: statusColor,
                          fontWeight: FontWeight.w600,
                          fontSize: 13.5,
                        ),
                      ),
                    ],
                  ),
                  trailing: const Icon(Icons.arrow_forward_ios_rounded,
                      size: 18, color: Colors.black38),
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  Color _statusColor(String status) {
    switch (status.toLowerCase()) {
      case "completed":
        return Colors.blueAccent;
      case "confirmed":
        return Colors.green;
      case "cancelled":
        return Colors.redAccent;
      default:
        return Colors.orangeAccent;
    }
  }
}
