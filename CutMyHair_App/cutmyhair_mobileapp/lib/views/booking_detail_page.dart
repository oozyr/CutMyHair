import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cutmyhair1/models/barber_model.dart';
import 'package:cutmyhair1/models/booking_model.dart';
import 'package:cutmyhair1/models/service_model.dart';
import 'package:cutmyhair1/theme/app_theme.dart';
import 'package:cutmyhair1/views/barber_detail_page.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';

class BookingDetailPage extends StatefulWidget {
  final BookingModel booking;
  final Barber barber;
  final ServiceModel service;

  const BookingDetailPage({
    super.key,
    required this.booking,
    required this.barber,
    required this.service,
  });

  @override
  State<BookingDetailPage> createState() => _BookingDetailPageState();
}

class _BookingDetailPageState extends State<BookingDetailPage> {
  Map<String, dynamic>? bookingData;
  bool hasReview = false;
  bool loadingReview = true;

  @override
  void initState() {
    super.initState();
    _listenToBooking();
    _checkIfReviewed();
  }

  void _listenToBooking() {
    FirebaseFirestore.instance
        .collection('bookings')
        .doc(widget.booking.id)
        .snapshots()
        .listen((snap) {
          if (snap.exists) {
            setState(() => bookingData = snap.data());
          }
        });
  }

  Future<void> _checkIfReviewed() async {
    final reviewSnap = await FirebaseFirestore.instance
        .collection('reviews')
        .where('bookingId', isEqualTo: widget.booking.id)
        .limit(1)
        .get();

    setState(() {
      hasReview = reviewSnap.docs.isNotEmpty;
      loadingReview = false;
    });
  }

  Color _statusColor(String status) {
    switch (status) {
      case "confirmed":
        return Colors.green;
      case "completed":
        return Colors.blueAccent;
      case "cancelled":
        return Colors.redAccent;
      default:
        return Colors.orangeAccent;
    }
  }

  Future<void> _cancelBooking() async {
    await FirebaseFirestore.instance
        .collection('bookings')
        .doc(widget.booking.id)
        .update({'status': 'cancelled'});
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text("Booking cancelled."),
        backgroundColor: Colors.redAccent,
      ),
    );
    Navigator.pop(context);
  }

  void _openReviewPage() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => BarberDetailPage(
          barberId: widget.barber.id,
          bookingId: widget.booking.id,
        ),
      ),
    ).then((_) => _checkIfReviewed());
  }

  @override
  Widget build(BuildContext context) {
    final booking = bookingData ?? widget.booking.toMap();
    final status = (booking['status'] ?? "pending").toString().toLowerCase();
    final dateTime = (booking['dateTime'] is Timestamp)
        ? (booking['dateTime'] as Timestamp).toDate()
        : widget.booking.dateTime;

    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: const Text("Booking Details"),
        backgroundColor: Colors.white,
        elevation: 0,
        foregroundColor: Colors.black87,
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          // 🧔 Barber Info Card
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(18),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 8,
                  offset: const Offset(0, 3),
                ),
              ],
            ),
            child: Row(
              children: [
                ClipRRect(
                  borderRadius: const BorderRadius.horizontal(
                    left: Radius.circular(18),
                  ),
                  child: Image.network(
                    widget.barber.imageUrl,
                    width: 100,
                    height: 100,
                    fit: BoxFit.cover,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          widget.barber.name,
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            const Icon(
                              Icons.star_rounded,
                              color: Colors.amber,
                              size: 18,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              widget.barber.rating.toStringAsFixed(1),
                              style: const TextStyle(
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            const SizedBox(width: 6),
                            const Text(
                              "Rating",
                              style: TextStyle(
                                fontSize: 12,
                                color: Colors.black54,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Text(
                          widget.barber.phone,
                          style: const TextStyle(
                            color: Colors.black54,
                            fontSize: 13,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                IconButton(
                  onPressed: () async {
                    final phone = widget.barber.phone.replaceAll(' ', '');
                    final uri = Uri.parse("tel:$phone");
                    if (await canLaunchUrl(uri)) {
                      await launchUrl(uri);
                    }
                  },
                  icon: const Icon(
                    Icons.call_rounded,
                    color: AppTheme.primary,
                    size: 28,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // 📅 Booking Summary
          Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(18),
              gradient: const LinearGradient(
                colors: [Color(0xFF007AFF), Color(0xFF00C6FF)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.1),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  "Booking Summary",
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 14),
                _infoRow("Service", widget.service.name),
                _infoRow(
                  "Date",
                  DateFormat('EEE, d MMM yyyy').format(dateTime),
                ),
                _infoRow("Time", DateFormat('hh:mm a').format(dateTime)),
                _infoRow(
                  "Price",
                  "RM${widget.service.price.toStringAsFixed(2)}",
                ),
                const Divider(color: Colors.white54, height: 26),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      "Status",
                      style: TextStyle(color: Colors.white70, fontSize: 15),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: _statusColor(status).withOpacity(0.2),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(
                          color: _statusColor(status).withOpacity(0.3),
                        ),
                      ),
                      child: Text(
                        status.toUpperCase(),
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 30),

          // 🗑 Cancel Booking (if pending)
          if (status == "pending")
            ElevatedButton.icon(
              onPressed: _cancelBooking,
              icon: const Icon(Icons.cancel_rounded, color: Colors.white),
              label: const Text("Cancel Booking"),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.redAccent,
                minimumSize: const Size(double.infinity, 50),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
            ),

          // 💬 Review Button (if completed)
          if (status == "completed")
            Padding(
              padding: const EdgeInsets.only(top: 12),
              child: ElevatedButton.icon(
                onPressed: hasReview
                    ? null
                    : _openReviewPage, // disabled if already reviewed
                icon: Icon(
                  hasReview ? Icons.check_circle : Icons.rate_review_rounded,
                  color: Colors.white,
                ),
                label: Text(
                  hasReview ? "Review Submitted" : "Leave a Review",
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: hasReview ? Colors.grey : AppTheme.primary,
                  minimumSize: const Size(double.infinity, 50),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _infoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: const TextStyle(
              color: Colors.white70,
              fontSize: 15,
              fontWeight: FontWeight.w500,
            ),
          ),
          Text(
            value,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 15,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }
}
