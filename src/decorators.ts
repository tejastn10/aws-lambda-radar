import { Context } from "aws-lambda";
import { getLambdaInfo, getMinimalLambdaInfo } from "./info";
import { createContextLogger } from "./logging";
import { measureExecutionTime } from "./performance";
import { LogOptions } from "./types";
import "reflect-metadata";

/**
 * Method decorator to log Lambda information
 * @param logOptions Options to customize logging behavior
 */
const logLambdaInfo = (logOptions?: LogOptions) => {
	return (
		target: unknown,
		propertyKey: string,
		descriptor: PropertyDescriptor
	): PropertyDescriptor => {
		const originalMethod = descriptor.value;
		// Store metadata keys to preserve them
		const metadataKeys = Reflect.getMetadataKeys(target as object, propertyKey);

		descriptor.value = async (...args: [unknown, Context]): Promise<unknown> => {
			const context = args[1];
			if (!context || typeof context.functionName !== "string") {
				return originalMethod.apply(this, args);
			}

			// Create logger with provided options
			const logger = createContextLogger(context, logOptions);

			// Use minimal or verbose info based on options
			const lambdaInfo = logOptions?.verbose
				? getLambdaInfo(context)
				: getMinimalLambdaInfo(context);

			// Log with configurable options
			logger.info("Lambda execution details", lambdaInfo, {
				includeLambdaInfo: false, // Since we're explicitly logging lambdaInfo as data
			});

			return originalMethod.apply(this, args);
		};

		// Restore metadata to the new method
		metadataKeys.forEach((key) => {
			const value = Reflect.getMetadata(key, target as object, propertyKey);
			Reflect.defineMetadata(key, value, target as object, propertyKey);
		});

		return descriptor;
	};
};

/**
 * Method decorator to measure and log execution time
 * @param logOptions Options to customize logging behavior
 */
const measurePerformance = (logOptions?: LogOptions) => {
	return (
		target: unknown,
		propertyKey: string,
		descriptor: PropertyDescriptor
	): PropertyDescriptor => {
		const originalMethod = descriptor.value;
		// Store metadata keys to preserve them
		const metadataKeys = Reflect.getMetadataKeys(target as object, propertyKey);

		descriptor.value = async (...args: [unknown, Context]): Promise<unknown> => {
			const context = args[1];
			if (!context || typeof context.functionName !== "string") {
				return originalMethod.apply(this, args);
			}

			// Create logger with provided options
			const logger = createContextLogger(context, logOptions);

			const { result, executionTime } = await measureExecutionTime(async () =>
				originalMethod.apply(this, args)
			);

			// Log with customizable options
			logger.info(
				`Method ${propertyKey} execution completed`,
				{ executionTime },
				{
					// Can override per-call options here if needed
					includeData: true, // Always include execution time
				}
			);

			return result;
		};

		// Restore metadata to the new method
		metadataKeys.forEach((key) => {
			const value = Reflect.getMetadata(key, target as object, propertyKey);
			Reflect.defineMetadata(key, value, target as object, propertyKey);
		});

		return descriptor;
	};
};

/**
 * Method decorator to handle errors
 * @param logOptions Options to customize error logging behavior
 */
const handleErrors = (logOptions?: LogOptions) => {
	return (
		target: unknown,
		propertyKey: string,
		descriptor: PropertyDescriptor
	): PropertyDescriptor => {
		const originalMethod = descriptor.value;
		// Store metadata keys to preserve them
		const metadataKeys = Reflect.getMetadataKeys(target as object, propertyKey);

		descriptor.value = async (...args: [unknown, Context]): Promise<unknown> => {
			const context = args[1];
			try {
				return await originalMethod.apply(this, args);
			} catch (error) {
				if (context && typeof context.functionName === "string") {
					// For errors, often want more verbose logging
					const errorLogOptions = {
						...logOptions,
						// Errors typically need more context, so default to including lambda info
						includeLambdaInfo: logOptions?.includeLambdaInfo !== false,
					};

					const logger = createContextLogger(context, errorLogOptions);
					logger.error(
						`Error in method ${propertyKey}`,
						error instanceof Error ? error : new Error(String(error)),
						undefined, // No additional data
						{ verbose: true } // Override to get verbose output for errors
					);
				}

				// Return a standardized error response (useful for API Gateway)
				return {
					statusCode: 500,
					body: JSON.stringify({
						message: "Internal server error",
						requestId: context?.awsRequestId || "unknown",
					}),
				};
			}
		};

		// Restore metadata to the new method
		metadataKeys.forEach((key) => {
			const value = Reflect.getMetadata(key, target as object, propertyKey);
			Reflect.defineMetadata(key, value, target as object, propertyKey);
		});

		return descriptor;
	};
};

/**
 * Composable decorator factory
 * Creates a decorator that combines multiple decorators while preserving metadata
 * @param decorators List of decorators to compose (applied left to right)
 */
const composeDecorators = (...decorators: Array<MethodDecorator>) => {
	return (
		target: unknown,
		propertyKey: string,
		descriptor: PropertyDescriptor
	): PropertyDescriptor => {
		return decorators.reduce<PropertyDescriptor>((acc, decorator) => {
			const result = decorator(target as object, propertyKey, acc);
			return result || acc;
		}, descriptor);
	};
};

export { logLambdaInfo, measurePerformance, handleErrors, composeDecorators };
