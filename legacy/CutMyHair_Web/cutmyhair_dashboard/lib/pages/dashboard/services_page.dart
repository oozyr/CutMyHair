import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../profile/add_services_page.dart';
import '../profile/edit_services_page.dart';

class ServicesPage extends StatefulWidget {
  const ServicesPage({super.key});

  @override
  State<ServicesPage> createState() => _ServicesPageState();
}

class _ServicesPageState extends State<ServicesPage> {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  Future<void> _deleteService(String serviceId) async {
    final user = _auth.currentUser;
    if (user == null) return;

    await _firestore
        .collection("barbers")
        .doc(user.uid)
        .collection("services")
        .doc(serviceId)
        .delete();

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text("Service deleted successfully ✅"),
        backgroundColor: Colors.redAccent,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = _auth.currentUser;

    if (user == null) {
      return const Center(
        child: Text(
          "Please log in to view services.",
          style: TextStyle(color: Colors.white70),
        ),
      );
    }

    return Stack(
      children: [
        // 🌌 Background Gradient
        Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0xFF0A1428), Color(0xFF1C2541)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
        ),

        // 🪞 Batik Overlay
        Opacity(
          opacity: 0.15,
          child: Image.asset(
            "assets/images/batik1.jpg",
            fit: BoxFit.cover,
            width: double.infinity,
            height: double.infinity,
          ),
        ),

        // 📋 Main Content
        Padding(
          padding: const EdgeInsets.only(top: 70.0, left: 24, right: 24),
          child: StreamBuilder<QuerySnapshot>(
            stream: _firestore
                .collection("barbers")
                .doc(user.uid)
                .collection("services")
                .orderBy("name")
                .snapshots(),
            builder: (context, snapshot) {
              if (snapshot.connectionState == ConnectionState.waiting) {
                return const Center(
                  child: CircularProgressIndicator(color: Colors.cyanAccent),
                );
              }

              if (!snapshot.hasData || snapshot.data!.docs.isEmpty) {
                return const Center(
                  child: Text(
                    "No services yet. Add one now!",
                    style: TextStyle(color: Colors.white70, fontSize: 18),
                  ),
                );
              }

              final services = snapshot.data!.docs;

              return ListView(
                padding: const EdgeInsets.only(bottom: 100),
                children: [
                  // 🧊 Group Background
                  ClipRRect(
                    borderRadius: BorderRadius.circular(25),
                    child: BackdropFilter(
                      filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
                      child: Container(
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.06),
                          borderRadius: BorderRadius.circular(25),
                          border: Border.all(color: Colors.white24),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.blueAccent.withOpacity(0.25),
                              blurRadius: 20,
                              offset: const Offset(0, 6),
                            ),
                          ],
                        ),
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          children: services.map((doc) {
                            final data =
                                doc.data() as Map<String, dynamic>? ?? {};
                            final name = data["name"] ?? "Unnamed";
                            final price = data["price"] ?? 0;
                            final duration = data["durationMinutes"] ?? 0;

                            return Container(
                              margin: const EdgeInsets.only(bottom: 14),
                              child: ClipRRect(
                                borderRadius: BorderRadius.circular(18),
                                child: BackdropFilter(
                                  filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                                  child: Container(
                                    decoration: BoxDecoration(
                                      color: Colors.white.withOpacity(0.05),
                                      borderRadius: BorderRadius.circular(18),
                                      border: Border.all(color: Colors.white24),
                                      boxShadow: [
                                        BoxShadow(
                                          color:
                                              Colors.blueAccent.withOpacity(0.2),
                                          blurRadius: 15,
                                          offset: const Offset(0, 6),
                                        ),
                                      ],
                                    ),
                                    child: ListTile(
                                      contentPadding:
                                          const EdgeInsets.symmetric(
                                              horizontal: 20, vertical: 12),
                                      title: Text(
                                        name,
                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontWeight: FontWeight.bold,
                                          fontSize: 17,
                                        ),
                                      ),
                                      subtitle: Text(
                                        "RM$price • $duration min",
                                        style: const TextStyle(
                                            color: Colors.white70),
                                      ),
                                      trailing: Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          IconButton(
                                            icon: const Icon(
                                              Icons.edit,
                                              color: Colors.cyanAccent,
                                            ),
                                            onPressed: () {
                                              Navigator.push(
                                                context,
                                                MaterialPageRoute(
                                                  builder: (_) => EditServicesPage(
                                                    barberId: user.uid,
                                                    serviceId: doc.id,
                                                    serviceData: data,
                                                  ),
                                                ),
                                              );
                                            },
                                          ),
                                          IconButton(
                                            icon: const Icon(
                                              Icons.delete,
                                              color: Colors.redAccent,
                                            ),
                                            onPressed: () =>
                                                _deleteService(doc.id),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                            );
                          }).toList(),
                        ),
                      ),
                    ),
                  ),
                ],
              );
            },
          ),
        ),

        // 🏷 Floating Page Title (like Appointments)
        const Positioned(
          top: 20,
          left: 24,
          child: Text(
            "Services",
            style: TextStyle(
              color: Colors.white,
              fontSize: 26,
              fontWeight: FontWeight.bold,
              shadows: [
                Shadow(color: Colors.blueAccent, blurRadius: 18),
              ],
            ),
          ),
        ),

        // ➕ Floating Button
        Positioned(
          bottom: 30,
          right: 30,
          child: FloatingActionButton(
            backgroundColor: const Color(0xFF2196F3),
            elevation: 10,
            child: const Icon(Icons.add, color: Colors.white),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const AddServicesPage()),
              );
            },
          ),
        ),
      ],
    );
  }
}
