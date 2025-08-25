import type { Context } from "aws-lambda";
import { getLambdaInfo } from "./info";
import { createContextLogger } from "./logging";
import { measureExecutionTime } from "./performance";
import type { LambdaHandler } from "./types";

/**
 * Create middleware for AWS Lambda handlers that adds automatic logging
 * @param handler Your Lambda handler function
 * @returns Enhanced handler function with automatic logging
 */
const withLogging = <TEvent = unknown, TResult = unknown>(
	handler: LambdaHandler<TEvent, TResult>
): LambdaHandler<TEvent, TResult> => {
	return async (event: TEvent, context: Context): Promise<TResult> => {
		const logger = createContextLogger(context);
		const lambdaInfo = getLambdaInfo(context);

		// Log invocation
		logger.info("Lambda invocation started", {
			isColdStart: lambdaInfo.coldStart,
			event: process.env.NODE_ENV === "development" ? event : undefined,
		});

		try {
			// Execute handler and measure time
			const { result, executionTime } = await measureExecutionTime(() => handler(event, context));

			// Log successful completion
			logger.info("Lambda invocation completed", {
				executionTime,
				memoryUsage: `${lambdaInfo.memoryUsageInMB}MB`,
			});

			return result;
		} catch (error) {
			// Log error
			logger.error(
				"Lambda invocation failed",
				error instanceof Error ? error : new Error(String(error))
			);
			throw error;
		}
	};
};

/**
 * Create middleware for AWS Lambda handlers that adds error handling
 * @param handler Your Lambda handler function
 * @returns Enhanced handler function with error handling
 */
const withErrorHandling = <TEvent = unknown, TResult = unknown>(
	handler: LambdaHandler<TEvent, TResult>
): LambdaHandler<TEvent, unknown> => {
	return async (
		event: TEvent,
		context: Context
	): Promise<TResult | { statusCode: number; body: string }> => {
		try {
			return await handler(event, context);
		} catch (error) {
			const logger = createContextLogger(context);
			logger.error(
				"Unhandled error in Lambda",
				error instanceof Error ? error : new Error(String(error))
			);

			// Return a standardized error response (useful for API Gateway)
			return {
				statusCode: 500,
				body: JSON.stringify({
					message: "Internal server error",
					requestId: context.awsRequestId,
				}),
			};
		}
	};
};

/**
 * Combine multiple middleware functions
 * @param middlewares Array of middleware functions to apply (in order)
 * @returns Combined middleware function
 */
const compose = <TEvent = unknown, TResult = unknown>(
	...middlewares: Array<(handler: LambdaHandler<TEvent, unknown>) => LambdaHandler<TEvent, unknown>>
): ((handler: LambdaHandler<TEvent, TResult>) => LambdaHandler<TEvent, unknown>) => {
	return (handler: LambdaHandler<TEvent, TResult>): LambdaHandler<TEvent, unknown> => {
		return middlewares.reduceRight<LambdaHandler<TEvent, unknown>>(
			(acc, middleware) => middleware(acc),
			handler
		);
	};
};

export { compose, withErrorHandling, withLogging };
