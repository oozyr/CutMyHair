import 'package:cloud_firestore/cloud_firestore.dart';

class Barber {
  final String id;
  final String name;
  final String email;
  final String phone;
  final String address;
  final int experience;
  final String barberType;
  final String description;
  final String priceRange;
  final double? latitude;
  final double? longitude;
  final String imageUrl;
  final List<String> gallery;
  final double rating;
  final int totalReviews;
  final bool isVerified;
  final bool isActive;
  final Timestamp? createdAt;
  final Timestamp? updatedAt;

  Barber({
    required this.id,
    required this.name,
    required this.email,
    required this.phone,
    required this.address,
    required this.experience,
    required this.barberType,
    required this.description,
    required this.priceRange,
    required this.latitude,
    required this.longitude,
    required this.imageUrl,
    required this.gallery,
    required this.rating,
    required this.totalReviews,
    required this.isVerified,
    required this.isActive,
    this.createdAt,
    this.updatedAt,
  });

  factory Barber.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>? ?? {};

    double _toDouble(dynamic value) {
      if (value == null) return 0.0;
      if (value is int) return value.toDouble();
      if (value is double) return value;
      if (value is String) return double.tryParse(value) ?? 0.0;
      return 0.0;
    }

    int _toInt(dynamic value) {
      if (value == null) return 0;
      if (value is int) return value;
      if (value is double) return value.toInt();
      if (value is String) return int.tryParse(value) ?? 0;
      return 0;
    }

    bool _toBool(dynamic value) {
      if (value == null) return false;
      if (value is bool) return value;
      if (value is String) return value.toLowerCase() == 'true';
      if (value is num) return value == 1;
      return false;
    }

    return Barber(
      id: data['id'] ?? doc.id,
      name: data['name'] ?? '',
      email: data['email'] ?? '',
      phone: data['phone'] ?? '',
      address: data['address'] ?? '',
      experience: _toInt(data['experience']),
      barberType: data['barberType'] ?? '',
      description: data['description'] ?? '',
      priceRange: data['priceRange'] ?? '',
      latitude: (data['latitude'] != null)
          ? (data['latitude'] as num).toDouble()
          : null,
      longitude: (data['longitude'] != null)
          ? (data['longitude'] as num).toDouble()
          : null,
      imageUrl: data['imageUrl'] ?? '',
      gallery:
          (data['gallery'] is List) ? List<String>.from(data['gallery']) : [],
      rating: _toDouble(data['rating']),
      totalReviews: _toInt(data['totalReviews']),
      isVerified: _toBool(data['isVerified']),
      isActive: _toBool(data['isActive']),
      createdAt: data['createdAt'],
      updatedAt: data['updatedAt'],
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'name': name,
      'email': email,
      'phone': phone,
      'address': address,
      'experience': experience,
      'barberType': barberType,
      'description': description,
      'priceRange': priceRange,
      'latitude': latitude,
      'longitude': longitude,
      'imageUrl': imageUrl,
      'gallery': gallery,
      'rating': rating,
      'totalReviews': totalReviews,
      'isVerified': isVerified,
      'isActive': isActive,
      'createdAt': createdAt,
      'updatedAt': updatedAt,
    };
  }
}
