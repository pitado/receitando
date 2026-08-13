interface ErrorWithCode {
  code: unknown;
}

export function isPrismaErrorWithCode(error: unknown, code: string): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as ErrorWithCode).code === code
  );
}
