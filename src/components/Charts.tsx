import { useState } from 'react';
import { Platform, Text, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, G, Line, Rect, Text as SvgText } from 'react-native-svg';

import { formatCompact, formatMoney } from '@/lib/money';
import { categoryOf } from '@/state/types';
import { makeStyles, useColors, useTheme } from './theme';

/**
 * Categorical palette (validated set, fixed order). The color follows the category, never its rank,
 * so filtering or a new month never repaints a category. Always shown next to a text label.
 */
const SERIES: Record<'light' | 'dark', string[]> = {
  light: ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#6250d6', '#e34948'],
  dark: ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#0ca30c', '#9085e9', '#e66767'],
};

const SLOT: Record<string, number> = {
  comida: 0,
  transporte: 1,
  moradia: 2,
  lazer: 3,
  saude: 4,
  compras: 5,
  outros: 6,
  // Income categories live in their own lists, so slots can repeat.
  salario: 5,
  extra: 2,
  investimentos: 0,
  presente: 4,
};

// SVG text ignores the app font on web and falls back to serif.
const SVG_FONT = Platform.OS === 'web' ? 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif' : undefined;

export function useCategoryColor() {
  const { scheme } = useTheme();
  return (id: string) => SERIES[scheme][SLOT[categoryOf(id).id] ?? 6];
}

/** Donut split by category with the total in the middle. Segments are separated by a small gap. */
export function CategoryDonut({
  data,
  total,
  size = 176,
}: {
  data: [string, number][];
  total: number;
  size?: number;
}) {
  const styles = useStyles();
  const colors = useColors();
  const colorOf = useCategoryColor();
  const stroke = 22;
  const r = (size - stroke) / 2;
  const c = size / 2;
  const circ = 2 * Math.PI * r;
  const gap = data.length > 1 ? 3 : 0;

  const lengths = data.map(([, value]) => (value / total) * circ);
  const segments = data.map(([id], i) => ({
    id,
    dash: Math.max(0.5, lengths[i] - gap),
    offset: lengths.slice(0, i).reduce((sum, l) => sum + l, 0),
  }));
  const summary = data.map(([id, v]) => `${categoryOf(id).label} ${Math.round((v / total) * 100)}%`).join(', ');

  return (
    <View
      style={[styles.donut, { width: size, height: size }]}
      accessible
      accessibilityRole="image"
      accessibilityLabel={`Gastos por categoria: ${summary}`}>
      <Svg width={size} height={size}>
        <Circle cx={c} cy={c} r={r} stroke={colors.primarySoft} strokeWidth={stroke} fill="none" />
        {/* Circles start at 3 o'clock; the quarter-turn offset moves the first segment to 12 o'clock. */}
        {segments.map((s) => (
          <Circle
            key={s.id}
            cx={c}
            cy={c}
            r={r}
            stroke={colorOf(s.id)}
            strokeWidth={stroke}
            fill="none"
            strokeDasharray={`${s.dash} ${circ - s.dash}`}
            strokeDashoffset={circ / 4 - s.offset}
          />
        ))}
      </Svg>
      <View style={styles.donutCenter} pointerEvents="none">
        <Text style={styles.donutLabel}>Total gasto</Text>
        <Text style={styles.donutValue} numberOfLines={1} adjustsFontSizeToFit>
          {formatMoney(total)}
        </Text>
      </View>
    </View>
  );
}

export type MonthPoint = { key: string; label: string; income: number; expense: number };

const H = 168;
const PAD = { top: 12, bottom: 26, left: 4, right: 4 };

/** Income vs expense per month. One shared axis with light gridlines; the selected month is emphasized. */
export function MonthlyBars({ data, selected }: { data: MonthPoint[]; selected: string }) {
  const styles = useStyles();
  const colors = useColors();
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  const max = Math.max(1, ...data.flatMap((d) => [d.income, d.expense]));
  const plotH = H - PAD.top - PAD.bottom;
  const plotW = Math.max(0, width - PAD.left - PAD.right);
  const slot = data.length ? plotW / data.length : 0;
  const barW = Math.min(16, Math.max(6, slot / 4));
  const baseY = PAD.top + plotH;
  const barH = (v: number) => (v > 0 ? Math.max(3, (v / max) * plotH) : 0);
  const summary = data
    .map((d) => `${d.label}: entradas ${formatMoney(d.income)}, saídas ${formatMoney(d.expense)}`)
    .join('; ');

  const bar = (x: number, v: number, color: string, on: boolean) => {
    const h = barH(v);
    if (!h) return null;
    return <Rect x={x} y={baseY - h} width={barW} height={h} rx={4} ry={4} fill={color} opacity={on ? 1 : 0.5} />;
  };

  return (
    <View accessible accessibilityRole="image" accessibilityLabel={`Entradas e saídas por mês. ${summary}`}>
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.swatch, { backgroundColor: colors.income }]} />
          <Text style={styles.legendText}>Entradas</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.swatch, { backgroundColor: colors.expense }]} />
          <Text style={styles.legendText}>Saídas</Text>
        </View>
      </View>
      <View onLayout={onLayout} style={{ height: H }}>
        {width > 0 ? (
          <Svg width={width} height={H}>
            {[0, 0.5, 1].map((t) => (
              <Line
                key={t}
                x1={0}
                x2={width}
                y1={baseY - t * plotH}
                y2={baseY - t * plotH}
                stroke={colors.border}
                strokeWidth={1}
                strokeDasharray={t === 0 ? undefined : '3 4'}
              />
            ))}
            <SvgText x={PAD.left} y={PAD.top - 3} fontSize={10} fontFamily={SVG_FONT} fill={colors.muted}>
              {formatCompact(max)}
            </SvgText>
            {data.map((d, i) => {
              const on = d.key === selected;
              const cx = PAD.left + slot * i + slot / 2;
              return (
                <G key={d.key}>
                  {bar(cx - barW - 1, d.income, colors.income, on)}
                  {bar(cx + 1, d.expense, colors.expense, on)}
                  <SvgText
                    x={cx}
                    y={H - 8}
                    fontSize={12}
                    fontFamily={SVG_FONT}
                    fontWeight={on ? '700' : '400'}
                    fill={on ? colors.text : colors.muted}
                    textAnchor="middle">
                    {d.label}
                  </SvgText>
                </G>
              );
            })}
          </Svg>
        ) : null}
      </View>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  donut: { alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  donutCenter: { position: 'absolute', alignItems: 'center', width: '62%' },
  donutLabel: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  donutValue: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  legend: { flexDirection: 'row', gap: 16, marginBottom: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  swatch: { width: 10, height: 10, borderRadius: 3 },
  legendText: { color: colors.muted, fontSize: 12, fontWeight: '600' },
}));
