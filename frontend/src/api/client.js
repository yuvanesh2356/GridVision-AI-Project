import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  timeout: 60000,
});

// ---------------------------------------------------------------------------
// Inspections
// ---------------------------------------------------------------------------
export async function uploadInspection(file, assetId) {
  const formData = new FormData();
  formData.append("file", file);
  if (assetId !== undefined && assetId !== null && assetId !== "") {
    formData.append("asset_id", assetId);
  }
  const { data } = await api.post("/inspections/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function getInspections(params = {}) {
  const { data } = await api.get("/inspections", { params });
  return data;
}

export async function getInspection(id) {
  const { data } = await api.get(`/inspections/${id}`);
  return data;
}

// ---------------------------------------------------------------------------
// Assets
// ---------------------------------------------------------------------------
export async function getAssets() {
  const { data } = await api.get("/assets");
  return data;
}

export async function getAsset(id) {
  const { data } = await api.get(`/assets/${id}`);
  return data;
}

export async function getAssetTimeline(id) {
  const { data } = await api.get(`/assets/${id}/timeline`);
  return data;
}

// ---------------------------------------------------------------------------
// Management: alerts, reports, tickets
// ---------------------------------------------------------------------------
export async function getAlerts(params = {}) {
  const { data } = await api.get("/management/alerts", { params });
  return data;
}

export async function updateAlertStatus(id, status) {
  const { data } = await api.patch(`/management/alerts/${id}`, { status });
  return data;
}

export function reportDownloadUrl(inspectionId) {
  return `/api/management/reports/${inspectionId}/pdf`;
}

export async function createMaintenanceTicket(inspectionId, priority) {
  const { data } = await api.post("/management/tickets", {
    inspection_id: inspectionId,
    priority: priority ?? null,
  });
  return data;
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------
export async function getDashboardSummary() {
  const { data } = await api.get("/dashboard/summary");
  return data;
}

export async function getDashboardHeatmap() {
  const { data } = await api.get("/dashboard/heatmap");
  return data;
}

export default api;
