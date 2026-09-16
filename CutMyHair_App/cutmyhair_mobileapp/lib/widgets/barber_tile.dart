import 'package:cutmyhair1/models/barber_model.dart';
import 'package:cutmyhair1/theme/app_theme.dart';
import 'package:flutter/material.dart';

class BarberTile extends StatelessWidget {
  final Barber barber;
  final String? subtitle;
  final VoidCallback? onTap;
  final bool compact;
  final double? distanceKm;

  const BarberTile({
    super.key,
    required this.barber,
    this.subtitle,
    this.onTap,
    this.compact = false,
    this.distanceKm,
  });

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;

    // Width based adaptive sizing
    final cardWidth = compact ? size.width * 0.45 : size.width * 0.42;
    final imageHeight = compact ? cardWidth * 0.65 : cardWidth * 0.60;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: cardWidth,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(AppTheme.radius),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.06),
              blurRadius: 8,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildImage(context, imageHeight),

            // 🧾 Details section auto expands with safe padding
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // 💈 Barber name + rating
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      Expanded(
                        child: Text(
                          barber.name,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            fontWeight: FontWeight.w600,
                            fontSize: 15,
                            color: Colors.black87,
                          ),
                        ),
                      ),
                      const Icon(Icons.star_rounded,
                          color: Colors.amber, size: 15),
                      const SizedBox(width: 3),
                      Text(
                        barber.rating.toStringAsFixed(1),
                        style: const TextStyle(
                          fontSize: 12,
                          color: Colors.black54,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 3),

                  // 🧔 Barber Type
                  Text(
                    barber.barberType.isNotEmpty
                        ? barber.barberType
                        : "Freelancer",
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 12.5,
                      color: Colors.blueGrey,
                    ),
                  ),

                  // 📍 Distance
                  if (distanceKm != null)
                    Padding(
                      padding: const EdgeInsets.only(top: 2),
                      child: Text(
                        "${distanceKm!.toStringAsFixed(1)} km away",
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 12,
                          color: Colors.black45,
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildImage(BuildContext context, double height) {
    if (barber.imageUrl.isEmpty) {
      return Container(
        height: height,
        color: Colors.grey[100],
        alignment: Alignment.center,
        child: const Icon(Icons.cut, size: 40, color: Colors.black26),
      );
    }

    return ClipRRect(
      borderRadius: const BorderRadius.only(
        topLeft: Radius.circular(AppTheme.radius),
        topRight: Radius.circular(AppTheme.radius),
      ),
      child: Image.network(
        barber.imageUrl,
        height: height,
        width: double.infinity,
        fit: BoxFit.cover,
        loadingBuilder: (context, child, progress) {
          if (progress == null) return child;
          return Container(
            height: height,
            color: Colors.grey[200],
            alignment: Alignment.center,
            child: const SizedBox(
              width: 22,
              height: 22,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                color: AppTheme.primary,
              ),
            ),
          );
        },
        errorBuilder: (_, __, ___) => Container(
          height: height,
          color: Colors.grey[200],
          alignment: Alignment.center,
          child: const Icon(Icons.cut, size: 36, color: Colors.grey),
        ),
      ),
    );
  }
}
