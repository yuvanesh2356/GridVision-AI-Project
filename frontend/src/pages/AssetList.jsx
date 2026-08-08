import React, { useEffect, useState, useCallback } from "react";
import { Zap, Boxes, MapPin, ChevronDown, ChevronUp, AlertTriangle, Radar } from "lucide-react";
import { getAssets, getAssetTimeline } from "../api/client.js";
import HealthScoreGauge from "../components/HealthScoreGauge.jsx";
import TimelineComparison from "../components/TimelineComparison.jsx";

const TYPE_ICON = {
  tower: Zap,
  transformer: Boxes,
};

export default function AssetList() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [timelines, setTimelines] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await getAssets();
      setAssets(data);
    } catch (err) {
      setLoadError(
        err?.response?.data?.detail ||
          "Could not reach the GridVision backend. Confirm the API is running and try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggleExpand = useCallback(
    async (assetId) => {
      if (expandedId === assetId) {
        setExpandedId(null);
        return;
      }
      setExpandedId(assetId);
      if (!timelines[assetId]) {
        try {
          const tl = await getAssetTimeline(assetId);
          setTimelines((prev) => ({ ...prev, [assetId]: tl }));
        } catch {
          setTimelines((prev) => ({ ...prev, [assetId]: null }));
        }
      }
    },
    [expandedId, timelines]
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <div>
          <span className="skeleton block h-6 w-40" />
          <span className="skeleton mt-2 block h-4 w-64" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="hud-panel relative overflow-hidden p-4">
              <span className="hud-corner-tl" />
              <span className="hud-corner-br" />
              <div className="flex items-center gap-4">
                <span className="skeleton h-[72px] w-[72px] shrink-0 rounded-full" />
                <div className="flex-1 space-y-2">
                  <span className="skeleton block h-4 w-24" />
                  <span className="skeleton block h-3 w-16" />
                  <span className="skeleton block h-3 w-28" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="hud-panel relative flex flex-col items-center gap-3 p-10 text-center">
        <span className="hud-corner-tl" />
        <span className="hud-corner-br" />
        <AlertTriangle size={22} className="text-critical" />
        <p className="text-sm text-text-muted">{loadError}</p>
        <button
          onClick={load}
          className="rounded-md border border-signal/40 bg-signal/10 px-3 py-1.5 text-xs font-medium text-signal transition-colors hover:bg-signal/20"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2">
          <Radar size={18} className="text-signal" />
          <h1 className="font-display text-xl font-semibold text-text-primary">
            Grid Assets
          </h1>
        </div>
        <p className="mt-1 text-sm text-text-muted">
          {assets.length} registered assets across the monitored network.
        </p>
      </div>

      {assets.length === 0 ? (
        <div className="hud-panel relative flex flex-col items-center gap-2 p-10 text-center">
          <span className="hud-corner-tl" />
          <span className="hud-corner-br" />
          <Radar size={22} className="text-text-muted" />
          <p className="text-sm text-text-muted">
            No assets registered yet. Seed data should populate this automatically on
            first backend startup.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {assets.map((asset) => {
            const Icon = TYPE_ICON[asset.type] || Boxes;
            const isExpanded = expandedId === asset.id;
            return (
              <div key={asset.id} className="hud-panel relative animate-fadeInUp overflow-hidden transition-transform duration-200 hover:-translate-y-0.5">
                <span className="hud-corner-tl" />
                <span className="hud-corner-br" />
                <div className="flex items-center gap-4 p-4">
                  <HealthScoreGauge score={asset.health_score} size={72} label={false} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <Icon size={14} className="text-signal" />
                      <span className="font-display font-semibold text-text-primary">
                        {asset.name}
                      </span>
                    </div>
                    <div className="mt-0.5 text-xs capitalize text-text-muted">
                      {asset.type}
                    </div>
                    <div className="mt-1.5 flex items-center gap-1 text-[11px] font-mono text-text-muted">
                      <MapPin size={11} />
                      {asset.lat.toFixed(3)}, {asset.lng.toFixed(3)}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => toggleExpand(asset.id)}
                  className="flex w-full items-center justify-center gap-1.5 border-t border-line py-2 text-xs font-medium text-text-muted transition-colors hover:bg-elevated/50 hover:text-signal"
                >
                  {isExpanded ? (
                    <>
                      Hide Timeline <ChevronUp size={14} />
                    </>
                  ) : (
                    <>
                      View Timeline <ChevronDown size={14} />
                    </>
                  )}
                </button>

                {isExpanded && (
                  <div className="border-t border-line p-4">
                    {timelines[asset.id] === undefined ? (
                      <div className="space-y-3">
                        <span className="skeleton block h-4 w-32" />
                        <span className="skeleton block h-[140px] w-full" />
                        <div className="space-y-2">
                          <span className="skeleton block h-4 w-full" />
                          <span className="skeleton block h-4 w-full" />
                          <span className="skeleton block h-4 w-full" />
                        </div>
                      </div>
                    ) : timelines[asset.id] === null ? (
                      <p className="py-4 text-center text-sm text-text-muted">
                        Could not load timeline for this asset.
                      </p>
                    ) : (
                      <TimelineComparison timeline={timelines[asset.id]} compact />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
