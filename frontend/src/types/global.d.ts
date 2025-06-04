/// <reference types="jest" />
/// <reference types="react" />
/// <reference types="node" />

import React from 'react';
import type { Jest, Describe, It, Expect } from '@jest/types';

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
      REACT_APP_API_URL: string;
      [key: string]: string | undefined;
    }
  }

  interface Window {
    env: Record<string, string>;
  }

  // Test globals
  const describe: Describe;
  const it: It;
  const test: It;
  const expect: Expect;
  const beforeEach: jest.Lifecycle;
  const afterEach: jest.Lifecycle;
  const beforeAll: jest.Lifecycle;
  const afterAll: jest.Lifecycle;
  const jest: Jest;

  // React globals
  namespace JSX {
    type Element = React.ReactElement<any, any>
  }
}

declare module '*.svg' {
  const content: React.FunctionComponent<React.SVGAttributes<SVGElement>>;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}

declare module '*.jpeg' {
  const content: string;
  export default content;
}

declare module '*.gif' {
  const content: string;
  export default content;
}

declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module '*.module.scss' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module '*.json' {
  const content: Record<string, unknown>;
  export default content;
}

declare module 'recharts' {
  import { PureComponent, ReactNode, ReactElement } from 'react';

  export interface TooltipProps<TValue = number, TName = string> {
    active?: boolean;
    payload?: Array<{
      value: TValue;
      name: TName;
      dataKey: string;
      payload: Record<string, unknown>;
    }>;
    label?: string;
    content?: ReactElement | ((props: TooltipProps<TValue, TName>) => ReactElement | null) | string;
    formatter?: (value: TValue, name?: TName) => [TValue, TName] | string | number;
    wrapperStyle?: React.CSSProperties;
    contentStyle?: React.CSSProperties;
    itemStyle?: React.CSSProperties;
    labelStyle?: React.CSSProperties;
    cursor?: boolean | React.ReactElement | object;
    offset?: number;
    position?: { x: number; y: number };
    coordinate?: { x: number; y: number };
    viewBox?: {
      x?: number;
      y?: number;
      width?: number;
      height?: number;
    };
  }

  export interface ChartProps {
    width?: number;
    height?: number;
    data?: Array<Record<string, unknown>>;
    margin?: {
      top?: number;
      right?: number;
      bottom?: number;
      left?: number;
    };
    children?: ReactNode;
  }

  export interface LineProps {
    type?: 'basis' | 'basisClosed' | 'basisOpen' | 'linear' | 'linearClosed' | 'natural' | 'monotoneX' | 'monotoneY' | 'monotone' | 'step' | 'stepBefore' | 'stepAfter';
    dataKey: string;
    stroke?: string;
    name?: string;
    yAxisId?: string;
  }

  export interface YAxisProps {
    type?: 'number' | 'category';
    domain?: [number | 'auto' | ((dataMin: number) => number), number | 'auto' | ((dataMax: number) => number)];
    orientation?: 'left' | 'right';
    yAxisId?: string;
  }

  export interface AreaProps {
    type?: 'basis' | 'basisClosed' | 'basisOpen' | 'linear' | 'linearClosed' | 'natural' | 'monotoneX' | 'monotoneY' | 'monotone' | 'step' | 'stepBefore' | 'stepAfter';
    dataKey: string;
    stroke?: string;
    fill?: string;
    name?: string;
    stackId?: string;
  }

  export interface PieProps {
    data?: Array<Record<string, unknown>>;
    dataKey: string;
    nameKey?: string;
    cx?: string | number;
    cy?: string | number;
    innerRadius?: number;
    outerRadius?: number;
    fill?: string;
    label?: boolean | React.ReactElement | ((props: any) => React.ReactElement);
    children?: ReactNode;
  }

  export class LineChart extends PureComponent<ChartProps> {}
  export class Line extends PureComponent<LineProps> {}
  export class XAxis extends PureComponent<{
    dataKey?: string | ((obj: any) => string);
    type?: 'number' | 'category';
    allowDecimals?: boolean;
    domain?: [number | 'auto' | ((dataMin: number) => number), number | 'auto' | ((dataMax: number) => number)];
  }> {}
  export class YAxis extends PureComponent<YAxisProps> {}
  export class CartesianGrid extends PureComponent<{
    strokeDasharray?: string;
  }> {}
  export class Tooltip extends PureComponent<TooltipProps> {}
  export class Legend extends PureComponent<{
    align?: 'left' | 'center' | 'right';
    verticalAlign?: 'top' | 'middle' | 'bottom';
  }> {}
  export class ResponsiveContainer extends PureComponent<{
    width?: string | number;
    height?: string | number;
    minWidth?: number;
    minHeight?: number;
    aspect?: number;
    children: ReactNode;
  }> {}
  export class PieChart extends PureComponent<ChartProps> {}
  export class Pie extends PureComponent<PieProps> {}
  export class Cell extends PureComponent<{
    fill?: string;
  }> {}
  export class AreaChart extends PureComponent<ChartProps> {}
  export class Area extends PureComponent<AreaProps> {}
}

export {}; 