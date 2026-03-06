export type ToolContext = {
  root: string;
};

export type ToolCallback = (
  args: Record<string, unknown>,
  context: ToolContext
) => Promise<{
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
}>;
