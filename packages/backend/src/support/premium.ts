/** Manual grants are independent of donations and never enter the public payment ledger. */
export function hasPremium(totalCents: number, features?: { premiumGrantedAt?: Date } | null): boolean {
  return totalCents >= 1000 || features?.premiumGrantedAt instanceof Date;
}
