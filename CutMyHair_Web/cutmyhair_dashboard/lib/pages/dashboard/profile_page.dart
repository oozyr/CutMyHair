import 'dart:ui';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import '../profile/edit_profile_page.dart';

class ProfilePage extends StatefulWidget {
  const ProfilePage({super.key});

  @override
  State<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends State<ProfilePage> {
  final uid = FirebaseAuth.instance.currentUser?.uid;
  double _averageRating = 0;
  int _reviewCount = 0;

  @override
  void initState() {
    super.initState();
    _fetchReviews();
  }

  Future<void> _fetchReviews() async {
    if (uid == null) return;

    try {
      final snapshot = await FirebaseFirestore.instance
          .collection('reviews')
          .where('barberId', isEqualTo: uid)
          .get();

      if (snapshot.docs.isEmpty) {
        setState(() {
          _averageRating = 0;
          _reviewCount = 0;
        });
        return;
      }

      double total = 0;
      for (var doc in snapshot.docs) {
        final rating = (doc.data()['rating'] ?? 0).toDouble();
        total += rating;
      }

      setState(() {
        _reviewCount = snapshot.docs.length;
        _averageRating = total / _reviewCount;
      });
    } catch (e) {
      debugPrint("Error fetching reviews: $e");
    }
  }

  @override
  Widget build(BuildContext context) {
    if (uid == null) {
      return const Center(child: Text("Please log in first."));
    }

    return Stack(
      children: [
        // 🌌 Background Gradient + Overlay
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

        // 🌟 Main Content
        StreamBuilder<DocumentSnapshot>(
          stream: FirebaseFirestore.instance
              .collection('barbers')
              .doc(uid)
              .snapshots(),
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const Center(
                child: CircularProgressIndicator(color: Colors.cyanAccent),
              );
            }

            if (!snapshot.hasData || !snapshot.data!.exists) {
              return const Center(
                child: Text(
                  "No profile data.",
                  style: TextStyle(color: Colors.white70),
                ),
              );
            }

            final barberData =
                snapshot.data!.data() as Map<String, dynamic>? ?? {};

            return SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 70),
              child: Center(
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(25),
                  child: BackdropFilter(
                    filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
                    child: Container(
                      width: 600,
                      padding: const EdgeInsets.all(28),
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
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          // 🧑‍🎤 Profile Image
                          CircleAvatar(
                            radius: 60,
                            backgroundColor: Colors.cyanAccent.withOpacity(0.2),
                            child: ClipOval(
                              child: (barberData['imageUrl'] != null &&
                                      barberData['imageUrl']
                                          .toString()
                                          .isNotEmpty)
                                  ? CachedNetworkImage(
                                      imageUrl: barberData['imageUrl'],
                                      width: 120,
                                      height: 120,
                                      fit: BoxFit.cover,
                                      placeholder: (_, __) => const Center(
                                        child: CircularProgressIndicator(
                                          color: Colors.cyanAccent,
                                        ),
                                      ),
                                      errorWidget: (_, __, ___) => Image.asset(
                                        "assets/images/blank.jpg",
                                        fit: BoxFit.cover,
                                      ),
                                    )
                                  : Image.asset(
                                      "assets/images/blank.jpg",
                                      fit: BoxFit.cover,
                                    ),
                            ),
                          ),
                          const SizedBox(height: 20),

                          // 🏷 Name and Type
                          Text(
                            barberData['name'] ?? "Unnamed Barber",
                            style: const TextStyle(
                              color: Colors.cyanAccent,
                              fontSize: 24,
                              fontWeight: FontWeight.bold,
                              shadows: [
                                Shadow(
                                  color: Colors.blueAccent,
                                  blurRadius: 12,
                                ),
                              ],
                            ),
                          ),
                          Text(
                            barberData['barberType'] ?? "",
                            style: const TextStyle(
                              color: Colors.white70,
                              fontSize: 16,
                            ),
                          ),
                          const SizedBox(height: 16),

                          // ⭐ Rating and Review Count
                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(
                                Icons.star,
                                color: Colors.amberAccent,
                                size: 22,
                              ),
                              const SizedBox(width: 5),
                              Text(
                                _averageRating.toStringAsFixed(1),
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              Text(
                                "  ($_reviewCount review${_reviewCount == 1 ? '' : 's'})",
                                style: const TextStyle(
                                  color: Colors.white70,
                                  fontSize: 14,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 25),

                          // 📩 Info Tiles
                          infoTile(Icons.email, barberData['email'] ?? "-"),
                          infoTile(Icons.phone, barberData['phone'] ?? "-"),
                          infoTile(
                            Icons.location_on,
                            barberData['address'] ?? "-",
                          ),
                          const SizedBox(height: 20),

                          // ✂️ Description
                          Align(
                            alignment: Alignment.centerLeft,
                            child: Text(
                              "Description:",
                              style: TextStyle(
                                color: Colors.cyanAccent.withOpacity(0.9),
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                          const SizedBox(height: 8),
                          Align(
                            alignment: Alignment.centerLeft,
                            child: Text(
                              barberData['description'] ?? "-",
                              textAlign: TextAlign.left,
                              style: const TextStyle(
                                color: Colors.white70,
                                fontSize: 15,
                                height: 1.4,
                              ),
                            ),
                          ),
                          const SizedBox(height: 25),

                          // 🖼️ Gallery Section
                          Align(
                            alignment: Alignment.centerLeft,
                            child: Text(
                              "Gallery",
                              style: TextStyle(
                                color: Colors.cyanAccent.withOpacity(0.9),
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                          const SizedBox(height: 10),

                          StreamBuilder<QuerySnapshot>(
                            stream: FirebaseFirestore.instance
                                .collection('barbers')
                                .doc(uid)
                                .collection('gallery')
                                .orderBy('uploadedAt', descending: true)
                                .snapshots(),
                            builder: (context, snap) {
                              if (snap.connectionState ==
                                  ConnectionState.waiting) {
                                return const Center(
                                  child: CircularProgressIndicator(
                                    color: Colors.cyanAccent,
                                  ),
                                );
                              }

                              if (snap.hasError) {
                                return const Text(
                                  "Error loading images.",
                                  style: TextStyle(color: Colors.white70),
                                );
                              }

                              if (!snap.hasData || snap.data!.docs.isEmpty) {
                                return const Text(
                                  "No images available.",
                                  style: TextStyle(color: Colors.white70),
                                );
                              }

                              final images = snap.data!.docs
                                  .map((doc) =>
                                      (doc.data() as Map<String, dynamic>)['imageUrl'] ??
                                      '')
                                  .where((url) => url.toString().isNotEmpty)
                                  .toList();

                              return SizedBox(
                                height: 110,
                                child: ListView.separated(
                                  scrollDirection: Axis.horizontal,
                                  itemCount: images.length,
                                  separatorBuilder: (_, __) =>
                                      const SizedBox(width: 10),
                                  itemBuilder: (context, index) {
                                    final img = images[index];
                                    return GestureDetector(
                                      onTap: () {
                                        showDialog(
                                          context: context,
                                          builder: (_) => Dialog(
                                            backgroundColor: Colors.transparent,
                                            child: InteractiveViewer(
                                              panEnabled: true,
                                              minScale: 0.8,
                                              maxScale: 4,
                                              child: ClipRRect(
                                                borderRadius:
                                                    BorderRadius.circular(20),
                                                child: Image.network(
                                                  img,
                                                  fit: BoxFit.contain,
                                                ),
                                              ),
                                            ),
                                          ),
                                        );
                                      },
                                      child: ClipRRect(
                                        borderRadius: BorderRadius.circular(12),
                                        child: CachedNetworkImage(
                                          imageUrl: img,
                                          width: 100,
                                          height: 100,
                                          fit: BoxFit.cover,
                                          placeholder: (_, __) => const Center(
                                            child: CircularProgressIndicator(
                                              color: Colors.cyanAccent,
                                            ),
                                          ),
                                          errorWidget: (_, __, ___) =>
                                              Image.asset(
                                            "assets/images/blank.jpg",
                                            fit: BoxFit.cover,
                                          ),
                                        ),
                                      ),
                                    );
                                  },
                                ),
                              );
                            },
                          ),
                          const SizedBox(height: 30),

                          // ✏️ Edit Profile Button
                          ElevatedButton.icon(
                            icon: const Icon(Icons.edit, color: Colors.black),
                            label: const Text(
                              "Edit Profile",
                              style: TextStyle(
                                color: Colors.black,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            onPressed: () async {
                              await Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (context) =>
                                      EditProfilePage(data: barberData),
                                ),
                              );
                            },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.cyanAccent,
                              minimumSize: const Size(double.infinity, 50),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
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
        ),

        // 🏷 Floating Title
        const Positioned(
          top: 20,
          left: 24,
          child: Text(
            "My Profile",
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

  Widget infoTile(IconData icon, String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        children: [
          Icon(icon, color: Colors.cyanAccent, size: 20),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(color: Colors.white, fontSize: 15),
            ),
          ),
        ],
      ),
    );
  }
}
