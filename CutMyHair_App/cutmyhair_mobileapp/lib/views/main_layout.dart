import 'dart:ui';
import 'package:cutmyhair1/views/home_page.dart';
import 'package:cutmyhair1/views/map_page.dart';
import 'package:cutmyhair1/views/history_page.dart';
import 'package:cutmyhair1/views/profile_page.dart';
import 'package:flutter/material.dart';

class MainLayout extends StatefulWidget {
  const MainLayout({super.key});

  @override
  State<MainLayout> createState() => _MainLayoutState();
}

class _MainLayoutState extends State<MainLayout> {
  int _index = 1; // Home center
  late final List<Widget> _pages;

  @override
  void initState() {
    super.initState();
    _pages = [
      MapPage(),
      const HomePage(),
      HistoryPage(),
      ProfilePage(),
    ];
  }

  @override
  Widget build(BuildContext context) {
    const primary = Color(0xFF007AFF);

    return Scaffold(
      extendBody: true,
      backgroundColor: Colors.white,
      body: AnimatedSwitcher(
        duration: const Duration(milliseconds: 350),
        switchInCurve: Curves.easeInOut,
        child: IndexedStack(index: _index, children: _pages),
      ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.only(bottom: 10, top: 6),
        decoration: const BoxDecoration(color: Colors.transparent),
        child: ClipRRect(
          borderRadius: const BorderRadius.vertical(top: Radius.circular(26)),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
            child: Container(
              height: 72,
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.9),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.07),
                    blurRadius: 12,
                    offset: const Offset(0, -3),
                  ),
                ],
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _navItem(Icons.map_rounded, "Map", 0, primary),
                  _navItem(Icons.home_rounded, "Home", 1, primary,
                      isCenter: true),
                  _navItem(Icons.history_rounded, "History", 2, primary),
                  _navItem(Icons.person_rounded, "Profile", 3, primary),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _navItem(
    IconData icon,
    String label,
    int idx,
    Color color, {
    bool isCenter = false,
  }) {
    final selected = _index == idx;

    return GestureDetector(
      onTap: () => setState(() => _index = idx),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 250),
        curve: Curves.easeOutCubic,
        padding: EdgeInsets.symmetric(
          horizontal: isCenter ? 20 : 14,
          vertical: isCenter ? 8 : 6,
        ),
        decoration: selected
            ? BoxDecoration(
                color: color.withOpacity(0.12),
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                    color: color.withOpacity(0.25),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ],
              )
            : null,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            AnimatedScale(
              duration: const Duration(milliseconds: 250),
              scale: selected ? 1.25 : 1.0,
              curve: Curves.easeOutBack,
              child: Icon(
                icon,
                size: isCenter ? 30 : 24,
                color: selected ? color : Colors.black54,
              ),
            ),
            const SizedBox(height: 4),
            AnimatedDefaultTextStyle(
              duration: const Duration(milliseconds: 200),
              style: TextStyle(
                fontSize: 11,
                color: selected ? color : Colors.black54,
                fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
              ),
              child: Text(label),
            ),
          ],
        ),
      ),
    );
  }
}
