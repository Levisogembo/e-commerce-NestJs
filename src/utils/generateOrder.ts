import { customAlphabet } from 'nanoid';

// Numbers + uppercase letters only
const nanoid = customAlphabet(
  '123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  8
);

export function generateOrderNumber(): string {
  return `ORD-${nanoid()}`;
}