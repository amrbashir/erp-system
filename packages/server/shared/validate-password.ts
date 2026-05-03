import { WeakPasswordError } from "./errors.js";

const PASSWORD_MIN_LENGTH = 6;

export function validatePassword(password: string): WeakPasswordError | null {
	if (password.length < PASSWORD_MIN_LENGTH) {
		return new WeakPasswordError({
			reason: `Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
		});
	}
	if (!/[A-Z]/.test(password)) {
		return new WeakPasswordError({
			reason: "Password must contain at least one uppercase letter",
		});
	}
	if (!/[a-z]/.test(password)) {
		return new WeakPasswordError({
			reason: "Password must contain at least one lowercase letter",
		});
	}
	if (!/[0-9]/.test(password)) {
		return new WeakPasswordError({ reason: "Password must contain at least one digit" });
	}
	return null;
}
