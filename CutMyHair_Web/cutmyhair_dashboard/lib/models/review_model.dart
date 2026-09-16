import 'package:cloud_firestore/cloud_firestore.dart';

class ReviewModel {
  final String id;
  final String barberId;
  final String userId;
  final String userName;
  final String comment;
  final double rating;
  final Timestamp createdAt;
  final List<String>? imageUrls;

  ReviewModel({
    required this.id,
    required this.barberId,
    required this.userId,
    required this.userName,
    required this.comment,
    required this.rating,
    required this.createdAt,
    this.imageUrls,
  });

  factory ReviewModel.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>? ?? {};

    return ReviewModel(
      id: doc.id,
      barberId: data['barberId'] ?? '',
      userId: data['userId'] ?? '',
      userName: data['userName'] ?? 'Unknown User',
      comment: data['comment'] ?? '',
      rating: (data['rating'] ?? 0).toDouble(),
      createdAt: data['createdAt'] ?? Timestamp.now(),
      imageUrls: (data['imageUrls'] as List?)
          ?.map((e) => e.toString())
          .toList(),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'barberId': barberId,
      'userId': userId,
      'userName': userName,
      'comment': comment,
      'rating': rating,
      'createdAt': createdAt,
      if (imageUrls != null && imageUrls!.isNotEmpty) 'imageUrls': imageUrls,
    };
  }
}
