/**
 * Standard response format for all server actions.
 */
export type ActionResult<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

/**
 * A wrapper for server actions that provides consistent error handling and logging.
 * 
 * @param actionName The name of the action for logging purposes.
 * @param fn The async function containing the action logic.
 * @returns An ActionResult object containing success status, data, or error message.
 */
export async function actionWrapper<T>(
  actionName: string,
  fn: () => Promise<T>
): Promise<ActionResult<T>> {
  try {
    const data = await fn();
    return { success: true, data };
  } catch (error) {
    console.error(`Error in action ${actionName}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}
