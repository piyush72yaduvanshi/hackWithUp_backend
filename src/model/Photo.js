import mongoose from "mongoose";

const plantAnalysisSchema = new mongoose.Schema({
  plantName: {
    type: String,
    default: null,
  },
  disease: {
    type: String,
    default: null,
  },
  severity: {
    type: String,
    default: null,
  },
  treatment: {
    type: String,
    default: null,
  },
  fullAnalysis: {
    type: String,
    required: true,
  },
  analyzedAt: {
    type: Date,
    default: Date.now,
  },
  userRole: {
    type: String,
    default: null,
  },
});


const PlantAnalysis = mongoose.model("PlantAnalysis", plantAnalysisSchema);

export default PlantAnalysis;