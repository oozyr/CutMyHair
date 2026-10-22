import 'dart:async';
import 'dart:io';
import 'dart:typed_data';
import 'dart:ui';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:image_picker/image_picker.dart';
import 'package:firebase_storage/firebase_storage.dart' as firebase_storage;
import 'package:cached_network_image/cached_network_image.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

class EditProfilePage extends StatefulWidget {
  final Map<String, dynamic> data;
  const EditProfilePage({super.key, required this.data});

  @override
  State<EditProfilePage> createState() => _EditProfilePageState();
}

class _EditProfilePageState extends State<EditProfilePage> {
  // Controllers
  late TextEditingController nameCtrl;
  late TextEditingController emailCtrl;
  late TextEditingController phoneCtrl;
  late TextEditingController addressCtrl;
  late TextEditingController descriptionCtrl;
  late TextEditingController barberTypeCtrl;
  late TextEditingController experienceCtrl;

  // State
  bool isVerified = false;

  // Profile image
  File? _profileFile;
  Uint8List? _profileWebImage;
  String? imageUrl;

  // Gallery
  List<Map<String, dynamic>> galleryImages = [];
  bool uploadingGallery = false;
  Set<String> deletingGallery = {};
  bool editMode = false; // ✅ added

  // Flags
  bool saving = false;
  bool uploadingProfile = false;

  // Location
  double? latitude;
  double? longitude;

  // Limits
  final int galleryMax = 5;
  final Duration opTimeout = const Duration(seconds: 10);

  @override
  void initState() {
    super.initState();
    final d = widget.data;
    nameCtrl = TextEditingController(text: d['name'] ?? "");
    emailCtrl = TextEditingController(text: d['email'] ?? "");
    phoneCtrl = TextEditingController(text: d['phone'] ?? "");
    addressCtrl = TextEditingController(text: d['address'] ?? "");
    descriptionCtrl = TextEditingController(text: d['description'] ?? "");
    barberTypeCtrl = TextEditingController(text: d['barberType'] ?? "");
    experienceCtrl =
        TextEditingController(text: (d['experience'] ?? "").toString());
    latitude = (d['latitude'] ?? 0).toDouble();
    longitude = (d['longitude'] ?? 0).toDouble();
    imageUrl = d['imageUrl'] ?? "";
    isVerified = d['isVerified'] ?? false;
    loadGallery();
  }

  @override
  void dispose() {
    nameCtrl.dispose();
    emailCtrl.dispose();
    phoneCtrl.dispose();
    addressCtrl.dispose();
    descriptionCtrl.dispose();
    barberTypeCtrl.dispose();
    experienceCtrl.dispose();
    super.dispose();
  }

  firebase_storage.FirebaseStorage _storageInstance() =>
      firebase_storage.FirebaseStorage.instance;

  // ------------------- PROFILE IMAGE -------------------
  Future<void> pickProfileImage() async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(
      source: ImageSource.gallery,
      imageQuality: 70,
    );
    if (picked == null) return;
    if (kIsWeb) {
      final bytes = await picked.readAsBytes();
      setState(() {
        _profileWebImage = bytes;
        _profileFile = null;
      });
    } else {
      setState(() {
        _profileFile = File(picked.path);
        _profileWebImage = null;
      });
    }
  }

  Future<String?> uploadProfileImage() async {
    if (_profileFile == null &&
        (_profileWebImage == null || _profileWebImage!.isEmpty)) {
      return imageUrl;
    }
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) throw Exception("User not logged in.");
    final ref = _storageInstance().ref().child("profileImages/${user.uid}.jpg");

    try {
      setState(() => uploadingProfile = true);
      late final firebase_storage.UploadTask uploadTask;
      final metadata =
          firebase_storage.SettableMetadata(contentType: 'image/jpeg');

      if (kIsWeb && _profileWebImage != null) {
        uploadTask = ref.putData(_profileWebImage!, metadata);
      } else if (_profileFile != null && await _profileFile!.exists()) {
        uploadTask = ref.putFile(_profileFile!, metadata);
      } else {
        return imageUrl;
      }

      await uploadTask.timeout(opTimeout);
      final url = await ref.getDownloadURL().timeout(opTimeout);
      setState(() => imageUrl = url);
      return url;
    } catch (e) {
      debugPrint("uploadProfileImage error: $e");
      return imageUrl;
    } finally {
      if (mounted) setState(() => uploadingProfile = false);
    }
  }

  // ------------------- GALLERY -------------------
  Future<void> loadGallery() async {
    try {
      final uid = FirebaseAuth.instance.currentUser!.uid;
      final snap = await FirebaseFirestore.instance
          .collection('barbers')
          .doc(uid)
          .collection('gallery')
          .orderBy('uploadedAt', descending: true)
          .get();
      final list = snap.docs.map((d) {
        final data = d.data();
        return {
          'id': d.id,
          'imageUrl': data['imageUrl'] ?? "",
          'caption': data['caption'] ?? "",
        };
      }).toList();
      setState(() => galleryImages = list);
    } catch (e) {
      debugPrint("Load gallery error: $e");
    }
  }

  Future<void> pickAndUploadGalleryImage() async {
    if (galleryImages.length >= galleryMax) {
      _showSnack("Maximum $galleryMax images allowed.");
      return;
    }

    final picker = ImagePicker();
    final picked = await picker.pickImage(
      source: ImageSource.gallery,
      imageQuality: 80,
    );
    if (picked == null) return;

    File? file;
    Uint8List? bytes;
    if (kIsWeb) {
      bytes = await picked.readAsBytes();
    } else {
      file = File(picked.path);
    }

    await showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) {
        Uint8List? previewBytes = bytes;
        File? previewFile = file;
        final captionCtrl = TextEditingController();
        bool isUploading = false;

        Future<void> saveImage() async {
          if (isUploading) return;
          setState(() => uploadingGallery = true);
          try {
            isUploading = true;
            final url = await _uploadGalleryImage(previewFile, previewBytes);
            if (url == null) {
              _showSnack("Failed to upload image.");
              return;
            }
            final uid = FirebaseAuth.instance.currentUser!.uid;
            final newDoc = await FirebaseFirestore.instance
                .collection('barbers')
                .doc(uid)
                .collection('gallery')
                .add({
              'imageUrl': url,
              'caption': captionCtrl.text.trim(),
              'uploadedAt': FieldValue.serverTimestamp(),
            });
            setState(() {
              galleryImages.insert(0, {
                'id': newDoc.id,
                'imageUrl': url,
                'caption': captionCtrl.text.trim(),
              });
            });
            Navigator.pop(ctx);
            _showSnack("Gallery image added ✅");
          } catch (e) {
            _showSnack("Error: $e");
          } finally {
            isUploading = false;
            if (mounted) setState(() => uploadingGallery = false);
          }
        }

        return AlertDialog(
          backgroundColor: Colors.grey[900],
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
          ),
          title: const Text(
            "Add Gallery Image",
            style: TextStyle(
              color: Colors.lightBlueAccent,
              fontWeight: FontWeight.bold,
            ),
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: previewBytes != null
                    ? Image.memory(previewBytes, height: 180, fit: BoxFit.cover)
                    : Image.file(previewFile!, height: 180, fit: BoxFit.cover),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: captionCtrl,
                maxLength: 50,
                style: const TextStyle(color: Colors.white),
                decoration: InputDecoration(
                  hintText: "Caption (e.g. Classic Fade)",
                  hintStyle: const TextStyle(color: Colors.white54),
                  filled: true,
                  fillColor: Colors.white10,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide.none,
                  ),
                  contentPadding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text("Cancel",
                  style: TextStyle(color: Colors.white70)),
            ),
            ElevatedButton(
              onPressed: saveImage,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.lightBlueAccent,
                foregroundColor: Colors.black,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: const Text("Save"),
            ),
          ],
        );
      },
    );
  }

  Future<String?> _uploadGalleryImage(File? file, Uint8List? webImage) async {
    final uid = FirebaseAuth.instance.currentUser!.uid;
    final timestamp = DateTime.now().millisecondsSinceEpoch;
    final ref = _storageInstance()
        .ref()
        .child("galleryImages/$uid/$timestamp.jpg");

    try {
      late firebase_storage.UploadTask task;
      final metadata =
          firebase_storage.SettableMetadata(contentType: 'image/jpeg');

      if (kIsWeb && webImage != null) {
        task = ref.putData(webImage, metadata);
      } else if (file != null) {
        task = ref.putFile(file, metadata);
      } else {
        return null;
      }

      await task.timeout(opTimeout);
      final url = await ref.getDownloadURL().timeout(opTimeout);
      return url;
    } catch (e) {
      debugPrint("_uploadGalleryImage error: $e");
      return null;
    }
  }

  Future<void> deleteGalleryImage(String id, String url) async {
    final uid = FirebaseAuth.instance.currentUser!.uid;
    try {
      setState(() => deletingGallery.add(id));
      await FirebaseFirestore.instance
          .collection('barbers')
          .doc(uid)
          .collection('gallery')
          .doc(id)
          .delete();
      await firebase_storage.FirebaseStorage.instance.refFromURL(url).delete();
      setState(() => galleryImages.removeWhere((img) => img['id'] == id));
      _showSnack("Deleted successfully.");
    } catch (e) {
      _showSnack("Error deleting: $e");
    } finally {
      deletingGallery.remove(id);
    }
  }

  Future<void> editGalleryCaption(String id, String oldCaption) async {
    final captionCtrl = TextEditingController(text: oldCaption);
    final newCaption = await showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: Colors.grey[900],
        title: const Text("Edit Caption",
            style: TextStyle(color: Colors.lightBlueAccent)),
        content: TextField(
          controller: captionCtrl,
          maxLength: 50,
          style: const TextStyle(color: Colors.white),
          decoration: InputDecoration(
            hintText: "Enter new caption",
            hintStyle: const TextStyle(color: Colors.white54),
            filled: true,
            fillColor: Colors.white10,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide.none,
            ),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text("Cancel"),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, captionCtrl.text.trim()),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.lightBlueAccent,
              foregroundColor: Colors.black,
            ),
            child: const Text("Save"),
          ),
        ],
      ),
    );

    if (newCaption == null || newCaption == oldCaption) return;
    final uid = FirebaseAuth.instance.currentUser!.uid;
    await FirebaseFirestore.instance
        .collection('barbers')
        .doc(uid)
        .collection('gallery')
        .doc(id)
        .update({'caption': newCaption});
    setState(() {
      final img = galleryImages.firstWhere((e) => e['id'] == id);
      img['caption'] = newCaption;
    });
  }

  // ------------------- MAP PICKER -------------------
  Future<void> pickLocation() async {
    LatLng selectedPos = LatLng(latitude ?? 0, longitude ?? 0);
    final Completer<GoogleMapController> controller = Completer();

    await showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setStateDialog) {
            return AlertDialog(
              backgroundColor: Colors.grey[900],
              title: const Text(
                "Select Shop Location",
                style: TextStyle(color: Colors.lightBlueAccent),
              ),
              content: SizedBox(
                width: double.maxFinite,
                height: 480,
                child: GoogleMap(
                  initialCameraPosition:
                      CameraPosition(target: selectedPos, zoom: 15),
                  onMapCreated: (ctrl) => controller.complete(ctrl),
                  markers: {
                    Marker(
                      markerId: const MarkerId('shop'),
                      position: selectedPos,
                      draggable: true,
                      onDragEnd: (pos) =>
                          setStateDialog(() => selectedPos = pos),
                    ),
                  },
                  onTap: (pos) => setStateDialog(() => selectedPos = pos),
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () {
                    setState(() {
                      latitude = selectedPos.latitude;
                      longitude = selectedPos.longitude;
                    });
                    Navigator.pop(context);
                  },
                  child: const Text("Save",
                      style: TextStyle(color: Colors.lightBlueAccent)),
                ),
              ],
            );
          },
        );
      },
    );
  }

  // ------------------- SAVE PROFILE -------------------
  Future<void> saveProfile() async {
    final uid = FirebaseAuth.instance.currentUser?.uid;
    if (uid == null) return;
    if (nameCtrl.text.trim().isEmpty) {
      _showSnack("Please enter your name.");
      return;
    }

    setState(() => saving = true);
    try {
      final newImageUrl = await uploadProfileImage();
      final data = {
        "name": nameCtrl.text.trim(),
        "email": emailCtrl.text.trim(),
        "phone": phoneCtrl.text.trim(),
        "address": addressCtrl.text.trim(),
        "description": descriptionCtrl.text.trim(),
        "barberType": barberTypeCtrl.text.trim(),
        "experience": int.tryParse(experienceCtrl.text.trim()) ?? 0,
        "isVerified": isVerified,
        "imageUrl": newImageUrl ?? "",
        "latitude": latitude,
        "longitude": longitude,
        "updatedAt": FieldValue.serverTimestamp(),
      };
      await FirebaseFirestore.instance
          .collection('barbers')
          .doc(uid)
          .update(data);
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(const SnackBar(content: Text("Profile updated ✅")));
        Navigator.pop(context, true);
      }
    } catch (e) {
      _showSnack("Error: $e");
    } finally {
      if (mounted) setState(() => saving = false);
    }
  }

  void _showSnack(String msg) =>
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));

  Widget field(String label, TextEditingController ctrl,
      {int maxLines = 1, IconData? icon}) {
    return TextField(
      controller: ctrl,
      maxLines: maxLines,
      style: const TextStyle(color: Colors.white),
      decoration: InputDecoration(
        prefixIcon:
            icon != null ? Icon(icon, color: Colors.lightBlueAccent) : null,
        filled: true,
        fillColor: Colors.white.withOpacity(0.05),
        labelText: label,
        labelStyle: const TextStyle(color: Colors.lightBlueAccent),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide:
              BorderSide(color: Colors.lightBlueAccent.withOpacity(0.5)),
        ),
        focusedBorder: const OutlineInputBorder(
          borderRadius: BorderRadius.all(Radius.circular(12)),
          borderSide: BorderSide(color: Colors.lightBlueAccent),
        ),
      ),
    );
  }

  // ------------------- BUILD -------------------
  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0xFF0A1428), Color(0xFF1C2541)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
        ),
        Scaffold(
          backgroundColor: Colors.transparent,
          appBar: AppBar(
            backgroundColor: Colors.transparent,
            elevation: 0,
            centerTitle: true,
            title: const Text(
              "Edit Profile",
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
                shadows: [Shadow(color: Colors.blueAccent, blurRadius: 9)],
                letterSpacing: 0.8,
              ),
            ),
            iconTheme: const IconThemeData(color: Colors.lightBlueAccent),
          ),
          body: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 40),
            child: Center(
              child: ClipRRect(
                borderRadius: BorderRadius.circular(25),
                child: BackdropFilter(
                  filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
                  child: Container(
                    width: 640,
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.08),
                      borderRadius: BorderRadius.circular(25),
                      border: Border.all(
                          color: Colors.lightBlueAccent.withOpacity(0.25)),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.cyanAccent.withOpacity(0.2),
                          blurRadius: 20,
                          offset: const Offset(0, 6),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                     Stack(
  children: [
    CircleAvatar(
      radius: 60,
      backgroundColor: Colors.lightBlueAccent.withOpacity(0.3),
      child: ClipOval(
        child: SizedBox(
          width: 114,
          height: 114,
          child: _profileFile != null
              ? Image.file(_profileFile!, fit: BoxFit.cover) // 📸 Preview mobile
              : (_profileWebImage != null
                  ? Image.memory(_profileWebImage!, fit: BoxFit.cover) // 📸 Preview web
                  : (imageUrl != null && imageUrl!.isNotEmpty
                      ? CachedNetworkImage(
                          imageUrl: imageUrl!,
                          fit: BoxFit.cover,
                          placeholder: (_, __) => const Center(
                            child: CircularProgressIndicator(
                              color: Colors.lightBlueAccent,
                            ),
                          ),
                        )
                      : Image.asset(
                          "assets/images/blank.jpg",
                          fit: BoxFit.cover,
                        ))),
        ),
      ),
    ),
    Positioned(
      bottom: 0,
      right: 0,
      child: GestureDetector(
        onTap: pickProfileImage,
        child: Container(
          decoration: BoxDecoration(
            color: Colors.lightBlueAccent,
            shape: BoxShape.circle,
            border: Border.all(color: Colors.white, width: 2),
          ),
          padding: const EdgeInsets.all(8),
          child: const Icon(Icons.camera_alt, color: Colors.black, size: 18),
        ),
      ),
    ),
  ],
),


                        // ---------------- GALLERY ----------------
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text("Gallery",
                                style: TextStyle(
                                    color: Colors.lightBlueAccent,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 16)),
                            Row(
                              children: [
                                IconButton(
                                  icon: Icon(
                                    editMode
                                        ? Icons.check_circle
                                        : Icons.edit,
                                    color: Colors.lightBlueAccent,
                                  ),
                                  tooltip: editMode
                                      ? "Done Editing"
                                      : "Edit Gallery",
                                  onPressed: () =>
                                      setState(() => editMode = !editMode),
                                ),
                                IconButton(
                                  onPressed: uploadingGallery
                                      ? null
                                      : pickAndUploadGalleryImage,
                                  icon: uploadingGallery
                                      ? const SizedBox(
                                          width: 20,
                                          height: 20,
                                          child: CircularProgressIndicator(
                                              strokeWidth: 2),
                                        )
                                      : const Icon(Icons.add_a_photo,
                                          color: Colors.lightBlueAccent),
                                ),
                              ],
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        galleryImages.isEmpty
                            ? const Text("No gallery images yet.",
                                style: TextStyle(color: Colors.white70))
                            : GridView.builder(
                                physics:
                                    const NeverScrollableScrollPhysics(),
                                shrinkWrap: true,
                                gridDelegate:
                                    const SliverGridDelegateWithFixedCrossAxisCount(
                                  crossAxisCount: 3,
                                  crossAxisSpacing: 8,
                                  mainAxisSpacing: 8,
                                  childAspectRatio: 1,
                                ),
                                itemCount: galleryImages.length,
                                itemBuilder: (context, index) {
                                  final img = galleryImages[index];
                                  final id = img['id'];
                                  return Stack(
                                    children: [
                                      ClipRRect(
                                        borderRadius:
                                            BorderRadius.circular(12),
                                        child: CachedNetworkImage(
                                          imageUrl: img['imageUrl'],
                                          fit: BoxFit.cover,
                                          width: double.infinity,
                                          height: double.infinity,
                                        ),
                                      ),
                                      if (editMode)
                                        Positioned(
                                          top: 4,
                                          right: 4,
                                          child: Row(
                                            children: [
                                              IconButton(
                                                padding: EdgeInsets.zero,
                                                constraints:
                                                    const BoxConstraints(
                                                        minWidth: 30,
                                                        minHeight: 30),
                                                icon: const Icon(Icons.edit,
                                                    color:
                                                        Colors.lightBlueAccent,
                                                    size: 18),
                                                onPressed: () =>
                                                    editGalleryCaption(
                                                        id, img['caption']),
                                              ),
                                              IconButton(
                                                padding: EdgeInsets.zero,
                                                constraints:
                                                    const BoxConstraints(
                                                        minWidth: 30,
                                                        minHeight: 30),
                                                icon: deletingGallery
                                                        .contains(id)
                                                    ? const SizedBox(
                                                        width: 16,
                                                        height: 16,
                                                        child:
                                                            CircularProgressIndicator(
                                                          strokeWidth: 2,
                                                          color:
                                                              Colors.redAccent,
                                                        ),
                                                      )
                                                    : const Icon(Icons.delete,
                                                        color:
                                                            Colors.redAccent,
                                                        size: 18),
                                                onPressed: () =>
                                                    deleteGalleryImage(id,
                                                        img['imageUrl']),
                                              ),
                                            ],
                                          ),
                                        ),
                                    ],
                                  );
                                },
                              ),
                        const SizedBox(height: 25),

                        // ---------------- LOCATION ----------------
                        const Align(
                          alignment: Alignment.centerLeft,
                          child: Text("Shop Location",
                              style: TextStyle(
                                  color: Colors.lightBlueAccent,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 16)),
                        ),
                        const SizedBox(height: 10),
                        ElevatedButton.icon(
                          onPressed: pickLocation,
                          icon: const Icon(Icons.location_on,
                              color: Colors.white),
                          label: const Text("Choose Shop Location"),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.lightBlueAccent,
                            foregroundColor: Colors.black,
                            minimumSize:
                                const Size(double.infinity, 50),
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12)),
                          ),
                        ),
                        if (latitude != null && longitude != null)
                          Padding(
                            padding:
                                const EdgeInsets.only(top: 16.0),
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(12),
                              child: Container(
                                height: 180,
                                decoration: BoxDecoration(
                                  border: Border.all(
                                      color: Colors.lightBlueAccent
                                          .withOpacity(0.4)),
                                ),
                                child: GoogleMap(
                                  initialCameraPosition:
                                      CameraPosition(
                                          target: LatLng(
                                              latitude!, longitude!),
                                          zoom: 15),
                                  markers: {
                                    Marker(
                                        markerId:
                                            const MarkerId('shop'),
                                        position: LatLng(
                                            latitude!, longitude!))
                                  },
                                  zoomControlsEnabled: false,
                                  scrollGesturesEnabled: false,
                                  rotateGesturesEnabled: false,
                                  tiltGesturesEnabled: false,
                                  myLocationEnabled: false,
                                ),
                              ),
                            ),
                          ),
                        const SizedBox(height: 30),

                        // ---------------- PROFILE FIELDS ----------------
                        const Align(
                          alignment: Alignment.centerLeft,
                          child: Text("Profile Information",
                              style: TextStyle(
                                  color: Colors.lightBlueAccent,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 16)),
                        ),
                        const SizedBox(height: 10),
                        field("Barber Name", nameCtrl, icon: Icons.person),
                        const SizedBox(height: 8),
                        field("Email", emailCtrl, icon: Icons.email),
                        const SizedBox(height: 8),
                        field("Phone Number", phoneCtrl,
                            icon: Icons.phone),
                        const SizedBox(height: 8),
                        field("Address", addressCtrl, icon: Icons.home),
                        const SizedBox(height: 8),
                        field("Description", descriptionCtrl,
                            maxLines: 3, icon: Icons.description),
                        const SizedBox(height: 8),
                        field("Barber Type", barberTypeCtrl,
                            icon: Icons.cut),
                        const SizedBox(height: 8),
                        field("Experience (years)", experienceCtrl,
                            icon: Icons.timer),
                        const SizedBox(height: 25),

                        // ---------------- SAVE ----------------
                        ElevatedButton.icon(
                          onPressed:
                              (saving || uploadingProfile) ? null : saveProfile,
                          icon: (saving || uploadingProfile)
                              ? const SizedBox(
                                  width: 20,
                                  height: 20,
                                  child: CircularProgressIndicator(
                                      strokeWidth: 2, color: Colors.black),
                                )
                              : const Icon(Icons.save_alt,
                                  color: Colors.black),
                          label: const Text("Save Changes",
                              style: TextStyle(
                                  color: Colors.black,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 16)),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.lightBlueAccent,
                            minimumSize:
                                const Size(double.infinity, 52),
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12)),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}
