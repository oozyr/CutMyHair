import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

class AuthService {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  // 🔹 Signup (daftar akaun baru)
  Future<User?> signUpWithEmail(String email, String password) async {
    try {
      UserCredential result = await _auth.createUserWithEmailAndPassword(
        email: email,
        password: password,
      );
      return result.user;
    } on FirebaseAuthException catch (e) {
      print("Signup error: ${e.message}");
      rethrow;
    }
  }

  // 🔹 Login dengan semakan isVerified
  Future<User?> signInWithEmail(String email, String password) async {
    try {
      UserCredential result = await _auth.signInWithEmailAndPassword(
        email: email,
        password: password,
      );

      User? user = result.user;
      if (user == null) return null;

      // 🔹 Semak barber isVerified
      final barberDoc = await _firestore.collection('barbers').doc(user.uid).get();

      if (!barberDoc.exists) {
        await _auth.signOut();
        throw FirebaseAuthException(
            code: 'not-a-barber',
            message: 'Access denied. This account is not a barber.');
      }

      final bool isVerified = barberDoc.data()?['isVerified'] ?? false;
      if (!isVerified) {
        await _auth.signOut();
        throw FirebaseAuthException(
            code: 'not-verified',
            message: 'Your account is not verified yet.');
      }

      return user;
    } on FirebaseAuthException catch (e) {
      print("Login error: ${e.message}");
      rethrow;
    }
  }

  // 🔹 Logout
  Future<void> signOut() async {
    await _auth.signOut();
  }

  // 🔹 Semak user yang sedang login
  User? get currentUser => _auth.currentUser;
}
