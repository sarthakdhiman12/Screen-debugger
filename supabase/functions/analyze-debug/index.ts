import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { screenshot, terminalLogs, codeSnippet } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build the content array for multimodal input
    const content: any[] = [];
    
    // Add system context
    content.push({
      type: "text",
      text: `You are an expert code debugger. Analyze the provided debugging context (screenshot, terminal logs, and/or code snippet) and provide a comprehensive analysis.

Your response MUST be in this exact JSON format:
{
  "rootCause": "A clear, concise explanation of the root cause of the error",
  "errorChain": ["Step 1 of how the error occurred", "Step 2", "..."],
  "suggestedFixes": [
    {
      "title": "Fix title",
      "description": "Detailed description of the fix",
      "code": "Optional code snippet showing the fix"
    }
  ],
  "testSuggestions": [
    {
      "title": "Test case title",
      "description": "What this test validates",
      "code": "Example test code"
    }
  ],
  "summary": "A brief 1-2 sentence summary of the issue and recommended action"
}

Be specific, actionable, and provide real code examples where applicable.`
    });

    // Add screenshot if provided (base64 image)
    if (screenshot) {
      content.push({
        type: "image_url",
        image_url: {
          url: screenshot
        }
      });
      content.push({
        type: "text",
        text: "Above is a screenshot of the error or issue."
      });
    }

    // Add terminal logs if provided
    if (terminalLogs && terminalLogs.trim()) {
      content.push({
        type: "text",
        text: `Terminal/Console Logs:\n\`\`\`\n${terminalLogs}\n\`\`\``
      });
    }

    // Add code snippet if provided
    if (codeSnippet && codeSnippet.trim()) {
      content.push({
        type: "text",
        text: `Code Snippet:\n\`\`\`\n${codeSnippet}\n\`\`\``
      });
    }

    // Check if we have at least some input
    if (!screenshot && (!terminalLogs || !terminalLogs.trim()) && (!codeSnippet || !codeSnippet.trim())) {
      return new Response(
        JSON.stringify({ error: "Please provide at least one input: screenshot, terminal logs, or code snippet" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    content.push({
      type: "text",
      text: "Now analyze the above debugging context and provide your analysis in the specified JSON format."
    });

    console.log("Sending request to Lovable AI with multimodal content");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          {
            role: "user",
            content: content
          }
        ],
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Usage limit reached. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;

    if (!aiResponse) {
      throw new Error("No response from AI");
    }

    console.log("Received AI response, parsing...");

    // Try to parse the JSON response
    let analysis;
    try {
      // Extract JSON from the response (it might be wrapped in markdown code blocks)
      const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/) || 
                        aiResponse.match(/```\s*([\s\S]*?)\s*```/) ||
                        [null, aiResponse];
      const jsonStr = jsonMatch[1] || aiResponse;
      analysis = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", parseError);
      // Return a structured response even if parsing fails
      analysis = {
        rootCause: "Analysis completed but response parsing failed",
        errorChain: [],
        suggestedFixes: [],
        testSuggestions: [],
        summary: aiResponse
      };
    }

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in analyze-debug function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "An unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
