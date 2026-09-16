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
import 'package:uuid/uuid.dart';

class BookingPage extends StatefulWidget {
  final Barber barber;
  final List<ServiceModel> services;
  final ServiceModel? selectedService;

  const BookingPage({
    super.key,
    required this.barber,
    required this.services,
    this.selectedService,
  });

  @override
  State<BookingPage> createState() => _BookingPageState();
}

class _BookingPageState extends State<BookingPage> {
  late final FirestoreService _firestoreService;
  ServiceModel? _selectedService;
  DateTime? _selectedDate;
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    _firestoreService = FirestoreService();
    _selectedService = widget.selectedService;
  }

  Future<bool> _isSlotAvailable(String barberId, DateTime dateTime) async {
    final snapshot = await FirebaseFirestore.instance
        .collection('bookings')
        .where('barberId', isEqualTo: barberId)
        .where('dateTime', isEqualTo: Timestamp.fromDate(dateTime))
        .where('status', isNotEqualTo: 'cancelled')
        .get();
    return snapshot.docs.isEmpty;
  }

  Future<void> _confirmBooking() async {
    final authService = Provider.of<AuthService>(context, listen: false);
    final user = authService.currentUser;

    if (user == null) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text("Please log in first."),
          backgroundColor: Colors.redAccent,
        ),
      );
      return;
    }

    if (_selectedService == null || _selectedDate == null) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Please select a service and time.")),
      );
      return;
    }

    setState(() => _loading = true);
    final available = await _isSlotAvailable(widget.barber.id, _selectedDate!);

    if (!available) {
      if (!mounted) return;
      setState(() => _loading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text("This slot is already booked."),
          backgroundColor: Colors.redAccent,
        ),
      );
      return;
    }

    final bookingId = const Uuid().v4();
    final booking = BookingModel(
      id: bookingId,
      userId: user.uid,
      barberId: widget.barber.id,
      serviceId: _selectedService!.id,
      dateTime: _selectedDate!,
      status: "pending",
    );

    try {
      await _firestoreService.createBooking(booking);
      if (!mounted) return;

      setState(() => _loading = false);
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (_) => BookingDetailPage(
            booking: booking,
            barber: widget.barber,
            service: _selectedService!,
          ),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      setState(() => _loading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text("Failed to create booking: $e"),
          backgroundColor: Colors.redAccent,
        ),
      );
    }
  }

  Future<void> _pickDateTime() async {
    final now = DateTime.now();
    final date = await showDatePicker(
      context: context,
      initialDate: now,
      firstDate: now,
      lastDate: now.add(const Duration(days: 30)),
    );
    if (date != null) {
      final time = await showTimePicker(
        context: context,
        initialTime: TimeOfDay.now(),
      );
      if (time != null) {
        setState(() {
          _selectedDate = DateTime(
            date.year,
            date.month,
            date.day,
            time.hour,
            time.minute,
          );
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final formattedDate = _selectedDate != null
        ? DateFormat('EEE, d MMM yyyy • hh:mm a').format(_selectedDate!)
        : "Pick Date & Time";

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text("Book Appointment"),
        centerTitle: true,
        elevation: 0,
        backgroundColor: Colors.white,
        foregroundColor: Colors.black87,
      ),
      body: Stack(
        children: [
          ListView(
            padding: const EdgeInsets.all(20),
            children: [
              // Barber card
              Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(18),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.05),
                      blurRadius: 8,
                      offset: const Offset(0, 3),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    ClipRRect(
                      borderRadius:
                          const BorderRadius.horizontal(left: Radius.circular(18)),
                      child: Image.network(
                        widget.barber.imageUrl,
                        height: 100,
                        width: 100,
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
                            Text(widget.barber.name,
                                style: const TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.bold)),
                            const SizedBox(height: 4),
                            Row(
                              children: [
                                const Icon(Icons.star_rounded,
                                    color: Colors.amber, size: 18),
                                const SizedBox(width: 4),
                                Text(widget.barber.rating.toStringAsFixed(1),
                                    style: const TextStyle(
                                        fontWeight: FontWeight.w500)),
                                const SizedBox(width: 4),
                                const Text("Rating",
                                    style: TextStyle(
                                        fontSize: 12, color: Colors.black54)),
                              ],
                            ),
                            const SizedBox(height: 6),
                            Text(
                              widget.barber.description,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                  color: Colors.black54, fontSize: 13),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Services
              const Text("Select a Service",
                  style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 18,
                      color: Colors.black87)),
              const SizedBox(height: 12),
              Wrap(
                spacing: 12,
                runSpacing: 12,
                children: widget.services.map((s) {
                  final selected = _selectedService?.id == s.id;
                  return GestureDetector(
                    onTap: () => setState(() => _selectedService = s),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      padding: const EdgeInsets.all(14),
                      width: (MediaQuery.of(context).size.width / 2) - 28,
                      decoration: BoxDecoration(
                        color: selected
                            ? AppTheme.primary.withValues(alpha: 0.1)
                            : Colors.white,
                        border: Border.all(
                            color: selected
                                ? AppTheme.primary
                                : Colors.grey.shade300),
                        borderRadius: BorderRadius.circular(14),
                        boxShadow: [
                          if (selected)
                            BoxShadow(
                              color: AppTheme.primary.withValues(alpha: 0.2),
                              blurRadius: 10,
                              offset: const Offset(0, 3),
                            ),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(s.name,
                              style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 15,
                                  color: selected
                                      ? AppTheme.primary
                                      : Colors.black87)),
                          const SizedBox(height: 6),
                          Text("RM${s.price.toStringAsFixed(2)}",
                              style: const TextStyle(
                                  fontWeight: FontWeight.w600,
                                  color: Colors.black87)),
                          const SizedBox(height: 4),
                          Text("${s.durationMinutes} mins",
                              style: const TextStyle(
                                  fontSize: 13, color: Colors.black54)),
                        ],
                      ),
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(height: 30),

              // Date/Time picker
              const Text("Select Date & Time",
                  style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 18,
                      color: Colors.black87)),
              const SizedBox(height: 12),
              GestureDetector(
                onTap: _pickDateTime,
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(
                      horizontal: 16, vertical: 18),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: AppTheme.primary),
                    gradient: LinearGradient(
                      colors: [Colors.white, Colors.grey.shade100],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(formattedDate,
                          style: TextStyle(
                              color: _selectedDate == null
                                  ? Colors.black54
                                  : Colors.black87,
                              fontSize: 15)),
                      const Icon(Icons.calendar_today_rounded,
                          color: AppTheme.primary),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 40),
            ],
          ),

          if (_loading)
            Container(
              color: Colors.black.withValues(alpha: 0.2),
              child: const Center(
                child: CircularProgressIndicator(color: AppTheme.primary),
              ),
            ),
        ],
      ),
      bottomNavigationBar: SafeArea(
        child: Container(
          padding: const EdgeInsets.all(16),
          child: ElevatedButton(
            onPressed: _loading ? null : _confirmBooking,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.primary,
              minimumSize: const Size(double.infinity, 56),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14)),
              elevation: 6,
              shadowColor: AppTheme.primary.withValues(alpha: 0.4),
            ),
            child: const Text(
              "Confirm Booking",
              style: TextStyle(
                  fontSize: 17, fontWeight: FontWeight.bold, color: Colors.white),
            ),
          ),
        ),
      ),
    );
  }
}
