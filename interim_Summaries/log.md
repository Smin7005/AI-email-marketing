Found 1 items to process
Generating email for Shaun studio (test_category)
[GENERATE EMAILS] DMXAPI_KEY set: true
[GENERATE EMAILS] Calling API for Shaun studio...
 GET /api/campaigns/31 200 in 165ms
 GET /api/campaigns/31/items 200 in 133ms
 PUT /api/inngest 200 in 48ms
[GENERATE EMAILS] API Response for Shaun studio: {
  "choices": [
    {
      "finish_reason": "length",
      "index": 0,
      "logprobs": null,
      "message": {
        "annotations": [],
        "content": "",
        "refusal": null,
        "role": "assistant"
      }
    }
  ],
  "created": 1769497096,
  "id": "chatcmpl-D2XJgwCKckaNZ2NBeR6anl3NKLJqr",
  "model": "gpt-5-mini-2025-08-07",
  "object": "chat.completion",
  "system_fingerprint": null,
  "usage": {
    "completion_tokens": 300,
    "completion_tokens_details": {
      "accepted_prediction_tokens": 0,
      "audio_tokens": 0,
      "reasoning_tokens": 300,
      "rejected_prediction_tokens": 0
    },
    "prompt_tokens": 294,
    "prompt_tokens_details": {
      "audio_tokens": 0,
      "cached_tokens": 0
    },
    "total_tokens": 594
  }
}
[GENERATE EMAILS] Generated text for Shaun studio: { length: 0, preview: 'EMPTY' }
✗ Failed to generate email for Shaun studio: Error: No content generated from LLM API
    at eval (webpack-internal:///(rsc)/./src/inngest/functions/generate-emails.ts:180:27)
    at process.processTicksAndRejections (node:internal/process/task_queues:103:5)
    at async goIntervalTiming (webpack-internal:///(rsc)/./node_modules/inngest/helpers/promises.js:189:3)
    at async V1InngestExecution.tryExecuteStep (webpack-internal:///(rsc)/./node_modules/inngest/components/execution/v1.js:399:20)
    at async steps-found (webpack-internal:///(rsc)/./node_modules/inngest/components/execution/v1.js:315:24)
    at async V1InngestExecution._start (webpack-internal:///(rsc)/./node_modules/inngest/components/execution/v1.js:134:20)
    at async InngestCommHandler.handleAction (webpack-internal:///(rsc)/./node_modules/inngest/components/InngestCommHandler.js:846:24)
    at async ServerTiming.wrap (webpack-internal:///(rsc)/./node_modules/inngest/helpers/ServerTiming.js:64:11)
    at async ServerTiming.wrap (webpack-internal:///(rsc)/./node_modules/inngest/helpers/ServerTiming.js:64:11)
    at async C:\Internship\AI_Email_Campaign\AI-email-marketing\node_modules\next\dist\compiled\next-server\app-route.runtime.dev.js:6:57228     
    at async eT.execute (C:\Internship\AI_Email_Campaign\AI-email-marketing\node_modules\next\dist\compiled\next-server\app-route.runtime.dev.js:6:46851)
    at async eT.handle (C:\Internship\AI_Email_Campaign\AI-email-marketing\node_modules\next\dist\compiled\next-server\app-route.runtime.dev.js:6:58760)
    at async doRender (C:\Internship\AI_Email_Campaign\AI-email-marketing\node_modules\next\dist\server\base-server.js:1366:42)
    at async cacheEntry.responseCache.get.routeKind (C:\Internship\AI_Email_Campaign\AI-email-marketing\node_modules\next\dist\server\base-server.js:1588:28)
    at async DevServer.renderToResponseWithComponentsImpl (C:\Internship\AI_Email_Campaign\AI-email-marketing\node_modules\next\dist\server\base-server.js:1496:28)
    at async DevServer.renderPageComponent (C:\Internship\AI_Email_Campaign\AI-email-marketing\node_modules\next\dist\server\base-server.js:1924:24)
    at async DevServer.renderToResponseImpl (C:\Internship\AI_Email_Campaign\AI-email-marketing\node_modules\next\dist\server\base-server.js:1962:32)
    at async DevServer.pipeImpl (C:\Internship\AI_Email_Campaign\AI-email-marketing\node_modules\next\dist\server\base-server.js:922:25)
    at async NextNodeServer.handleCatchallRenderRequest (C:\Internship\AI_Email_Campaign\AI-email-marketing\node_modules\next\dist\server\next-server.js:272:17)
    at async DevServer.handleRequestImpl (C:\Internship\AI_Email_Campaign\AI-email-marketing\node_modules\next\dist\server\base-server.js:818:17)
    at async C:\Internship\AI_Email_Campaign\AI-email-marketing\node_modules\next\dist\server\dev\next-dev-server.js:339:20
    at async Span.traceAsyncFn (C:\Internship\AI_Email_Campaign\AI-email-marketing\node_modules\next\dist\trace\trace.js:154:20)
    at async DevServer.handleRequest (C:\Internship\AI_Email_Campaign\AI-email-marketing\node_modules\next\dist\server\dev\next-dev-server.js:336:24)
    at async invokeRender (C:\Internship\AI_Email_Campaign\AI-email-marketing\node_modules\next\dist\server\lib\router-server.js:182:21)
    at async handleRequest (C:\Internship\AI_Email_Campaign\AI-email-marketing\node_modules\next\dist\server\lib\router-server.js:359:24)        
    at async requestHandlerImpl (C:\Internship\AI_Email_Campaign\AI-email-marketing\node_modules\next\dist\server\lib\router-server.js:383:13)   
    at async Server.requestListener (C:\Internship\AI_Email_Campaign\AI-email-marketing\node_modules\next\dist\server\lib\start-server.js:141:13)
 POST /api/inngest?fnId=b2b-email-marketing-generate-emails&stepId=step 206 in 5679ms
 GET /api/campaigns/31 200 in 162ms
 GET /api/campaigns/31/items 200 in 213ms
Starting email generation for campaign 31
Campaign data fetched: { id: 31, name: 'ABC Trading', tone: 'friendly' }
Found 1 items to process
 POST /api/inngest?fnId=b2b-email-marketing-generate-emails&stepId=step 206 in 253ms
Starting email generation for campaign 31
Campaign data fetched: { id: 31, name: 'ABC Trading', tone: 'friendly' }
Found 1 items to process
Email generation complete! Results: [
  {
    businessName: 'Shaun studio',
    error: 'No content generated from LLM API',
    itemId: 31,
    success: false
  }
]
 POST /api/inngest?fnId=b2b-email-marketing-generate-emails&stepId=step 200 in 31ms
 GET /api/campaigns/31 200 in 214ms
 GET /api/campaigns/31/items 200 in 176ms
 PUT /api/inngest 200 in 13ms
 PUT /api/inngest 200 in 12ms