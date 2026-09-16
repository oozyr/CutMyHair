import 'package:cloud_firestore/cloud_firestore.dart';

class ReviewModel {
  final String id;
  final String barberId;
  final String userId;
  final String userName;
  final double rating;
  final String comment;
  final Timestamp createdAt;

  ReviewModel({
    required this.id,
    required this.barberId,
    required this.userId,
    required this.userName,
    required this.rating,
    required this.comment,
    required this.createdAt,
  });

  /// ✅ Create ReviewModel from Firestore DocumentSnapshot
  factory ReviewModel.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return ReviewModel(
      id: doc.id,
      barberId: data['barberId'] ?? '',
      userId: data['userId'] ?? '',
      userName: data['userName'] ?? 'User',
      rating: (data['rating'] ?? 0).toDouble(),
      comment: data['comment'] ?? '',
      createdAt: data['createdAt'] ?? Timestamp.now(),
    );
  }

  /// ✅ Create ReviewModel from plain Map
  factory ReviewModel.fromMap(Map<String, dynamic> data) {
    return ReviewModel(
      id: data['id'] ?? '',
      barberId: data['barberId'] ?? '',
      userId: data['userId'] ?? '',
      userName: data['userName'] ?? 'User',
      rating: (data['rating'] ?? 0).toDouble(),
      comment: data['comment'] ?? '',
      createdAt: data['createdAt'] ?? Timestamp.now(),
    );
  }

  /// ✅ Convert ReviewModel to Map for Firestore
  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'barberId': barberId,
      'userId': userId,
      'userName': userName,
      'rating': rating,
      'comment': comment,
      'createdAt': createdAt,
    };
  }
}
