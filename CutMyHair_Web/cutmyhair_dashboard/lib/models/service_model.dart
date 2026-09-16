import 'package:cloud_firestore/cloud_firestore.dart';

class ServiceModel {
  final String id;
  final String barberId;
  final String name;
  final double price;
  final int durationMinutes;

  ServiceModel({
    required this.id,
    required this.barberId,
    required this.name,
    required this.price,
    required this.durationMinutes,
  });

  factory ServiceModel.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return ServiceModel(
      id: data['id'] ?? doc.id,
      barberId: data['barberId'] ?? '',
      name: data['name'] ?? '',
      price: (data['price'] ?? 0).toDouble(),
      durationMinutes: (data['durationMinutes'] ?? 0).toInt(),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'barberId': barberId,
      'name': name,
      'price': price,
      'durationMinutes': durationMinutes,
    };
  }
}
