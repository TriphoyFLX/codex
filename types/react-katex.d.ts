declare module 'react-katex' {
  interface MathProps {
    math: string;
    block?: boolean;
  }
  export const BlockMath: React.FC<MathProps>;
  export const InlineMath: React.FC<MathProps>;
}
