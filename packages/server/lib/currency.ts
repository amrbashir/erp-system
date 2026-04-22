export const SUPPORTED_CURRENCIES = new Set([
	"USD",
	"EUR",
	"GBP",
	"JPY",
	"CNY",
	"SAR",
	"AED",
	"EGP",
	"CAD",
	"AUD",
	"CHF",
	"INR",
	"BRL",
	"KRW",
	"MXN",
	"SGD",
	"HKD",
	"NOK",
	"SEK",
	"DKK",
	"NZD",
	"ZAR",
	"TRY",
	"RUB",
	"PLN",
	"THB",
	"MYR",
	"IDR",
	"PHP",
	"KWD",
	"QAR",
	"BHD",
	"OMR",
	"JOD",
]);

export function validateCurrency(code: string): string | null {
	if (!SUPPORTED_CURRENCIES.has(code)) {
		return "Unsupported currency code";
	}
	return null;
}
