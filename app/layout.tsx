import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Neural Network X-Ray | 3D Interactive WebGL Inference Engine',
  description:
    'Real-time client-side neural network visualization and ablation engine built with Next.js, React Three Fiber, and TypeScript.',
  keywords: [
    'Neural Network',
    'WebGL',
    'Three.js',
    'React Three Fiber',
    'Next.js',
    'TypeScript',
    'MNIST',
    'Inference Engine',
    'Ablation Study',
  ],
  authors: [{ name: 'Dr-Ghost7', url: 'https://github.com/Dr-Ghost7' }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#05070e] text-slate-100 antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
        {children}
      </body>
    </html>
  );
}
