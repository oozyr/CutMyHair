import 'package:cloud_firestore/cloud_firestore.dart';

class AppUser {
  final String id;
  final String name;
  final String email;
  final String? photo;
  final String? phone;

  AppUser({
    required this.id,
    required this.name,
    required this.email,
    this.photo,
    this.phone,
  });

  // ✅ Add this to safely clone and modify fields
  AppUser copyWith({
    String? id,
    String? name,
    String? email,
    String? photo,
    String? phone,
  }) {
    return AppUser(
      id: id ?? this.id,
      name: name ?? this.name,
      email: email ?? this.email,
      photo: photo ?? this.photo,
      phone: phone ?? this.phone,
    );
  }

  // ✅ Convert Firestore document to AppUser
  factory AppUser.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>? ?? {};
    return AppUser(
      id: data['id'] ?? doc.id,
      name: data['name'] ?? '',
      email: data['email'] ?? '',
      photo: data['photo'],
      phone: data['phone'],
    );
  }

  // ✅ Convert AppUser to Map (for Firestore writes)
  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'name': name,
      'email': email,
      'photo': photo,
      'phone': phone,
    };
  }
}
