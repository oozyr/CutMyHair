import 'dart:async';
import 'package:cutmyhair1/services/auth_service.dart';
import 'package:cutmyhair1/views/login_page.dart';
import 'package:cutmyhair1/views/main_layout.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

class SplashPage extends StatefulWidget {
  @override
  State<SplashPage> createState() => _SplashPageState();
}

class _SplashPageState extends State<SplashPage> {
  @override
  void initState() {
    super.initState();
    final auth = Provider.of<AuthService>(context, listen: false);
    Timer(const Duration(milliseconds: 800), () {
      auth.authStateChanges().first.then((user) {
        if (user != null) {
          Navigator.of(context).pushReplacement(
            MaterialPageRoute(builder: (_) => const MainLayout()),
          );
        } else {
          Navigator.of(
            context,
          ).pushReplacement(MaterialPageRoute(builder: (_) => LoginPage()));
        }
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Image.asset(
              'assets/icon/app_icon.png', // path to your logo
              height: 100, // adjust size to fit nicely
            ),
            const SizedBox(height: 16),
            const Text(
              'CutMyHair',
              style: TextStyle(
                fontSize: 26,
                fontWeight: FontWeight.bold,
                color: Colors.black87,
              ),
            ),
            const SizedBox(height: 20),
            const CircularProgressIndicator(
              color: Color(0xFF007AFF), // iOS blue accent
              strokeWidth: 3,
            ),
          ],
        ),
      ),
    );
  }
}
