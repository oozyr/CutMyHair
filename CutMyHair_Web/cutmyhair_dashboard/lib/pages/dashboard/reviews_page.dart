// ignore_for_file: unused_element

import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '/models/review_model.dart';

class ReviewsPage extends StatelessWidget {
  const ReviewsPage({super.key});

  Color _ratingColor(double rating) {
    if (rating >= 4.0) return Colors.greenAccent;
    if (rating >= 3.0) return Colors.orangeAccent;
    return Colors.redAccent;
  }

  Widget _buildStars(double rating) {
    const starSize = 18.0;
    List<Widget> stars = [];
    for (int i = 1; i <= 5; i++) {
      if (i <= rating.floor()) {
        stars.add(const Icon(Icons.star, color: Colors.amberAccent, size: starSize));
      } else if (i - rating < 1) {
        stars.add(const Icon(Icons.star_half, color: Colors.amberAccent, size: starSize));
      } else {
        stars.add(const Icon(Icons.star_border, color: Colors.white38, size: starSize));
      }
    }
    return Row(children: stars);
  }

  void _showImageDialog(BuildContext context, String imageUrl) {
    showDialog(
      context: context,
      builder: (_) => Dialog(
        backgroundColor: Colors.transparent,
        child: GestureDetector(
          onTap: () => Navigator.pop(context),
          child: InteractiveViewer(
            clipBehavior: Clip.none,
            panEnabled: true,
            minScale: 0.8,
            maxScale: 4,
            child: ClipRRect(
              borderRadius: BorderRadius.circular(20),
              child: Image.network(imageUrl, fit: BoxFit.contain),
            ),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) {
      return const Center(
        child: Text(
          "Please log in first.",
          style: TextStyle(color: Colors.white70),
        ),
      );
    }

    return Stack(
      children: [
        // 🌌 Background gradient + overlay
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

        // 📋 Reviews Stream
        StreamBuilder<QuerySnapshot>(
          stream: FirebaseFirestore.instance
              .collection("reviews")
              .where("barberId", isEqualTo: user.uid)
              .orderBy("createdAt", descending: true)
              .snapshots(),
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const Center(
                child: CircularProgressIndicator(color: Colors.cyanAccent),
              );
            }

            if (!snapshot.hasData || snapshot.data!.docs.isEmpty) {
              return const Center(
                child: Text(
                  "No reviews yet",
                  style: TextStyle(color: Colors.white70, fontSize: 18),
                ),
              );
            }

            final reviews = snapshot.data!.docs
                .map((doc) => ReviewModel.fromFirestore(doc))
                .toList();

            // 🔹 Calculate average rating
            double avgRating = 0;
            for (var r in reviews) {
              avgRating += r.rating;
            }
            avgRating = avgRating / reviews.length;

            return ListView(
              padding:
                  const EdgeInsets.only(top: 70, left: 24, right: 24, bottom: 100),
              children: [
                // 🏷 Header
                const Padding(
                  padding: EdgeInsets.only(bottom: 20),
                  child: Text(
                    "Customer Reviews",
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

                // 🧊 Group Background for Reviews
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
                      padding: const EdgeInsets.all(18),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // ⭐ Summary header
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Row(
                                children: [
                                  const Icon(Icons.star_rounded,
                                      color: Colors.amberAccent, size: 30),
                                  const SizedBox(width: 6),
                                  Text(
                                    avgRating.toStringAsFixed(1),
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 24,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ],
                              ),
                              Text(
                                "${reviews.length} reviews",
                                style: const TextStyle(
                                  color: Colors.white70,
                                  fontSize: 14,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 20),

                          // 🔹 Review Cards
                          ...reviews.map((review) {
                            final dateTime = review.createdAt.toDate();
                            final formattedDate =
                                "${dateTime.day.toString().padLeft(2, '0')}-${dateTime.month.toString().padLeft(2, '0')}-${dateTime.year}";
                            final List<String> imageUrls = (review.imageUrls ?? []);

                            return Container(
                              margin: const EdgeInsets.only(bottom: 16),
                              child: ClipRRect(
                                borderRadius: BorderRadius.circular(20),
                                child: BackdropFilter(
                                  filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                                  child: Container(
                                    padding: const EdgeInsets.all(16),
                                    decoration: BoxDecoration(
                                      color: Colors.white.withOpacity(0.05),
                                      borderRadius: BorderRadius.circular(20),
                                      border: Border.all(color: Colors.white24),
                                      boxShadow: [
                                        BoxShadow(
                                          color: Colors.blueAccent.withOpacity(0.2),
                                          blurRadius: 15,
                                          offset: const Offset(0, 6),
                                        ),
                                      ],
                                    ),
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Row(
                                          mainAxisAlignment:
                                              MainAxisAlignment.spaceBetween,
                                          children: [
                                            Expanded(
                                              child: Text(
                                                review.userName,
                                                style: const TextStyle(
                                                  color: Colors.white,
                                                  fontSize: 16,
                                                  fontWeight: FontWeight.bold,
                                                ),
                                              ),
                                            ),
                                            _buildStars(review.rating),
                                          ],
                                        ),
                                        const SizedBox(height: 8),
                                        Text(
                                          review.comment,
                                          style: const TextStyle(
                                            color: Colors.white70,
                                            fontSize: 14,
                                          ),
                                        ),

                                        // 🖼️ Image attachments (if any)
                                        if (imageUrls.isNotEmpty) ...[
                                          const SizedBox(height: 10),
                                          SizedBox(
                                            height: 80,
                                            child: ListView.separated(
                                              scrollDirection: Axis.horizontal,
                                              itemCount: imageUrls.length,
                                              separatorBuilder: (_, __) =>
                                                  const SizedBox(width: 10),
                                              itemBuilder: (context, i) {
                                                final img = imageUrls[i];
                                                return GestureDetector(
                                                  onTap: () => _showImageDialog(context, img),
                                                  child: ClipRRect(
                                                    borderRadius:
                                                        BorderRadius.circular(12),
                                                    child: Container(
                                                      width: 80,
                                                      height: 80,
                                                      decoration: BoxDecoration(
                                                        color: Colors.white12,
                                                        border: Border.all(
                                                            color: Colors.white24),
                                                      ),
                                                      child: Image.network(
                                                        img,
                                                        fit: BoxFit.cover,
                                                        errorBuilder: (context, _, __) =>
                                                            const Icon(Icons.image_not_supported,
                                                                color: Colors.white38),
                                                      ),
                                                    ),
                                                  ),
                                                );
                                              },
                                            ),
                                          ),
                                        ],

                                        const SizedBox(height: 6),
                                        Text(
                                          formattedDate,
                                          style: const TextStyle(
                                            color: Colors.white38,
                                            fontSize: 12,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ),
                            );
                          }).toList(),
                        ],
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
            "Reviews",
            style: TextStyle(
              color: Colors.white,
              fontSize: 26,
              fontWeight: FontWeight.bold,
              shadows: [
                Shadow(color: Colors.blueAccent, blurRadius: 18),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
