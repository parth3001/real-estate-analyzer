// Context builder for AI analysis (MCP architecture)

export async function buildSFRContext(dealData: any, analysis: any) {
  // Placeholder for future data sources
  // const crexiData = await getCrexiData(dealData.propertyAddress);
  // const censusData = await getCensusData(dealData.propertyAddress);
  return {
    ...dealData,
    ...analysis,
    // crexiData,
    // censusData,
  };
}

// Add more context builders for MF, market, etc. as needed 