import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'login_page.dart';

class SignUpPage extends StatefulWidget {
  const SignUpPage({super.key});

  @override
  State<SignUpPage> createState() => _SignUpPageState();
}

class _SignUpPageState extends State<SignUpPage>
    with SingleTickerProviderStateMixin {
  final TextEditingController fullNameController = TextEditingController();
  final TextEditingController experienceController = TextEditingController();
  final TextEditingController phoneController = TextEditingController();
  final TextEditingController addressController = TextEditingController();
  final TextEditingController emailController = TextEditingController();
  final TextEditingController passwordController = TextEditingController();

  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  late AnimationController _controller;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    );

    _fadeAnimation = CurvedAnimation(parent: _controller, curve: Curves.easeIn);
    _slideAnimation = Tween<Offset>(
      begin: const Offset(0, 0.25),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeOutCubic));

    _controller.forward();
  }

  Future<void> _signUp() async {
    if (fullNameController.text.isEmpty ||
        experienceController.text.isEmpty ||
        phoneController.text.isEmpty ||
        addressController.text.isEmpty ||
        emailController.text.isEmpty ||
        passwordController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text("Please fill in all the fields."),
          backgroundColor: Colors.redAccent,
        ),
      );
      return;
    }

    try {
      UserCredential userCredential =
          await _auth.createUserWithEmailAndPassword(
        email: emailController.text.trim(),
        password: passwordController.text.trim(),
      );

      final user = userCredential.user!;
      final uid = user.uid;

      await _firestore.collection('barbers').doc(uid).set({
        'id': uid,
        'name': fullNameController.text.trim(),
        'email': emailController.text.trim(),
        'phone': phoneController.text.trim(),
        'address': addressController.text.trim(),
        'experience': int.tryParse(experienceController.text.trim()) ?? 0,
        'latitude': null,
        'longitude': null,
        'imageUrl': '',
        'gallery': <String>[],
        'description': '',
        'barberType': 'Freelancer',
        'priceRange': '',
        'rating': 0.0,
        'totalReviews': 0,
        'isVerified': false,
        'isActive': true,
        'createdAt': FieldValue.serverTimestamp(),
        'updatedAt': FieldValue.serverTimestamp(),
      });

      final servicesRef =
          _firestore.collection('barbers').doc(uid).collection('services');
      await servicesRef.doc('default').set({
        'id': 'default',
        'barberId': uid,
        'name': 'Basic Haircut',
        'price': 20.0,
        'durationMinutes': 30,
      });

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text("Registration successful! Please log in."),
          backgroundColor: Colors.green,
          duration: Duration(seconds: 2),
        ),
      );

      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (context) => const LoginPage()),
      );
    } on FirebaseAuthException catch (e) {
      String message = "Registration error.";

      if (e.code == 'weak-password') {
        message = "The password is too weak.";
      } else if (e.code == 'email-already-in-use') {
        message = "This email is already in use.";
      } else if (e.code == 'invalid-email') {
        message = "Invalid email format.";
      }

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(message), backgroundColor: Colors.redAccent),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text("Unexpected error: $e"),
          backgroundColor: Colors.redAccent,
        ),
      );
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        fit: StackFit.expand,
        children: [
          // Batik background
          Image.asset("assets/images/batik1.jpg", fit: BoxFit.cover),

          // Navy gradient overlay
          Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  const Color(0xFF0A1B3D).withOpacity(0.9),
                  const Color(0xFF162A5E).withOpacity(0.8),
                  const Color(0xFF0A1B3D).withOpacity(0.85),
                ],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
            ),
          ),

          FadeTransition(
            opacity: _fadeAnimation,
            child: SlideTransition(
              position: _slideAnimation,
              child: Center(
                child: SingleChildScrollView(
                  child: Column(
                    children: [
                      const SizedBox(height: 30),
                      const Text(
                        "Register New Barber",
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: 32,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF00BFFF),
                          shadows: [
                            Shadow(
                              blurRadius: 10,
                              color: Colors.black45,
                              offset: Offset(2, 2),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 35),

                      // Glassmorphic card
                      ClipRRect(
                        borderRadius: BorderRadius.circular(25),
                        child: BackdropFilter(
                          filter: ImageFilter.blur(sigmaX: 18, sigmaY: 18),
                          child: Container(
                            width: 380,
                            padding: const EdgeInsets.symmetric(
                                vertical: 35, horizontal: 30),
                            decoration: BoxDecoration(
                              color: Colors.blueGrey.withOpacity(0.15),
                              borderRadius: BorderRadius.circular(25),
                              border: Border.all(
                                  color: Colors.blueAccent.withOpacity(0.3),
                                  width: 1.5),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withOpacity(0.4),
                                  blurRadius: 18,
                                  offset: const Offset(0, 6),
                                ),
                              ],
                            ),
                            child: Column(
                              children: [
                                const Text(
                                  "Registration Details",
                                  style: TextStyle(
                                    fontSize: 24,
                                    fontWeight: FontWeight.bold,
                                    color: Color(0xFF00BFFF),
                                  ),
                                ),
                                const SizedBox(height: 25),

                                _buildTextField(
                                  label: "Full Name",
                                  icon: Icons.person,
                                  controller: fullNameController,
                                ),
                                const SizedBox(height: 15),
                                _buildTextField(
                                  label: "Experience (Years)",
                                  icon: Icons.history_edu,
                                  controller: experienceController,
                                  keyboard: TextInputType.number,
                                ),
                                const SizedBox(height: 15),
                                _buildTextField(
                                  label: "Phone Number",
                                  icon: Icons.phone,
                                  controller: phoneController,
                                  keyboard: TextInputType.phone,
                                ),
                                const SizedBox(height: 15),
                                _buildTextField(
                                  label: "Address",
                                  icon: Icons.location_on,
                                  controller: addressController,
                                ),
                                const SizedBox(height: 15),
                                _buildTextField(
                                  label: "Email",
                                  icon: Icons.email,
                                  controller: emailController,
                                  keyboard: TextInputType.emailAddress,
                                ),
                                const SizedBox(height: 15),
                                _buildTextField(
                                  label: "Password",
                                  icon: Icons.lock,
                                  controller: passwordController,
                                  obscure: true,
                                ),
                                const SizedBox(height: 30),

                                ElevatedButton(
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: const Color(0xFF1E3A8A),
                                    foregroundColor: Colors.white,
                                    padding: const EdgeInsets.symmetric(
                                        horizontal: 80, vertical: 16),
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(18),
                                    ),
                                    shadowColor:
                                        Colors.blueAccent.withOpacity(0.7),
                                    elevation: 12,
                                  ),
                                  onPressed: _signUp,
                                  child: const Text(
                                    "Register Now",
                                    style: TextStyle(
                                      fontSize: 18,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                                const SizedBox(height: 20),
                                TextButton(
                                  onPressed: () {
                                    Navigator.pushReplacement(
                                      context,
                                      MaterialPageRoute(
                                          builder: (context) =>
                                              const LoginPage()),
                                    );
                                  },
                                  child: const Text(
                                    "Already have an account? Log in here",
                                    style: TextStyle(
                                      color: Colors.white70,
                                      decoration: TextDecoration.underline,
                                      fontSize: 15,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTextField({
    required String label,
    required IconData icon,
    required TextEditingController controller,
    bool obscure = false,
    TextInputType keyboard = TextInputType.text,
  }) {
    return TextField(
      controller: controller,
      obscureText: obscure,
      keyboardType: keyboard,
      style: const TextStyle(color: Colors.white),
      decoration: InputDecoration(
        prefixIcon: Icon(icon, color: const Color(0xFF00BFFF)),
        labelText: label,
        labelStyle: const TextStyle(color: Colors.white70),
        filled: true,
        fillColor: Colors.blueGrey.withOpacity(0.1),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: Colors.blueAccent.withOpacity(0.3)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: Color(0xFF00BFFF)),
        ),
      ),
    );
  }
}
