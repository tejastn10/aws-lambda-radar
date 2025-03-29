import { ExecutionResult } from "./types";

/**
 * Measure execution time of a function
 * @param fn Function to execute and measure
 * @param args Arguments to pass to the function
 * @returns Result of the function and execution time
 */
const measureExecutionTime = async <T>(
	fn: (...args: unknown[]) => Promise<T>,
	...args: unknown[]
): Promise<ExecutionResult<T>> => {
	const startTime = process.hrtime();
	const result = await fn(...args);
	const diff = process.hrtime(startTime);
	const executionTime = (diff[0] * 1e9 + diff[1]) / 1e6; // convert to milliseconds

	return {
		result,
		executionTime,
	};
};

/**
 * Create a helper for tracking stages in Lambda execution
 * @returns Timer object with methods to mark and measure stages
 */
const createExecutionTimer = (): {
	mark: (name: string) => void;
	measure: (name: string, startMark: string, endMark?: string) => number;
	getMeasures: () => Record<string, number>;
} => {
	const marks: Record<string, [number, number]> = {};
	const measures: Record<string, number> = {};

	return {
		/**
		 * Mark a point in execution to measure from/to
		 * @param name Name of the mark
		 */
		mark: (name: string): void => {
			marks[name] = process.hrtime();
		},

		/**
		 * Measure time between two marks
		 * @param name Name for the measurement
		 * @param startMark Start mark name
		 * @param endMark End mark name (defaults to now if not provided)
		 * @returns Duration in milliseconds
		 */
		measure: (name: string, startMark: string, endMark?: string): number => {
			if (!marks[startMark]) {
				throw new Error(`Start mark "${startMark}" doesn't exist`);
			}

			const start = marks[startMark];
			const end = endMark ? marks[endMark] : process.hrtime();

			if (endMark && !marks[endMark]) {
				throw new Error(`End mark "${endMark}" doesn't exist`);
			}

			const diff = [end[0] - start[0], end[1] - start[1]];
			const duration = (diff[0] * 1e9 + diff[1]) / 1e6; // convert to milliseconds

			measures[name] = duration;
			return duration;
		},

		/**
		 * Get all measurements
		 * @returns Record of all measurements
		 */
		getMeasures: (): Record<string, number> => {
			return { ...measures };
		},
	};
};

export { createExecutionTimer, measureExecutionTime };
