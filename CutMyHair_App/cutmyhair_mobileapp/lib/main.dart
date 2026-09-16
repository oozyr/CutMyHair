import 'package:cutmyhair1/services/auth_service.dart';
import 'package:cutmyhair1/services/firestore_service.dart';
import 'package:cutmyhair1/views/splash_page.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'firebase_options.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // ✅ Prevent duplicate Firebase initialization
  try {
    if (Firebase.apps.isEmpty) {
      await Firebase.initializeApp(
        options: DefaultFirebaseOptions.currentPlatform,
      );
    } else {
      Firebase.app(); // reuse existing instance
    }
  } catch (e) {
    debugPrint('⚠️ Firebase already initialized: $e');
  }

  runApp(const CutMyHairApp());
}

class CutMyHairApp extends StatelessWidget {
  const CutMyHairApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        Provider<AuthService>(create: (_) => AuthService()),
        Provider<FirestoreService>(create: (_) => FirestoreService()),
      ],
      child: MaterialApp(
        title: 'CutMyHair',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          primaryColor: const Color(0xFF007AFF),
          colorScheme: ColorScheme.fromSwatch().copyWith(
            secondary: const Color(0xFF007AFF),
          ),
          scaffoldBackgroundColor: Colors.white,
          visualDensity: VisualDensity.adaptivePlatformDensity,
          fontFamily: 'Inter',
        ),
        home: SplashPage(),
      ),
    );
  }
}
