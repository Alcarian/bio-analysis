import React, { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
} from "recharts";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Alert,
  TextField,
  InputAdornment,
  IconButton,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { Search as SearchIcon, Clear as ClearIcon } from "@mui/icons-material";
import { PatientAnalysis } from "../types";
import { parseDate } from "../utils/dateUtils";

interface AnalysisChartsProps {
  patientId: string;
  analyses: PatientAnalysis[];
}

interface AbnormalityChartData {
  date: string;
  abnormalCount: number;
}

interface TestTrendData {
  date: string;
  value: number;
  unit?: string;
  normalMin?: number;
  normalMax?: number;
}

/**
 * Tooltip personnalisé avec couleurs explicites (compatible mode sombre)
 */
const CustomTooltip: React.FC<{
  active?: boolean;
  payload?: any[];
  label?: string;
  unit?: string;
  valueLabel?: string;
}> = ({ active, payload, label, unit, valueLabel = "Valeur" }) => {
  if (!active || !payload || payload.length === 0) return null;
  const entry = payload[0];
  const entryUnit = unit ?? entry?.payload?.unit ?? "";
  return (
    <Box
      sx={{
        background: "#fff",
        border: "1px solid #ccc",
        borderRadius: 1,
        p: 1.5,
        fontSize: 13,
        color: "#1976d2",
        lineHeight: 1.6,
        boxShadow: 2,
      }}
    >
      <div
        style={{ fontWeight: 600, marginBottom: 4 }}
      >{`Date : ${label}`}</div>
      <div>
        {valueLabel}&nbsp;:{" "}
        <strong>
          {typeof entry.value === "number"
            ? entry.value.toFixed(2)
            : entry.value}
          {entryUnit ? `\u00a0${entryUnit}` : ""}
        </strong>
      </div>
    </Box>
  );
};

/**
 * Affiche une ligne de graphique avec zones de valeurs normales
 */
const TestTrendChart: React.FC<{
  testName: string;
  data: TestTrendData[];
}> = ({ testName, data }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const hasAbnormal = data.some(
    (d) =>
      (d.normalMin && d.value < d.normalMin) ||
      (d.normalMax && d.value > d.normalMax),
  );

  if (data.length === 0) {
    return null;
  }

  const normalMin = data[0].normalMin;
  const normalMax = data[0].normalMax;
  const unit = data[0].unit ?? "";
  const average = data.reduce((sum, d) => sum + d.value, 0) / data.length;

  // Affiche au maximum ~6 dates sur l'axe X
  const xAxisInterval = data.length <= 6 ? 0 : Math.ceil(data.length / 6) - 1;

  // Calcul du domaine Y adapté aux valeurs normales + données
  const allValues = data.map((d) => d.value);
  const dataMin = Math.min(...allValues);
  const dataMax = Math.max(...allValues);
  const rangeMin = Math.min(dataMin, normalMin ?? dataMin);
  const rangeMax = Math.max(dataMax, normalMax ?? dataMax);
  const padding = (rangeMax - rangeMin) * 0.15 || 1;
  const yDomain: [number, number] = [
    Math.max(0, Math.floor((rangeMin - padding) * 100) / 100),
    Math.ceil((rangeMax + padding) * 100) / 100,
  ];

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent sx={{ px: { xs: 1, sm: 3 }, py: { xs: 1.5, sm: 2 } }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", sm: "center" },
            flexDirection: { xs: "column", sm: "row" },
            gap: { xs: 0.5, sm: 0 },
            mb: 2,
          }}
        >
          <Typography
            variant="h6"
            sx={{ fontSize: { xs: "0.95rem", sm: "1.25rem" } }}
          >
            {testName}
          </Typography>
          {hasAbnormal && (
            <Chip label="Anomalies détectées" color="error" size="small" />
          )}
        </Box>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart
            data={data}
            margin={{
              left: isMobile ? 5 : 0,
              right: isMobile ? 5 : 10,
              top: 5,
              bottom: isMobile ? 10 : 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: isMobile ? 9 : 11 }}
              angle={isMobile ? -45 : -30}
              textAnchor="end"
              height={isMobile ? 60 : 50}
              interval={xAxisInterval}
            />
            <YAxis
              tick={{ fontSize: isMobile ? 9 : 11 }}
              width={isMobile ? 40 : 50}
              domain={yDomain}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {normalMin !== undefined && normalMax !== undefined && (
              <ReferenceArea
                y1={normalMin}
                y2={normalMax}
                fill="#4caf50"
                fillOpacity={0.12}
                stroke="#4caf50"
                strokeOpacity={0.5}
                label={{
                  value: "Zone normale",
                  position: "insideTopRight",
                  fontSize: 11,
                  fill: "#4caf50",
                }}
              />
            )}
            {normalMin !== undefined && normalMax === undefined && (
              <ReferenceLine
                y={normalMin}
                stroke="#4caf50"
                strokeDasharray="5 5"
                label={{
                  value: "Min normal",
                  position: "insideTopRight",
                  fontSize: 11,
                  fill: "#4caf50",
                }}
              />
            )}
            {normalMax !== undefined && normalMin === undefined && (
              <ReferenceLine
                y={normalMax}
                stroke="#4caf50"
                strokeDasharray="5 5"
                label={{
                  value: "Max normal",
                  position: "insideTopRight",
                  fontSize: 11,
                  fill: "#4caf50",
                }}
              />
            )}
            <Line
              type="monotone"
              dataKey="value"
              stroke="#8884d8"
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              name={testName}
            />
          </LineChart>
        </ResponsiveContainer>
        <Box
          sx={{
            mt: 1,
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: { xs: 0.5, sm: 1 },
          }}
        >
          <Typography
            variant="body2"
            color="textSecondary"
            sx={{
              fontStyle: "italic",
              fontSize: { xs: "0.7rem", sm: "0.875rem" },
            }}
          >
            Moy&nbsp;:{" "}
            <strong>
              {average.toFixed(2)}
              {unit ? `\u00a0${unit}` : ""}
            </strong>
          </Typography>
          {normalMin !== undefined && (
            <Typography
              variant="body2"
              color="textSecondary"
              sx={{
                fontStyle: "italic",
                fontSize: { xs: "0.7rem", sm: "0.875rem" },
              }}
            >
              ·&nbsp;Min&nbsp;:{" "}
              <strong>
                {normalMin.toFixed(2)}
                {unit ? `\u00a0${unit}` : ""}
              </strong>
            </Typography>
          )}
          {normalMax !== undefined && (
            <Typography
              variant="body2"
              color="textSecondary"
              sx={{
                fontStyle: "italic",
                fontSize: { xs: "0.7rem", sm: "0.875rem" },
              }}
            >
              ·&nbsp;Max&nbsp;:{" "}
              <strong>
                {normalMax.toFixed(2)}
                {unit ? `\u00a0${unit}` : ""}
              </strong>
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

/**
 * Affiche le nombre d'anomalies au fil du temps
 */
const AbnormalityTrendChart: React.FC<{
  data: AbnormalityChartData[];
}> = ({ data }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  if (data.length === 0) {
    return null;
  }

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent sx={{ px: { xs: 1, sm: 3 }, py: { xs: 1.5, sm: 2 } }}>
        <Typography
          variant="h6"
          sx={{ mb: 2, fontSize: { xs: "0.95rem", sm: "1.25rem" } }}
        >
          Évolution du nombre d'anomalies
        </Typography>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart
            data={data}
            margin={{
              left: isMobile ? 5 : 0,
              right: isMobile ? 5 : 10,
              top: 5,
              bottom: isMobile ? 10 : 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: isMobile ? 9 : 11 }}
              angle={isMobile ? -45 : -30}
              textAnchor="end"
              height={isMobile ? 60 : 50}
              interval={data.length <= 6 ? 0 : Math.ceil(data.length / 6) - 1}
            />
            <YAxis
              tick={{ fontSize: isMobile ? 9 : 11 }}
              width={isMobile ? 30 : 35}
            />
            <Tooltip content={<CustomTooltip valueLabel="Anomalies" />} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar
              dataKey="abnormalCount"
              fill="#ff7300"
              name="Nombre d'anomalies"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

/**
 * Calcule les données de série temporelle pour un test à partir des analyses déjà chargées
 */
const computeTestTimeSeries = (
  analyses: PatientAnalysis[],
  testName: string,
): TestTrendData[] => {
  return analyses
    .map((analysis) => {
      const testData = analysis.biochemistryData[testName];
      if (!testData) return null;
      return {
        date: analysis.date,
        value: testData.value,
        unit: testData.unit,
        normalMin: testData.normalMin,
        normalMax: testData.normalMax,
      };
    })
    .filter(Boolean)
    .sort((a, b) => parseDate(a!.date) - parseDate(b!.date)) as TestTrendData[];
};

/**
 * Calcule les statistiques d'un test à partir des analyses déjà chargées
 */
const computeTestStatistics = (
  analyses: PatientAnalysis[],
  testName: string,
): {
  average: number;
  min: number;
  max: number;
  latest: number;
  count: number;
} | null => {
  const timeSeries = computeTestTimeSeries(analyses, testName);
  if (timeSeries.length === 0) return null;
  const values = timeSeries.map((d) => d.value);
  return {
    average: values.reduce((a, b) => a + b, 0) / values.length,
    min: Math.min(...values),
    max: Math.max(...values),
    latest: values[values.length - 1],
    count: values.length,
  };
};

/**
 * Affiche un résumé des statistiques pour un test
 */
const TestStatisticsSummary: React.FC<{
  testName: string;
  analyses: PatientAnalysis[];
}> = ({ testName, analyses }) => {
  const stats = useMemo(
    () => computeTestStatistics(analyses, testName),
    [analyses, testName],
  );

  if (!stats) {
    return null;
  }

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent sx={{ px: { xs: 1.5, sm: 3 }, py: { xs: 1, sm: 2 } }}>
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: "bold",
            mb: 1,
            fontSize: { xs: "0.85rem", sm: "1rem" },
          }}
        >
          {testName}
        </Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: { xs: 0.5, sm: 1 },
          }}
        >
          <Box>
            <Typography variant="caption" color="textSecondary">
              Dernière valeur
            </Typography>
            <Typography variant="body1">{stats.latest.toFixed(2)}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="textSecondary">
              Moyenne
            </Typography>
            <Typography variant="body1">{stats.average.toFixed(2)}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="textSecondary">
              Min
            </Typography>
            <Typography variant="body1">{stats.min.toFixed(2)}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="textSecondary">
              Max
            </Typography>
            <Typography variant="body1">{stats.max.toFixed(2)}</Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

/**
 * Composant principal de visualisation des analyses
 */
const AnalysisCharts: React.FC<AnalysisChartsProps> = ({
  patientId,
  analyses,
}) => {
  const [chartSearch, setChartSearch] = useState("");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const chartData = useMemo(() => {
    const abnormalities: AbnormalityChartData[] = [];

    analyses.forEach((analysis) => {
      const abnormalCount = Object.values(analysis.biochemistryData).filter(
        (v) => v.isAbnormal,
      ).length;
      abnormalities.push({
        date: analysis.date,
        abnormalCount,
      });
    });

    // Tri croissant : date la plus ancienne à gauche
    return abnormalities.sort((a, b) => parseDate(a.date) - parseDate(b.date));
  }, [analyses]);

  // Collecte tous les noms de tests uniques
  const allTestNames = useMemo(() => {
    const names = new Set<string>();
    analyses.forEach((analysis) => {
      Object.keys(analysis.biochemistryData).forEach((testName) => {
        names.add(testName);
      });
    });
    return Array.from(names).sort();
  }, [analyses]);

  // Filtre les tests selon la recherche
  const filteredTestNames = useMemo(() => {
    const q = chartSearch.trim().toLowerCase();
    if (!q) return allTestNames;
    return allTestNames.filter((name) => name.toLowerCase().includes(q));
  }, [allTestNames, chartSearch]);

  if (analyses.length === 0) {
    return (
      <Alert severity="info">
        Aucune analyse disponible. Importez des fichiers PDF pour commencer.
      </Alert>
    );
  }

  if (analyses.length === 1) {
    return (
      <Box>
        <Typography variant="h6" sx={{ mb: 3 }}>
          Résumé de l'analyse unique
        </Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(auto-fit, minmax(280px, 1fr))",
            },
            gap: 2,
          }}
        >
          {allTestNames.map((testName) => (
            <TestStatisticsSummary
              key={testName}
              testName={testName}
              analyses={analyses}
            />
          ))}
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      <Typography
        variant="h5"
        sx={{
          mb: { xs: 2, sm: 3 },
          fontWeight: "bold",
          fontSize: { xs: "1.1rem", sm: "1.5rem" },
        }}
      >
        Évolution de la santé du patient
      </Typography>

      {/* Graphique des anomalies */}
      <AbnormalityTrendChart data={chartData} />

      {/* Barre de recherche */}
      <Box sx={{ mb: 2, mt: { xs: 2, sm: 4 } }}>
        <TextField
          size="small"
          placeholder={isMobile ? "Rechercher…" : "Rechercher un test…"}
          value={chartSearch}
          onChange={(e) => setChartSearch(e.target.value)}
          sx={{ width: { xs: "100%", sm: 340 } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
            endAdornment: chartSearch ? (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={() => setChartSearch("")}
                  edge="end"
                >
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ) : null,
          }}
        />
      </Box>

      {/* Graphiques individuels pour chaque test */}
      <Typography
        variant="h6"
        sx={{ mb: 2, fontSize: { xs: "0.95rem", sm: "1.25rem" } }}
      >
        Suivi des tests individuels
      </Typography>

      {filteredTestNames.length === 0 && chartSearch.trim() !== "" && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Aucun test trouvé pour « {chartSearch} ».
        </Alert>
      )}

      {filteredTestNames.map((testName) => {
        const timeSeries = computeTestTimeSeries(analyses, testName);
        return (
          <TestTrendChart
            key={testName}
            testName={testName}
            data={timeSeries}
          />
        );
      })}
    </Box>
  );
};

export default AnalysisCharts;
