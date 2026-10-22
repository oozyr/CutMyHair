import 'package:flutter/material.dart';

class AppTheme {
  static const Color primary = Color(0xFF007AFF);
  static const Color background = Color(0xFFF9FAFB);
  static const Color textPrimary = Colors.black87;
  static const Color textSecondary = Colors.black54;
  static const Color card = Colors.white;

  static const double padding = 20.0;
  static const double radius = 16.0;

  static const BoxShadow softShadow = BoxShadow(
    color: Colors.black12,
    blurRadius: 10,
    offset: Offset(0, 4),
  );

  static const TextStyle title = TextStyle(
    fontSize: 22,
    fontWeight: FontWeight.bold,
    color: textPrimary,
  );

  static const TextStyle subtitle = TextStyle(
    fontSize: 16,
    fontWeight: FontWeight.w500,
    color: textPrimary,
  );

  static const TextStyle label = TextStyle(
    fontSize: 14,
    color: textSecondary,
  );

  static ThemeData lightTheme() => ThemeData(
        fontFamily: 'Inter',
        scaffoldBackgroundColor: background,
        primaryColor: primary,
        colorScheme: ColorScheme.fromSwatch().copyWith(secondary: primary),
        appBarTheme: const AppBarTheme(
          backgroundColor: card,
          elevation: 0,
          titleTextStyle: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: textPrimary,
          ),
          iconTheme: IconThemeData(color: textPrimary),
        ),
      );
}
