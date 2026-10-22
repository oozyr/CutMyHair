import 'dart:io';
import 'dart:ui';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cutmyhair1/models/barber_model.dart';
import 'package:cutmyhair1/models/service_model.dart';
import 'package:cutmyhair1/services/auth_service.dart';
import 'package:cutmyhair1/services/firestore_service.dart';
import 'package:cutmyhair1/theme/app_theme.dart';
import 'package:cutmyhair1/views/booking_page.dart';
import 'package:cutmyhair1/widgets/loading_widget.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

class BarberDetailPage extends StatefulWidget {
  final String barberId;
  final String? bookingId;
  const BarberDetailPage({required this.barberId, this.bookingId, super.key});

  @override
  State<BarberDetailPage> createState() => _BarberDetailPageState();
}

class _BarberDetailPageState extends State<BarberDetailPage>
    with SingleTickerProviderStateMixin {
  Barber? _barber;
  List<ServiceModel> _services = [];
  List<Map<String, dynamic>> _reviews = [];
  List<Map<String, dynamic>> _photos = [];

  bool _loading = true;
  bool _canReview = false;
  double _avgRating = 0;
  Map<int, int> _ratingCounts = {};

  final TextEditingController _reviewCtrl = TextEditingController();
  double _rating = 0;
  List<File> _selectedImages = [];

  late TabController _tab;

  @override
  void initState() {
    super.initState();
    _tab = TabController(length: 3, vsync: this)
      ..addListener(() => setState(() {}));

    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (widget.bookingId != null) {
        _tab.index = 1;
      }
    });

    _loadData();
  }

  Future<void> _loadData() async {
    final db = Provider.of<FirestoreService>(context, listen: false);
    final auth = Provider.of<AuthService>(context, listen: false);
    final user = auth.currentUser;

    _barber = await db.getBarberById(widget.barberId);
    _services = await db.getServicesForBarber(widget.barberId);

    final reviewSnap = await FirebaseFirestore.instance
        .collection('reviews')
        .where('barberId', isEqualTo: widget.barberId)
        .orderBy('createdAt', descending: true)
        .get();
    _reviews = reviewSnap.docs.map((e) => e.data()).toList();

    // Calculate average rating
    if (_reviews.isNotEmpty) {
      double total = 0;
      _ratingCounts = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0};
      for (var r in _reviews) {
        final rate = (r['rating'] ?? 0).toInt();
        total += rate;
        _ratingCounts[rate] = (_ratingCounts[rate] ?? 0) + 1;
      }
      _avgRating = total / _reviews.length;
      await FirebaseFirestore.instance
          .collection('barbers')
          .doc(widget.barberId)
          .update({'rating': double.parse(_avgRating.toStringAsFixed(1))});
    }

    final photosSnap = await FirebaseFirestore.instance
        .collection('barbers')
        .doc(widget.barberId)
        .collection('gallery')
        .get();
    _photos = photosSnap.docs.map((e) => e.data()).toList();

    if (user != null) {
      final bookings = await FirebaseFirestore.instance
          .collection('bookings')
          .where('userId', isEqualTo: user.uid)
          .where('barberId', isEqualTo: widget.barberId)
          .where('status', isEqualTo: 'completed')
          .get();

      final reviewedBookingIds = _reviews.map((r) => r['bookingId']).toSet();
      _canReview = bookings.docs.any((b) => !reviewedBookingIds.contains(b.id));

      if (widget.bookingId != null) {
        final reviewedBooking = _reviews.any(
          (r) => r['bookingId'] == widget.bookingId,
        );
        _canReview = !reviewedBooking;
      }
    }

    if (mounted) setState(() => _loading = false);
  }

  Future<void> _pickImages(Function(void Function()) setModalState) async {
    final picker = ImagePicker();
    final picked = await picker.pickMultiImage();
    if (picked.isEmpty) return;

    setModalState(() {
      final newImages = picked.map((e) => File(e.path)).toList();
      _selectedImages = [..._selectedImages, ...newImages].take(3).toList();
    });

    if (_selectedImages.length == 3) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text("You can upload up to 3 photos only."),
          backgroundColor: Colors.orangeAccent,
        ),
      );
    }
  }

  Future<void> _submitReview() async {
    final auth = Provider.of<AuthService>(context, listen: false);
    final user = auth.currentUser;
    if (user == null || _rating == 0 || _reviewCtrl.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text("Please give a rating and write a comment."),
        ),
      );
      return;
    }

    // Find a completed booking (not yet reviewed)
    final bookingSnap = await FirebaseFirestore.instance
        .collection('bookings')
        .where('userId', isEqualTo: user.uid)
        .where('barberId', isEqualTo: widget.barberId)
        .where('status', isEqualTo: 'completed')
        .limit(1)
        .get();

    if (bookingSnap.docs.isEmpty) {
      _showNeedBookingDialog();
      return;
    }

    final bookingId = bookingSnap.docs.first.id;
    final reviewId = FirebaseFirestore.instance.collection('reviews').doc().id;

    // Upload selected images (optional)
    List<String> urls = [];
    for (var f in _selectedImages) {
      final ref = FirebaseStorage.instance.ref(
        'reviewImages/$reviewId/${f.path.split('/').last}',
      );
      await ref.putFile(f);
      urls.add(await ref.getDownloadURL());
    }

    final review = {
      'id': reviewId,
      'barberId': widget.barberId,
      'userId': user.uid,
      'bookingId': bookingId,
      'userName': user.displayName ?? "User",
      'userPhoto': user.photoURL,
      'rating': _rating,
      'comment': _reviewCtrl.text.trim(),
      'imageUrls': urls,
      'createdAt': FieldValue.serverTimestamp(),
    };

    await FirebaseFirestore.instance
        .collection('reviews')
        .doc(reviewId)
        .set(review);

    await _loadData();
    _reviewCtrl.clear();
    _selectedImages.clear();
    _rating = 0;

    if (mounted) {
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text("Review added successfully!"),
          backgroundColor: Colors.green,
        ),
      );
    }
  }

  void _showNeedBookingDialog() {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        title: const Text("Booking Required"),
        content: const Text(
          "You need to complete a booking with this barber before leaving a review.",
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text("OK", style: TextStyle(color: AppTheme.primary)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const LoadingWidget();

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(title: Text(_barber?.name ?? ''), centerTitle: true),
      body: Column(
        children: [
          if (_barber?.imageUrl != null)
            Stack(
              children: [
                Image.network(
                  _barber!.imageUrl,
                  width: double.infinity,
                  height: 220,
                  fit: BoxFit.cover,
                ),
                Positioned(
                  bottom: 10,
                  left: 16,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.black54,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      children: [
                        const Icon(
                          Icons.star_rounded,
                          color: Colors.amber,
                          size: 18,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          _avgRating.toStringAsFixed(1),
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Text(
                          " (${_reviews.length})",
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
          const SizedBox(height: 8),
          Text(
            _barber?.name ?? '',
            style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 4),
          Text(
            _barber?.description ?? '',
            style: AppTheme.label,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          TabBar(
            controller: _tab,
            labelColor: AppTheme.primary,
            unselectedLabelColor: Colors.black54,
            tabs: const [
              Tab(text: 'Services'),
              Tab(text: 'Reviews'),
              Tab(text: 'Photos'),
            ],
          ),
          Expanded(
            child: TabBarView(
              controller: _tab,
              children: [_servicesTab(), _reviewsTab(), _photosTab()],
            ),
          ),
        ],
      ),
      floatingActionButton: _buildFab(),
    );
  }

  Widget _buildRatingSummary() {
    if (_reviews.isEmpty) return const SizedBox.shrink();
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 8),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            "Ratings & Reviews",
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Text(
                _avgRating.toStringAsFixed(1),
                style: const TextStyle(
                  fontSize: 42,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(width: 8),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: List.generate(
                      5,
                      (i) => Icon(
                        Icons.star_rounded,
                        color: i < _avgRating.round()
                            ? Colors.amber
                            : Colors.grey[300],
                      ),
                    ),
                  ),
                  Text(
                    "${_reviews.length} Reviews",
                    style: const TextStyle(fontSize: 12, color: Colors.black54),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 8),
          ...List.generate(5, (i) {
            final star = 5 - i;
            final count = _ratingCounts[star] ?? 0;
            final percent = _reviews.isNotEmpty ? count / _reviews.length : 0;
            return Padding(
              padding: const EdgeInsets.symmetric(vertical: 2),
              child: Row(
                children: [
                  Text(
                    "$star",
                    style: const TextStyle(fontSize: 12, color: Colors.black),
                  ),
                  const Icon(Icons.star_rounded, color: Colors.amber, size: 14),
                  const SizedBox(width: 6),
                  Expanded(
                    child: LinearProgressIndicator(
                      value: percent.toDouble(),
                      minHeight: 6,
                      color: AppTheme.primary,
                      backgroundColor: Colors.grey[200],
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    "${(percent * 100).toStringAsFixed(0)}%",
                    style: const TextStyle(fontSize: 12, color: Colors.black54),
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }

  Widget? _buildFab() {
    final index = _tab.index;
    if (index == 0) {
      return FloatingActionButton.extended(
        backgroundColor: AppTheme.primary,
        onPressed: () => Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => BookingPage(barber: _barber!, services: _services),
          ),
        ),
        icon: const Icon(Icons.calendar_today_rounded),
        label: const Text("Book Now"),
      );
    } else if (index == 1) {
      return FloatingActionButton.extended(
        backgroundColor: AppTheme.primary,
        onPressed: _canReview
            ? () => showModalBottomSheet(
                context: context,
                isScrollControlled: true,
                shape: const RoundedRectangleBorder(
                  borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
                ),
                builder: (_) => StatefulBuilder(
                  builder: (context, setModalState) => Padding(
                    padding: EdgeInsets.only(
                      bottom: MediaQuery.of(context).viewInsets.bottom + 16,
                      left: 16,
                      right: 16,
                      top: 16,
                    ),
                    child: _addReviewBox(setModalState),
                  ),
                ),
              )
            : _showNeedBookingDialog,
        icon: const Icon(Icons.rate_review_rounded),
        label: const Text("Add Review"),
      );
    }
    return null;
  }

  Widget _servicesTab() => _services.isEmpty
      ? const Center(child: Text("No services yet"))
      : ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: _services.length,
          itemBuilder: (_, i) {
            final s = _services[i];
            return Card(
              margin: const EdgeInsets.only(bottom: 12),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
              child: ListTile(
                title: Text(s.name, style: AppTheme.subtitle),
                subtitle: Text(
                  '${s.durationMinutes} mins',
                  style: AppTheme.label,
                ),
                trailing: Text(
                  'RM ${s.price.toStringAsFixed(2)}',
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    color: AppTheme.primary,
                  ),
                ),
                onTap: () => Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => BookingPage(
                      barber: _barber!,
                      services: _services,
                      selectedService: s,
                    ),
                  ),
                ),
              ),
            );
          },
        );

  Widget _reviewsTab() {
    if (_reviews.isEmpty) {
      return const Center(
        child: Text(
          "No reviews yet",
          style: TextStyle(fontSize: 16, color: Colors.black54),
        ),
      );
    }
    return ListView(
      children: [
        _buildRatingSummary(),
        ..._reviews.map((r) => _reviewCard(r)).toList(),
        const SizedBox(height: 40),
      ],
    );
  }

  Widget _reviewCard(Map<String, dynamic> r) {
    final name = r['userName'] ?? "User";
    final rating = (r['rating'] ?? 0).toDouble();
    final comment = r['comment'] ?? '';
    final ts = r['createdAt'];
    final date = ts is Timestamp
        ? DateFormat('d MMM yyyy').format(ts.toDate())
        : '';
    final imgs = (r['imageUrls'] ?? []) as List<dynamic>;
    final photo = r['userPhoto'];
    final initials = name.isNotEmpty ? name[0].toUpperCase() : '?';
    final reviewId = r['id'];
    final userId = r['userId'];

    final auth = Provider.of<AuthService>(context, listen: false);
    final currentUser = auth.currentUser;

    Future<void> _deleteReview() async {
      final confirm = await showDialog<bool>(
        context: context,
        builder: (_) => AlertDialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          title: const Text("Delete Review"),
          content: const Text("Are you sure you want to delete this review?"),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text("Cancel"),
            ),
            TextButton(
              onPressed: () => Navigator.pop(context, true),
              child: const Text(
                "Delete",
                style: TextStyle(color: Colors.redAccent),
              ),
            ),
          ],
        ),
      );

      if (confirm != true) return;

      try {
        await FirebaseFirestore.instance
            .collection('reviews')
            .doc(reviewId)
            .delete();

        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text("Review deleted successfully."),
            backgroundColor: Colors.green,
          ),
        );

        await _loadData(); // refresh list
      } catch (e) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text("Failed to delete review: $e"),
            backgroundColor: Colors.redAccent,
          ),
        );
      }
    }

    return GestureDetector(
      onLongPress: () async {
        if (currentUser != null && currentUser.uid == userId) {
          await _deleteReview();
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text("You can only delete your own reviews."),
              backgroundColor: Colors.orangeAccent,
            ),
          );
        }
      },
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(18),
          boxShadow: [
            BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 8),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                CircleAvatar(
                  radius: 22,
                  backgroundColor: Colors.grey[200],
                  backgroundImage: photo != null ? NetworkImage(photo) : null,
                  child: photo == null
                      ? Text(
                          initials,
                          style: const TextStyle(
                            color: AppTheme.primary,
                            fontWeight: FontWeight.bold,
                          ),
                        )
                      : null,
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        name,
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ),
                      if (date.isNotEmpty)
                        Text(
                          date,
                          style: const TextStyle(
                            fontSize: 12,
                            color: Colors.black54,
                          ),
                        ),
                    ],
                  ),
                ),
                Row(
                  children: List.generate(
                    5,
                    (i) => Icon(
                      Icons.star_rounded,
                      color: i < rating ? Colors.amber : Colors.grey[300],
                      size: 18,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Text(
              comment,
              style: const TextStyle(
                fontSize: 15,
                color: Colors.black87,
                height: 1.4,
              ),
            ),
            if (imgs.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: imgs
                      .map(
                        (url) => ClipRRect(
                          borderRadius: BorderRadius.circular(12),
                          child: Image.network(
                            url,
                            width: 90,
                            height: 90,
                            fit: BoxFit.cover,
                          ),
                        ),
                      )
                      .toList(),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _addReviewBox(Function(void Function()) setModalState) {
    return ClipRRect(
      borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 300),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.9),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.15),
                blurRadius: 12,
                offset: const Offset(0, -2),
              ),
            ],
          ),
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  "Write a Review",
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 18,
                    color: AppTheme.textPrimary,
                  ),
                ),
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: List.generate(
                    5,
                    (i) => GestureDetector(
                      onTap: () {
                        HapticFeedback.lightImpact();
                        setModalState(() => _rating = (i + 1).toDouble());
                      },
                      child: AnimatedScale(
                        scale: i < _rating ? 1.2 : 1.0,
                        duration: const Duration(milliseconds: 150),
                        child: Icon(
                          i < _rating
                              ? Icons.star_rounded
                              : Icons.star_border_rounded,
                          color: Colors.amber,
                          size: 36,
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 14),
                TextField(
                  controller: _reviewCtrl,
                  maxLines: 3,
                  decoration: InputDecoration(
                    hintText: "Share your experience...",
                    filled: true,
                    fillColor: Colors.grey[100],
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                    contentPadding: const EdgeInsets.all(12),
                  ),
                ),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    ..._selectedImages.map(
                      (file) => Stack(
                        alignment: Alignment.topRight,
                        children: [
                          ClipRRect(
                            borderRadius: BorderRadius.circular(12),
                            child: Image.file(
                              file,
                              width: 80,
                              height: 80,
                              fit: BoxFit.cover,
                            ),
                          ),
                          GestureDetector(
                            onTap: () => setModalState(
                              () => _selectedImages.remove(file),
                            ),
                            child: Container(
                              decoration: const BoxDecoration(
                                color: Colors.black54,
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(
                                Icons.close,
                                size: 16,
                                color: Colors.white,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    if (_selectedImages.length < 3)
                      GestureDetector(
                        onTap: () => _pickImages(setModalState),
                        child: Container(
                          width: 80,
                          height: 80,
                          decoration: BoxDecoration(
                            color: Colors.grey[100],
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: Colors.grey.shade400),
                          ),
                          child: const Icon(
                            Icons.add_a_photo_rounded,
                            color: Colors.grey,
                          ),
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 18),
                Align(
                  alignment: Alignment.centerRight,
                  child: ElevatedButton.icon(
                    onPressed: _submitReview,
                    icon: const Icon(Icons.send_rounded, size: 18),
                    label: const Text("Submit"),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primary,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 20,
                        vertical: 12,
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _photosTab() {
    if (_photos.isEmpty) {
      return const Center(
        child: Text("No photos yet", style: TextStyle(color: Colors.black54)),
      );
    }

    return GridView.builder(
      padding: const EdgeInsets.all(16),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisSpacing: 14,
        crossAxisSpacing: 14,
        childAspectRatio: 0.95,
      ),
      itemCount: _photos.length,
      itemBuilder: (_, i) {
        final p = _photos[i];
        final imageUrl = p['imageUrl'] ?? '';
        final caption = (p['caption'] ?? '').trim();
        return GestureDetector(
          onTap: () {
            Navigator.push(
              context,
              PageRouteBuilder(
                opaque: false,
                barrierColor: Colors.black.withOpacity(0.9),
                pageBuilder: (context, _, __) => Scaffold(
                  backgroundColor: Colors.black,
                  body: Stack(
                    children: [
                      Center(
                        child: Hero(
                          tag: imageUrl,
                          child: InteractiveViewer(
                            minScale: 1,
                            maxScale: 3,
                            child: Image.network(
                              imageUrl,
                              fit: BoxFit.contain,
                              width: double.infinity,
                              height: double.infinity,
                            ),
                          ),
                        ),
                      ),
                      Positioned(
                        top: MediaQuery.of(context).padding.top + 10,
                        left: 10,
                        child: IconButton(
                          icon: const Icon(
                            Icons.arrow_back_ios_new_rounded,
                            color: Colors.white,
                          ),
                          onPressed: () => Navigator.pop(context),
                        ),
                      ),
                      if (caption.isNotEmpty)
                        Positioned(
                          bottom: 30,
                          left: 20,
                          right: 20,
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 8,
                            ),
                            decoration: BoxDecoration(
                              color: Colors.black.withOpacity(0.4),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Text(
                              caption,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 15,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
                transitionsBuilder: (_, anim, __, child) => FadeTransition(
                  opacity: CurvedAnimation(
                    parent: anim,
                    curve: Curves.easeInOutCubic,
                  ),
                  child: child,
                ),
              ),
            );
          },
          child: Hero(
            tag: imageUrl,
            child: ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: Image.network(
                imageUrl,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => Container(
                  color: Colors.grey[300],
                  child: const Icon(
                    Icons.image_not_supported_rounded,
                    color: Colors.grey,
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
