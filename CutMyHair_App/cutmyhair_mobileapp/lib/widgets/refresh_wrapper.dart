import 'package:flutter/material.dart';

class RefreshWrapper extends StatelessWidget {
  final Future<void> Function() onRefresh;
  final Widget child;
  final Color? color;

  const RefreshWrapper({
    super.key,
    required this.onRefresh,
    required this.child,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      color: color ?? const Color(0xFF007AFF),
      displacement: 80,
      edgeOffset: 10,
      strokeWidth: 2.5,
      onRefresh: onRefresh,
      child: child,
    );
  }
}
