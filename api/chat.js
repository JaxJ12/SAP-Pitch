export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { messages } = req.body;

    // 1. Convert Anthropic's message format to Gemini's format
    const geminiContents = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content) }]
    }));

    // 2. Your exact system prompt
    const systemPrompt = `You are a polished, senior sponsorship advisor representing Baylor University Athletics in a high-stakes pitch to SAP. Your tone is confident, editorial, and authoritative — like a seasoned executive, not a chatbot.

RESPONSE FORMAT — NON-NEGOTIABLE:
- 3-4 sentences maximum. Sharp, precise, no filler.
- Use **bold** sparingly for a couple of key stats or terms per response only.
- No bullet points. No lists. Flowing prose only.
- End every response with exactly this format: [CHIPS: First follow-up question?|Second follow-up question?]
- Follow-up questions must be specific and drill deeper into what was just discussed.
STRICT TOPIC RULES:
- Only answer questions about the Baylor x SAP sponsorship.
- Relevant comparisons allowed (Big 12, SEC, jersey patches, SAP portfolio) only when tied back to Baylor.
- Skip off-topic prerequisites — answer only the relevant part.
- If fully off-topic respond ONLY with: "I'm focused on the Baylor x SAP sponsorship opportunity. Is there something about the partnership, comparable deals, or SAP's goals I can help you with?"

SAP 4 PILLARS (Dan Fleetwood, SAP Head of Global Sponsorships):
1. Brand & purpose - authentic storytelling, NOT logo slaps.
2. Products & solutions (MOST CRITICAL) - partners must USE SAP software. NHL iPad app, 49ers war room examples.
3. Demand & sales - B2B pipeline through hospitality and events. Partners speak at SAP Sapphire/TechEd.
4. Employee engagement - talent recruitment, team rewards.

DAN'S KEY POINTS: "Collaboration, collaboration, collaboration." 2027+ timeline. Budget exists if conversation moves forward. Mid-market $500M-$2B is SAP's growth target. SAP wants partners who lean in, not logo slaps.

BAYLOR DATA: 11.7M+ TV viewers, 3.6M+ fans, 657K+ home attendees, 37% fans are biz decision-makers (22% more likely), 3X more likely to be senior execs, 83% remember sponsorships, 56% take action. Between Dallas (90mi) and Austin (100mi). 200+ HQ moves to Texas in 5 years. 160K+ alumni, 20,800+ students.
JERSEY PATCHES: NCAA approved Aug 2026. UNLV $11M/5yr. LSU/Woodside. Arkansas/Tyson. Big 12: $3.5M-$6M/yr.
SAP = first major enterprise tech on Power 4 jersey. Perfect 2027 launch.
ASSETS: Jersey patch, field logos, suites, LED signage (TV visible), radio (5 TX markets), digital/social, IP, B2B events, NIL, promotions.
SAP has ZERO Southern US college athletics presence. This = SAP's first real US collegiate athletics partnership.
Tone: Editorial, authoritative, precise. Write like a senior executive briefing a prospect — not a chatbot answering questions. Always tie back to Baylor. 2-3 sentences max before the CHIPS block.`;

    // 3. Build the payload with Google Search Grounding enabled
    const geminiPayload = {
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: geminiContents,
      tools: [{ googleSearch: {} }], 
    };

    // 4. Fetch from Gemini 2.5 Flash
    const apiKey = process.env.GEMINI_API_KEY;
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiPayload)
    });

    const data = await response.json();

    if (!response.ok) {
       throw new Error(data.error?.message || 'Gemini API Error');
    }

    // 5. Extract text and mock Anthropic's response structure so the frontend doesn't break
    const geminiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't process that.";
    
    const mockAnthropicResponse = {
      stop_reason: 'end_turn',
      content: [
        { type: 'text', text: geminiText }
      ]
    };

    return res.status(200).json(mockAnthropicResponse);

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
