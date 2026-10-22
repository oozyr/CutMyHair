import type { Service } from '../types';

export const seedServices: Service[] = [
  // shop-001
  { id: 'svc-001-1', shopId: 'shop-001', name: 'Classic Haircut', nameMs: 'Gunting Klasik', price: 15, durationMinutes: 30, description: 'Traditional scissor cut and style.' },
  { id: 'svc-001-2', shopId: 'shop-001', name: 'Shave', nameMs: 'Cukur', price: 12, durationMinutes: 30, description: 'Clean razor shave with hot towel.' },
  { id: 'svc-001-3', shopId: 'shop-001', name: 'Haircut + Shave', nameMs: 'Gunting + Cukur', price: 25, durationMinutes: 60, description: 'Full grooming combo.' },

  // shop-002
  { id: 'svc-002-1', shopId: 'shop-002', name: 'Skin Fade', nameMs: 'Fade Kulit', price: 30, durationMinutes: 45, description: 'Low, mid or high skin fade.' },
  { id: 'svc-002-2', shopId: 'shop-002', name: 'Taper Fade', nameMs: 'Taper Fade', price: 28, durationMinutes: 45, description: 'Classic taper with textured top.' },
  { id: 'svc-002-3', shopId: 'shop-002', name: 'Beard Trim', nameMs: 'Trim Janggut', price: 18, durationMinutes: 30, description: 'Shape and trim beard with line-up.' },
  { id: 'svc-002-4', shopId: 'shop-002', name: 'Cut + Beard', nameMs: 'Gunting + Janggut', price: 45, durationMinutes: 75, description: 'Fade or taper with beard styling.' },

  // shop-003
  { id: 'svc-003-1', shopId: 'shop-003', name: 'Modern Cut', nameMs: 'Gunting Moden', price: 20, durationMinutes: 30, description: 'Contemporary styles with scissor and clipper work.' },
  { id: 'svc-003-2', shopId: 'shop-003', name: 'Undercut', nameMs: 'Undercut', price: 22, durationMinutes: 30, description: 'Disconnected undercut with textured top.' },
  { id: 'svc-003-3', shopId: 'shop-003', name: 'Hair Colour', nameMs: 'Warna Rambut', price: 60, durationMinutes: 90, description: 'Full colour or highlights.' },

  // shop-004
  { id: 'svc-004-1', shopId: 'shop-004', name: 'Premium Haircut', nameMs: 'Gunting Premium', price: 35, durationMinutes: 45, description: 'Precision cut with wash and style.' },
  { id: 'svc-004-2', shopId: 'shop-004', name: 'Hot Towel Shave', nameMs: 'Cukur Tuala Panas', price: 30, durationMinutes: 45, description: 'Traditional straight razor shave.' },
  { id: 'svc-004-3', shopId: 'shop-004', name: 'Full Grooming', nameMs: 'Grooming Penuh', price: 65, durationMinutes: 90, description: 'Cut, shave and face mask.' },

  // shop-005
  { id: 'svc-005-1', shopId: 'shop-005', name: 'Gunting Biasa', nameMs: 'Gunting Biasa', price: 12, durationMinutes: 30, description: 'Gunting rambut standard dengan sikat.' },
  { id: 'svc-005-2', shopId: 'shop-005', name: 'Cukur Janggut', nameMs: 'Cukur Janggut', price: 10, durationMinutes: 30, description: 'Cukur dan kemas janggut.' },

  // shop-006
  { id: 'svc-006-1', shopId: 'shop-006', name: 'Skin Fade', nameMs: 'Fade Kulit', price: 32, durationMinutes: 45, description: 'Specialist skin fade, any level.' },
  { id: 'svc-006-2', shopId: 'shop-006', name: 'Burst Fade', nameMs: 'Burst Fade', price: 35, durationMinutes: 45, description: 'Burst fade with curls or waves on top.' },
  { id: 'svc-006-3', shopId: 'shop-006', name: 'Textured Crop', nameMs: 'Crop Berstruktur', price: 28, durationMinutes: 30, description: 'French crop with fade.' },

  // shop-007
  { id: 'svc-007-1', shopId: 'shop-007', name: 'Basic Cut', nameMs: 'Gunting Asas', price: 14, durationMinutes: 30, description: 'Simple and clean cut.' },
  { id: 'svc-007-2', shopId: 'shop-007', name: 'Kids Cut', nameMs: 'Gunting Kanak-kanak', price: 10, durationMinutes: 30, description: 'Haircut for children under 12.' },
  { id: 'svc-007-3', shopId: 'shop-007', name: 'Senior Cut', nameMs: 'Gunting Warga Emas', price: 12, durationMinutes: 30, description: 'Discounted rate for seniors.' },

  // shop-008
  { id: 'svc-008-1', shopId: 'shop-008', name: 'Classic Cut', nameMs: 'Gunting Klasik', price: 25, durationMinutes: 30, description: 'Scissor cut and blow dry.' },
  { id: 'svc-008-2', shopId: 'shop-008', name: 'Hot Towel Shave', nameMs: 'Cukur Tuala Panas', price: 28, durationMinutes: 45, description: 'Luxury hot towel straight razor shave.' },
  { id: 'svc-008-3', shopId: 'shop-008', name: 'Gentleman Package', nameMs: 'Pakej Gentlemen', price: 50, durationMinutes: 75, description: 'Cut, shave and scalp massage.' },

  // shop-009
  { id: 'svc-009-1', shopId: 'shop-009', name: 'Quick Cut', nameMs: 'Gunting Pantas', price: 12, durationMinutes: 30, description: 'Fast clipper cut.' },
  { id: 'svc-009-2', shopId: 'shop-009', name: 'Fade Cut', nameMs: 'Gunting Fade', price: 20, durationMinutes: 30, description: 'Mid or low fade with cut on top.' },

  // shop-010
  { id: 'svc-010-1', shopId: 'shop-010', name: 'Standard Cut', nameMs: 'Gunting Standard', price: 15, durationMinutes: 30, description: 'Trusted everyday haircut.' },
  { id: 'svc-010-2', shopId: 'shop-010', name: 'Cut + Beard', nameMs: 'Gunting + Janggut', price: 25, durationMinutes: 60, description: 'Haircut with beard trim.' },
  { id: 'svc-010-3', shopId: 'shop-010', name: 'Relaxer Treatment', nameMs: 'Rawatan Pelurus', price: 80, durationMinutes: 120, description: 'Chemical straightening treatment.' },
];
