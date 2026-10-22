import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/services.dart';

class AddServicesPage extends StatefulWidget {
  const AddServicesPage({super.key});

  @override
  State<AddServicesPage> createState() => _AddServicePageState();
}

class _AddServicePageState extends State<AddServicesPage> {
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _priceController = TextEditingController();
  final TextEditingController _durationController = TextEditingController();

  final _firestore = FirebaseFirestore.instance;
  final _auth = FirebaseAuth.instance;

  bool saving = false;

  void _showSnack(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
  }

  void _saveService() async {
    setState(() => saving = true);
    String? uid = _auth.currentUser?.uid;

    if (uid == null) {
      _showSnack("Please log in again.");
      setState(() => saving = false);
      return;
    }

    if (_nameController.text.trim().isEmpty ||
        _priceController.text.trim().isEmpty ||
        _durationController.text.trim().isEmpty) {
      _showSnack("Fill in details.");
      setState(() => saving = false);
      return;
    }

    // Pastikan harga dalam format double
    final priceText = _priceController.text.trim().replaceAll(",", ".");
    final price = double.tryParse(priceText);
    if (price == null) {
      _showSnack("Please input valid price.");
      setState(() => saving = false);
      return;
    }

    // Pastikan durasi dalam format integer
    final duration = int.tryParse(_durationController.text.trim());
    if (duration == null) {
      _showSnack("Please input valid duration.");
      setState(() => saving = false);
      return;
    }

    try {
      await _firestore.collection("barbers").doc(uid).collection("services").add({
        "name": _nameController.text.trim(),
        "price": price,
        "durationMinutes": duration,
        "createdAt": Timestamp.now(),
      });

      if (mounted) {
        _showSnack("Service added succesfuly ✅");
        Navigator.pop(context);
      }
    } catch (e) {
      debugPrint("Error saving service: $e");
      _showSnack("Error: $e");
    } finally {
      if (mounted) setState(() => saving = false);
    }
  }

  Widget _fancyTextField({
    required String label,
    required TextEditingController controller,
    TextInputType? keyboardType,
    List<TextInputFormatter>? inputFormatters,
    int maxLines = 1,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10),
      child: TextField(
        controller: controller,
        keyboardType: keyboardType ?? TextInputType.text,
        inputFormatters: inputFormatters,
        maxLines: maxLines,
        style: const TextStyle(color: Colors.white),
        decoration: InputDecoration(
          labelText: label,
          labelStyle: const TextStyle(color: Colors.lightBlueAccent),
          filled: true,
          fillColor: Colors.white.withOpacity(0.08),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(20),
            borderSide: BorderSide.none,
          ),
        ),
      ),
    );
  }

  @override
  void dispose() {
    _nameController.dispose();
    _priceController.dispose();
    _durationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        // Gradient background
        Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0xFF0A1428), Color(0xFF1C2541)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
        ),
        // Background overlay
        Opacity(
          opacity: 0.1,
          child: Image.asset(
            "assets/images/batik1.jpg",
            fit: BoxFit.cover,
            width: double.infinity,
            height: double.infinity,
          ),
        ),
        Scaffold(
          backgroundColor: Colors.transparent,
          appBar: AppBar(
            title: const Text(
              "Add service",
              style: TextStyle(
                color: Colors.lightBlueAccent,
                fontWeight: FontWeight.bold,
              ),
            ),
            backgroundColor: Colors.transparent,
            elevation: 0,
            iconTheme: const IconThemeData(color: Colors.lightBlueAccent),
          ),
          body: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 50),
              child: Container(
                width: 500,
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.08),
                  borderRadius: BorderRadius.circular(30),
                  border: Border.all(
                      color: Colors.lightBlueAccent.withOpacity(0.3), width: 1),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.4),
                      blurRadius: 20,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                child: Column(
                  children: [
                    const Text(
                      "Add new service",
                      style: TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                        color: Colors.lightBlueAccent,
                      ),
                    ),
                    const SizedBox(height: 20),
                    _fancyTextField(label: "Service Name", controller: _nameController),
                    _fancyTextField(
                      label: "Price (RM)",
                      controller: _priceController,
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      inputFormatters: [
                        FilteringTextInputFormatter.allow(RegExp(r'^\d+\.?\d{0,2}')),
                      ],
                    ),
                    _fancyTextField(
                      label: "Duration (Minutes)",
                      controller: _durationController,
                      keyboardType: TextInputType.number,
                      inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                    ),
                    const SizedBox(height: 30),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: saving ? null : _saveService,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.lightBlueAccent,
                          foregroundColor: Colors.black,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(20),
                          ),
                        ),
                        child: saving
                            ? const CircularProgressIndicator(color: Colors.black)
                            : const Text(
                                "Save Service",
                                style: TextStyle(
                                    fontWeight: FontWeight.bold, fontSize: 16),
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
    );
  }
}
