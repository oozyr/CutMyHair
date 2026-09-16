import 'package:cloud_firestore/cloud_firestore.dart';

class BookingModel {
  final String id;
  final String userId;
  final String barberId;
  final String serviceId;
  final DateTime dateTime;
  final String status;

  BookingModel({
    required this.id,
    required this.userId,
    required this.barberId,
    required this.serviceId,
    required this.dateTime,
    required this.status,
  });

  factory BookingModel.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return BookingModel(
      id: data['id'] ?? doc.id,
      userId: data['userId'] ?? '',
      barberId: data['barberId'] ?? '',
      serviceId: data['serviceId'] ?? '',
      dateTime: (data['dateTime'] as Timestamp).toDate(),
      status: data['status'] ?? 'pending',
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'userId': userId,
      'barberId': barberId,
      'serviceId': serviceId,
      'dateTime': Timestamp.fromDate(dateTime),
      'status': status,
    };
  }
}
