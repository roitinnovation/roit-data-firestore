const getTracerAgent = () => {
  const agent = (global as any)._roit_trace_agent;
  if (!agent) {
    return null;
  }

  return agent;
}

export const startTracer = async <T>(
    name: string,
    operation: (span: any) => Promise<T>
): Promise<T> => {
  const tracerAgent = getTracerAgent()

  if (!tracerAgent) {
    return operation({ 
        setAttributes: () => {}, 
        end: () => {} 
    })
  }

  return await tracerAgent.getGlobalTracer().startActiveSpan(name, async (span: any) => {
    try {
        return await operation(span)
    } finally {
        span.end()
    }
  })
} 