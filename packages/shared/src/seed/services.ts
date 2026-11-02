import type { Service } from '../types';

export const seedServices: Service[] = [
  // shop-001 (Peel / Maluri)
  { id: 'svc-001-1', shopId: 'shop-001', name: 'Classic Haircut', nameMs: 'Gunting Klasik', price: 2000, durationMinutes: 30, description: 'Traditional scissor and clipper cut.' },
  { id: 'svc-001-2', shopId: 'shop-001', name: 'Clean Shave', nameMs: 'Cukur Bersih', price: 1500, durationMinutes: 30, description: 'Clean razor shave with hot towel.' },
  { id: 'svc-001-3', shopId: 'shop-001', name: 'Haircut + Shave Combo', nameMs: 'Gunting + Cukur Kombo', price: 3200, durationMinutes: 60, description: 'Full grooming combo.' },
  { id: 'svc-001-4', shopId: 'shop-001', name: 'Kids Haircut', nameMs: 'Gunting Kanak-kanak', price: 1500, durationMinutes: 30, description: 'Gentle haircut for kids under 12.' },
  { id: 'svc-001-5', shopId: 'shop-001', name: 'Beard Trim & Shape', nameMs: 'Trim & Kemas Janggut', price: 1500, durationMinutes: 25, description: 'Precise beard line-up.' },
  { id: 'svc-001-6', shopId: 'shop-001', name: 'Hair Colouring', nameMs: 'Pewarna Rambut', price: 11000, durationMinutes: 75, description: 'Natural dark or fashion colour.' },

  // shop-002 (Leisure Mall)
  { id: 'svc-002-1', shopId: 'shop-002', name: 'Skin Fade', nameMs: 'Fade Kulit', price: 2500, durationMinutes: 45, description: 'Low, mid or high skin fade.' },
  { id: 'svc-002-2', shopId: 'shop-002', name: 'Taper Fade', nameMs: 'Taper Fade', price: 2500, durationMinutes: 45, description: 'Classic taper with textured top.' },
  { id: 'svc-002-3', shopId: 'shop-002', name: 'Beard Trim & Sculpt', nameMs: 'Trim & Ukir Janggut', price: 1800, durationMinutes: 30, description: 'Shape and trim beard with razor line-up.' },
  { id: 'svc-002-4', shopId: 'shop-002', name: 'Cut + Beard Styling', nameMs: 'Gunting + Gaya Janggut', price: 4000, durationMinutes: 60, description: 'Fade or taper with beard styling.' },
  { id: 'svc-002-5', shopId: 'shop-002', name: 'Basic Cut', nameMs: 'Gunting Asas', price: 2000, durationMinutes: 30, description: 'Standard men haircut.' },
  { id: 'svc-002-6', shopId: 'shop-002', name: 'Premium Hair Colouring', nameMs: 'Warna Rambut Premium', price: 13500, durationMinutes: 90, description: 'Full bleach and tone colour.' },

  // shop-003 (Cheras Baru)
  { id: 'svc-003-1', shopId: 'shop-003', name: 'Modern Scissor Cut', nameMs: 'Gunting Moden', price: 2200, durationMinutes: 30, description: 'Contemporary scissor work.' },
  { id: 'svc-003-2', shopId: 'shop-003', name: 'Skin Fade', nameMs: 'Fade Kulit', price: 2500, durationMinutes: 40, description: 'Zero fade with razor clean.' },
  { id: 'svc-003-3', shopId: 'shop-003', name: 'Express Hair Colour', nameMs: 'Warna Rambut Pantas', price: 10000, durationMinutes: 60, description: 'Single tone coverage.' },
  { id: 'svc-003-4', shopId: 'shop-003', name: 'Kids Cut', nameMs: 'Gunting Kanak-kanak', price: 1500, durationMinutes: 30, description: 'Fun and patient cut for kids.' },
  { id: 'svc-003-5', shopId: 'shop-003', name: 'Beard Grooming', nameMs: 'Dandanan Janggut', price: 1600, durationMinutes: 25, description: 'Hot oil and trim.' },

  // shop-004 (Taman Connaught)
  { id: 'svc-004-1', shopId: 'shop-004', name: 'Gentlemen Cut & Wash', nameMs: 'Gunting & Cuci Gentlemen', price: 2800, durationMinutes: 45, description: 'Precision cut with shampoo and styling.' },
  { id: 'svc-004-2', shopId: 'shop-004', name: 'Hot Towel Royal Shave', nameMs: 'Cukur Diraja Tuala Panas', price: 2400, durationMinutes: 40, description: 'Traditional straight razor shave.' },
  { id: 'svc-004-3', shopId: 'shop-004', name: 'Full Grooming Ritual', nameMs: 'Grooming Penuh', price: 5500, durationMinutes: 75, description: 'Cut, shave, facial massage and mask.' },
  { id: 'svc-004-4', shopId: 'shop-004', name: 'Skin Fade Specialist', nameMs: 'Fade Kulit Pakar', price: 2600, durationMinutes: 45, description: 'Zero-gap clipper blend.' },
  { id: 'svc-004-5', shopId: 'shop-004', name: 'Platinum Hair Colouring', nameMs: 'Pewarna Platinum', price: 15000, durationMinutes: 100, description: 'Double bleach and toning.' },

  // shop-005 (Taman Midah)
  { id: 'svc-005-1', shopId: 'shop-005', name: 'Gunting Biasa / Basic Cut', nameMs: 'Gunting Biasa', price: 2000, durationMinutes: 30, description: 'Gunting rambut standard kemas.' },
  { id: 'svc-005-2', shopId: 'shop-005', name: 'Cukur Tradisional', nameMs: 'Cukur Tradisional', price: 1500, durationMinutes: 25, description: 'Cukur bersih dengan pisau lipat.' },
  { id: 'svc-005-3', shopId: 'shop-005', name: 'Gunting Kanak-kanak', nameMs: 'Gunting Kanak-kanak', price: 1500, durationMinutes: 30, description: 'Potongan mesra kanak-kanak.' },
  { id: 'svc-005-4', shopId: 'shop-005', name: 'Kemas Janggut & Misai', nameMs: 'Kemas Janggut & Misai', price: 1500, durationMinutes: 25, description: 'Trim janggut dan misai.' },

  // shop-006 (Bandar Tun Razak)
  { id: 'svc-006-1', shopId: 'shop-006', name: 'Skin Fade Signature', nameMs: 'Fade Kulit Khas', price: 2500, durationMinutes: 40, description: 'Pakar low/mid/high skin fade.' },
  { id: 'svc-006-2', shopId: 'shop-006', name: 'Burst Fade', nameMs: 'Burst Fade', price: 2700, durationMinutes: 45, description: 'Burst fade with curl sponge top.' },
  { id: 'svc-006-3', shopId: 'shop-006', name: 'Textured French Crop', nameMs: 'Crop Berstruktur', price: 2400, durationMinutes: 35, description: 'Crop moden dengan fade.' },
  { id: 'svc-006-4', shopId: 'shop-006', name: 'Kids Haircut', nameMs: 'Gunting Kanak-kanak', price: 1600, durationMinutes: 30, description: 'Gunting kanak-kanak sekolah.' },
  { id: 'svc-006-5', shopId: 'shop-006', name: 'Fashion Hair Bleach & Tone', nameMs: 'Lunturan & Warna Fesyen', price: 12500, durationMinutes: 90, description: 'Warna fesyen kelabu, blonde atau coklat.' },

  // shop-007 (Sri Petaling)
  { id: 'svc-007-1', shopId: 'shop-007', name: 'Standard Haircut', nameMs: 'Gunting Standard', price: 2200, durationMinutes: 30, description: 'Modern scissor and clipper styling.' },
  { id: 'svc-007-2', shopId: 'shop-007', name: 'Skin Fade', nameMs: 'Fade Kulit', price: 2500, durationMinutes: 40, description: 'Zero skin taper or fade.' },
  { id: 'svc-007-3', shopId: 'shop-007', name: 'Kids Cut', nameMs: 'Gunting Kanak-kanak', price: 1600, durationMinutes: 30, description: 'Gentle haircut for boys.' },
  { id: 'svc-007-4', shopId: 'shop-007', name: 'Beard Trim & Lineup', nameMs: 'Trim Janggut & Garisan', price: 1700, durationMinutes: 25, description: 'Clean lines with foil shaver.' },
  { id: 'svc-007-5', shopId: 'shop-007', name: 'Full Hair Colour', nameMs: 'Warna Rambut Penuh', price: 12000, durationMinutes: 80, description: 'Premium ammonia-free colour.' },

  // shop-008 (Bukit Jalil)
  { id: 'svc-008-1', shopId: 'shop-008', name: 'Executive Haircut', nameMs: 'Gunting Eksekutif', price: 2800, durationMinutes: 40, description: 'Professional consultation, cut and wash.' },
  { id: 'svc-008-2', shopId: 'shop-008', name: 'Hot Towel Deluxe Shave', nameMs: 'Cukur Mewah Tuala Panas', price: 2400, durationMinutes: 35, description: 'Three hot towels and straight razor.' },
  { id: 'svc-008-3', shopId: 'shop-008', name: 'Signature Skin Fade', nameMs: 'Fade Kulit Khas', price: 2600, durationMinutes: 45, description: 'Razor-sharp skin transition.' },
  { id: 'svc-008-4', shopId: 'shop-008', name: 'Executive Grooming Package', nameMs: 'Pakej Dandanan Eksekutif', price: 5800, durationMinutes: 80, description: 'Cut, wash, shave and scalp detox.' },
  { id: 'svc-008-5', shopId: 'shop-008', name: 'Creative Hair Tinting', nameMs: 'Pewarna Rambut Kreatif', price: 14000, durationMinutes: 90, description: 'Highlights or balayage for men.' },

  // shop-009 (Pandan Indah)
  { id: 'svc-009-1', shopId: 'shop-009', name: 'Quick Clipper Cut', nameMs: 'Gunting Pantas Mesin', price: 2000, durationMinutes: 25, description: 'Fast and neat clipper trim.' },
  { id: 'svc-009-2', shopId: 'shop-009', name: 'Fade Cut', nameMs: 'Gunting Fade', price: 2400, durationMinutes: 35, description: 'Mid or low taper fade.' },
  { id: 'svc-009-3', shopId: 'shop-009', name: 'Kids Haircut', nameMs: 'Gunting Kanak-kanak', price: 1500, durationMinutes: 30, description: 'Haircut for students under 12.' },
  { id: 'svc-009-4', shopId: 'shop-009', name: 'Beard Trim', nameMs: 'Trim Janggut', price: 1500, durationMinutes: 20, description: 'Quick beard outline.' },

  // shop-010 (Kuchai Lama)
  { id: 'svc-010-1', shopId: 'shop-010', name: 'Standard Cut & Style', nameMs: 'Gunting Standard & Gaya', price: 2000, durationMinutes: 30, description: 'Reliable everyday cut.' },
  { id: 'svc-010-2', shopId: 'shop-010', name: 'Skin Fade Special', nameMs: 'Khas Fade Kulit', price: 2500, durationMinutes: 40, description: 'Ultra close skin taper.' },
  { id: 'svc-010-3', shopId: 'shop-010', name: 'Beard Sculpt & Shave', nameMs: 'Bentuk Janggut & Cukur', price: 1800, durationMinutes: 30, description: 'Precision razor edging.' },
  { id: 'svc-010-4', shopId: 'shop-010', name: 'Hair Colour Treatment', nameMs: 'Rawatan Pewarna Rambut', price: 11500, durationMinutes: 75, description: 'Grey blending or vivid tone.' },

  // shop-011 (Ampang Town)
  { id: 'svc-011-1', shopId: 'shop-011', name: 'Pekan Ampang Classic Cut', nameMs: 'Gunting Klasik Ampang', price: 2000, durationMinutes: 30, description: 'Traditional barbering heritage cut.' },
  { id: 'svc-011-2', shopId: 'shop-011', name: 'Skin Fade Blend', nameMs: 'Campuran Fade Kulit', price: 2500, durationMinutes: 40, description: 'Smooth clipper fade.' },
  { id: 'svc-011-3', shopId: 'shop-011', name: 'Hot Towel Beard Shave', nameMs: 'Cukur Tuala Panas', price: 2000, durationMinutes: 30, description: 'Relaxing hot towel and foam shave.' },
  { id: 'svc-011-4', shopId: 'shop-011', name: 'Kids Trim', nameMs: 'Trim Kanak-kanak', price: 1500, durationMinutes: 25, description: 'Quick kid haircut.' },

  // shop-012 (Taman Desa)
  { id: 'svc-012-1', shopId: 'shop-012', name: 'Desa Scissor Haircut', nameMs: 'Gunting Gunting Desa', price: 2200, durationMinutes: 35, description: 'Meticulous scissor over comb.' },
  { id: 'svc-012-2', shopId: 'shop-012', name: 'Skin Fade', nameMs: 'Fade Kulit', price: 2500, durationMinutes: 40, description: 'Clean zero fade.' },
  { id: 'svc-012-3', shopId: 'shop-012', name: 'Beard Trim', nameMs: 'Trim Janggut', price: 1500, durationMinutes: 25, description: 'Beard tidy and balm.' },
  { id: 'svc-012-4', shopId: 'shop-012', name: 'Grey Camo Colour', nameMs: 'Pewarna Samaran Uban', price: 10500, durationMinutes: 60, description: 'Subtle 10-minute grey blending.' },

  // shop-013 (Salak Selatan)
  { id: 'svc-013-1', shopId: 'shop-013', name: 'Artisan Fade', nameMs: 'Fade Artisanal', price: 2500, durationMinutes: 40, description: 'Tailored fade to head shape.' },
  { id: 'svc-013-2', shopId: 'shop-013', name: 'Standard Haircut', nameMs: 'Gunting Standard', price: 2000, durationMinutes: 30, description: 'Clean cut and neck shave.' },
  { id: 'svc-013-3', shopId: 'shop-013', name: 'Beard Trimming', nameMs: 'Trim Janggut', price: 1600, durationMinutes: 25, description: 'Edge lining and oil.' },
  { id: 'svc-013-4', shopId: 'shop-013', name: 'Hair Dye / Colouring', nameMs: 'Pewarna Rambut', price: 11000, durationMinutes: 70, description: 'Deep black or dark brown.' },

  // shop-014 (Taman Segar)
  { id: 'svc-014-1', shopId: 'shop-014', name: 'Segar Everyday Cut', nameMs: 'Gunting Harian Segar', price: 2000, durationMinutes: 30, description: 'Comfortable family haircut.' },
  { id: 'svc-014-2', shopId: 'shop-014', name: 'Taper / Fade', nameMs: 'Taper / Fade', price: 2400, durationMinutes: 35, description: 'Clean taper at temples and nape.' },
  { id: 'svc-014-3', shopId: 'shop-014', name: 'Kids School Cut', nameMs: 'Gunting Sekolah Budak', price: 1500, durationMinutes: 25, description: 'Disiplin sekolah standard.' },
  { id: 'svc-014-4', shopId: 'shop-014', name: 'Full Shave', nameMs: 'Cukur Penuh', price: 1800, durationMinutes: 30, description: 'Straight razor face shave.' },

  // shop-015 (Shamelin Perkasa)
  { id: 'svc-015-1', shopId: 'shop-015', name: 'Loft Precision Cut', nameMs: 'Gunting Ketepatan Loft', price: 2500, durationMinutes: 40, description: 'Modern layered cut with texture.' },
  { id: 'svc-015-2', shopId: 'shop-015', name: 'Skin Fade Sharpness', nameMs: 'Fade Kulit Tajam', price: 2600, durationMinutes: 45, description: 'Foil shaver zero finish.' },
  { id: 'svc-015-3', shopId: 'shop-015', name: 'Beard Spa & Shape', nameMs: 'Spa & Bentuk Janggut', price: 2000, durationMinutes: 30, description: 'Hot towel, trim and beard butter.' },
  { id: 'svc-015-4', shopId: 'shop-015', name: 'Colour Bleach & Ash Grey', nameMs: 'Peluntur & Warna Kelabu', price: 14500, durationMinutes: 90, description: 'Trending ash tones.' },

  // shop-016 (Sungai Besi)
  { id: 'svc-016-1', shopId: 'shop-016', name: 'Vintage Scissor Cut', nameMs: 'Gunting Vintaj', price: 2000, durationMinutes: 30, description: 'Classic gentleman style.' },
  { id: 'svc-016-2', shopId: 'shop-016', name: 'Skin Fade', nameMs: 'Fade Kulit', price: 2400, durationMinutes: 35, description: 'Low and clean fade.' },
  { id: 'svc-016-3', shopId: 'shop-016', name: 'Barber Hot Shave', nameMs: 'Cukur Panas Barber', price: 1800, durationMinutes: 30, description: 'Traditional lather and blade.' },
  { id: 'svc-016-4', shopId: 'shop-016', name: 'Kids Haircut', nameMs: 'Gunting Budak', price: 1500, durationMinutes: 25, description: 'Comfort cut for little ones.' },

  // shop-017 (Ampang Hills - Outside 1)
  { id: 'svc-017-1', shopId: 'shop-017', name: 'Hilltop Scissor Cut', nameMs: 'Gunting Bukit Gunting', price: 2200, durationMinutes: 35, description: 'Relaxed salon scissor cut.' },
  { id: 'svc-017-2', shopId: 'shop-017', name: 'Zero Fade', nameMs: 'Zero Fade', price: 2500, durationMinutes: 40, description: 'High contrast fade.' },
  { id: 'svc-017-3', shopId: 'shop-017', name: 'Beard Trim', nameMs: 'Trim Janggut', price: 1700, durationMinutes: 25, description: 'Neat edge detailing.' },
  { id: 'svc-017-4', shopId: 'shop-017', name: 'Men Hair Colour', nameMs: 'Pewarna Rambut Lelaki', price: 12000, durationMinutes: 75, description: 'Organic herbal dye.' },

  // shop-018 (Cheras Perdana - Outside 2)
  { id: 'svc-018-1', shopId: 'shop-018', name: 'Perdana Standard Cut', nameMs: 'Gunting Standard Perdana', price: 2000, durationMinutes: 30, description: 'Clean clipper and scissor cut.' },
  { id: 'svc-018-2', shopId: 'shop-018', name: 'Skin Fade', nameMs: 'Fade Kulit', price: 2400, durationMinutes: 40, description: 'Seamless skin fade.' },
  { id: 'svc-018-3', shopId: 'shop-018', name: 'Kids Haircut', nameMs: 'Gunting Kanak-kanak', price: 1500, durationMinutes: 25, description: 'Quick school trim.' },
  { id: 'svc-018-4', shopId: 'shop-018', name: 'Hair Colour Highlights', nameMs: 'Highlight Warna Rambut', price: 13000, durationMinutes: 80, description: 'Subtle brown and caramel streaks.' },

  // shop-019 (Balakong - Outside 3)
  { id: 'svc-019-1', shopId: 'shop-019', name: 'Express Workday Cut', nameMs: 'Gunting Pantas Kerja', price: 2000, durationMinutes: 25, description: 'Fast professional haircut.' },
  { id: 'svc-019-2', shopId: 'shop-019', name: 'Skin Fade Specialist', nameMs: 'Fade Kulit Pakar', price: 2500, durationMinutes: 40, description: 'High taper and fade.' },
  { id: 'svc-019-3', shopId: 'shop-019', name: 'Hot Towel Clean Shave', nameMs: 'Cukur Bersih Tuala Panas', price: 1900, durationMinutes: 30, description: 'Classic shaving treatment.' },
  { id: 'svc-019-4', shopId: 'shop-019', name: 'Full Combo Package', nameMs: 'Pakej Kombo Penuh', price: 4800, durationMinutes: 65, description: 'Cut, wash and razor beard.' },

  // shop-020 (Bandar Mahkota - Outside 4)
  { id: 'svc-020-1', shopId: 'shop-020', name: 'Mahkota Signature Cut', nameMs: 'Gunting Khas Mahkota', price: 2400, durationMinutes: 35, description: 'Detailed haircut with blow dry.' },
  { id: 'svc-020-2', shopId: 'shop-020', name: 'Skin Fade', nameMs: 'Fade Kulit', price: 2600, durationMinutes: 40, description: 'Precision razor fade.' },
  { id: 'svc-020-3', shopId: 'shop-020', name: 'Beard Sculpture', nameMs: 'Ukir Janggut', price: 1800, durationMinutes: 25, description: 'Line up and conditioning.' },
  { id: 'svc-020-4', shopId: 'shop-020', name: 'Full Hair Colouring', nameMs: 'Pewarna Rambut Penuh', price: 13500, durationMinutes: 85, description: 'Complete hair colour makeover.' },

  // shop-free-001 (Freelance Barber Razif - Midah)
  { id: 'svc-free-001-1', shopId: 'shop-free-001', name: 'Mobile House-Call Haircut', nameMs: 'Gunting Rambut Ke Rumah', price: 3500, durationMinutes: 45, description: 'Professional haircut at your home.' },
  { id: 'svc-free-001-2', shopId: 'shop-free-001', name: 'Mobile Skin Fade', nameMs: 'Fade Kulit Ke Rumah', price: 4000, durationMinutes: 50, description: 'Skin fade delivered to your location.' },
  { id: 'svc-free-001-3', shopId: 'shop-free-001', name: 'Mobile Cut & Beard Combo', nameMs: 'Kombo Gunting & Janggut', price: 5000, durationMinutes: 65, description: 'Complete haircut and beard styling.' },
  { id: 'svc-free-001-4', shopId: 'shop-free-001', name: 'Kids Haircut House-Call', nameMs: 'Gunting Budak Ke Rumah', price: 2500, durationMinutes: 30, description: 'Stress-free haircut for your child at home.' },

  // shop-free-002 (Freelance Stylist Daniel - Sri Petaling)
  { id: 'svc-free-002-1', shopId: 'shop-free-002', name: 'Home Visit Scissor Cut', nameMs: 'Gunting Gunting Rumah', price: 3800, durationMinutes: 45, description: 'Customised bespoke cut at your doorstep.' },
  { id: 'svc-free-002-2', shopId: 'shop-free-002', name: 'Mobile Fade & Texture', nameMs: 'Fade & Tekstur Mudah Alih', price: 4200, durationMinutes: 50, description: 'Modern fade and crop styling.' },
  { id: 'svc-free-002-3', shopId: 'shop-free-002', name: 'On-Demand Hair Colour', nameMs: 'Warna Rambut Atas Talian', price: 16000, durationMinutes: 100, description: 'Hair colouring in your own comfort.' },
  { id: 'svc-free-002-4', shopId: 'shop-free-002', name: 'Beard Detailing & Lineup', nameMs: 'Dandanan Garis Janggut', price: 2500, durationMinutes: 30, description: 'Sharp razor lines.' },

  // shop-free-003 (Freelance Mobile Barber Sam - Pandan Indah)
  { id: 'svc-free-003-1', shopId: 'shop-free-003', name: 'Doorstep Standard Cut', nameMs: 'Gunting Depan Pintu', price: 3500, durationMinutes: 40, description: 'Quick, tidy cut at your premises.' },
  { id: 'svc-free-003-2', shopId: 'shop-free-003', name: 'Doorstep Skin Fade', nameMs: 'Fade Kulit Depan Pintu', price: 4000, durationMinutes: 50, description: 'Zero fade with mobile equipment.' },
  { id: 'svc-free-003-3', shopId: 'shop-free-003', name: 'Doorstep Father & Son Combo', nameMs: 'Kombo Bapa & Anak', price: 5500, durationMinutes: 70, description: 'Two haircuts in one single visit.' },
  { id: 'svc-free-003-4', shopId: 'shop-free-003', name: 'Doorstep Beard Trim', nameMs: 'Trim Janggut Depan Pintu', price: 2000, durationMinutes: 25, description: 'Beard maintenance at home.' },
];
