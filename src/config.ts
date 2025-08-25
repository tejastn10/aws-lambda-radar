import {
	type AliasConfiguration,
	type FunctionConfiguration,
	GetFunctionConfigurationCommand,
	type GetFunctionConfigurationCommandOutput,
	LambdaClient,
	ListAliasesCommand,
	ListVersionsByFunctionCommand,
} from "@aws-sdk/client-lambda";

// Create a Lambda client
let lambdaClient: LambdaClient | null = null;

/**
 * Get or create the Lambda client
 */
const getLambdaClient = (): LambdaClient => {
	if (!lambdaClient) {
		lambdaClient = new LambdaClient({});
	}
	return lambdaClient;
};

/**
 * Set a custom Lambda client (useful for testing or custom configuration)
 * @param client Custom Lambda client
 */
function setLambdaClient(client: LambdaClient): void {
	lambdaClient = client;
}

/**
 * Retrieve configuration for a Lambda function
 * @param functionName Name of the Lambda function
 * @returns Promise with Lambda configuration
 */
const getLambdaConfiguration = async (
	functionName: string
): Promise<GetFunctionConfigurationCommandOutput> => {
	const client = getLambdaClient();
	const command = new GetFunctionConfigurationCommand({
		FunctionName: functionName,
	});

	const response = await client.send(command);
	return response;
};

/**
 * List aliases for a Lambda function
 * @param functionName Name of the Lambda function
 * @returns Promise with list of aliases
 */
const listLambdaAliases = async (functionName: string): Promise<AliasConfiguration[]> => {
	const client = getLambdaClient();
	const command = new ListAliasesCommand({
		FunctionName: functionName,
	});

	const response = await client.send(command);
	return response.Aliases || [];
};

/**
 * List versions for a Lambda function
 * @param functionName Name of the Lambda function
 * @returns Promise with list of versions
 */
const listLambdaVersions = async (functionName: string): Promise<FunctionConfiguration[]> => {
	const client = getLambdaClient();
	const command = new ListVersionsByFunctionCommand({
		FunctionName: functionName,
	});

	const response = await client.send(command);
	return response.Versions || [];
};

export { getLambdaConfiguration, listLambdaAliases, listLambdaVersions, setLambdaClient };
