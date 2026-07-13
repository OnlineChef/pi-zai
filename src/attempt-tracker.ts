import type { Usage } from "@earendil-works/pi-ai";
import type { ProviderAttemptRecord } from "./storage/types.ts";

type InFlightAttempt = {
	queryId: string;
	requestId: string;
	attempt: number;
	payloadFingerprint: string;
	queryStartedAt: number;
	requestStartedAt: number;
	headersReceivedAt: number | undefined;
	firstDeltaAt: number | undefined;
	firstToolDeltaAt: number | undefined;
	httpStatus: number | undefined;
	errorCategory: string | undefined;
};

type TurnUsageTotals = {
	input: number;
	cacheRead: number;
	cacheWrite: number;
	output: number;
	costTotal: number;
};

export class AttemptTracker {
	private inFlight: InFlightAttempt | undefined;
	private turnUsage: TurnUsageTotals | undefined;

	hasInFlight(): boolean {
		return this.inFlight !== undefined;
	}

	prepareQueryAttempt(queryId: string, now = Date.now()): void {
		this.turnUsage = undefined;
		this.inFlight = {
			queryId,
			requestId: `${queryId}-pending`,
			attempt: 0,
			payloadFingerprint: "pending",
			queryStartedAt: now,
			requestStartedAt: now,
			headersReceivedAt: undefined,
			firstDeltaAt: undefined,
			firstToolDeltaAt: undefined,
			httpStatus: undefined,
			errorCategory: undefined,
		};
	}

	accumulateTurnUsage(usage: Usage): void {
		const current = this.turnUsage ?? {
			input: 0,
			cacheRead: 0,
			cacheWrite: 0,
			output: 0,
			costTotal: 0,
		};
		current.input += usage.input;
		current.cacheRead += usage.cacheRead;
		current.cacheWrite += usage.cacheWrite;
		current.output += usage.output;
		current.costTotal += usage.cost.total;
		this.turnUsage = current;
	}

	getTurnUsage(): Usage | undefined {
		if (!this.turnUsage) return undefined;
		const { input, cacheRead, cacheWrite, output, costTotal } = this.turnUsage;
		return {
			input,
			cacheRead,
			cacheWrite,
			output,
			totalTokens: input + cacheRead + cacheWrite + output,
			cost: {
				input: 0,
				output: 0,
				cacheRead: 0,
				cacheWrite: 0,
				total: costTotal,
			},
		};
	}

	armProviderAttempt(input: {
		requestId: string;
		attempt: number;
		payloadFingerprint: string;
		now?: number;
	}): void {
		if (!this.inFlight) {
			this.beginAttempt({
				queryId: input.requestId.replace(/-a\d+$/, ""),
				requestId: input.requestId,
				attempt: input.attempt,
				payloadFingerprint: input.payloadFingerprint,
				now: input.now,
			});
			return;
		}
		this.inFlight.requestId = input.requestId;
		this.inFlight.attempt = input.attempt;
		this.inFlight.payloadFingerprint = input.payloadFingerprint;
		this.inFlight.requestStartedAt = input.now ?? Date.now();
	}

	beginAttempt(input: {
		queryId: string;
		requestId: string;
		attempt: number;
		payloadFingerprint: string;
		now?: number;
	}): void {
		const previous = this.inFlight;
		const now = input.now ?? Date.now();
		this.inFlight = {
			queryId: input.queryId,
			requestId: input.requestId,
			attempt: input.attempt,
			payloadFingerprint: input.payloadFingerprint,
			queryStartedAt: previous?.queryStartedAt ?? now,
			requestStartedAt: now,
			headersReceivedAt: previous?.headersReceivedAt,
			firstDeltaAt: previous?.firstDeltaAt,
			firstToolDeltaAt: previous?.firstToolDeltaAt,
			httpStatus: undefined,
			errorCategory: undefined,
		};
	}

	markHeadersReceived(now = Date.now()): void {
		if (!this.inFlight || this.inFlight.headersReceivedAt !== undefined) return;
		this.inFlight.headersReceivedAt = now;
	}

	markFirstDelta(now = Date.now()): void {
		if (!this.inFlight || this.inFlight.firstDeltaAt !== undefined) return;
		this.inFlight.firstDeltaAt = now;
	}

	markFirstToolDelta(now = Date.now()): void {
		if (!this.inFlight || this.inFlight.firstToolDeltaAt !== undefined) return;
		this.inFlight.firstToolDeltaAt = now;
	}

	markResponse(status: number, errorCategory?: string): void {
		if (!this.inFlight) return;
		this.inFlight.httpStatus = status;
		if (errorCategory) {
			this.inFlight.errorCategory = errorCategory;
		}
		if (this.inFlight.headersReceivedAt === undefined) {
			this.inFlight.headersReceivedAt = Date.now();
		}
	}

	buildRecord(input: {
		occurredAt?: number;
		projectId: string;
		sessionHash: string;
		provider: string;
		model: string;
		endpointKind: string;
		thinkingLevel?: string;
		extensionVersion: string;
		systemFingerprint?: string;
		toolsetFingerprint?: string;
		usage?: Usage;
		errorCategory?: string;
		toolCallsInTurn?: number;
		toolErrorsInTurn?: number;
		toolDurationMsTotal?: number;
	}): ProviderAttemptRecord | undefined {
		if (!this.inFlight) return undefined;

		const endedAt = input.occurredAt ?? Date.now();
		const requestToHeadersMs =
			this.inFlight.headersReceivedAt !== undefined
				? this.inFlight.headersReceivedAt - this.inFlight.requestStartedAt
				: undefined;
		const requestToFirstDeltaMs =
			this.inFlight.firstDeltaAt !== undefined
				? this.inFlight.firstDeltaAt - this.inFlight.queryStartedAt
				: undefined;
		const requestToFirstToolDeltaMs =
			this.inFlight.firstToolDeltaAt !== undefined
				? this.inFlight.firstToolDeltaAt - this.inFlight.queryStartedAt
				: undefined;
		const totalMs = endedAt - this.inFlight.queryStartedAt;
		const usage = input.usage ?? this.getTurnUsage();

		const record: ProviderAttemptRecord = {
			occurredAt: endedAt,
			projectId: input.projectId,
			sessionHash: input.sessionHash,
			queryId: this.inFlight.queryId,
			requestId: this.inFlight.requestId,
			attempt: this.inFlight.attempt,
			provider: input.provider,
			model: input.model,
			endpointKind: input.endpointKind,
			thinkingLevel: input.thinkingLevel,
			extensionVersion: input.extensionVersion,
			systemFingerprint: input.systemFingerprint,
			toolsetFingerprint: input.toolsetFingerprint,
			payloadFingerprint: this.inFlight.payloadFingerprint,
			inputTokens: usage?.input,
			cacheReadTokens: usage?.cacheRead,
			cacheWriteTokens: usage?.cacheWrite,
			outputTokens: usage?.output,
			requestToHeadersMs,
			requestToFirstDeltaMs,
			requestToFirstToolDeltaMs,
			totalMs,
			httpStatus: this.inFlight.httpStatus,
			errorCategory: input.errorCategory ?? this.inFlight.errorCategory,
			estimatedApiCostMicrousd:
				usage !== undefined
					? Math.round(Math.max(0, usage.cost.total) * 1_000_000)
					: undefined,
			toolCallsInTurn: input.toolCallsInTurn,
			toolErrorsInTurn: input.toolErrorsInTurn,
			toolDurationMsTotal: input.toolDurationMsTotal,
		};

		this.inFlight = undefined;
		this.turnUsage = undefined;
		return record;
	}

	reset(): void {
		this.inFlight = undefined;
		this.turnUsage = undefined;
	}
}
