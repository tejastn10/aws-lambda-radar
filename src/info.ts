import { Context } from "aws-lambda";
import os from "os";
import { LambdaInfo, SystemInfo, MinimalLambdaInfo } from "./types";

// Track cold starts
let isFirstInvocation = true;

/**
 * Get comprehensive information about the current Lambda execution
 * @param context The Lambda context object
 * @returns Object containing Lambda execution details
 */
const getLambdaInfo = (context: Context): LambdaInfo => {
	const coldStart = isFirstInvocation;
	isFirstInvocation = false;

	const memoryUsageInMB = Math.round((process.memoryUsage().rss / 1024 / 1024) * 100) / 100;

	return {
		functionName: context.functionName,
		functionVersion: context.functionVersion,
		memoryLimitInMB: parseInt(context.memoryLimitInMB),
		memoryUsageInMB,
		executionEnvironment: process.env.AWS_EXECUTION_ENV,
		logGroupName: context.logGroupName,
		logStreamName: context.logStreamName,
		awsRequestId: context.awsRequestId,
		coldStart,
		remainingTime: context.getRemainingTimeInMillis(),
		region: process.env.AWS_REGION || "unknown",
		alias: getAliasFromContext(context),
	};
};

/**
 * Get minimal Lambda execution information for less verbose logging
 * @param context The Lambda context object
 * @returns Object containing only essential Lambda details
 */
const getMinimalLambdaInfo = (context: Context): MinimalLambdaInfo => {
	const coldStart = isFirstInvocation;
	isFirstInvocation = false;
	return {
		functionName: context.functionName,
		functionVersion: context.functionVersion,
		awsRequestId: context.awsRequestId,
		alias: getAliasFromContext(context),
		coldStart,
	};
};

/**
 * Extract the alias name from the Lambda context
 * @param context The Lambda context object
 * @returns The alias name if available, otherwise undefined
 */
const getAliasFromContext = (context: Context): string | undefined => {
	// Extract alias from the qualified ARN (if available)
	// ARN format: arn:aws:lambda:region:account-id:function:function-name:alias-or-version
	const functionArn = context.invokedFunctionArn || "";
	const arnParts = functionArn.split(":");

	// If the last part is a number, it's a version not an alias
	const lastPart = arnParts[arnParts.length - 1];
	if (lastPart && isNaN(Number(lastPart))) {
		return lastPart;
	}

	return undefined;
};

/**
 * Get information about system resources
 * @returns Object containing system resource information
 */
const getSystemInfo = (): SystemInfo => {
	return {
		platform: process.platform,
		arch: process.arch,
		nodeVersion: process.version,
		cpuModel: os.cpus()[0]?.model || "unknown",
		cpuCount: os.cpus().length,
		totalMemory: Math.round(os.totalmem() / 1024 / 1024),
		freeMemory: Math.round(os.freemem() / 1024 / 1024),
		uptime: os.uptime(),
	};
};

/**
 * Calculates the memory utilization percentage
 * @param context The Lambda context object
 * @returns Percentage of allocated memory being used
 */
const getMemoryUtilization = (context: Context): number => {
	const usedMemory = process.memoryUsage().rss;
	const totalMemory = parseInt(context.memoryLimitInMB) * 1024 * 1024;
	return Math.round((usedMemory / totalMemory) * 100 * 100) / 100;
};

export {
	getLambdaInfo,
	getMinimalLambdaInfo,
	getSystemInfo,
	getMemoryUtilization,
	getAliasFromContext,
};
