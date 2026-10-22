import 'dart:io';
import 'dart:ui';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cutmyhair1/models/app_user.dart';
import 'package:cutmyhair1/services/auth_service.dart';
import 'package:cutmyhair1/services/firestore_service.dart';
import 'package:cutmyhair1/views/history_page.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import 'login_page.dart';

class ProfilePage extends StatefulWidget {
  const ProfilePage({super.key});

  @override
  State<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends State<ProfilePage> {
  AppUser? user;
  bool loading = true;
  bool uploading = false;
  int totalBookings = 0;
  double avgRating = 0.0;
  final ImagePicker _picker = ImagePicker();

  @override
  void initState() {
    super.initState();
    _loadUser();
  }

  Future<void> _loadUser() async {
    final auth = Provider.of<AuthService>(context, listen: false);
    final db = Provider.of<FirestoreService>(context, listen: false);

    if (auth.uid == null) return;

    final u = await db.getUser(auth.uid!);
    final bookingsSnap = await FirebaseFirestore.instance
        .collection('bookings')
        .where('userId', isEqualTo: auth.uid!)
        .get();

    final reviewsSnap = await FirebaseFirestore.instance
        .collection('reviews')
        .where('userId', isEqualTo: auth.uid!)
        .get();

    setState(() {
      user = u;
      totalBookings = bookingsSnap.docs.length;
      if (reviewsSnap.docs.isNotEmpty) {
        avgRating = reviewsSnap.docs
                .map((d) => (d['rating'] ?? 0).toDouble())
                .reduce((a, b) => a + b) /
            reviewsSnap.docs.length;
      }
      loading = false;
    });
  }

  Future<void> _pickAndUploadPhoto() async {
    final db = Provider.of<FirestoreService>(context, listen: false);
    final auth = Provider.of<AuthService>(context, listen: false);
    final picked = await _picker.pickImage(source: ImageSource.gallery);

    if (picked != null) {
      setState(() => uploading = true);
      try {
        final file = File(picked.path);
        final url = await db.uploadAndSaveProfilePhoto(auth.uid!, file);

        if (url != null) {
          setState(() => user = user?.copyWith(photo: url));
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Profile photo updated successfully')),
            );
          }
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Upload failed — no URL returned')),
          );
        }
      } catch (e) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Upload failed: $e')),
        );
      } finally {
        if (mounted) setState(() => uploading = false);
      }
    }
  }

  Future<void> _editProfileDialog() async {
    final db = Provider.of<FirestoreService>(context, listen: false);
    final nameController = TextEditingController(text: user?.name ?? '');
    final phoneController = TextEditingController(text: user?.phone ?? '');

    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(25)),
      ),
      builder: (context) => Padding(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).viewInsets.bottom,
          left: 24,
          right: 24,
          top: 24,
        ),
        child: SingleChildScrollView(
          child: Column(
            children: [
              const Text(
                'Edit Profile',
                style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Colors.black87),
              ),
              const SizedBox(height: 20),
              TextField(
                controller: nameController,
                decoration: _inputDecoration('Full Name', Icons.person_outline),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: phoneController,
                keyboardType: TextInputType.phone,
                decoration: _inputDecoration('Phone Number', Icons.phone_outlined),
              ),
              const SizedBox(height: 20),
              ElevatedButton.icon(
                icon: const Icon(Icons.save),
                label: const Text('Save Changes'),
                onPressed: () async {
                  Navigator.pop(context);
                  await db.updateUserProfile(user!.id, {
                    'name': nameController.text.trim(),
                    'phone': phoneController.text.trim(),
                  });
                  setState(() {
                    user = user?.copyWith(
                      name: nameController.text.trim(),
                      phone: phoneController.text.trim(),
                    );
                  });
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Profile updated')),
                  );
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF007AFF),
                  minimumSize: const Size(double.infinity, 50),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12)),
                ),
              ),
              const SizedBox(height: 25),
            ],
          ),
        ),
      ),
    );
  }

  InputDecoration _inputDecoration(String label, IconData icon) {
    return InputDecoration(
      labelText: label,
      prefixIcon: Icon(icon, color: Colors.blueAccent),
      filled: true,
      fillColor: Colors.blue.withOpacity(0.05),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide.none,
      ),
    );
  }

  Future<void> _logout() async {
    final auth = Provider.of<AuthService>(context, listen: false);
    await auth.signOut();
    if (!mounted) return;
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) =>  LoginPage()),
      (route) => false,
    );
  }

  @override
  Widget build(BuildContext context) {
    const blue = Color(0xFF007AFF);
    const lightBlue = Color(0xFFE7F3FF);

    return Scaffold(
      backgroundColor: Colors.white,
      body: loading
          ? const Center(child: CircularProgressIndicator())
          : Stack(
              children: [
                // 🌈 Gradient Header
                Container(
                  height: 280,
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      colors: [blue, Color(0xFF00C6FF)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                  ),
                ),

                // 📱 Frosted content
                SingleChildScrollView(
                  child: Column(
                    children: [
                      const SizedBox(height: 90),

                      // 👤 Avatar Section
                      Stack(
                        alignment: Alignment.bottomRight,
                        children: [
                          CircleAvatar(
                            radius: 60,
                            backgroundColor: Colors.white.withOpacity(0.3),
                            backgroundImage: user?.photo != null
                                ? NetworkImage(user!.photo!)
                                : null,
                            child: user?.photo == null
                                ? const Icon(Icons.person,
                                    color: Colors.white, size: 60)
                                : null,
                          ),
                          GestureDetector(
                            onTap: uploading ? null : _pickAndUploadPhoto,
                            child: Container(
                              decoration: BoxDecoration(
                                color: Colors.white,
                                shape: BoxShape.circle,
                                boxShadow: [
                                  BoxShadow(
                                      color: Colors.black26,
                                      blurRadius: 5,
                                      offset: const Offset(0, 2))
                                ],
                              ),
                              padding: const EdgeInsets.all(6),
                              child: uploading
                                  ? const SizedBox(
                                      height: 20,
                                      width: 20,
                                      child: CircularProgressIndicator(
                                          strokeWidth: 2),
                                    )
                                  : const Icon(Icons.camera_alt_rounded,
                                      color: blue, size: 20),
                            ),
                          ),
                        ],
                      ),

                      const SizedBox(height: 16),
                      Text(
                        user?.name ?? "User",
                        style: const TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.bold,
                            color: Colors.white),
                      ),
                      Text(
                        user?.email ?? '',
                        style: const TextStyle(
                            color: Colors.white70, fontSize: 14),
                      ),

                      const SizedBox(height: 24),

                      // 🌟 Glass Stats
                      _glassSection(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 28, vertical: 16),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                          children: [
                            _statBox(Icons.calendar_month_rounded, "Bookings",
                                totalBookings.toString()),
                          ],
                        ),
                      ),

                      const SizedBox(height: 28),

                      // ⚙️ Account Glass Card
                      _glassSection(
                        padding: const EdgeInsets.all(18),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text("Account",
                                style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w600,
                                    color: Colors.black87)),
                            const SizedBox(height: 10),
                            _menuTile(Icons.history_rounded, "Booking History",
                                onTap: () => Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                        builder: (_) => const HistoryPage()))),
                            _menuTile(Icons.person_outline, "Edit Profile",
                                onTap: _editProfileDialog),
                            const Divider(height: 22, thickness: 0.8),
                            _menuTile(Icons.logout_rounded, "Logout",
                                color: Colors.red, onTap: _logout),
                          ],
                        ),
                      ),

                      const SizedBox(height: 40),
                    ],
                  ),
                ),

                // Transparent AppBar
                Positioned(
                  top: 0,
                  left: 0,
                  right: 0,
                  child: AppBar(
                    backgroundColor: Colors.transparent,
                    elevation: 0,
                    centerTitle: true,
                    title: const Text(
                      "My Profile",
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 18,
                      ),
                    ),
                  ),
                ),
              ],
            ),
    );
  }

  // 🌫 Frosted glass container (used for cards)
  Widget _glassSection({
    required Widget child,
    EdgeInsetsGeometry padding = const EdgeInsets.all(16),
  }) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(22),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
        child: Container(
          margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
          padding: padding,
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                Colors.white.withOpacity(0.65),
                const Color(0xFFE7F3FF).withOpacity(0.75),
              ],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(22),
            border: Border.all(color: Colors.white.withOpacity(0.3)),
            boxShadow: [
              BoxShadow(
                color: Colors.blue.withOpacity(0.08),
                blurRadius: 20,
                offset: const Offset(0, 6),
              ),
            ],
          ),
          child: child,
        ),
      ),
    );
  }

  Widget _statBox(IconData icon, String label, String value) {
    return Column(
      children: [
        Icon(icon, color: const Color(0xFF007AFF), size: 26),
        const SizedBox(height: 6),
        Text(
          value,
          style: const TextStyle(
              color: Colors.black87, fontSize: 18, fontWeight: FontWeight.bold),
        ),
        Text(label,
            style: const TextStyle(color: Colors.black54, fontSize: 13)),
      ],
    );
  }

  Widget _menuTile(IconData icon, String title,
      {Color color = Colors.black87, VoidCallback? onTap}) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 12),
        margin: const EdgeInsets.symmetric(vertical: 6),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.7),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: Colors.white.withOpacity(0.4)),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: color == Colors.red
                    ? Colors.red.withOpacity(0.1)
                    : const Color(0xFF007AFF).withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: color, size: 20),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Text(title,
                  style: TextStyle(
                      fontWeight: FontWeight.w500,
                      color: color,
                      fontSize: 15)),
            ),
            const Icon(Icons.chevron_right_rounded, color: Colors.black45),
          ],
        ),
      ),
    );
  }
}
