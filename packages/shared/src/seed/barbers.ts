import type { Barber } from '../types';

export const seedBarbers: Barber[] = [
  // shop-001 (Peel / Maluri)
  { id: 'barb-001-1', shopId: 'shop-001', name: 'Ali bin Hamid', photo: '', bio: '15 tahun pengalaman guntingan klasik.', serviceIds: ['svc-001-1', 'svc-001-2', 'svc-001-3', 'svc-001-4', 'svc-001-5', 'svc-001-6'], isActive: true },
  { id: 'barb-001-2', shopId: 'shop-001', name: 'Roslan Daud', photo: '', bio: 'Pakar gunting tradisional dan cukur.', serviceIds: ['svc-001-1', 'svc-001-2', 'svc-001-4', 'svc-001-5'], isActive: true },

  // shop-002 (Leisure Mall)
  { id: 'barb-002-1', shopId: 'shop-002', name: 'Aiman Razif', photo: '', bio: 'Skin fade specialist, 7 years experience.', serviceIds: ['svc-002-1', 'svc-002-2', 'svc-002-3', 'svc-002-4', 'svc-002-5', 'svc-002-6'], isActive: true },
  { id: 'barb-002-2', shopId: 'shop-002', name: 'Kevin Loh', photo: '', bio: 'Modern cuts and beard artistry.', serviceIds: ['svc-002-2', 'svc-002-3', 'svc-002-4', 'svc-002-5'], isActive: true },
  { id: 'barb-002-3', shopId: 'shop-002', name: 'Shahrulnizam', photo: '', bio: 'Precision fades and hair colouring.', serviceIds: ['svc-002-1', 'svc-002-2', 'svc-002-5', 'svc-002-6'], isActive: true },

  // shop-003 (Cheras Baru)
  { id: 'barb-003-1', shopId: 'shop-003', name: 'Hazwan Azmi', photo: '', bio: 'Trendy cuts and hair colour.', serviceIds: ['svc-003-1', 'svc-003-2', 'svc-003-3', 'svc-003-4', 'svc-003-5'], isActive: true },
  { id: 'barb-003-2', shopId: 'shop-003', name: 'Bryan Chong', photo: '', bio: 'Modern styles for all hair types.', serviceIds: ['svc-003-1', 'svc-003-2', 'svc-003-4', 'svc-003-5'], isActive: true },

  // shop-004 (Taman Connaught)
  { id: 'barb-004-1', shopId: 'shop-004', name: 'Marcus Ng', photo: '', bio: 'Premium grooming expert.', serviceIds: ['svc-004-1', 'svc-004-2', 'svc-004-3', 'svc-004-4', 'svc-004-5'], isActive: true },
  { id: 'barb-004-2', shopId: 'shop-004', name: 'Faizal Akhtar', photo: '', bio: 'Hot towel shave master.', serviceIds: ['svc-004-1', 'svc-004-2', 'svc-004-3', 'svc-004-4'], isActive: true },
  { id: 'barb-004-3', shopId: 'shop-004', name: 'Arun Kumar', photo: '', bio: 'Fade and taper perfectionist.', serviceIds: ['svc-004-1', 'svc-004-3', 'svc-004-4', 'svc-004-5'], isActive: true },

  // shop-005 (Taman Midah)
  { id: 'barb-005-1', shopId: 'shop-005', name: 'Ngah Ibrahim', photo: '', bio: '20 tahun menggunting.', serviceIds: ['svc-005-1', 'svc-005-2', 'svc-005-3', 'svc-005-4'], isActive: true },
  { id: 'barb-005-2', shopId: 'shop-005', name: 'Saiful Bahari', photo: '', bio: 'Kemas dan mesra keluarga.', serviceIds: ['svc-005-1', 'svc-005-2', 'svc-005-3', 'svc-005-4'], isActive: true },

  // shop-006 (Bandar Tun Razak)
  { id: 'barb-006-1', shopId: 'shop-006', name: 'Zikri Hakim', photo: '', bio: 'Fade specialist. IG @zikrifades.', serviceIds: ['svc-006-1', 'svc-006-2', 'svc-006-3', 'svc-006-4', 'svc-006-5'], isActive: true },
  { id: 'barb-006-2', shopId: 'shop-006', name: 'Asrul Nizam', photo: '', bio: 'Textured crops and burst fades.', serviceIds: ['svc-006-1', 'svc-006-2', 'svc-006-3', 'svc-006-4'], isActive: true },
  { id: 'barb-006-3', shopId: 'shop-006', name: 'Danish Haikal', photo: '', bio: 'Pewarna dan penggayaan moden.', serviceIds: ['svc-006-1', 'svc-006-3', 'svc-006-4', 'svc-006-5'], isActive: true },

  // shop-007 (Sri Petaling)
  { id: 'barb-007-1', shopId: 'shop-007', name: 'Azman Sulaiman', photo: '', bio: 'Untuk semua peringkat umur.', serviceIds: ['svc-007-1', 'svc-007-2', 'svc-007-3', 'svc-007-4', 'svc-007-5'], isActive: true },
  { id: 'barb-007-2', shopId: 'shop-007', name: 'Ridhwan Yusof', photo: '', bio: 'Pakar kanak-kanak dan fade.', serviceIds: ['svc-007-1', 'svc-007-2', 'svc-007-3', 'svc-007-4'], isActive: true },

  // shop-008 (Bukit Jalil)
  { id: 'barb-008-1', shopId: 'shop-008', name: 'James Reuben', photo: '', bio: 'Classic barbering with a modern touch.', serviceIds: ['svc-008-1', 'svc-008-2', 'svc-008-3', 'svc-008-4', 'svc-008-5'], isActive: true },
  { id: 'barb-008-2', shopId: 'shop-008', name: 'Prakash Nair', photo: '', bio: 'Hot towel shave aficionado.', serviceIds: ['svc-008-1', 'svc-008-2', 'svc-008-3', 'svc-008-4'], isActive: true },
  { id: 'barb-008-3', shopId: 'shop-008', name: 'Lucas Wong', photo: '', bio: 'Styling, bleaching, and precision fades.', serviceIds: ['svc-008-1', 'svc-008-3', 'svc-008-4', 'svc-008-5'], isActive: true },

  // shop-009 (Pandan Indah)
  { id: 'barb-009-1', shopId: 'shop-009', name: 'Hafizuddin', photo: '', bio: 'Fast and clean cuts.', serviceIds: ['svc-009-1', 'svc-009-2', 'svc-009-3', 'svc-009-4'], isActive: true },
  { id: 'barb-009-2', shopId: 'shop-009', name: 'Sharifuddin Bakar', photo: '', bio: 'Pakar gunting pantas dan kemas.', serviceIds: ['svc-009-1', 'svc-009-2', 'svc-009-3', 'svc-009-4'], isActive: true },

  // shop-010 (Kuchai Lama)
  { id: 'barb-010-1', shopId: 'shop-010', name: 'Subramaniam A/L Raju', photo: '', bio: 'Trusted for 12 years in Cheras.', serviceIds: ['svc-010-1', 'svc-010-2', 'svc-010-3', 'svc-010-4'], isActive: true },
  { id: 'barb-010-2', shopId: 'shop-010', name: 'Fadzillah Borhan', photo: '', bio: 'Barber keluarga, mesra semua.', serviceIds: ['svc-010-1', 'svc-010-2', 'svc-010-3', 'svc-010-4'], isActive: true },

  // shop-011 (Ampang Town)
  { id: 'barb-011-1', shopId: 'shop-011', name: 'Boon Kiat Tan', photo: '', bio: 'Ampang town traditional barber.', serviceIds: ['svc-011-1', 'svc-011-2', 'svc-011-3', 'svc-011-4'], isActive: true },
  { id: 'barb-011-2', shopId: 'shop-011', name: 'Khairul Anuar', photo: '', bio: 'Specialist in fades and hot shaves.', serviceIds: ['svc-011-1', 'svc-011-2', 'svc-011-3', 'svc-011-4'], isActive: true },

  // shop-012 (Taman Desa)
  { id: 'barb-012-1', shopId: 'shop-012', name: 'Kok Leong Chong', photo: '', bio: 'Precision scissor master.', serviceIds: ['svc-012-1', 'svc-012-2', 'svc-012-3', 'svc-012-4'], isActive: true },
  { id: 'barb-012-2', shopId: 'shop-012', name: 'Imran Syafiq', photo: '', bio: 'Modern fades and beard trims.', serviceIds: ['svc-012-1', 'svc-012-2', 'svc-012-3', 'svc-012-4'], isActive: true },

  // shop-013 (Salak Selatan)
  { id: 'barb-013-1', shopId: 'shop-013', name: 'Hazriq Ismail', photo: '', bio: 'Artisan cutter and colourist.', serviceIds: ['svc-013-1', 'svc-013-2', 'svc-013-3', 'svc-013-4'], isActive: true },
  { id: 'barb-013-2', shopId: 'shop-013', name: 'David Lee', photo: '', bio: 'Clean tapers and beard sculpting.', serviceIds: ['svc-013-1', 'svc-013-2', 'svc-013-3', 'svc-013-4'], isActive: true },

  // shop-014 (Taman Segar)
  { id: 'barb-014-1', shopId: 'shop-014', name: 'Mohd Fikri', photo: '', bio: 'Friendly local barber.', serviceIds: ['svc-014-1', 'svc-014-2', 'svc-014-3', 'svc-014-4'], isActive: true },
  { id: 'barb-014-2', shopId: 'shop-014', name: 'Syed Alwi', photo: '', bio: 'Great with kids and classic fades.', serviceIds: ['svc-014-1', 'svc-014-2', 'svc-014-3', 'svc-014-4'], isActive: true },

  // shop-015 (Shamelin Perkasa)
  { id: 'barb-015-1', shopId: 'shop-015', name: 'Calvin Low', photo: '', bio: 'Loft style texture and fade specialist.', serviceIds: ['svc-015-1', 'svc-015-2', 'svc-015-3', 'svc-015-4'], isActive: true },
  { id: 'barb-015-2', shopId: 'shop-015', name: 'Zulhelmi Rashid', photo: '', bio: 'Beard spa and luxury styling.', serviceIds: ['svc-015-1', 'svc-015-2', 'svc-015-3', 'svc-015-4'], isActive: true },

  // shop-016 (Sungai Besi)
  { id: 'barb-016-1', shopId: 'shop-016', name: 'Shamsul Kamal', photo: '', bio: 'Vintage gentleman cut connoisseur.', serviceIds: ['svc-016-1', 'svc-016-2', 'svc-016-3', 'svc-016-4'], isActive: true },
  { id: 'barb-016-2', shopId: 'shop-016', name: 'Naveen Kumar', photo: '', bio: 'Quick fade and clean beard line.', serviceIds: ['svc-016-1', 'svc-016-2', 'svc-016-3', 'svc-016-4'], isActive: true },

  // shop-017 (Ampang Hills - Outside 1)
  { id: 'barb-017-1', shopId: 'shop-017', name: 'Hisham Salleh', photo: '', bio: 'Ampang hills quiet retreat cutter.', serviceIds: ['svc-017-1', 'svc-017-2', 'svc-017-3', 'svc-017-4'], isActive: true },
  { id: 'barb-017-2', shopId: 'shop-017', name: 'Alex Tan', photo: '', bio: 'Precision scissors and colour.', serviceIds: ['svc-017-1', 'svc-017-2', 'svc-017-3', 'svc-017-4'], isActive: true },

  // shop-018 (Cheras Perdana - Outside 2)
  { id: 'barb-018-1', shopId: 'shop-018', name: 'Swee Meng Goh', photo: '', bio: 'Experienced Cheras South barber.', serviceIds: ['svc-018-1', 'svc-018-2', 'svc-018-3', 'svc-018-4'], isActive: true },
  { id: 'barb-018-2', shopId: 'shop-018', name: 'Hairul Azri', photo: '', bio: 'Low fade and beard line expert.', serviceIds: ['svc-018-1', 'svc-018-2', 'svc-018-3', 'svc-018-4'], isActive: true },

  // shop-019 (Balakong - Outside 3)
  { id: 'barb-019-1', shopId: 'shop-019', name: 'Kumar Ananthan', photo: '', bio: 'Fast cuts and hot towel shaves.', serviceIds: ['svc-019-1', 'svc-019-2', 'svc-019-3', 'svc-019-4'], isActive: true },
  { id: 'barb-019-2', shopId: 'shop-019', name: 'Zaim Johari', photo: '', bio: 'Fades and modern comb overs.', serviceIds: ['svc-019-1', 'svc-019-2', 'svc-019-3', 'svc-019-4'], isActive: true },

  // shop-020 (Bandar Mahkota - Outside 4)
  { id: 'barb-020-1', shopId: 'shop-020', name: 'Farid Ramli', photo: '', bio: 'Township barber specialist.', serviceIds: ['svc-020-1', 'svc-020-2', 'svc-020-3', 'svc-020-4'], isActive: true },
  { id: 'barb-020-2', shopId: 'shop-020', name: 'Kenneth Chew', photo: '', bio: 'Creative bleach, tone, and skin fade.', serviceIds: ['svc-020-1', 'svc-020-2', 'svc-020-3', 'svc-020-4'], isActive: true },

  // shop-free-001 (Freelance 1)
  { id: 'barb-free-001', shopId: 'shop-free-001', name: 'Razif Mansor', photo: '', bio: 'Mobile on-demand barber in Cheras.', serviceIds: ['svc-free-001-1', 'svc-free-001-2', 'svc-free-001-3', 'svc-free-001-4'], isActive: true },

  // shop-free-002 (Freelance 2)
  { id: 'barb-free-002', shopId: 'shop-free-002', name: 'Daniel Tan', photo: '', bio: 'Freelance house-call stylist in Sri Petaling & Bukit Jalil.', serviceIds: ['svc-free-002-1', 'svc-free-002-2', 'svc-free-002-3', 'svc-free-002-4'], isActive: true },

  // shop-free-003 (Freelance 3)
  { id: 'barb-free-003', shopId: 'shop-free-003', name: 'Samad Idris', photo: '', bio: 'Mobile barber covering Pandan Indah and Ampang.', serviceIds: ['svc-free-003-1', 'svc-free-003-2', 'svc-free-003-3', 'svc-free-003-4'], isActive: true },
];
