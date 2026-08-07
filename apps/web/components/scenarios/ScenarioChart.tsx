"use client";

import { useRef } from "react";
import type { ScenarioCandle } from "../../lib/scenarios";
import styles from "./ScenarioChart.module.css";

const CANDLE_SPACING = 18;
const CANDLE_BODY_WIDTH = 10;
const PADDING_LEFT = 16;
const PADDING_RIGHT = 104;
const PADDING_TOP = 16;
const PADDING_BOTTOM = 16;
const CHART_HEIGHT = 320;

export interface ChartLine {
  price: number;
  color: string;
  label: string;
  fromIndex: number;
}

function priceDomain(candles: ScenarioCandle[]) {
  const highs = candles.map((c) => c.h);
  const lows = candles.map((c) => c.l);
  const max = Math.max(...highs);
  const min = Math.min(...lows);
  const pad = (max - min) * 0.08;
  return { min: min - pad, max: max + pad };
}

export function ScenarioChart({
  allCandles,
  visibleCount,
  lines,
  onPriceClick,
  armedLabel,
}: {
  allCandles: ScenarioCandle[];
  visibleCount: number;
  lines: ChartLine[];
  onPriceClick?: (price: number) => void;
  armedLabel?: string;
}) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const { min, max } = priceDomain(allCandles);
  const width = PADDING_LEFT + PADDING_RIGHT + allCandles.length * CANDLE_SPACING;

  function priceToY(price: number) {
    return PADDING_TOP + ((max - price) / (max - min)) * CHART_HEIGHT;
  }

  function handleClick(evt: React.MouseEvent<SVGSVGElement>) {
    if (!onPriceClick || !svgRef.current) return;
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = evt.clientX;
    pt.y = evt.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const local = pt.matrixTransform(ctm.inverse());
    const price = max - ((local.y - PADDING_TOP) / CHART_HEIGHT) * (max - min);
    onPriceClick(Math.round(price * 10) / 10);
  }

  return (
    <div className={styles.wrap}>
      {armedLabel ? <p className={styles.armed}>{armedLabel}</p> : null}
      <svg
        ref={svgRef}
        className={onPriceClick ? `${styles.svg} ${styles.clickable}` : styles.svg}
        viewBox={`0 0 ${width} ${PADDING_TOP + CHART_HEIGHT + PADDING_BOTTOM}`}
        role="img"
        aria-label="Candlestick price chart"
        onClick={handleClick}
      >
        {allCandles.slice(0, visibleCount).map((c, i) => {
          const x = PADDING_LEFT + i * CANDLE_SPACING + CANDLE_SPACING / 2;
          const up = c.c >= c.o;
          const color = up ? "var(--gain)" : "var(--loss)";
          const bodyTop = priceToY(Math.max(c.o, c.c));
          const bodyBot = priceToY(Math.min(c.o, c.c));
          return (
            <g key={i}>
              <line x1={x} x2={x} y1={priceToY(c.h)} y2={priceToY(c.l)} stroke={color} strokeWidth="1.5" />
              <rect
                x={x - CANDLE_BODY_WIDTH / 2}
                y={bodyTop}
                width={CANDLE_BODY_WIDTH}
                height={Math.max(bodyBot - bodyTop, 1.5)}
                fill={color}
              />
            </g>
          );
        })}

        {lines.map((line, i) => {
          const y = priceToY(line.price);
          const x1 = PADDING_LEFT + line.fromIndex * CANDLE_SPACING;
          return (
            <g key={i}>
              <line x1={x1} x2={width - PADDING_RIGHT + 8} y1={y} y2={y} stroke={line.color} strokeDasharray="5 3" strokeWidth="1.5" />
              <text x={width - PADDING_RIGHT + 12} y={y + 3} fill={line.color} className={styles.lineLabel}>
                {line.label} {line.price}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
