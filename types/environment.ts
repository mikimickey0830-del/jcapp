export const appEnvironmentValues = ["development", "test", "production"] as const;

export type AppEnvironment = (typeof appEnvironmentValues)[number];

export type AppEnvironmentInfo = {
  value: AppEnvironment;
  label: string;
  description: string;
  allowsTestData: boolean;
};
