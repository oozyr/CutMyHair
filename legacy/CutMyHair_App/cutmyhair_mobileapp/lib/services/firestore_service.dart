import 'dart:io';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_storage/firebase_storage.dart';
import '../models/app_user.dart';
import '../models/barber_model.dart';
import '../models/booking_model.dart';
import '../models/review_model.dart';
import '../models/service_model.dart';

class FirestoreService {
  final FirebaseFirestore _db = FirebaseFirestore.instance;

  /// --------------------------------------------------
  /// USERS
  /// --------------------------------------------------

  Future<void> createUser(AppUser user) async {
    await _db.collection('users').doc(user.id).set(user.toMap(), SetOptions(merge: true));
  }

  Future<AppUser?> getUserById(String userId) async {
    final doc = await _db.collection('users').doc(userId).get();
    if (doc.exists) return AppUser.fromFirestore(doc);
    return null;
  }

  Future<void> updateUser(String userId, Map<String, dynamic> data) async {
    await _db.collection('users').doc(userId).update(data);
  }

  Future<String?> uploadAndSaveProfilePhoto(String userId, File imageFile) async {
    try {
      final ref = FirebaseStorage.instance.ref().child('profileImages/$userId.jpg');
      await ref.putFile(imageFile);
      final url = await ref.getDownloadURL();
      await _db.collection('users').doc(userId).update({'photo': url});
      return url;
    } catch (e) {
      print('❌ Error uploading profile photo: $e');
      return null;
    }
  }

  /// --------------------------------------------------
  /// BARBERS
  /// --------------------------------------------------

  Future<List<Barber>> getAllActiveBarbers() async {
    final snap = await _db.collection('barbers').where('isActive', isEqualTo: true).get();
    return snap.docs.map((d) => Barber.fromFirestore(d)).toList();
  }

  Future<Barber?> getBarberById(String barberId) async {
    final doc = await _db.collection('barbers').doc(barberId).get();
    if (doc.exists) return Barber.fromFirestore(doc);
    return null;
  }

  Stream<List<Barber>> streamActiveBarbers() {
    return _db
        .collection('barbers')
        .where('isActive', isEqualTo: true)
        .snapshots()
        .map((snap) => snap.docs.map((d) => Barber.fromFirestore(d)).toList());
  }

  /// --------------------------------------------------
  /// SERVICES (Subcollection of each Barber)
  /// --------------------------------------------------

  Future<List<ServiceModel>> getServicesForBarber(String barberId) async {
    final snap = await _db.collection('barbers').doc(barberId).collection('services').get();
    return snap.docs.map((d) => ServiceModel.fromFirestore(d)).toList();
  }

  Stream<List<ServiceModel>> streamServices(String barberId) {
    return _db
        .collection('barbers')
        .doc(barberId)
        .collection('services')
        .snapshots()
        .map((snap) => snap.docs.map((d) => ServiceModel.fromFirestore(d)).toList());
  }

  Future<void> addService(String barberId, ServiceModel service) async {
    await _db
        .collection('barbers')
        .doc(barberId)
        .collection('services')
        .doc(service.id)
        .set(service.toMap());
  }

  Future<void> deleteService(String barberId, String serviceId) async {
    await _db.collection('barbers').doc(barberId).collection('services').doc(serviceId).delete();
  }

  /// --------------------------------------------------
  /// BOOKINGS
  /// --------------------------------------------------

  Future<void> createBooking(BookingModel booking) async {
    await _db.collection('bookings').doc(booking.id).set(booking.toMap());
  }

  Stream<List<BookingModel>> streamUserBookings(String userId) {
    return _db
        .collection('bookings')
        .where('userId', isEqualTo: userId)
        .orderBy('dateTime', descending: true)
        .snapshots()
        .map((snap) => snap.docs.map((d) => BookingModel.fromFirestore(d)).toList());
  }

  Stream<List<BookingModel>> streamBarberBookings(String barberId) {
    return _db
        .collection('bookings')
        .where('barberId', isEqualTo: barberId)
        .orderBy('dateTime', descending: true)
        .snapshots()
        .map((snap) => snap.docs.map((d) => BookingModel.fromFirestore(d)).toList());
  }

  Future<void> cancelBooking(String bookingId) async {
    await _db.collection('bookings').doc(bookingId).update({'status': 'cancelled'});
  }

  Future<void> completeBooking(String bookingId) async {
    await _db.collection('bookings').doc(bookingId).update({'status': 'completed'});
  }

  /// --------------------------------------------------
  /// REVIEWS
  /// --------------------------------------------------

  Future<void> addReview(ReviewModel review) async {
    await _db.collection('reviews').doc(review.id).set(review.toMap());
  }

  Future<void> deleteReview(String reviewId, String userId) async {
    final doc = await _db.collection('reviews').doc(reviewId).get();
    if (doc.exists && doc.data()?['userId'] == userId) {
      await _db.collection('reviews').doc(reviewId).delete();
    } else {
      throw Exception("You can only delete your own reviews.");
    }
  }

  Stream<List<ReviewModel>> streamBarberReviews(String barberId) {
    return _db
        .collection('reviews')
        .where('barberId', isEqualTo: barberId)
        .orderBy('createdAt', descending: true)
        .snapshots()
        .map((snap) => snap.docs.map((d) => ReviewModel.fromFirestore(d)).toList());
  }

  Future<List<ReviewModel>> getBarberReviews(String barberId) async {
    final snap = await _db
        .collection('reviews')
        .where('barberId', isEqualTo: barberId)
        .orderBy('createdAt', descending: true)
        .get();
    return snap.docs.map((d) => ReviewModel.fromFirestore(d)).toList();
  }

  /// --------------------------------------------------
  /// UTILITIES
  /// --------------------------------------------------

  Future<String> uploadImage(File file, String path) async {
    final ref = FirebaseStorage.instance.ref().child(path);
    await ref.putFile(file);
    return await ref.getDownloadURL();
  }

  Future<void> setDocument(String collection, String docId, Map<String, dynamic> data) async {
    await _db.collection(collection).doc(docId).set(data, SetOptions(merge: true));
  }

  Future<void> deleteDocument(String collection, String docId) async {
    await _db.collection(collection).doc(docId).delete();
  }

    /// --------------------------------------------------
  /// COMPATIBILITY HELPERS (for existing pages)
  /// --------------------------------------------------

  // Old alias for streamActiveBarbers
  Stream<List<Barber>> streamBarbers() => streamActiveBarbers();

  // Old alias for getUserById
  Future<AppUser?> getUser(String userId) => getUserById(userId);

  // Old alias for updateUser
  Future<void> updateUserProfile(String userId, Map<String, dynamic> data) =>
      updateUser(userId, data);


}
