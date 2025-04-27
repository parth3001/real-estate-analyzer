const OpenAI = require('openai');
const logger = require('winston');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

exports.testConnection = async (req, res) => {
  try {
    // First do a simple test to verify the connection
    const testResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant."
        },
        {
          role: "user",
          content: "Test connection - respond with 'OpenAI connection successful!'"
        }
      ],
      max_tokens: 50
    });
    
    // Now test the JSON structured response capability for real estate analysis
    const analysisTestResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a real estate investment expert. Provide structured analysis."
        },
        {
          role: "user",
          content: `Provide a quick sample analysis for this property in JSON format:
          
          {
            "summary": "Brief summary of a test property",
            "strengths": ["strength1", "strength2"],
            "weaknesses": ["weakness1", "weakness2"],
            "recommendations": ["recommendation1", "recommendation2"],
            "investmentScore": 75
          }`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 300
    });
    
    // Parse the analysis test response
    let analysisJson = {};
    try {
      analysisJson = JSON.parse(analysisTestResponse.choices[0].message.content);
    } catch (error) {
      analysisJson = { error: "Failed to parse JSON response" };
    }

    res.json({
      success: true,
      message: "OpenAI connection test successful",
      basicResponse: testResponse.choices[0].message.content,
      jsonStructuredResponse: analysisJson
    });
  } catch (error) {
    logger.error('OpenAI connection test failed:', error);
    res.status(500).json({
      success: false,
      message: "OpenAI connection test failed",
      error: error.message
    });
  }
}; 