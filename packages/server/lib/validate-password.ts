const PASSWORD_MIN_LENGTH = 6;

export function validatePassword(
	password: string,
): { valid: true } | { valid: false; message: string } {
	if (password.length < PASSWORD_MIN_LENGTH) {
		return {
			valid: false,
			message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
		};
	}
	if (!/[A-Z]/.test(password)) {
		return { valid: false, message: "Password must contain at least one uppercase letter" };
	}
	if (!/[a-z]/.test(password)) {
		return { valid: false, message: "Password must contain at least one lowercase letter" };
	}
	if (!/[0-9]/.test(password)) {
		return { valid: false, message: "Password must contain at least one digit" };
	}
	return { valid: true };
}
