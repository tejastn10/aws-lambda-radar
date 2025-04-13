<p align="center">
  <img src="https://raw.githubusercontent.com/tejastn10/aws-lambda-radar/refs/heads/main/logo.svg" alt="Logo">
</p>

# AWS-Lambda-Radar 🔭

![Node.js Version](https://img.shields.io/badge/Node.js-20%2B-339933?logo=nodedotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5%2B-007ACC?logo=typescript&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow?logo=open-source-initiative&logoColor=white)
[![NPM Version](https://img.shields.io/npm/v/aws-lambda-radar?logo=npm&logoColor=white&color=CB3837)](https://www.npmjs.com/package/aws-lambda-radar)

**AWS-Lambda-Radar** is a flexible module for AWS-Lambdas. It collects and reports Lambda information.

---

## Features ⚡

- **Logging**: Capture Lambda execution details.
- **Performance Monitoring**: Measure and log function execution time.
- **Error Handling**: Centralized error logging and standardized error responses.
- **Decorator Composition**: Easily combine multiple decorators for flexible behavior.

---

## Installation ⚙️

```bash
npm install aws-lambda-radar
```

## Usage 🚀

### Functional Approach

```typescript
import { Context, APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getLambdaInfo, createContextLogger, getMemoryUtilization } from 'aws-lambda-radar';

export const handler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
  // Get Lambda details
  const lambdaInfo = getLambdaInfo(context);
  
  // Use the context logger
  const logger = createContextLogger(context);
  logger.info('Processing request', { path: event.path });
  
  // Check memory usage
  const memoryUsage = getMemoryUtilization(context);
  logger.info(`Current memory utilization: ${memoryUsage}%`);
  
  // Your handler logic here
  
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Success',
      lambdaInfo
    })
  };
};
```

### Middleware Pattern

```typescript
import { Context, APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { withLogging, withErrorHandling, compose } from 'aws-lambda-radar';

// Your raw handler without boilerplate
const baseHandler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
  // Your business logic here
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Success' })
  };
};

// Compose middleware (applied in reverse order)
export const handler = compose(
  withLogging,
  withErrorHandling
)(baseHandler);
```

### Class-based approach with decorators

```typescript
import { Context, APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { logLambdaInfo, measurePerformance, handleErrors, createExecutionTimer } from 'aws-lambda-radar';

class LambdaHandler {
  @logLambdaInfo()
  @measurePerformance()
  @handleErrors()
  async handle(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
    // Create a timer to measure different parts of execution
    const timer = createExecutionTimer();
    
    // Mark the start of processing
    timer.mark('start');
    
    // Processing logic
    await this.processRequest(event);
    
    // Mark end of processing
    timer.mark('processComplete');
    
    // Measure the processing time
    const processingTime = timer.measure('processing', 'start', 'processComplete');
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Success',
        metrics: {
          processingTime
        }
      })
    };
  }
  
  private async processRequest(event: any): Promise<void> {
    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

// Create instance and export handler
const handler = new LambdaHandler();
export const lambdaHandler = (event: APIGatewayProxyEvent, context: Context) => 
  handler.handle(event, context);
```

---

## Contributing 🤝

Contributions are welcome! Please feel free to submit a Pull Request.

## License 📜

This project is licensed under the MIT License. See the [LICENSE](LICENSE.md) file for details.

---

## Acknowledgments 🙌

- Inspired by the need for simple, unified messaging across different platforms.
- Made with ❤️ for developers who need debugging information.
