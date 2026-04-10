import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

const QR_TOKEN_VERSION = 1;
const DEFAULT_QR_TTL_SECONDS = 60 * 5;
const QR_SECRET_ENV_KEY = "QR_SIGNING_SECRET";

export type QrTokenPayload = {
	v: typeof QR_TOKEN_VERSION;
	jti: string;
	storeId: string;
	subscriptionId: string;
	customerId: string;
	planId?: string;
	periodStart: string;
	periodEnd?: string;
	iat: number;
	exp: number;
};

export type CreateQrTokenInput = {
	storeId: string;
	subscriptionId: string;
	customerId: string;
	planId?: string;
	periodStart: string | Date;
	periodEnd?: string | Date;
	jti?: string;
	now?: Date;
	ttlSeconds?: number;
};

export class QrTokenError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "QrTokenError";
	}
}

export function createQrToken(input: CreateQrTokenInput): string {
	const now = input.now ?? new Date();
	const iat = toUnixSeconds(now);
	const exp = iat + (input.ttlSeconds ?? DEFAULT_QR_TTL_SECONDS);

	if (exp <= iat) {
		throw new QrTokenError("QR token expiration must be after issuance time.");
	}

	const payload: QrTokenPayload = {
		v: QR_TOKEN_VERSION,
		jti: input.jti ?? randomUUID(),
		storeId: input.storeId,
		subscriptionId: input.subscriptionId,
		customerId: input.customerId,
		planId: input.planId,
		periodStart: toIsoString(input.periodStart),
		periodEnd: input.periodEnd ? toIsoString(input.periodEnd) : undefined,
		iat,
		exp,
	};

	validatePayload(payload);

	const encodedPayload = encodeBase64Url(JSON.stringify(payload));
	const signature = signValue(encodedPayload);

	return `${encodedPayload}.${signature}`;
}

export function verifyQrToken(
	token: string,
	options?: { now?: Date },
): QrTokenPayload {
	const [encodedPayload, providedSignature, ...rest] = token.split(".");

	if (!encodedPayload || !providedSignature || rest.length > 0) {
		throw new QrTokenError("QR token format is invalid.");
	}

	const expectedSignature = signValue(encodedPayload);
	if (!safeEqual(providedSignature, expectedSignature)) {
		throw new QrTokenError("QR token signature is invalid.");
	}

	const payload = parsePayload(encodedPayload);
	validatePayload(payload);

	const now = toUnixSeconds(options?.now ?? new Date());
	if (payload.exp <= now) {
		throw new QrTokenError("QR token has expired.");
	}

	return payload;
}

export function decodeQrToken(token: string): QrTokenPayload {
	const [encodedPayload, providedSignature, ...rest] = token.split(".");

	if (!encodedPayload || !providedSignature || rest.length > 0) {
		throw new QrTokenError("QR token format is invalid.");
	}

	const payload = parsePayload(encodedPayload);
	validatePayload(payload);

	return payload;
}

function parsePayload(encodedPayload: string): QrTokenPayload {
	try {
		const payload = JSON.parse(decodeBase64Url(encodedPayload)) as QrTokenPayload;
		return payload;
	} catch {
		throw new QrTokenError("QR token payload is invalid.");
	}
}

function validatePayload(payload: QrTokenPayload) {
	if (payload.v !== QR_TOKEN_VERSION) {
		throw new QrTokenError("QR token version is not supported.");
	}

	if (!payload.jti) {
		throw new QrTokenError("QR token is missing a token id.");
	}

	if (!payload.storeId || !payload.subscriptionId || !payload.customerId) {
		throw new QrTokenError("QR token is missing required identifiers.");
	}

	if (!payload.periodStart) {
		throw new QrTokenError("QR token is missing a billing period start.");
	}

	if (!Number.isInteger(payload.iat) || !Number.isInteger(payload.exp)) {
		throw new QrTokenError("QR token timestamps must be integer seconds.");
	}

	if (payload.exp <= payload.iat) {
		throw new QrTokenError("QR token expiration must be after issuance time.");
	}

	if (Number.isNaN(Date.parse(payload.periodStart))) {
		throw new QrTokenError("QR token period start must be a valid ISO date.");
	}

	if (payload.periodEnd && Number.isNaN(Date.parse(payload.periodEnd))) {
		throw new QrTokenError("QR token period end must be a valid ISO date.");
	}
}

function signValue(value: string) {
	const secret = getQrSecret();
	return encodeBase64Url(createHmac("sha256", secret).update(value).digest());
}

function getQrSecret() {
	const secret = process.env[QR_SECRET_ENV_KEY];

	if (!secret) {
		throw new QrTokenError(
			`Missing ${QR_SECRET_ENV_KEY}. QR token signing is not configured.`,
		);
	}

	return secret;
}

function safeEqual(a: string, b: string) {
	const left = Buffer.from(a);
	const right = Buffer.from(b);

	if (left.length !== right.length) {
		return false;
	}

	return timingSafeEqual(left, right);
}

function encodeBase64Url(value: string | Buffer) {
	return Buffer.from(value).toString("base64url");
}

function decodeBase64Url(value: string) {
	return Buffer.from(value, "base64url").toString("utf8");
}

function toUnixSeconds(date: Date) {
	return Math.floor(date.getTime() / 1000);
}

function toIsoString(value: string | Date) {
	const date = typeof value === "string" ? new Date(value) : value;

	if (Number.isNaN(date.getTime())) {
		throw new QrTokenError("QR token dates must be valid ISO timestamps.");
	}

	return date.toISOString();
}

export { DEFAULT_QR_TTL_SECONDS, QR_SECRET_ENV_KEY, QR_TOKEN_VERSION };
