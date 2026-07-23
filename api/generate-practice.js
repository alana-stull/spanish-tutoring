export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const { topicLabel } = req.body || {};
  if (!topicLabel) return res.status(400).json({ error: 'topicLabel required' });

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: `Generate 5 new Spanish practice questions on the topic "${topicLabel}" for a Duke Athletics tutoring student transitioning from Spanish 1 to Spanish 2. Return ONLY a raw JSON array, no markdown fences, no preamble, matching exactly this schema:
[{"type":"mc","text":"Spanish sentence with a ___ blank, or a short conceptual question in English","options":["opt1","opt2","opt3","opt4"],"answer":0,"translation":"English translation of the Spanish sentence"},{"type":"fill","text":"Spanish sentence with a ___ blank","answers":["correctword"],"translation":"English translation"}]
Mix mc and fill types (roughly half and half). Where natural, set sentences around college athletics, teammates, classes, or campus life. Keep grammar strictly limited to the topic "${topicLabel}". Keep vocabulary at a late Spanish 1 / early Spanish 2 level.`,
        }],
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      return res.status(502).json({ error: 'Anthropic API error', detail });
    }

    const data = await response.json();
    const textBlock = (data.content || []).find((b) => b.type === 'text');
    if (!textBlock) return res.status(502).json({ error: 'No text in response' });

    let raw = textBlock.text.trim();
    raw = raw.replace(/^```json/i, '').replace(/^```/, '').replace(/```$/, '').trim();
    const questions = JSON.parse(raw);
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(502).json({ error: 'Empty question list' });
    }

    return res.status(200).json({ questions });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
