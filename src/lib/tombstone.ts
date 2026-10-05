import { DELETED_FLOOR_NUMBER_BELOW } from "@/lib/format";

// Floors and flats are soft-deleted (their rows stay for rent/lease
// history), but floor and flat numbers are unique per building/floor.
// When a row is deleted its number is replaced with a "tombstone" value,
// so the landlord can immediately create a new floor/flat with the same
// number. formatFloor / formatFlatNumber hide tombstones in history views.

export function tombstoneFloorNumber() {
  return (
    DELETED_FLOOR_NUMBER_BELOW - 1 - Math.floor(Math.random() * 1_000_000_000)
  );
}

export function tombstoneFlatNumber(flatNumber: string, flatId: string) {
  return `${flatNumber}~${flatId.slice(-8)}`;
}
