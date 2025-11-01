import PlantAnalysis from "../model/Photo.js";
import openaiService from "../utils/openaiClient.js";
import fs from "fs";
import path from "path";

const getImageDataUrl = (imagePath) => {
  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString("base64");
  const ext = path.extname(imagePath).toLowerCase();
  const mimeType = ext === ".png" ? "image/png" : "image/jpeg";
  return `data:${mimeType};base64,${base64Image}`;
};

const parseAnalysis = (analysisText) => {
  const result = {
    plantName: null,
    disease: null,
    severity: null,
    treatment: null,
  };

  const plantMatch = analysisText.match(
    /plant[:\s]+([^\n.]+)|leaf[:\s]+([^\n.]+)/i
  );
  if (plantMatch) {
    result.plantName = (plantMatch[1] || plantMatch[2]).trim();
  }

  const diseaseMatch = analysisText.match(/disease[:\s]+([^\n.]+)/i);
  if (diseaseMatch) {
    result.disease = diseaseMatch[1].trim();
  } else if (analysisText.toLowerCase().includes("healthy")) {
    result.disease = "Healthy";
  }

  const severityMatch = analysisText.match(/severity[:\s]+([^\n.]+)/i);
  if (severityMatch) {
    result.severity = severityMatch[1].trim();
  }

  const treatmentMatch = analysisText.match(
    /treatment[:\s]+([^\n]+)|recommendation[:\s]+([^\n]+)/i
  );
  if (treatmentMatch) {
    result.treatment = (treatmentMatch[1] || treatmentMatch[2]).trim();
  }

  return result;
};

export const uploadAndAnalyzePhoto = async (req, res, next) => {
  let tempFilePath = null;

  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided" });
    }

    tempFilePath = req.file.path;


    const imageDataUrl = getImageDataUrl(tempFilePath);

    const systemPrompt = `
You are an agriculture expert who communicates in friendly and natural Hinglish (a mix of Hindi and English).

Your task is to:
1. Identify the plant name from the uploaded leaf image (for example, "Tomato plant leaf" or "Wheat leaf").
2. Analyze the leaf image carefully to detect any signs of disease or nutrient deficiency.
3. If a disease or problem is found:
   - Mention the name of the disease.
   - Describe its severity (mild, moderate, or severe).
   - Explain the cause and symptoms in brief.
   - Give practical treatment advice (organic + chemical options).
   - Suggest specific medicines or fertilizers, and include relevant e-commerce links (like Amazon, Krishi Store, or BigHaat) for purchase.
   - Give preventive care tips to avoid future infection.
4. If the leaf is healthy, simply say:
   Healthy leaf 🌿 — koi disease nahi hai. Aapka paudha bilkul fit hai!
5. After the analysis, give personalized care tips for better plant health, such as:
   - Watering schedule
   - Fertilizer recommendations
   - Sunlight and soil care

Don't use extra symbols or decorations.
`;

    const userPrompt = `
You are an agriculture expert who communicates in friendly and natural Hinglish (a mix of Hindi and English).
Your task is to:
1. Identify the plant name from the uploaded leaf image (for example, "Tomato plant leaf" or "Wheat leaf").
2. Analyze the leaf image carefully to detect any signs of disease or nutrient deficiency.
3. If a disease or problem is found:
   - Mention the name of the disease.
   - Describe its severity (mild, moderate, or severe).
   - Explain the cause and symptoms in brief.
   - Give practical treatment advice (both organic and chemical options).
   - Suggest specific medicines or fertilizers, and include relevant e-commerce links (like Amazon, Krishi Store, or BigHaat) for purchase.
   - Give preventive care tips to avoid future infection.
4. If the leaf is healthy, simply say:
   Healthy leaf 🌿 — koi disease nahi hai. Aapka paudha bilkul fit hai!
5. After the analysis, give personalized care tips for better plant health, such as:
   - Watering schedule
   - Fertilizer recommendations
   - Sunlight and soil care
Avoid using extra symbols or unnecessary decorations.
`;

    const fullAnalysis = await openaiService.visionCompletion(
      imageDataUrl,
      userPrompt,
      systemPrompt
    );

    const parsedData = parseAnalysis(fullAnalysis);

    const analysis = new PlantAnalysis({
      plantName: parsedData.plantName,
      disease: parsedData.disease,
      severity: parsedData.severity,
      treatment: parsedData.treatment,
      fullAnalysis: fullAnalysis,
    });

    await analysis.save();

    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }

    res.status(201).json(analysis);
  } catch (error) {
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
    next(error);
  }
};

export const getAllAnalyses = async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const skip = Math.max(parseInt(req.query.skip) || 0, 0);
    const role = req.query.role;

    const filter = {};
    if (role) {
      filter.userRole = role;
    }

    const analyses = await PlantAnalysis.find(filter)
      .sort({ analyzedAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean();

    res.json(analyses);
  } catch (error) {
    next(error);
  }
};

export const getAnalysisById = async (req, res, next) => {
  try {
    const analysis = await PlantAnalysis.findById(req.params.id).lean();
    if (!analysis) {
      return res.status(404).json({ error: "Analysis not found" });
    }

    res.json(analysis);
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ error: "Invalid analysis ID" });
    }
    next(error);
  }
};

export const getStatisticsByRole = async (req, res, next) => {
  try {
    const stats = await PlantAnalysis.aggregate([
      {
        $group: {
          _id: "$userRole",
          count: { $sum: 1 },
          healthyCount: {
            $sum: {
              $cond: [
                { $regexMatch: { input: "$disease", regex: /healthy/i } },
                1,
                0,
              ],
            },
          },
          diseasedCount: {
            $sum: {
              $cond: [
                { $regexMatch: { input: "$disease", regex: /healthy/i } },
                0,
                1,
              ],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          role: "$_id",
          total: "$count",
          healthy: "$healthyCount",
          diseased: "$diseasedCount",
        },
      },
    ]);

    res.json(stats);
  } catch (error) {
    next(error);
  }
};
