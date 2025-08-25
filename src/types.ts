import type { Context } from "aws-lambda";

export interface LogOptions {
	verbose?: boolean;
	includeLambdaInfo?: boolean;
	includeTimestamp?: boolean;
	includeData?: boolean;
}

export interface MinimalLambdaInfo {
	/** Name of the Lambda function */
	functionName: string;
	/** Version of the Lambda function ($LATEST or a version number) */
	functionVersion: string;
	/** Function alias if invoked through an alias */
	alias?: string;
	/** Unique request ID for the current invocation */
	awsRequestId: string;
	/** Whether this invocation is a cold start */
	coldStart: boolean;
}

/**
 * Information about the current Lambda execution environment
 */
export interface LambdaInfo extends MinimalLambdaInfo {
	/** Memory limit allocated to the function in MB */
	memoryLimitInMB: number;
	/** Current memory usage in MB */
	memoryUsageInMB: number;
	/** AWS execution environment identifier */
	executionEnvironment: string | undefined;
	/** CloudWatch log group name */
	logGroupName: string;
	/** CloudWatch log stream name */
	logStreamName: string;
	/** Remaining execution time in milliseconds */
	remainingTime: number;
	/** AWS region where the Lambda is executing */
	region: string;
	/** Function alias if invoked through an alias */
	alias?: string;
}

/**
 * System resource information
 */
export interface SystemInfo {
	/** Operating system platform */
	platform: string;
	/** CPU architecture */
	arch: string;
	/** Node.js version */
	nodeVersion: string;
	/** CPU model information */
	cpuModel: string;
	/** Number of CPU cores available */
	cpuCount: number;
	/** Total memory available to the system in MB */
	totalMemory: number;
	/** Free memory available to the system in MB */
	freeMemory: number;
	/** System uptime in seconds */
	uptime: number;
}

/**
 * Custom logger interface with structured logging
 */
export interface LambdaLogger {
	/** Log information messages */
	info: (message: string, data?: unknown, options?: LogOptions) => void;
	/** Log warning messages */
	warn: (message: string, data?: unknown, options?: LogOptions) => void;
	/** Log error messages */
	error: (message: string, error?: Error, data?: unknown, options?: LogOptions) => void;
	/** Log debug messages */
	debug: (message: string, data?: unknown, options?: LogOptions) => void;
}

/**
 * Result of performance measurement
 */
export interface ExecutionResult<T> {
	/** Return value from the executed function */
	result: T;
	/** Execution time in milliseconds */
	executionTime: number;
}

/**
 * Lambda handler type definition for middleware
 */
export type LambdaHandler<TEvent = unknown, TResult = unknown> = (
	event: TEvent,
	context: Context
) => Promise<TResult>;
