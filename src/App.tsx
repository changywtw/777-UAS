import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Plane, 
  Wind, 
  ArrowUpRight, 
  ArrowDownRight, 
  MoveHorizontal, 
  AlertTriangle,
  Settings,
  Info,
  ChevronRight,
  Edit2,
  Check,
  X,
  RefreshCw,
  Sparkles
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { 
  PASSENGER_TABLES, 
  FREIGHTER_TABLES,
  QRHTable
} from "./data/qrhData";
import { interpolate } from "./lib/interpolation";

export default function App() {
  const CURRENT_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'v2026.08.29.0000Z';
  const [isFreighter, setIsFreighter] = useState(false);
  const [weight, setWeight] = useState<number | undefined>(260);
  const [targetAltitude, setTargetAltitude] = useState<number | undefined>(20000);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isUpdating, setIsUpdating] = useState(false);
  const [publishedVersion, setPublishedVersion] = useState<string | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [updateFeedback, setUpdateFeedback] = useState<string | null>(null);

  const checkForPublishedVersion = async (isManual = false) => {
    if (isManual) {
      setUpdateFeedback("Checking...");
    }
    try {
      if (!navigator.onLine) {
        if (isManual) {
          setUpdateFeedback("Offline mode");
          setTimeout(() => setUpdateFeedback(null), 2500);
        }
        return;
      }

      const res = await fetch(`/version.json?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache' }
      });

      if (res.ok) {
        const data = await res.json();
        if (data.version && data.version !== CURRENT_VERSION) {
          setPublishedVersion(data.version);
          setIsDismissed(false);
          if (isManual) {
            setUpdateFeedback("Update available!");
            setTimeout(() => setUpdateFeedback(null), 2500);
          }
          return;
        }
      }

      // App is already at the latest published version
      setPublishedVersion(null);
      if (isManual) {
        setUpdateFeedback("Latest version");
        setTimeout(() => setUpdateFeedback(null), 2500);
      }
    } catch {
      if (isManual) {
        setUpdateFeedback(navigator.onLine ? "Latest version" : "Offline mode");
        setTimeout(() => setUpdateFeedback(null), 2500);
      }
    }
  };

  const handleForceUpdate = async () => {
    setIsUpdating(true);
    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          await reg.update().catch(() => {});
        }
      }
    } catch (e) {
      console.warn('Update error:', e);
    }

    // Force cache-busting reload on user action
    setTimeout(() => {
      window.location.replace(window.location.origin + window.location.pathname + '?_v=' + Date.now());
    }, 300);
  };

  useEffect(() => {
    // Initial check on load
    if (navigator.onLine) {
      checkForPublishedVersion(false);
    }

    const handleOnline = () => {
      setIsOnline(true);
      checkForPublishedVersion(false);
    };
    const handleOffline = () => setIsOnline(false);

    // Periodic check every 5 minutes when online
    const interval = setInterval(() => {
      if (navigator.onLine) {
        checkForPublishedVersion(false);
      }
    }, 5 * 60 * 1000);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const initialTables = useMemo(() => isFreighter ? FREIGHTER_TABLES : PASSENGER_TABLES, [isFreighter]);
  const [tables, setTables] = useState(initialTables);

  useEffect(() => {
    setTables(initialTables);
  }, [initialTables]);

  const weightLimits = useMemo(() => isFreighter ? { min: 150, max: 350 } : { min: 160, max: 360 }, [isFreighter]);
  const defaultWeight = isFreighter ? 250 : 260;

  const [phaseName, setPhaseName] = useState<string>(initialTables[0].name);
  const [configValue, setConfigValue] = useState<number>(0); // Used for Flaps index in Terminal/Approach
  const [isEditing, setIsEditing] = useState(false);
  const [editingCell, setEditingCell] = useState<{ rowIndex: number; weightIndex: number; param: string; value: string } | null>(null);

  const selectedTable = useMemo(() => tables.find(t => t.name === phaseName) || tables[0], [phaseName, tables]);

  const handlePhaseChange = (val: string) => {
    setPhaseName(val);
    if (val.includes("Terminal")) {
      setConfigValue(0); // FLAPS UP
    } else if (val.includes("Approach")) {
      setConfigValue(20); // FLAPS 20
    }
  };

  const updateCell = (rowIndex: number, weightIndex: number, param: string, value: string) => {
    setTables(prev => prev.map(t => {
      if (t.name !== selectedTable.name) return t;
      const newRows = [...t.rows];
      const row = newRows[rowIndex];
      const newData = [...row.data];
      const currentPoint = newData[weightIndex] || { pitch: 0 };
      
      const numValue = parseFloat(value);
      newData[weightIndex] = {
        ...currentPoint,
        [param]: isNaN(numValue) ? undefined : numValue
      };
      
      newRows[rowIndex] = { ...row, data: newData };
      return { ...t, rows: newRows };
    }));
  };

  // Determine target value for interpolation based on table type
  const targetValue = useMemo(() => {
    if (selectedTable.name.includes("Terminal") || selectedTable.name.includes("Approach")) {
      return configValue;
    }
    return targetAltitude ?? 0;
  }, [selectedTable, targetAltitude, configValue]);

  const interpolationResult = useMemo(() => {
    if (weight === undefined || targetAltitude === undefined) return null;
    return interpolate(selectedTable, targetValue, weight);
  }, [selectedTable, targetValue, weight, targetAltitude]);

  const isInvalidGoAround = useMemo(() => {
    return phaseName.includes("Go-Around") && interpolationResult?.result.vs !== undefined && interpolationResult.result.vs < 0;
  }, [phaseName, interpolationResult]);

  const isOutsideRange = useMemo(() => {
    return !interpolationResult || interpolationResult.type === "EXTRAPOLATED";
  }, [interpolationResult]);

  const isWeightOutsideTableRange = useMemo(() => {
    if (weight === undefined) return false;
    const minW = Math.min(...selectedTable.weights);
    const maxW = Math.max(...selectedTable.weights);
    return weight < minW || weight > maxW;
  }, [selectedTable.weights, weight]);

  const isAltitudeOutsideTableRange = useMemo(() => {
    if (targetAltitude === undefined) return false;
    if (selectedTable.name.includes("Terminal") || selectedTable.name.includes("Approach")) return false;
    const rowValues = selectedTable.rows.map(r => r.value);
    const minA = Math.min(...rowValues);
    const maxA = Math.max(...rowValues);
    return targetAltitude < minA || targetAltitude > maxA;
  }, [selectedTable.rows, selectedTable.name, targetAltitude]);

  const altitudeLimits = useMemo(() => {
    if (phaseName.includes("Holding")) return { min: 5000, max: 10000 };
    if (phaseName.includes("Go-Around")) return { min: 0, max: 10000 };
    if (phaseName.includes("Cruise")) return { min: 15000, max: 40000 };
    return { min: 0, max: 40000 };
  }, [phaseName]);

  const handleWeightChange = (val: number | undefined, isSlider = false, rawValue?: string) => {
    if (isSlider) {
      setWeight(Math.max(weightLimits.min, Math.min(weightLimits.max, val ?? defaultWeight)));
      return;
    }
    
    if (rawValue === "") {
      setWeight(undefined);
      return;
    }

    if (rawValue && rawValue.length >= 3) {
      setWeight(Math.max(weightLimits.min, Math.min(weightLimits.max, val ?? 0)));
    } else {
      setWeight(val);
    }
  };

  const handleAltitudeChange = (val: number | undefined, isSlider = false, rawValue?: string) => {
    if (isSlider) {
      setTargetAltitude(Math.max(altitudeLimits.min, Math.min(altitudeLimits.max, val ?? 20000)));
      return;
    }

    if (rawValue === "") {
      setTargetAltitude(undefined);
      return;
    }

    if (rawValue && rawValue.length >= 5) {
      setTargetAltitude(Math.max(altitudeLimits.min, Math.min(altitudeLimits.max, val ?? 0)));
    } else {
      setTargetAltitude(val);
    }
  };

  // Only snap values when the phase (and thus limits) actually changes
  useEffect(() => {
    setTargetAltitude(prev => Math.max(altitudeLimits.min, Math.min(altitudeLimits.max, prev ?? 0)));
    setWeight(prev => Math.max(weightLimits.min, Math.min(weightLimits.max, prev ?? defaultWeight)));
  }, [phaseName, weightLimits, altitudeLimits, defaultWeight]); // Run when phase or limits change

  const getPhaseIcon = (name: string) => {
    if (name.includes("Climb")) return <ArrowUpRight className="w-4 h-4" />;
    if (name.includes("Descent")) return <ArrowDownRight className="w-4 h-4" />;
    if (name.includes("Cruise") || name.includes("Holding")) return <MoveHorizontal className="w-4 h-4" />;
    return <Plane className="w-4 h-4" />;
  };

  return (
    <div className="min-h-[100dvh] bg-[#E4E3E0] text-[#141414] font-sans p-[5px] pt-[25px] selection:bg-[#141414] selection:text-[#E4E3E0]" >
      <header className="max-w-7xl mx-auto mb-2 flex flex-row items-center justify-between gap-2 border-[#141414] py-1">
        <div className="flex items-center gap-2 min-w-0">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              const nextIsFreighter = !isFreighter;
              setIsFreighter(nextIsFreighter);
              setWeight(nextIsFreighter ? 250 : 260);
            }}
            className={`group shrink-0 relative flex items-center gap-0 border-2 rounded-lg overflow-hidden transition-all duration-500 w-[145px] sm:w-[180px] ${
              isFreighter 
                ? "bg-blue-600 border-blue-400 text-white shadow-[0_0_20px_rgba(37,99,235,0.2)]" 
                : "bg-white border-[#141414] text-[#141414] shadow-[4px_4px_0px_#141414]"
            }`}
          >
            {/* Icon Section */}
            <div className={`p-2 sm:p-2.5 border-r-2 transition-colors duration-500 ${isFreighter ? "border-blue-400/30" : "border-[#141414]"}`}>
              <Plane className={`w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-700 ${isFreighter ? "rotate-[372deg]" : "rotate-0"}`} />
            </div>
            
            {/* Info Section */}
            <div className="px-2.5 sm:px-4 py-1.5 sm:py-2 flex flex-col items-start text-left">
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-black tracking-tighter uppercase leading-none">
                  {isFreighter ? "B777-F" : "B777-300ER"}
                </span>
              </div>
              <span className={`text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.15em] transition-opacity duration-500 ${isFreighter ? "opacity-70" : "opacity-40"}`}>
                GE90-115B
              </span>
            </div>
            
            {/* Hover indicator */}
            <div className="absolute inset-0 bg-current opacity-0 group-hover:opacity-[0.03] transition-opacity" />
          </motion.button>
          
          <div className="min-w-0">
            <h2 className="text-base sm:text-2xl font-bold tracking-tight font-serif leading-tight">
              <span className="block sm:inline">Unreliable Airspeed</span>
              <span className="block sm:inline sm:ml-2 font-sans text-[11px] sm:text-base not-italic font-normal opacity-50">
                QRH {isFreighter ? "PI-QRH.20" : "PI-QRH.10"}
              </span>
            </h2>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-2">
        {/* Left Column: Flight State */}
        <div className="lg:col-span-4 space-y-2">
          <Card className="border-[#141414] bg-white border-2 rounded-lg">
            <CardContent className="p-3 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1.5 bg-[#141414] rounded text-white">
                  <Settings className="w-3.5 h-3.5" />
                </div>
                <Label className="text-[14px] uppercase font-bold">Flight State</Label>
              </div>

              {/* Primary Inputs */}
              <div className="space-y-2">
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase font-bold opacity-50">Phase of Flight</Label>
                  <Select value={phaseName} onValueChange={handlePhaseChange}>
                    <SelectTrigger className="border-[#141414] bg-white w-full h-10 text-[16px]">
                      <SelectValue placeholder="Select phase" />
                    </SelectTrigger>
                    <SelectContent>
                      {tables.map((t, i) => (
                        <SelectItem key={i} value={t.name}>
                          <div className="flex items-center gap-2">
                            {getPhaseIcon(t.name)}
                            {t.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase font-bold opacity-50">Gross Weight (tons)</Label>
                    <div className="flex items-center gap-3">
                      <Input 
                        type="number" 
                        step="1"
                        value={Number.isNaN(weight) || weight === undefined ? "" : weight} 
                        onChange={(e) => {
                          const val = e.target.value === "" ? undefined : parseFloat(e.target.value);
                          handleWeightChange(val, false, e.target.value);
                        }}
                        onBlur={(e) => {
                          const val = parseFloat(e.target.value);
                          if (!isNaN(val)) {
                            setWeight(Math.max(weightLimits.min, Math.min(weightLimits.max, val)));
                          } else {
                            setWeight(defaultWeight);
                          }
                        }}
                        className={`bg-white font-mono text-[16px] h-10 w-24 border-2 transition-all ${isWeightOutsideTableRange ? '!border-red-500 !ring-2 !ring-red-500/20' : 'border-[#141414]'}`}
                      />
                      <div className="flex-1 px-1">
                        <input 
                          type="range"
                          min={weightLimits.min}
                          max={weightLimits.max}
                          step="1"
                          value={Number.isNaN(weight) || weight === undefined ? defaultWeight : weight}
                          onChange={(e) => handleWeightChange(parseFloat(e.target.value), true)}
                          className="w-full h-3 bg-[#141414]/10 rounded-lg appearance-none cursor-pointer accent-[#141414] touch-pan-x"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    {selectedTable.name.includes("Terminal") || selectedTable.name.includes("Approach") ? (
                      <>
                        <Label className="text-[10px] uppercase font-bold opacity-50">CONFIGURATION</Label>
                        <Select value={(configValue ?? 0).toString()} onValueChange={(v) => setConfigValue(parseInt(v))}>
                          <SelectTrigger className="border-[#141414] bg-white w-full h-10 text-[16px]">
                            <SelectValue placeholder="Select configuration">
                              {selectedTable.rows.find(r => r.value === configValue)?.label}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent className="min-w-[280px]">
                            {selectedTable.rows.map((row, i) => (
                              <SelectItem key={i} value={(row.value ?? 0).toString()}>
                                {row.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </>
                    ) : (
                      <>
                        <Label className="text-[10px] uppercase font-bold opacity-50">Pressure Altitude (FT)</Label>
                        <div className="flex items-center gap-3">
                          <Input 
                            type="number" 
                            value={Number.isNaN(targetAltitude) || targetAltitude === undefined ? "" : targetAltitude} 
                            onChange={(e) => {
                              const val = e.target.value === "" ? undefined : parseInt(e.target.value);
                              handleAltitudeChange(val, false, e.target.value);
                            }}
                            onBlur={(e) => {
                              const val = parseInt(e.target.value);
                              if (!isNaN(val)) {
                                setTargetAltitude(Math.max(altitudeLimits.min, Math.min(altitudeLimits.max, val)));
                              } else {
                                setTargetAltitude(altitudeLimits.min);
                              }
                            }}
                            className={`bg-white font-mono text-[16px] h-10 w-24 border-2 transition-all ${isAltitudeOutsideTableRange ? '!border-red-500 !ring-2 !ring-red-500/20' : 'border-[#141414]'}`}
                          />
                          <div className="flex-1 px-1">
                            <input 
                              type="range"
                              min={altitudeLimits.min}
                              max={altitudeLimits.max}
                              step="1000"
                              value={Number.isNaN(targetAltitude) ? 0 : targetAltitude}
                              onChange={(e) => handleAltitudeChange(parseInt(e.target.value), true)}
                              className="w-full h-3 bg-[#141414]/10 rounded-lg appearance-none cursor-pointer accent-[#141414] touch-pan-x"
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded flex items-center gap-3">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <div className="text-[11px] leading-tight text-amber-900">
                  <strong>WARNING:</strong> Altitude and vertical speed indications may be unreliable. Use calculated pitch and thrust as primary reference.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Results & Tables */}
        <div className="lg:col-span-8 space-y-2">
          {/* Results Display */}
          <div className="w-full">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full"
            >
                <Card className="bg-white border-2 border-[#141414]">
                  <CardContent className="p-0">
                    <div className="flex flex-row w-full items-stretch divide-x-2 divide-[#141414]">
                      {/* Part 1: Aircraft Configuration */}
                      <div className="flex-1 p-1.5 sm:p-2 space-y-1.5 sm:space-y-2 border-r-0 border-[#141414] bg-white rounded-l-lg">
                        <div className="flex items-center justify-center gap-1 w-full">
                          <Label className="text-[11px] sm:text-[12px] uppercase font-bold opacity-70">Configuration</Label>
                        </div>

                        <div>
                          {(() => {
                            const configLabel = (() => {
                              if (selectedTable.name.includes("Terminal") || selectedTable.name.includes("Approach")) {
                                return selectedTable.rows.find(r => r.value === configValue)?.label || "FLAPS UP, GEAR UP";
                              }
                              if (selectedTable.name.includes("Go-Around")) {
                                return "FLAPS 20, GEAR UP";
                              }
                              return "FLAPS UP, GEAR UP";
                            })();
                            const [flapsPart, gearPart] = configLabel.split(',').map(s => s.trim());
                            const flaps = flapsPart;
                            const gear = gearPart?.split('(')[0].trim() || "GEAR UP";
                            
                            return (
                              <div className="grid grid-cols-2 gap-1.5 sm:gap-3">
                                <div className="flex flex-col items-center text-center space-y-0.5 sm:space-y-1 min-w-0">
                                  <Label className="text-[9px] sm:text-[10px] uppercase font-bold opacity-50">Flaps</Label>
                                  <div className="text-sm sm:text-xl md:text-2xl font-mono font-bold truncate w-full">
                                    <AnimatePresence mode="popLayout">
                                      <motion.div
                                        key={flaps}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 0.2 }}
                                      >
                                        {flaps.toUpperCase().includes("UP") ? "UP" : flaps.replace(/FLAPS/i, '').split('(')[0].trim()}
                                      </motion.div>
                                    </AnimatePresence>
                                  </div>
                                </div>
                                <div className="flex flex-col items-center text-center space-y-0.5 sm:space-y-1 min-w-0">
                                  <Label className="text-[9px] sm:text-[10px] uppercase font-bold opacity-50">Gear</Label>
                                  <div className="text-sm sm:text-xl md:text-2xl font-mono font-bold truncate w-full">
                                    <AnimatePresence mode="popLayout">
                                      <motion.div
                                        key={gear}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 0.2 }}
                                      >
                                        {gear.toUpperCase().includes("DOWN") ? "DOWN" : "UP"}
                                      </motion.div>
                                    </AnimatePresence>
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>

                      {/* Part 2: Pilot Action */}
                      <div className={`flex-1 p-1.5 sm:p-2 space-y-1.5 sm:space-y-2 border-2 rounded-xl transition-colors duration-200 relative z-10 overflow-hidden ${isOutsideRange ? 'border-red-500 bg-red-50' : 'border-[#228B22] bg-[#f2fcf2]'}`}>
                        <div className="flex items-center justify-center gap-1 w-full">
                          <Label className={`text-[11px] sm:text-[12px] uppercase font-bold ${isOutsideRange ? 'text-red-700' : 'text-[#1d6b1d]'}`}>Pilot Action</Label>
                        </div>
                        <div className="grid grid-cols-2 gap-1 sm:gap-3">
                          <div className="flex flex-col items-center text-center space-y-0.5 sm:space-y-1 min-w-0">
                            <Label className="text-[9px] sm:text-[10px] uppercase font-bold opacity-50">Pitch</Label>
                            <div className="text-sm sm:text-xl md:text-2xl font-mono font-black tracking-tight sm:tracking-tighter truncate w-full">
                              <AnimatePresence mode="popLayout">
                                <motion.div
                                  key={isInvalidGoAround || interpolationResult?.type === "EXTRAPOLATED" ? "invalid" : interpolationResult?.result.pitch}
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  {isInvalidGoAround || interpolationResult?.type === "EXTRAPOLATED" ? "N/A" : (interpolationResult && !Number.isNaN(interpolationResult.result.pitch) ? `${interpolationResult.result.pitch}°` : "N/A")}
                                </motion.div>
                              </AnimatePresence>
                            </div>
                          </div>
                          <div className="flex flex-col items-center text-center space-y-0.5 sm:space-y-1 min-w-0">
                            <Label className="text-[9px] sm:text-[10px] uppercase font-bold opacity-50">Thrust</Label>
                            <div className="text-xs sm:text-lg md:text-2xl font-mono font-black tracking-tight sm:tracking-tighter truncate w-full leading-relaxed sm:leading-none">
                              <AnimatePresence mode="popLayout">
                                <motion.div
                                  key={(isInvalidGoAround || interpolationResult?.type === "EXTRAPOLATED" ? "invalid" : JSON.stringify(interpolationResult?.result.thrust || interpolationResult?.result.vs)) + phaseName}
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  {isInvalidGoAround || interpolationResult?.type === "EXTRAPOLATED" ? "N/A" : (interpolationResult ? (
                                    phaseName.includes("Go-Around") ? "G/A" :
                                    interpolationResult.result.thrust !== undefined && !Number.isNaN(interpolationResult.result.thrust) ? `${interpolationResult.result.thrust}%` : 
                                    interpolationResult.result.vs !== undefined && !Number.isNaN(interpolationResult.result.vs) ? (
                                      interpolationResult.result.vs < 0 ? "IDLE" : 
                                      phaseName.includes("Climb") ? "MAX CLB" : "MAX"
                                    ) : "MAX"
                                  ) : "N/A")}
                                </motion.div>
                              </AnimatePresence>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Part 3: Outcome */}
                      <div className="flex-1 p-1.5 sm:p-2 space-y-1.5 sm:space-y-2 border-l-0 border-[#141414] bg-white rounded-r-lg">
                        <div className="flex items-center justify-center gap-1 w-full">
                          <Label className="text-[11px] sm:text-[12px] uppercase font-bold opacity-70">Outcome</Label>
                        </div>
                        <div className="grid grid-cols-2 gap-1 sm:gap-3">
                          <div className="flex flex-col items-center text-center space-y-0.5 sm:space-y-1 min-w-0">
                            <Label className="text-[9px] sm:text-[10px] uppercase font-bold opacity-50">Airspeed</Label>
                            <div className="text-sm sm:text-xl md:text-2xl font-mono font-black tracking-tight sm:tracking-tighter truncate w-full">
                              <AnimatePresence mode="popLayout">
                                <motion.div
                                  key={isInvalidGoAround || interpolationResult?.type === "EXTRAPOLATED" ? "invalid" : (interpolationResult?.result.kias || interpolationResult?.result.mach)}
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  {isInvalidGoAround || interpolationResult?.type === "EXTRAPOLATED" ? "—" : (interpolationResult?.result.mach !== undefined && !Number.isNaN(interpolationResult.result.mach) 
                                    ? `.${interpolationResult.result.mach.toFixed(2).split('.')[1]}M`
                                    : interpolationResult?.result.kias !== undefined && !Number.isNaN(interpolationResult.result.kias) 
                                      ? interpolationResult.result.kias 
                                      : "—")}
                                </motion.div>
                              </AnimatePresence>
                            </div>
                            <p className="text-[9px] sm:text-[10px] font-mono opacity-70 uppercase">
                              {interpolationResult?.result.mach !== undefined ? "MACH" : "KIAS"}
                            </p>
                          </div>
                          <div className="flex flex-col items-center text-center space-y-0.5 sm:space-y-1 min-w-0">
                            <Label className="text-[9px] sm:text-[10px] uppercase font-bold opacity-50">V/S</Label>
                            <div className="text-sm sm:text-xl md:text-2xl font-mono font-black tracking-tight sm:tracking-tighter truncate w-full">
                              <AnimatePresence mode="popLayout">
                                <motion.div
                                  key={isInvalidGoAround || interpolationResult?.type === "EXTRAPOLATED" ? "invalid" : (() => {
                                    if (phaseName.includes("Cruise") || phaseName.includes("Holding") || phaseName.includes("Terminal")) return "0";
                                    if (phaseName.includes("Approach") && interpolationResult?.result.kias) return Math.round(interpolationResult.result.kias * -5.3);
                                    return interpolationResult?.result.vs;
                                  })()}
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  {isInvalidGoAround || interpolationResult?.type === "EXTRAPOLATED" ? "—" : (() => {
                                    if (phaseName.includes("Cruise") || phaseName.includes("Holding") || phaseName.includes("Terminal")) {
                                      return "0";
                                    }
                                    if (phaseName.includes("Approach") && interpolationResult?.result.kias) {
                                      // 3 degree glideslope calculation: V/S (fpm) ≈ Groundspeed (kts) * 5.3
                                      // Using KIAS as approximation for GS
                                      const vs = Math.round(interpolationResult.result.kias * -5.3);
                                      return vs;
                                    }
                                    return interpolationResult?.result.vs !== undefined && !Number.isNaN(interpolationResult.result.vs) 
                                      ? interpolationResult.result.vs 
                                      : "—";
                                  })()}
                                </motion.div>
                              </AnimatePresence>
                            </div>
                            <p className="text-[9px] sm:text-[10px] font-mono opacity-70 uppercase">
                              FT/MIN {phaseName.includes("Approach") && "(3° G/S)"}
                            </p>
                          </div>
                        </div>
                      </div>

                    </div>
                    {/* Warning Message Row */}
                    {(interpolationResult?.type === "EXTRAPOLATED" || !interpolationResult) && (
                      <div className="p-1 flex items-center justify-center gap-2 text-red-600 text-[10px] uppercase font-black bg-red-50 border-b border-red-100">
                        <AlertTriangle className="w-3 h-3 shrink-0" />
                        <p>PARAMETERS OUTSIDE QRH RANGE</p>
                      </div>
                    )}
                    {interpolationResult?.isShaded && (
                      <div className="p-1 text-amber-500 text-[10px] flex items-center justify-center gap-2 uppercase font-bold">
                        <Info className="w-3 h-3" />
                        Minimum speed limitation applies (+15 knots above min maneuver)
                      </div>
                    )}
                    {isInvalidGoAround && (
                      <div className="p-1.5 bg-red-100 text-red-700 text-[10px] flex items-center justify-center gap-2 uppercase font-black border-t border-red-200 animate-pulse">
                        <AlertTriangle className="w-3 h-3 shrink-0" />
                        <p>INVALID OUTPUT - Performance Insufficient</p>
                      </div>
                    )}
                    {phaseName.includes("Go-Around") && interpolationResult?.type === "EXTRAPOLATED" && !isInvalidGoAround && (
                      <div className="p-1.5 bg-red-50 text-red-600 text-[10px] flex items-center justify-center gap-2 uppercase font-bold border-t border-red-100">
                        <AlertTriangle className="w-3 h-3 shrink-0" />
                        <p>Extrapolation in G/A: Use pitch/thrust at own risk</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
          </div>

          {/* Reference Tables */}
          <Card className="border-[#141414] bg-white shadow-none border-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-1">
              <div>
                <CardTitle className="text-[16px] font-bold uppercase tracking-tight">QRH Reference Table</CardTitle>
                <CardDescription className="text-[10px] font-mono uppercase">Live highlight of interpolated values</CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-end">
                  <Label className="text-[10px] uppercase font-bold opacity-50 mb-0.5">Calculation Method</Label>
                  <div className="flex items-center gap-2">
                    <span className={`text-[8px] font-bold px-1 py-0.5 rounded uppercase ${
                      interpolationResult?.type === "EXACT" ? "bg-green-100 text-green-700" : 
                      (!interpolationResult || interpolationResult?.type === "EXTRAPOLATED") ? "bg-red-100 text-red-700" :
                      interpolationResult?.type === "BILINEAR" ? "bg-blue-100 text-blue-700" : 
                      "bg-amber-100 text-amber-700"
                    }`}>
                      {interpolationResult?.type === "EXACT" ? "EXACT MATCH" : 
                       interpolationResult?.type === "EXTRAPOLATED" ? "EXTRAPOLATED" :
                       interpolationResult?.type === "LINEAR_WEIGHT" ? "LINEAR (WT)" : 
                       interpolationResult?.type === "LINEAR_ROW" ? "LINEAR (ALT)" : 
                       interpolationResult?.type === "BILINEAR" ? "BILINEAR" : "N/A"}
                    </span>
                    <span className="text-[10px] font-mono opacity-50 uppercase">
                      {(!interpolationResult || interpolationResult?.type === "EXTRAPOLATED") ? "OUTSIDE RANGE" : "WITHIN RANGE"}
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="overflow-x-auto">
                <Table key={`${phaseName}-${targetValue}-${weight}`} className="border border-[#141414]">
                  <TableHeader className="bg-[#141414]">
                    <TableRow className="h-10">
                      <TableHead className="text-[#E4E3E0] font-mono text-[16px] uppercase border-r border-white/20 h-10 w-24 text-center">
                        {selectedTable.name.includes("Terminal") || selectedTable.name.includes("Approach") ? "FLAPS" : "ALT (FT)"}
                      </TableHead>
                      <TableHead className="text-[#E4E3E0] font-mono text-[16px] uppercase border-r border-white/20 text-center h-10 w-20">PARAM</TableHead>
                      {selectedTable.weights.map((w, i) => (
                        <TableHead 
                          key={w} 
                          className={`text-[#E4E3E0] font-mono text-[16px] uppercase text-center transition-colors h-10 ${interpolationResult?.weightIndices.includes(i) ? 'bg-blue-900' : ''}`}
                        >
                          {w}T
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedTable.rows.map((row, rowIndex) => {
                      const isInterpolatedRow = interpolationResult?.rowIndices?.includes(rowIndex) ?? false;
                      const isExactRowMatch = interpolationResult?.type === "EXACT" || interpolationResult?.type === "LINEAR_WEIGHT";
                      const isRowHighlight = isInterpolatedRow && (!isExactRowMatch || interpolationResult?.rowIndices[0] === rowIndex);
                      
                      // Determine how many parameters to show based on QRH images
                      const params: ("pitch" | "thrust" | "vs" | "kias" | "mach")[] = ["pitch"];
                      
                      // For Climb, Cruise, Descent, speeds are in the labels, not separate rows
                      const isEnroute = selectedTable.name.includes("Climb") || 
                                       selectedTable.name.includes("Cruise") || 
                                       selectedTable.name.includes("Descent");

                      if (row.data.some(d => d?.thrust !== undefined)) params.push("thrust");
                      if (row.data.some(d => d?.vs !== undefined)) params.push("vs");
                      
                      // Only show KIAS/MACH as rows for Holding, Terminal, Approach, and Go-Around
                      if (!isEnroute) {
                        if (row.data.some(d => d?.kias !== undefined)) params.push("kias");
                        if (row.data.some(d => d?.mach !== undefined)) params.push("mach");
                      }

                      return params.map((param, pIdx) => (
                        <TableRow key={`${rowIndex}-${param}`} className={`${isRowHighlight ? 'bg-blue-50/30' : ''} border-b border-[#141414]/10 h-8`}>
                          {pIdx === 0 && (
                            <TableCell 
                              rowSpan={params.length} 
                              className={`font-bold font-mono text-[16px] border-r border-[#141414] py-1 text-center ${isRowHighlight ? 'bg-blue-100/30' : ''}`}
                            >
                              {selectedTable.name.includes("Terminal") || selectedTable.name.includes("Approach") 
                                ? row.label.split(',')[0].split('(')[0].replace("FLAPS ", "").trim() 
                                : row.label}
                            </TableCell>
                          )}
                          <TableCell className="text-[16px] font-mono uppercase opacity-50 border-r border-[#141414]/10 text-center py-1">
                            {param === "pitch" ? "PITCH" : param === "thrust" ? "%N1" : param === "vs" ? "V/S" : param === "kias" ? "KIAS" : "MACH"}
                          </TableCell>
                          {row.data.map((d, wIndex) => {
                            const isWeightMatch = interpolationResult?.weightIndices?.includes(wIndex) ?? false;
                            const isCellMatch = isWeightMatch && isInterpolatedRow;
                            const isShaded = d?.shaded ?? false;
                            
                            let highlightClass = "";
                            if (isCellMatch) {
                              if (interpolationResult?.type === "EXACT") {
                                highlightClass = "bg-green-100 font-bold text-green-900 border-2 border-green-500 z-10 relative";
                              } else if (interpolationResult?.type === "EXTRAPOLATED") {
                                highlightClass = "bg-red-50 font-bold text-red-900 border border-red-400";
                              } else if (interpolationResult?.type === "LINEAR_WEIGHT" || interpolationResult?.type === "LINEAR_ROW") {
                                highlightClass = "bg-amber-50 font-bold text-amber-900 border border-amber-400";
                              } else {
                                highlightClass = "bg-blue-100 font-bold text-blue-900 border border-blue-400";
                              }
                            } else if (isShaded) {
                              highlightClass = "bg-gray-200";
                            }

                            return (
                              <TableCell 
                                key={wIndex} 
                                className={`text-center font-mono text-[16px] ${highlightClass} py-1 px-1`}
                              >
                                {isEditing ? (
                                  <input
                                    type="text"
                                    className="w-full bg-transparent text-center focus:outline-none focus:ring-1 focus:ring-[#141414] rounded text-[16px]"
                                    value={editingCell?.rowIndex === rowIndex && editingCell?.weightIndex === wIndex && editingCell?.param === param 
                                      ? editingCell.value 
                                      : (d ? (
                                          param === "pitch" ? d.pitch.toFixed(1) :
                                          param === "thrust" ? (d.thrust !== undefined ? d.thrust.toFixed(1) : "") :
                                          param === "vs" ? (d.vs?.toString() ?? "") :
                                          param === "kias" ? (d.kias?.toString() ?? "") :
                                          (d.mach !== undefined ? d.mach.toFixed(3) : "")
                                        ) : "")
                                    }
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setEditingCell({ rowIndex, weightIndex: wIndex, param, value: val });
                                      updateCell(rowIndex, wIndex, param, val);
                                    }}
                                    onBlur={() => setEditingCell(null)}
                                  />
                                ) : (
                                  d ? (
                                    param === "pitch" ? (Number.isNaN(d.pitch) ? "—" : d.pitch.toFixed(1)) :
                                    param === "thrust" ? (d.thrust === undefined || Number.isNaN(d.thrust) ? "—" : d.thrust.toFixed(1)) :
                                    param === "vs" ? (d.vs === undefined || Number.isNaN(d.vs) ? "—" : d.vs) :
                                    param === "kias" ? (d.kias === undefined || Number.isNaN(d.kias) ? "—" : d.kias) :
                                    (d.mach === undefined || Number.isNaN(d.mach) ? "—" : `.${d.mach.toFixed(2).split('.')[1]}M`)
                                  ) : "—"
                                )}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ));
                    })}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-[10px] font-mono opacity-80 italic max-w-2xl">
                  <Info className="w-3 h-3 shrink-0" />
                  <p>In shaded areas, data reflects the minimum speed limitation of 15 knots above minimum maneuvering speed.</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className={`border-[#141414] rounded-none font-mono text-[10px] uppercase h-7 ${isEditing ? 'bg-[#141414] text-white hover:bg-[#141414]/90' : ''}`}
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? (
                    <><Check className="w-3 h-3 mr-1" /> Done</>
                  ) : (
                    <><Edit2 className="w-3 h-3 mr-1" /> Modify</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Update Available Popup Modal / Banner */}
      <AnimatePresence>
        {publishedVersion && !isDismissed && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-lg shadow-2xl"
          >
            <div className="bg-[#141414] border-2 border-emerald-500/80 text-white rounded-xl p-4 sm:p-5 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/40 shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm sm:text-base tracking-tight flex items-center gap-2">
                      New Update Published
                      <span className="bg-emerald-500 text-black text-[10px] px-1.5 py-0.5 rounded font-mono font-black uppercase">
                        {publishedVersion}
                      </span>
                    </h3>
                    <p className="text-xs text-neutral-300 mt-1 leading-relaxed">
                      A newer version of the B777 Unreliable Airspeed Calculator is available. Update now to apply the latest publishment.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsDismissed(true)}
                  className="text-neutral-400 hover:text-white p-1 rounded-md transition-colors"
                  aria-label="Dismiss update banner"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-4 pt-3 border-t border-neutral-800 flex items-center justify-end gap-2">
                <button
                  onClick={() => setIsDismissed(true)}
                  className="px-3 py-1.5 text-xs text-neutral-400 hover:text-neutral-200 transition-colors font-medium"
                >
                  Later
                </button>
                <button
                  id="btn-force-refresh-app"
                  onClick={handleForceUpdate}
                  disabled={isUpdating}
                  className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 active:scale-98 text-black px-4 py-2 rounded-lg text-xs font-bold font-mono tracking-wide uppercase transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isUpdating ? 'animate-spin' : ''}`} />
                  {isUpdating ? 'Updating...' : 'Update & Force Refresh'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Data Source Notice (Below Table, Above Divider & App Version) */}
      <div className="max-w-7xl mx-auto mt-3 px-4 flex justify-end">
        <div className="flex items-center gap-1.5 font-mono text-[9px] sm:text-[10px] uppercase opacity-70">
          <span>Data Source</span>
          <span className="font-bold">QRH R42 (DEC 15, 2025)</span>
        </div>
      </div>

      {/* Footer Status Bar */}
      <footer className="max-w-7xl mx-auto mt-1 px-4 py-2 flex flex-wrap items-center justify-between gap-2 border-t border-[#141414]/10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-amber-500 animate-pulse'}`} />
            <span className="text-[10px] font-mono uppercase opacity-60">
              {isOnline ? 'Online Mode' : 'Offline Mode'}
            </span>
          </div>

          {publishedVersion && isDismissed && (
            <button
              onClick={() => setIsDismissed(false)}
              className="flex items-center gap-1.5 text-[10px] font-mono uppercase bg-emerald-600/15 text-emerald-800 border border-emerald-600/30 px-2 py-0.5 rounded animate-pulse hover:bg-emerald-600/25 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              Update Ready ({publishedVersion})
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {updateFeedback && (
            <span className="text-[10px] font-mono text-emerald-800 font-bold animate-fade-in">
              {updateFeedback}
            </span>
          )}
          <button
            onClick={() => checkForPublishedVersion(true)}
            title="Click to check for published updates"
            className="text-[10px] font-mono opacity-40 hover:opacity-100 uppercase tracking-wider flex items-center gap-1 transition-opacity cursor-pointer"
          >
            <span>{CURRENT_VERSION}</span>
            <RefreshCw className="w-2.5 h-2.5" />
          </button>
        </div>
      </footer>
    </div>
  );
}
