import type { Context } from "aws-lambda";
import { getLambdaInfo, getMinimalLambdaInfo } from "./info";
import type { LambdaLogger, LogOptions } from "./types";

/**
 * Creates a logger that includes Lambda context information
 * @param context The Lambda context object
 * @param defaultOptions Default options for all log calls
 * @returns Enhanced logger object
 */
const createContextLogger = (context: Context, defaultOptions: LogOptions = {}): LambdaLogger => {
	// Set default options with sensible defaults
	const options: Required<LogOptions> = {
		verbose: false,
		includeLambdaInfo: true,
		includeTimestamp: true,
		includeData: true,
		...defaultOptions,
	};

	// Get appropriate level of lambda info based on verbosity
	const lambdaInfo = options.verbose ? getLambdaInfo(context) : getMinimalLambdaInfo(context);

	const logStreamName = lambdaInfo.alias
		? `[${lambdaInfo.alias}]-${context.logStreamName}`
		: context.logStreamName;

	// ✅ Override the log stream name for better tracking
	process.env.AWS_LAMBDA_LOG_STREAM_NAME = logStreamName;

	// Helper function to format log messages
	const formatLog = (_level: string, message: string, data?: unknown, error?: Error): string => {
		const logParts = [message];

		if (options.includeLambdaInfo) {
			if (lambdaInfo.alias) {
				logParts.push(
					`Function: ${lambdaInfo.functionName}, Alias: ${lambdaInfo.alias}, Version: ${lambdaInfo.functionVersion}, RequestID: ${lambdaInfo.awsRequestId}, ColdStart: ${lambdaInfo.coldStart}`
				);
			} else {
				logParts.push(
					`Function: ${lambdaInfo.functionName}, Version: ${lambdaInfo.functionVersion}, RequestID: ${lambdaInfo.awsRequestId}, ColdStart: ${lambdaInfo.coldStart}`
				);
			}
		}

		if (data && options.includeData) {
			logParts.push(`Data: ${JSON.stringify(data, null, 2)}`);
		}

		if (error) {
			logParts.push(`Error: ${error.name} - ${error.message}\nStack: ${error.stack}`);
		}

		return logParts.join(" | ");
	};

	return {
		info: (message: string, data?: unknown, callOptions?: LogOptions): void => {
			const opts = { ...options, ...callOptions };
			console.info(formatLog("INFO", message, opts.includeData ? data : undefined));
		},
		warn: (message: string, data?: unknown, callOptions?: LogOptions): void => {
			const opts = { ...options, ...callOptions };
			console.warn(formatLog("WARN", message, opts.includeData ? data : undefined));
		},
		error: (message: string, error?: Error, data?: unknown, callOptions?: LogOptions): void => {
			const opts = { ...options, ...callOptions };
			console.error(formatLog("ERROR", message, opts.includeData ? data : undefined, error));
		},
		debug: (message: string, data?: unknown, callOptions?: LogOptions): void => {
			const opts = { ...options, ...callOptions };
			console.debug(formatLog("DEBUG", message, opts.includeData ? data : undefined));
		},
	};
};

/**
 * Creates a logger that captures errors and exceptions
 * @param baseLogger Base logger to extend
 * @returns Enhanced logger with error capture capabilities
 */
const createErrorCaptureLogger = (baseLogger: LambdaLogger): LambdaLogger => {
	// Capture unhandled exceptions and promise rejections
	process.on("uncaughtException", (error) => {
		baseLogger.error("Uncaught exception", error);
	});

	process.on("unhandledRejection", (reason) => {
		baseLogger.error(
			"Unhandled promise rejection",
			reason instanceof Error ? reason : new Error(String(reason))
		);
	});

	return baseLogger;
};

export { createContextLogger, createErrorCaptureLogger };
