/// <reference path="./.sst/platform/config.d.ts" />

/**
 * SST Configuration for Kefir App
 * 
 * This configuration defines the infrastructure for the Kefir app across
 * dev and prod environments.
 */

export default $config({
  app(input) {
    return {
      name: "kefir-app",
      removal: input?.stage === "prod" ? "retain" : "remove",
      home: "aws",
      providers: {
        aws: {
          region: "us-east-1",
        },
      },
    };
  },
  
  async run() {
    // Import stacks
    const auth = await import("./stacks/AuthStack");
    const data = await import("./stacks/DataStack");
    const api = await import("./stacks/ApiStack");
    const scheduler = await import("./stacks/SchedulerStack");
    const monitoring = await import("./stacks/MonitoringStack");

    // Deploy stacks in order
    const authStack = auth.default();
    const dataStack = data.default();
    const apiStack = api.default({ authStack, dataStack });
    const schedulerStack = scheduler.default({ apiStack, dataStack });
    
    // Only create monitoring stack in production
    if ($app.stage === "prod") {
      monitoring.default({ apiStack, dataStack });
    }

    // Output important values for frontend
    return {
      api: apiStack.url,
      userPoolId: authStack.userPoolId,
      userPoolClientId: authStack.clientId,
      region: "us-east-1",
    };
  },
});

