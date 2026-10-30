export type Errors<T> = Partial<Record<keyof T, string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE = /^\+?[0-9 ()-]{7,20}$/;

export function required(value: string, message = "This field is required"): string | undefined {
  return value.trim() ? undefined : message;
}

export function email(value: string): string | undefined {
  if (!value.trim()) return "Email is required";
  return EMAIL.test(value.trim()) ? undefined : "Enter a valid email address";
}

export function phone(value: string): string | undefined {
  if (!value.trim()) return "Phone number is required";
  return PHONE.test(value.trim()) ? undefined : "Enter a valid phone number";
}

export function minLength(value: string, min: number, label = "Password"): string | undefined {
  if (!value) return `${label} is required`;
  return value.length >= min ? undefined : `${label} must be at least ${min} characters`;
}

export function passesLuhn(digits: string): boolean {
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = Number(digits[i]);
    if (double) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    double = !double;
  }
  return sum % 10 === 0;
}

export function cardNumber(value: string): string | undefined {
  const digits = value.replace(/\s/g, "");
  if (!digits) return "Card number is required";
  if (!/^\d{13,19}$/.test(digits)) return "Enter a valid card number";
  return passesLuhn(digits) ? undefined : "Card number looks incorrect";
}

export function expiry(value: string): string | undefined {
  const match = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(value.trim());
  if (!match) return "Use MM/YY format";
  const month = Number(match[1]);
  const year = 2000 + Number(match[2]);
  const now = new Date();
  const endOfMonth = new Date(year, month, 0, 23, 59, 59);
  return endOfMonth >= now ? undefined : "This card has expired";
}

export function cvc(value: string): string | undefined {
  return /^\d{3,4}$/.test(value.trim()) ? undefined : "CVC must be 3 or 4 digits";
}

export function hasErrors<T>(errors: Errors<T>): boolean {
  return Object.values(errors).some(Boolean);
}
