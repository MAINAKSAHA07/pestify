// Generate Mumbai pincodes: 400001 to 400104
const mumbaiPincodes = Array.from({ length: 104 }, (_, i) => String(400001 + i));

export const AREA_PINCODES = {
  'Mumbai': mumbaiPincodes,
  'Navi Mumbai': ['400701', '400703', '400705', '400706', '400708', '400709', '400710', '400614', '400615', '410206', '410210', '410218'],
  'Thane': ['400601', '400602', '400603', '400604', '400605', '400606', '400607', '400608', '400610', '400611', '400612', '400613', '400614', '400615'],
  'Kalyan': ['421301', '421302', '421304', '421306', '421311'],
  'Dombivli': ['421201', '421202', '421203', '421204'],
  'Panvel': ['410206', '410207', '410208', '410209', '410210', '410218', '410221'],
  'Bhiwandi': ['421302', '421305', '421308', '421311'],
};

// Flatten all values to get a list of all approved pincodes
const allApproved = Object.values(AREA_PINCODES).flat();

// Store as Set for quick O(1) lookups
export const APPROVED_PINCODES = new Set(allApproved);

export function getAreaForPincode(pincode) {
  const cleanPin = String(pincode).trim();
  for (const [area, pins] of Object.entries(AREA_PINCODES)) {
    if (pins.includes(cleanPin)) {
      return area;
    }
  }
  return null;
}
